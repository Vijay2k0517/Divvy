"""
Recommendation Engine — AI-powered budget optimization recommendations.

Architecture:
  Router → RecommendationService → Statistical analysis + Pattern mining → BudgetRecommendation (DB)

Strategies:
  1. Historical trend analysis: recommends budgets based on 3-6 month spending trends
  2. Peer comparison: category-level percentile benchmarking
  3. Savings potential: identifies categories with high variance (opportunity to cut)
  4. Budget utilization: flags over/under-utilized budgets
"""

import datetime
import calendar
import logging
from typing import Optional

import numpy as np
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from ..models import Transaction, Budget, BudgetRecommendation
from ..config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class RecommendationService:

    @staticmethod
    async def _get_category_spending_history(
        db: AsyncSession, user_id: int, months: int = 6
    ) -> dict:
        """Get per-category monthly spending for the last N months."""
        today = datetime.date.today()
        category_data = {}

        for i in range(months - 1, -1, -1):
            d = today - datetime.timedelta(days=30 * i)
            first = d.replace(day=1)
            last_day = calendar.monthrange(d.year, d.month)[1]
            last = d.replace(day=last_day)

            result = await db.execute(
                select(
                    Transaction.category,
                    func.coalesce(func.sum(Transaction.amount), 0).label("total"),
                )
                .where(and_(
                    Transaction.user_id == user_id,
                    Transaction.amount < 0,
                    Transaction.date >= first,
                    Transaction.date <= last,
                ))
                .group_by(Transaction.category)
            )

            for row in result:
                cat = row.category
                if cat not in category_data:
                    category_data[cat] = []
                category_data[cat].append(abs(float(row.total)))

        return category_data

    @staticmethod
    async def generate_recommendations(
        db: AsyncSession, user_id: int
    ) -> list[dict]:
        """Generate budget optimization recommendations."""
        category_spending = await RecommendationService._get_category_spending_history(
            db, user_id
        )

        # Get current budgets
        budget_result = await db.execute(
            select(Budget).where(Budget.user_id == user_id)
        )
        current_budgets = {b.category: b.budget for b in budget_result.scalars().all()}

        # Clear old pending recommendations
        await db.execute(
            select(BudgetRecommendation)
            .where(
                BudgetRecommendation.user_id == user_id,
                BudgetRecommendation.status == "pending",
            )
        )

        recommendations = []

        for category, monthly_amounts in category_spending.items():
            if not monthly_amounts or len(monthly_amounts) < 2:
                continue

            amounts = np.array(monthly_amounts)
            mean_spending = float(np.mean(amounts))
            std_spending = float(np.std(amounts))
            median_spending = float(np.median(amounts))
            trend = float(amounts[-1] - amounts[0]) / len(amounts) if len(amounts) > 1 else 0

            current_budget = current_budgets.get(category)

            # Strategy 1: Budget Utilization Analysis
            if current_budget:
                avg_utilization = (mean_spending / current_budget * 100) if current_budget > 0 else 0

                if avg_utilization > 110:
                    # Consistently over budget — suggest increase
                    recommended = round(mean_spending * 1.1, -2)  # round to nearest 100
                    recommendations.append({
                        "category": category,
                        "current_budget": current_budget,
                        "recommended_budget": recommended,
                        "rationale": (
                            f"You've averaged ₹{mean_spending:,.0f}/month in {category}, "
                            f"exceeding your ₹{current_budget:,.0f} budget by "
                            f"{avg_utilization - 100:.0f}%. Consider adjusting to ₹{recommended:,.0f} "
                            f"for a realistic target."
                        ),
                        "potential_savings": 0,
                        "confidence": min(0.95, 0.5 + len(monthly_amounts) * 0.08),
                    })

                elif avg_utilization < 50:
                    # Significantly under budget — suggest decrease
                    recommended = round(mean_spending * 1.2, -2)
                    savings = current_budget - recommended
                    recommendations.append({
                        "category": category,
                        "current_budget": current_budget,
                        "recommended_budget": max(recommended, round(median_spending, -2)),
                        "rationale": (
                            f"Your {category} spending averages ₹{mean_spending:,.0f}/month, "
                            f"using only {avg_utilization:.0f}% of your ₹{current_budget:,.0f} budget. "
                            f"Reducing it could free up ₹{savings:,.0f}/month for savings."
                        ),
                        "potential_savings": max(0, savings),
                        "confidence": min(0.95, 0.5 + len(monthly_amounts) * 0.08),
                    })

            # Strategy 2: High Variance (spending control opportunity)
            cv = (std_spending / mean_spending) if mean_spending > 0 else 0  # coefficient of variation
            if cv > 0.4 and mean_spending > 1000:
                recommended = round(median_spending * 1.1, -2)
                potential_savings = max(0, mean_spending - median_spending) if not current_budget else 0

                if not any(r["category"] == category for r in recommendations):
                    recommendations.append({
                        "category": category,
                        "current_budget": current_budget,
                        "recommended_budget": recommended,
                        "rationale": (
                            f"Your {category} spending varies significantly "
                            f"(₹{min(amounts):,.0f} to ₹{max(amounts):,.0f}). "
                            f"Setting a ₹{recommended:,.0f} budget based on your median "
                            f"could help stabilize spending."
                        ),
                        "potential_savings": potential_savings,
                        "confidence": round(0.6 + min(0.3, len(monthly_amounts) * 0.05), 2),
                    })

            # Strategy 3: Categories without budgets (suggest creating one)
            if not current_budget and mean_spending > 500:
                recommended = round(mean_spending * 1.05, -2)  # 5% buffer

                if not any(r["category"] == category for r in recommendations):
                    recommendations.append({
                        "category": category,
                        "current_budget": None,
                        "recommended_budget": recommended,
                        "rationale": (
                            f"You spend an average of ₹{mean_spending:,.0f}/month on {category} "
                            f"but don't have a budget set. Creating a ₹{recommended:,.0f} budget "
                            f"will help you track and control this spending."
                        ),
                        "potential_savings": round(mean_spending * 0.1, 0),
                        "confidence": round(0.5 + min(0.4, len(monthly_amounts) * 0.07), 2),
                    })

        # Save to database
        for rec in recommendations:
            db_rec = BudgetRecommendation(
                user_id=user_id,
                category=rec["category"],
                current_budget=rec["current_budget"],
                recommended_budget=rec["recommended_budget"],
                rationale=rec["rationale"],
                potential_savings=rec["potential_savings"],
                confidence=rec["confidence"],
            )
            db.add(db_rec)

        await db.commit()
        return recommendations

    @staticmethod
    async def get_recommendations(
        db: AsyncSession,
        user_id: int,
        status: Optional[str] = None,
    ) -> dict:
        """Get user's budget recommendations."""
        q = select(BudgetRecommendation).where(
            BudgetRecommendation.user_id == user_id
        )
        if status:
            q = q.where(BudgetRecommendation.status == status)

        q = q.order_by(BudgetRecommendation.generated_at.desc())
        result = await db.execute(q)
        recommendations = result.scalars().all()

        total_savings = sum(
            r.potential_savings or 0
            for r in recommendations
            if r.status == "pending"
        )

        return {
            "recommendations": recommendations,
            "total_potential_savings": total_savings,
        }

    @staticmethod
    async def update_recommendation_status(
        db: AsyncSession,
        user_id: int,
        recommendation_id: int,
        status: str,
    ) -> Optional[BudgetRecommendation]:
        """Accept or dismiss a recommendation."""
        result = await db.execute(
            select(BudgetRecommendation)
            .where(
                BudgetRecommendation.id == recommendation_id,
                BudgetRecommendation.user_id == user_id,
            )
        )
        rec = result.scalar_one_or_none()
        if not rec:
            return None

        rec.status = status

        # If accepted, update or create the actual budget
        if status == "accepted":
            budget_result = await db.execute(
                select(Budget)
                .where(Budget.user_id == user_id, Budget.category == rec.category)
            )
            budget = budget_result.scalar_one_or_none()
            if budget:
                budget.budget = rec.recommended_budget
            else:
                new_budget = Budget(
                    user_id=user_id,
                    category=rec.category,
                    budget=rec.recommended_budget,
                )
                db.add(new_budget)

        await db.commit()
        await db.refresh(rec)
        return rec
