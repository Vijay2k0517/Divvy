"""Router: Financial Goals (Enhancement #10)"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..database import get_db
from ..models import User, Goal, GoalContribution
from ..schemas import GoalCreate, GoalUpdate, GoalOut, GoalContributeRequest
from ..dependencies import get_current_user

router = APIRouter(prefix="/api/goals", tags=["goals"])


@router.get("", response_model=list[GoalOut])
async def list_goals(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all financial goals for the current user."""
    result = await db.execute(
        select(Goal).where(Goal.user_id == user.id).order_by(Goal.created_at.desc())
    )
    return result.scalars().all()


@router.post("", response_model=GoalOut, status_code=201)
async def create_goal(
    req: GoalCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new financial goal."""
    goal = Goal(user_id=user.id, **req.model_dump())
    db.add(goal)
    await db.commit()
    await db.refresh(goal)
    return goal


@router.put("/{goal_id}", response_model=GoalOut)
async def update_goal(
    goal_id: int,
    req: GoalUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing goal."""
    result = await db.execute(
        select(Goal).where(Goal.id == goal_id, Goal.user_id == user.id)
    )
    goal = result.scalar_one_or_none()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    for key, value in req.model_dump(exclude_unset=True).items():
        setattr(goal, key, value)

    await db.commit()
    await db.refresh(goal)
    return goal


@router.delete("/{goal_id}")
async def delete_goal(
    goal_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a goal."""
    result = await db.execute(
        select(Goal).where(Goal.id == goal_id, Goal.user_id == user.id)
    )
    goal = result.scalar_one_or_none()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    await db.delete(goal)
    await db.commit()
    return {"success": True}


@router.post("/{goal_id}/contribute", response_model=GoalOut)
async def contribute_to_goal(
    goal_id: int,
    req: GoalContributeRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a contribution towards a goal."""
    result = await db.execute(
        select(Goal).where(Goal.id == goal_id, Goal.user_id == user.id)
    )
    goal = result.scalar_one_or_none()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    contribution = GoalContribution(
        goal_id=goal.id,
        amount=req.amount,
        note=req.note,
    )
    db.add(contribution)

    goal.current_amount = round(goal.current_amount + req.amount, 2)
    if goal.current_amount >= goal.target_amount:
        goal.is_completed = True

    await db.commit()
    await db.refresh(goal)
    return goal
