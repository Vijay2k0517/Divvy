"""
Investment Service — Portfolio tracking with performance analytics.

Architecture:
  Router → InvestmentService → Investment + InvestmentSnapshot (DB)

Features:
  - CRUD for investment holdings
  - Portfolio summary with gain/loss
  - Asset allocation breakdown
  - Historical portfolio snapshots
"""

import datetime
import logging
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from ..models import Investment, InvestmentSnapshot
from ..config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class InvestmentService:

    @staticmethod
    async def get_portfolio(
        db: AsyncSession, user_id: int
    ) -> dict:
        """Get complete portfolio summary with allocation breakdown."""
        result = await db.execute(
            select(Investment)
            .where(Investment.user_id == user_id)
            .order_by(Investment.buy_date.desc())
        )
        investments = result.scalars().all()

        total_invested = 0.0
        total_current = 0.0
        allocation = {}
        inv_list = []

        for inv in investments:
            invested = inv.quantity * inv.buy_price
            current = inv.quantity * (inv.current_price or inv.buy_price)
            gain_loss = current - invested
            gain_loss_pct = (gain_loss / invested * 100) if invested > 0 else 0

            total_invested += invested
            total_current += current

            asset_type = inv.asset_type
            if asset_type not in allocation:
                allocation[asset_type] = 0.0
            allocation[asset_type] += current

            inv_list.append({
                "id": inv.id,
                "name": inv.name,
                "symbol": inv.symbol,
                "asset_type": inv.asset_type,
                "quantity": inv.quantity,
                "buy_price": inv.buy_price,
                "current_price": inv.current_price,
                "buy_date": inv.buy_date,
                "currency": inv.currency,
                "notes": inv.notes,
                "gain_loss": round(gain_loss, 2),
                "gain_loss_pct": round(gain_loss_pct, 2),
                "total_invested": round(invested, 2),
                "total_current": round(current, 2),
            })

        total_gain_loss = total_current - total_invested
        total_gain_loss_pct = (
            (total_gain_loss / total_invested * 100) if total_invested > 0 else 0
        )

        allocation_list = [
            {
                "asset_type": at,
                "value": round(val, 2),
                "pct": round((val / total_current * 100) if total_current > 0 else 0, 1),
            }
            for at, val in sorted(allocation.items(), key=lambda x: x[1], reverse=True)
        ]

        return {
            "total_invested": round(total_invested, 2),
            "total_current": round(total_current, 2),
            "total_gain_loss": round(total_gain_loss, 2),
            "total_gain_loss_pct": round(total_gain_loss_pct, 2),
            "investments": inv_list,
            "allocation": allocation_list,
        }

    @staticmethod
    async def create_investment(
        db: AsyncSession, user_id: int, data: dict
    ) -> Investment:
        """Add a new investment holding."""
        investment = Investment(
            user_id=user_id,
            name=data["name"],
            symbol=data.get("symbol"),
            asset_type=data["asset_type"],
            quantity=data["quantity"],
            buy_price=data["buy_price"],
            current_price=data.get("current_price", data["buy_price"]),
            buy_date=data["buy_date"],
            currency=data.get("currency", "INR"),
            notes=data.get("notes"),
        )
        db.add(investment)
        await db.commit()
        await db.refresh(investment)
        return investment

    @staticmethod
    async def update_investment(
        db: AsyncSession, user_id: int, investment_id: int, data: dict
    ) -> Optional[Investment]:
        """Update an investment holding."""
        result = await db.execute(
            select(Investment)
            .where(Investment.id == investment_id, Investment.user_id == user_id)
        )
        investment = result.scalar_one_or_none()
        if not investment:
            return None

        for field, value in data.items():
            if value is not None:
                setattr(investment, field, value)

        await db.commit()
        await db.refresh(investment)
        return investment

    @staticmethod
    async def delete_investment(
        db: AsyncSession, user_id: int, investment_id: int
    ) -> bool:
        """Remove an investment holding."""
        result = await db.execute(
            select(Investment)
            .where(Investment.id == investment_id, Investment.user_id == user_id)
        )
        investment = result.scalar_one_or_none()
        if not investment:
            return False

        await db.delete(investment)
        await db.commit()
        return True

    @staticmethod
    async def take_snapshot(
        db: AsyncSession, user_id: int
    ) -> Optional[InvestmentSnapshot]:
        """Take a daily portfolio value snapshot."""
        today = datetime.date.today()

        # Check if snapshot already taken today
        existing = await db.execute(
            select(InvestmentSnapshot)
            .where(
                InvestmentSnapshot.user_id == user_id,
                InvestmentSnapshot.date == today,
            )
        )
        if existing.scalar_one_or_none():
            return None

        # Calculate totals
        result = await db.execute(
            select(Investment).where(Investment.user_id == user_id)
        )
        investments = result.scalars().all()

        if not investments:
            return None

        total_invested = sum(inv.quantity * inv.buy_price for inv in investments)
        total_current = sum(
            inv.quantity * (inv.current_price or inv.buy_price)
            for inv in investments
        )

        snapshot = InvestmentSnapshot(
            user_id=user_id,
            date=today,
            total_invested=round(total_invested, 2),
            total_current=round(total_current, 2),
        )
        db.add(snapshot)
        await db.commit()
        await db.refresh(snapshot)
        return snapshot

    @staticmethod
    async def get_performance_history(
        db: AsyncSession, user_id: int, days: int = 90
    ) -> list:
        """Get portfolio performance over time."""
        cutoff = datetime.date.today() - datetime.timedelta(days=days)
        result = await db.execute(
            select(InvestmentSnapshot)
            .where(
                InvestmentSnapshot.user_id == user_id,
                InvestmentSnapshot.date >= cutoff,
            )
            .order_by(InvestmentSnapshot.date)
        )
        return result.scalars().all()
