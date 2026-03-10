"""Router: Multi-User Collaborative Budgeting (Enhancement #8)"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models import User
from ..schemas import (
    SharedBudgetCreate, SharedBudgetUpdate, SharedBudgetOut,
    SharedBudgetDetailOut, ContributionCreate, ContributionOut,
    JoinSharedBudgetRequest, SharedBudgetMemberOut,
)
from ..dependencies import get_current_user
from ..services.collaborative_service import CollaborativeService

router = APIRouter(prefix="/api/shared-budgets", tags=["collaborative-budgets"])


@router.post("", response_model=SharedBudgetOut, status_code=201)
async def create_shared_budget(
    req: SharedBudgetCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new shared budget group."""
    budget = await CollaborativeService.create_shared_budget(
        db, user.id, req.model_dump()
    )
    return SharedBudgetOut(
        id=budget.id,
        name=budget.name,
        description=budget.description,
        total_budget=budget.total_budget,
        total_spent=0.0,
        category=budget.category,
        invite_code=budget.invite_code,
        is_active=budget.is_active,
        owner_name=user.name,
        member_count=1,
        created_at=budget.created_at,
    )


@router.get("", response_model=list[SharedBudgetOut])
async def list_shared_budgets(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all shared budgets the user belongs to."""
    budgets = await CollaborativeService.get_user_shared_budgets(db, user.id)
    return [SharedBudgetOut(**b) for b in budgets]


@router.get("/{budget_id}", response_model=SharedBudgetDetailOut)
async def get_shared_budget_detail(
    budget_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get detailed shared budget with members and contributions."""
    result = await CollaborativeService.get_shared_budget_detail(
        db, user.id, budget_id
    )
    if not result:
        raise HTTPException(status_code=404, detail="Shared budget not found or not a member")

    return SharedBudgetDetailOut(
        budget=SharedBudgetOut(**result["budget"]),
        members=[SharedBudgetMemberOut(**m) for m in result["members"]],
        recent_contributions=result["recent_contributions"],
    )


@router.post("/join")
async def join_shared_budget(
    req: JoinSharedBudgetRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Join a shared budget using an invite code."""
    result = await CollaborativeService.join_shared_budget(
        db, user.id, req.invite_code
    )
    if not result:
        raise HTTPException(status_code=404, detail="Invalid invite code")
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.post("/{budget_id}/contributions", response_model=ContributionOut, status_code=201)
async def add_contribution(
    budget_id: int,
    req: ContributionCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a spending contribution to a shared budget."""
    contribution = await CollaborativeService.add_contribution(
        db, user.id, budget_id, req.model_dump()
    )
    if not contribution:
        raise HTTPException(status_code=404, detail="Shared budget not found or not a member")

    return ContributionOut(
        id=contribution.id,
        user_name=user.name,
        description=contribution.description,
        amount=contribution.amount,
        date=contribution.date,
        created_at=contribution.created_at,
    )


@router.delete("/{budget_id}/leave")
async def leave_shared_budget(
    budget_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Leave a shared budget (owners cannot leave)."""
    success = await CollaborativeService.leave_shared_budget(
        db, user.id, budget_id
    )
    if not success:
        raise HTTPException(
            status_code=400,
            detail="Cannot leave: not a member or you are the owner"
        )
    return {"success": True}
