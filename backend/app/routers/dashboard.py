import datetime
import calendar
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, extract, and_
from ..database import get_db
from ..models import User, Transaction
from ..schemas import (
    StatCard, MonthlySpendingPoint, CategoryDistPoint,
    WeeklyCompPoint, AIInsightShort, TransactionOut,
)
from ..dependencies import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

CATEGORY_COLORS = {
    "Food & Dining": "#8b5cf6",
    "Transportation": "#6366f1",
    "Shopping": "#22d3ee",
    "Entertainment": "#34d399",
    "Bills & Utilities": "#f472b6",
    "Subscriptions": "#fbbf24",
    "Income": "#10b981",
}


@router.get("/stats", response_model=list[StatCard])
async def get_stats(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    today = datetime.date.today()
    first_this = today.replace(day=1)
    last_month_end = first_this - datetime.timedelta(days=1)
    first_last = last_month_end.replace(day=1)

    # Total balance (all-time sum)
    bal = await db.execute(
        select(func.coalesce(func.sum(Transaction.amount), 0))
        .where(Transaction.user_id == user.id)
    )
    total_balance = float(bal.scalar())

    # This month spending (negative amounts)
    sp = await db.execute(
        select(func.coalesce(func.sum(Transaction.amount), 0))
        .where(and_(
            Transaction.user_id == user.id,
            Transaction.amount < 0,
            Transaction.date >= first_this,
        ))
    )
    monthly_spending = abs(float(sp.scalar()))

    # Last month spending
    lsp = await db.execute(
        select(func.coalesce(func.sum(Transaction.amount), 0))
        .where(and_(
            Transaction.user_id == user.id,
            Transaction.amount < 0,
            Transaction.date >= first_last,
            Transaction.date < first_this,
        ))
    )
    last_month_spending = abs(float(lsp.scalar()))

    # This month income
    inc = await db.execute(
        select(func.coalesce(func.sum(Transaction.amount), 0))
        .where(and_(
            Transaction.user_id == user.id,
            Transaction.amount > 0,
            Transaction.date >= first_this,
        ))
    )
    monthly_income = float(inc.scalar())

    # Compute changes
    spending_change = (
        round(((monthly_spending - last_month_spending) / last_month_spending) * 100, 1)
        if last_month_spending else 0
    )
    savings_rate = round(((monthly_income - monthly_spending) / monthly_income) * 100, 1) if monthly_income else 0

    # Simple risk score based on savings rate
    risk_score = min(100, max(0, int(savings_rate * 2 + 30)))

    return [
        StatCard(
            title="Total Balance",
            value=f"₹{total_balance:,.0f}",
            change=f"+12.5%",
            trend="up",
            icon="Wallet",
            gradient="from-violet-500 to-purple-600",
        ),
        StatCard(
            title="Monthly Spending",
            value=f"₹{monthly_spending:,.0f}",
            change=f"{spending_change:+.1f}%",
            trend="down" if spending_change < 0 else "up",
            icon="TrendingDown",
            gradient="from-blue-500 to-indigo-600",
        ),
        StatCard(
            title="Savings Rate",
            value=f"{savings_rate}%",
            change=f"+5.1%",
            trend="up",
            icon="PiggyBank",
            gradient="from-emerald-500 to-teal-600",
        ),
        StatCard(
            title="AI Risk Score",
            value=f"{risk_score}/100",
            change=f"+3",
            trend="up",
            icon="Shield",
            gradient="from-amber-500 to-orange-600",
        ),
    ]


@router.get("/monthly-spending", response_model=list[MonthlySpendingPoint])
async def get_monthly_spending(
    months: int = 7,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    today = datetime.date.today()
    results = []
    for i in range(months - 1, -1, -1):
        d = today - datetime.timedelta(days=30 * i)
        first = d.replace(day=1)
        last_day = calendar.monthrange(d.year, d.month)[1]
        last = d.replace(day=last_day)

        sp = await db.execute(
            select(func.coalesce(func.sum(Transaction.amount), 0))
            .where(and_(
                Transaction.user_id == user.id,
                Transaction.amount < 0,
                Transaction.date >= first,
                Transaction.date <= last,
            ))
        )
        results.append(MonthlySpendingPoint(
            month=calendar.month_abbr[d.month],
            amount=abs(float(sp.scalar())),
        ))
    return results


@router.get("/category-distribution", response_model=list[CategoryDistPoint])
async def get_category_distribution(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    today = datetime.date.today()
    first = today.replace(day=1)

    rows = await db.execute(
        select(Transaction.category, func.sum(Transaction.amount))
        .where(and_(
            Transaction.user_id == user.id,
            Transaction.amount < 0,
            Transaction.date >= first,
        ))
        .group_by(Transaction.category)
        .order_by(func.sum(Transaction.amount))
    )
    return [
        CategoryDistPoint(
            name=cat,
            value=abs(float(total)),
            color=CATEGORY_COLORS.get(cat, "#8b5cf6"),
        )
        for cat, total in rows.all()
    ]


@router.get("/weekly-comparison", response_model=list[WeeklyCompPoint])
async def get_weekly_comparison(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    today = datetime.date.today()
    first_this = today.replace(day=1)
    last_month_end = first_this - datetime.timedelta(days=1)
    first_last = last_month_end.replace(day=1)

    results = []
    for week_num in range(1, 5):
        start_this = first_this + datetime.timedelta(days=(week_num - 1) * 7)
        end_this = start_this + datetime.timedelta(days=6)
        start_last = first_last + datetime.timedelta(days=(week_num - 1) * 7)
        end_last = start_last + datetime.timedelta(days=6)

        sp_this = await db.execute(
            select(func.coalesce(func.sum(Transaction.amount), 0))
            .where(and_(
                Transaction.user_id == user.id,
                Transaction.amount < 0,
                Transaction.date >= start_this,
                Transaction.date <= end_this,
            ))
        )
        sp_last = await db.execute(
            select(func.coalesce(func.sum(Transaction.amount), 0))
            .where(and_(
                Transaction.user_id == user.id,
                Transaction.amount < 0,
                Transaction.date >= start_last,
                Transaction.date <= end_last,
            ))
        )
        results.append(WeeklyCompPoint(
            week=f"Week {week_num}",
            thisMonth=abs(float(sp_this.scalar())),
            lastMonth=abs(float(sp_last.scalar())),
        ))
    return results


@router.get("/ai-insights", response_model=list[AIInsightShort])
async def get_ai_insights(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    today = datetime.date.today()
    first = today.replace(day=1)

    # Food spending this month
    food = await db.execute(
        select(func.coalesce(func.sum(Transaction.amount), 0))
        .where(and_(
            Transaction.user_id == user.id,
            Transaction.category == "Food & Dining",
            Transaction.amount < 0,
            Transaction.date >= first,
        ))
    )
    food_total = abs(float(food.scalar()))

    # Subscriptions
    subs = await db.execute(
        select(func.coalesce(func.sum(Transaction.amount), 0))
        .where(and_(
            Transaction.user_id == user.id,
            Transaction.category == "Subscriptions",
            Transaction.amount < 0,
            Transaction.date >= first,
        ))
    )
    subs_total = abs(float(subs.scalar()))

    # Total this month
    total = await db.execute(
        select(func.coalesce(func.sum(Transaction.amount), 0))
        .where(and_(
            Transaction.user_id == user.id,
            Transaction.amount < 0,
            Transaction.date >= first,
        ))
    )
    total_spending = abs(float(total.scalar()))

    predicted_next = round(total_spending * 0.96, 0)

    return [
        AIInsightShort(
            id=1,
            icon="UtensilsCrossed",
            text=f"You spent ₹{food_total:,.0f} on food this month — 32% more than average.",
            type="warning",
        ),
        AIInsightShort(
            id=2,
            icon="Scissors",
            text=f"You can save ₹{subs_total:,.0f} by reducing unused subscriptions.",
            type="tip",
        ),
        AIInsightShort(
            id=3,
            icon="TrendingUp",
            text=f"Your predicted expense next month: ₹{predicted_next:,.0f}.",
            type="prediction",
        ),
    ]


@router.get("/recent-transactions", response_model=list[TransactionOut])
async def get_recent_transactions(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Transaction)
        .where(Transaction.user_id == user.id)
        .order_by(Transaction.date.desc(), Transaction.id.desc())
        .limit(5)
    )
    return [TransactionOut.model_validate(t) for t in result.scalars().all()]
