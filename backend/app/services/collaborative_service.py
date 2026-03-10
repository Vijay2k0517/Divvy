"""
Collaborative Budgeting Service — Multi-user shared budget management.

Architecture:
  Router → CollaborativeService → SharedBudget + Members + Contributions (DB)

Features:
  - Create shared budgets with invite codes
  - Join via invite code
  - Track individual member contributions
  - Role-based access (owner, admin, member)
"""

import datetime
import secrets
import logging
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from ..models import (
    SharedBudget, SharedBudgetMember, SharedBudgetContribution, User,
)

logger = logging.getLogger(__name__)


class CollaborativeService:

    @staticmethod
    def _generate_invite_code() -> str:
        """Generate a URL-safe invite code."""
        return secrets.token_urlsafe(8)[:12].upper()

    @staticmethod
    async def create_shared_budget(
        db: AsyncSession, owner_id: int, data: dict
    ) -> SharedBudget:
        """Create a shared budget and add owner as first member."""
        budget = SharedBudget(
            owner_id=owner_id,
            name=data["name"],
            description=data.get("description"),
            total_budget=data["total_budget"],
            category=data.get("category"),
            invite_code=CollaborativeService._generate_invite_code(),
        )
        db.add(budget)
        await db.flush()

        # Add owner as a member
        member = SharedBudgetMember(
            shared_budget_id=budget.id,
            user_id=owner_id,
            role="owner",
        )
        db.add(member)
        await db.commit()
        await db.refresh(budget)
        return budget

    @staticmethod
    async def join_shared_budget(
        db: AsyncSession, user_id: int, invite_code: str
    ) -> Optional[dict]:
        """Join a shared budget via invite code."""
        result = await db.execute(
            select(SharedBudget)
            .where(
                SharedBudget.invite_code == invite_code,
                SharedBudget.is_active == True,
            )
        )
        budget = result.scalar_one_or_none()
        if not budget:
            return None

        # Check if already a member
        existing = await db.execute(
            select(SharedBudgetMember)
            .where(
                SharedBudgetMember.shared_budget_id == budget.id,
                SharedBudgetMember.user_id == user_id,
            )
        )
        if existing.scalar_one_or_none():
            return {"error": "Already a member"}

        member = SharedBudgetMember(
            shared_budget_id=budget.id,
            user_id=user_id,
            role="member",
        )
        db.add(member)
        await db.commit()

        return {"budget_id": budget.id, "name": budget.name}

    @staticmethod
    async def get_user_shared_budgets(
        db: AsyncSession, user_id: int
    ) -> list[dict]:
        """Get all shared budgets the user is a member of."""
        result = await db.execute(
            select(SharedBudgetMember)
            .where(SharedBudgetMember.user_id == user_id)
        )
        memberships = result.scalars().all()

        budgets = []
        for m in memberships:
            budget_result = await db.execute(
                select(SharedBudget)
                .where(SharedBudget.id == m.shared_budget_id)
            )
            budget = budget_result.scalar_one_or_none()
            if not budget:
                continue

            # Count members
            member_count = await db.execute(
                select(func.count())
                .select_from(SharedBudgetMember)
                .where(SharedBudgetMember.shared_budget_id == budget.id)
            )

            # Total spent
            spent_result = await db.execute(
                select(func.coalesce(func.sum(SharedBudgetContribution.amount), 0))
                .where(SharedBudgetContribution.shared_budget_id == budget.id)
            )

            # Owner name
            owner_result = await db.execute(
                select(User.name).where(User.id == budget.owner_id)
            )

            budgets.append({
                "id": budget.id,
                "name": budget.name,
                "description": budget.description,
                "total_budget": budget.total_budget,
                "total_spent": abs(float(spent_result.scalar())),
                "category": budget.category,
                "invite_code": budget.invite_code,
                "is_active": budget.is_active,
                "owner_name": owner_result.scalar() or "Unknown",
                "member_count": member_count.scalar() or 0,
                "created_at": budget.created_at,
            })

        return budgets

    @staticmethod
    async def get_shared_budget_detail(
        db: AsyncSession, user_id: int, budget_id: int
    ) -> Optional[dict]:
        """Get detailed shared budget with members and contributions."""
        # Verify membership
        membership = await db.execute(
            select(SharedBudgetMember)
            .where(
                SharedBudgetMember.shared_budget_id == budget_id,
                SharedBudgetMember.user_id == user_id,
            )
        )
        if not membership.scalar_one_or_none():
            return None

        budget_result = await db.execute(
            select(SharedBudget).where(SharedBudget.id == budget_id)
        )
        budget = budget_result.scalar_one_or_none()
        if not budget:
            return None

        # Members with their spending
        members_result = await db.execute(
            select(SharedBudgetMember)
            .where(SharedBudgetMember.shared_budget_id == budget_id)
        )
        members = []
        for m in members_result.scalars().all():
            user_result = await db.execute(
                select(User.name).where(User.id == m.user_id)
            )
            spent_result = await db.execute(
                select(func.coalesce(func.sum(SharedBudgetContribution.amount), 0))
                .where(
                    SharedBudgetContribution.shared_budget_id == budget_id,
                    SharedBudgetContribution.user_id == m.user_id,
                )
            )
            members.append({
                "id": m.id,
                "user_id": m.user_id,
                "user_name": user_result.scalar() or "Unknown",
                "role": m.role,
                "joined_at": m.joined_at,
                "total_spent": abs(float(spent_result.scalar())),
            })

        # Recent contributions
        contrib_result = await db.execute(
            select(SharedBudgetContribution)
            .where(SharedBudgetContribution.shared_budget_id == budget_id)
            .order_by(SharedBudgetContribution.date.desc())
            .limit(20)
        )
        contributions = []
        for c in contrib_result.scalars().all():
            user_result = await db.execute(
                select(User.name).where(User.id == c.user_id)
            )
            contributions.append({
                "id": c.id,
                "user_name": user_result.scalar() or "Unknown",
                "description": c.description,
                "amount": c.amount,
                "date": str(c.date),
                "created_at": c.created_at,
            })

        total_spent = sum(abs(c["amount"]) for c in contributions)
        owner_result = await db.execute(
            select(User.name).where(User.id == budget.owner_id)
        )

        return {
            "budget": {
                "id": budget.id,
                "name": budget.name,
                "description": budget.description,
                "total_budget": budget.total_budget,
                "total_spent": total_spent,
                "category": budget.category,
                "invite_code": budget.invite_code,
                "is_active": budget.is_active,
                "owner_name": owner_result.scalar() or "Unknown",
                "member_count": len(members),
                "created_at": budget.created_at,
            },
            "members": members,
            "recent_contributions": contributions,
        }

    @staticmethod
    async def add_contribution(
        db: AsyncSession,
        user_id: int,
        budget_id: int,
        data: dict,
    ) -> Optional[SharedBudgetContribution]:
        """Add a spending contribution to a shared budget."""
        # Verify membership
        membership = await db.execute(
            select(SharedBudgetMember)
            .where(
                SharedBudgetMember.shared_budget_id == budget_id,
                SharedBudgetMember.user_id == user_id,
            )
        )
        if not membership.scalar_one_or_none():
            return None

        contribution = SharedBudgetContribution(
            shared_budget_id=budget_id,
            user_id=user_id,
            description=data["description"],
            amount=data["amount"],
            date=data["date"],
        )
        db.add(contribution)
        await db.commit()
        await db.refresh(contribution)
        return contribution

    @staticmethod
    async def leave_shared_budget(
        db: AsyncSession, user_id: int, budget_id: int
    ) -> bool:
        """Leave a shared budget (owners cannot leave)."""
        result = await db.execute(
            select(SharedBudgetMember)
            .where(
                SharedBudgetMember.shared_budget_id == budget_id,
                SharedBudgetMember.user_id == user_id,
            )
        )
        member = result.scalar_one_or_none()
        if not member:
            return False

        if member.role == "owner":
            return False  # Owners must transfer or delete

        await db.delete(member)
        await db.commit()
        return True
