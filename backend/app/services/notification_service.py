"""
Notification Service — Centralized notification and alert management.

Architecture:
  Router → NotificationService → Notification + AlertRule (DB)
  Background Worker → evaluates alert rules → creates notifications

Features:
  - User-defined alert rules (budget thresholds, spending limits)
  - System-generated notifications (anomalies, insights, sync status)
  - Read/unread management
"""

import datetime
import logging

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, update

from ..models import Notification, AlertRule, Budget, Transaction
from ..config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class NotificationService:

    @staticmethod
    async def create_notification(
        db: AsyncSession,
        user_id: int,
        type_: str,
        title: str,
        message: str,
        priority: str = "medium",
        action_url: str = None,
    ) -> Notification:
        """Create a new notification for a user."""
        notification = Notification(
            user_id=user_id,
            type=type_,
            title=title,
            message=message,
            priority=priority,
            action_url=action_url,
        )
        db.add(notification)
        await db.commit()
        await db.refresh(notification)
        return notification

    @staticmethod
    async def get_notifications(
        db: AsyncSession,
        user_id: int,
        unread_only: bool = False,
        limit: int = 50,
    ) -> dict:
        """Get user notifications."""
        q = select(Notification).where(Notification.user_id == user_id)
        if unread_only:
            q = q.where(Notification.is_read == False)

        q = q.order_by(Notification.created_at.desc()).limit(limit)
        result = await db.execute(q)
        notifications = result.scalars().all()

        unread_count = await db.execute(
            select(func.count())
            .select_from(Notification)
            .where(
                Notification.user_id == user_id,
                Notification.is_read == False,
            )
        )

        return {
            "notifications": notifications,
            "total": len(notifications),
            "unread": unread_count.scalar() or 0,
        }

    @staticmethod
    async def mark_read(
        db: AsyncSession, user_id: int, notification_id: int
    ) -> bool:
        """Mark a notification as read."""
        result = await db.execute(
            select(Notification)
            .where(
                Notification.id == notification_id,
                Notification.user_id == user_id,
            )
        )
        notification = result.scalar_one_or_none()
        if not notification:
            return False

        notification.is_read = True
        await db.commit()
        return True

    @staticmethod
    async def mark_all_read(db: AsyncSession, user_id: int) -> int:
        """Mark all notifications as read."""
        result = await db.execute(
            update(Notification)
            .where(
                Notification.user_id == user_id,
                Notification.is_read == False,
            )
            .values(is_read=True)
        )
        await db.commit()
        return result.rowcount

    @staticmethod
    async def delete_notification(
        db: AsyncSession, user_id: int, notification_id: int
    ) -> bool:
        """Delete a notification."""
        result = await db.execute(
            select(Notification)
            .where(
                Notification.id == notification_id,
                Notification.user_id == user_id,
            )
        )
        notification = result.scalar_one_or_none()
        if not notification:
            return False

        await db.delete(notification)
        await db.commit()
        return True

    # ── Alert Rules ──────────────────────────────────

    @staticmethod
    async def create_alert_rule(
        db: AsyncSession, user_id: int, data: dict
    ) -> AlertRule:
        """Create a custom alert rule."""
        rule = AlertRule(
            user_id=user_id,
            name=data["name"],
            rule_type=data["rule_type"],
            config=data["config"],
        )
        db.add(rule)
        await db.commit()
        await db.refresh(rule)
        return rule

    @staticmethod
    async def get_alert_rules(
        db: AsyncSession, user_id: int
    ) -> list:
        """Get all alert rules for a user."""
        result = await db.execute(
            select(AlertRule)
            .where(AlertRule.user_id == user_id)
            .order_by(AlertRule.created_at.desc())
        )
        return result.scalars().all()

    @staticmethod
    async def update_alert_rule(
        db: AsyncSession, user_id: int, rule_id: int, data: dict
    ) -> AlertRule | None:
        """Update an alert rule."""
        result = await db.execute(
            select(AlertRule)
            .where(AlertRule.id == rule_id, AlertRule.user_id == user_id)
        )
        rule = result.scalar_one_or_none()
        if not rule:
            return None

        for field, value in data.items():
            if value is not None:
                setattr(rule, field, value)

        await db.commit()
        await db.refresh(rule)
        return rule

    @staticmethod
    async def delete_alert_rule(
        db: AsyncSession, user_id: int, rule_id: int
    ) -> bool:
        """Delete an alert rule."""
        result = await db.execute(
            select(AlertRule)
            .where(AlertRule.id == rule_id, AlertRule.user_id == user_id)
        )
        rule = result.scalar_one_or_none()
        if not rule:
            return False

        await db.delete(rule)
        await db.commit()
        return True

    @staticmethod
    async def evaluate_alert_rules(
        db: AsyncSession, user_id: int
    ) -> int:
        """
        Evaluate all active alert rules and generate notifications.
        Called by background worker or after transaction changes.
        """
        result = await db.execute(
            select(AlertRule)
            .where(AlertRule.user_id == user_id, AlertRule.is_active == True)
        )
        rules = result.scalars().all()
        notifications_created = 0
        today = datetime.date.today()
        first_of_month = today.replace(day=1)

        for rule in rules:
            config = rule.config

            if rule.rule_type == "budget_threshold":
                # Check if spending in a category exceeds threshold % of budget
                category = config.get("category")
                threshold_pct = config.get("threshold", 80)

                budget_result = await db.execute(
                    select(Budget)
                    .where(
                        Budget.user_id == user_id,
                        Budget.category == category,
                    )
                )
                budget = budget_result.scalar_one_or_none()
                if not budget:
                    continue

                spent_result = await db.execute(
                    select(func.coalesce(func.sum(Transaction.amount), 0))
                    .where(and_(
                        Transaction.user_id == user_id,
                        Transaction.category == category,
                        Transaction.amount < 0,
                        Transaction.date >= first_of_month,
                    ))
                )
                spent = abs(float(spent_result.scalar()))
                utilization = (spent / budget.budget * 100) if budget.budget > 0 else 0

                if utilization >= threshold_pct:
                    await NotificationService.create_notification(
                        db, user_id,
                        type_="budget_alert",
                        title=f"Budget Alert: {category}",
                        message=(
                            f"You've used {utilization:.0f}% of your {category} budget "
                            f"(₹{spent:,.0f} of ₹{budget.budget:,.0f})."
                        ),
                        priority="high" if utilization >= 100 else "medium",
                        action_url="/budgets",
                    )
                    notifications_created += 1

            elif rule.rule_type == "spending_limit":
                # Check if daily spending exceeds a limit
                daily_limit = config.get("daily_limit", 5000)
                spent_result = await db.execute(
                    select(func.coalesce(func.sum(Transaction.amount), 0))
                    .where(and_(
                        Transaction.user_id == user_id,
                        Transaction.amount < 0,
                        Transaction.date == today,
                    ))
                )
                today_spent = abs(float(spent_result.scalar()))

                if today_spent > daily_limit:
                    await NotificationService.create_notification(
                        db, user_id,
                        type_="spending_alert",
                        title="Daily Spending Limit Exceeded",
                        message=(
                            f"You've spent ₹{today_spent:,.0f} today, exceeding your "
                            f"daily limit of ₹{daily_limit:,.0f}."
                        ),
                        priority="high",
                    )
                    notifications_created += 1

        return notifications_created
