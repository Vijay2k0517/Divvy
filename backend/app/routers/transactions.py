import math
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from ..database import get_db
from ..models import User, Transaction
from ..schemas import TransactionCreate, TransactionUpdate, TransactionOut, TransactionListResponse
from ..dependencies import get_current_user

router = APIRouter(prefix="/api/transactions", tags=["transactions"])

CATEGORIES = [
    "Food & Dining", "Transportation", "Shopping", "Entertainment",
    "Bills & Utilities", "Subscriptions", "Income",
]


@router.get("", response_model=TransactionListResponse)
async def list_transactions(
    search: str = "",
    category: str = "All",
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    q = select(Transaction).where(Transaction.user_id == user.id)

    if category and category != "All":
        q = q.where(Transaction.category == category)

    if search:
        q = q.where(
            or_(
                Transaction.description.ilike(f"%{search}%"),
                Transaction.category.ilike(f"%{search}%"),
            )
        )

    # Count
    count_q = select(func.count()).select_from(q.subquery())
    total = (await db.execute(count_q)).scalar() or 0
    pages = math.ceil(total / limit) if total else 1

    # Paginate
    q = q.order_by(Transaction.date.desc(), Transaction.id.desc())
    q = q.offset((page - 1) * limit).limit(limit)

    result = await db.execute(q)
    txns = [TransactionOut.model_validate(t) for t in result.scalars().all()]

    return TransactionListResponse(transactions=txns, total=total, page=page, pages=pages)


@router.post("", response_model=TransactionOut, status_code=201)
async def create_transaction(
    req: TransactionCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    txn = Transaction(
        user_id=user.id,
        date=req.date,
        category=req.category,
        description=req.description,
        amount=req.amount,
        mode=req.mode,
    )
    db.add(txn)
    await db.commit()
    await db.refresh(txn)
    return TransactionOut.model_validate(txn)


@router.put("/{txn_id}", response_model=TransactionOut)
async def update_transaction(
    txn_id: int,
    req: TransactionUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Transaction).where(Transaction.id == txn_id, Transaction.user_id == user.id)
    )
    txn = result.scalar_one_or_none()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")

    for field, value in req.model_dump(exclude_unset=True).items():
        setattr(txn, field, value)

    await db.commit()
    await db.refresh(txn)
    return TransactionOut.model_validate(txn)


@router.delete("/{txn_id}")
async def delete_transaction(
    txn_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Transaction).where(Transaction.id == txn_id, Transaction.user_id == user.id)
    )
    txn = result.scalar_one_or_none()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")

    await db.delete(txn)
    await db.commit()
    return {"success": True}


@router.get("/categories")
async def get_categories():
    return {"categories": CATEGORIES}
