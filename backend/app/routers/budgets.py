import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from ..database import get_db
from ..models import User, Transaction, Budget
from ..schemas import BudgetCreate, BudgetUpdate, BudgetOut, BudgetListResponse
from ..dependencies import get_current_user

router = APIRouter(prefix="/api/budgets", tags=["budgets"])


async def _compute_spent(db: AsyncSession, user_id: int, category: str) -> float:
    today = datetime.date.today()
    first = today.replace(day=1)
    sp = await db.execute(
        select(func.coalesce(func.sum(Transaction.amount), 0))
        .where(and_(
            Transaction.user_id == user_id,
            Transaction.category == category,
            Transaction.amount < 0,
            Transaction.date >= first,
        ))
    )
    return abs(float(sp.scalar()))


@router.get("", response_model=BudgetListResponse)
async def list_budgets(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Budget).where(Budget.user_id == user.id).order_by(Budget.id)
    )
    budgets = result.scalars().all()

    out = []
    total_budget = 0.0
    total_spent = 0.0
    for b in budgets:
        spent = await _compute_spent(db, user.id, b.category)
        out.append(BudgetOut(
            id=b.id,
            category=b.category,
            budget=b.budget,
            spent=spent,
            color=b.color,
        ))
        total_budget += b.budget
        total_spent += spent

    return BudgetListResponse(budgets=out, total_budget=total_budget, total_spent=total_spent)


@router.post("", response_model=BudgetOut, status_code=201)
async def create_budget(
    req: BudgetCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Check duplicate category
    existing = await db.execute(
        select(Budget).where(Budget.user_id == user.id, Budget.category == req.category)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Budget already exists for this category")

    budget = Budget(user_id=user.id, category=req.category, budget=req.budget, color=req.color)
    db.add(budget)
    await db.commit()
    await db.refresh(budget)

    spent = await _compute_spent(db, user.id, budget.category)
    return BudgetOut(id=budget.id, category=budget.category, budget=budget.budget, spent=spent, color=budget.color)


@router.put("/{budget_id}", response_model=BudgetOut)
async def update_budget(
    budget_id: int,
    req: BudgetUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Budget).where(Budget.id == budget_id, Budget.user_id == user.id)
    )
    budget = result.scalar_one_or_none()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")

    for field, value in req.model_dump(exclude_unset=True).items():
        setattr(budget, field, value)

    await db.commit()
    await db.refresh(budget)

    spent = await _compute_spent(db, user.id, budget.category)
    return BudgetOut(id=budget.id, category=budget.category, budget=budget.budget, spent=spent, color=budget.color)


@router.delete("/{budget_id}")
async def delete_budget(
    budget_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Budget).where(Budget.id == budget_id, Budget.user_id == user.id)
    )
    budget = result.scalar_one_or_none()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")

    await db.delete(budget)
    await db.commit()
    return {"success": True}
