"""Router: Investment Tracking Module (Enhancement #6)"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models import User
from ..schemas import (
    InvestmentCreate, InvestmentUpdate, InvestmentOut,
    PortfolioSummary, InvestmentSnapshotOut,
)
from ..dependencies import get_current_user
from ..services.investment_service import InvestmentService

router = APIRouter(prefix="/api/investments", tags=["investments"])


@router.get("/portfolio", response_model=PortfolioSummary)
async def get_portfolio(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get complete portfolio summary with allocation."""
    result = await InvestmentService.get_portfolio(db, user.id)
    return PortfolioSummary(
        total_invested=result["total_invested"],
        total_current=result["total_current"],
        total_gain_loss=result["total_gain_loss"],
        total_gain_loss_pct=result["total_gain_loss_pct"],
        investments=[InvestmentOut(**inv) for inv in result["investments"]],
        allocation=result["allocation"],
    )


@router.get("", response_model=list[InvestmentOut])
async def list_investments(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all investment holdings."""
    from sqlalchemy import select
    from ..models import Investment
    result = await db.execute(
        select(Investment).where(Investment.user_id == user.id).order_by(Investment.buy_date.desc())
    )
    investments = result.scalars().all()
    out = []
    for inv in investments:
        invested = inv.quantity * inv.buy_price
        current = inv.quantity * (inv.current_price or inv.buy_price)
        out.append(InvestmentOut(
            id=inv.id, name=inv.name, symbol=inv.symbol,
            asset_type=inv.asset_type, quantity=inv.quantity,
            buy_price=inv.buy_price, current_price=inv.current_price,
            buy_date=inv.buy_date, currency=inv.currency, notes=inv.notes,
            gain_loss=round(current - invested, 2),
            gain_loss_pct=round(((current - invested) / invested * 100) if invested > 0 else 0, 2),
            total_invested=round(invested, 2),
            total_current=round(current, 2),
        ))
    return out


@router.post("", response_model=InvestmentOut, status_code=201)
async def create_investment(
    req: InvestmentCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a new investment holding."""
    investment = await InvestmentService.create_investment(
        db, user.id, req.model_dump()
    )
    invested = investment.quantity * investment.buy_price
    current = investment.quantity * (investment.current_price or investment.buy_price)
    return InvestmentOut(
        id=investment.id,
        name=investment.name,
        symbol=investment.symbol,
        asset_type=investment.asset_type,
        quantity=investment.quantity,
        buy_price=investment.buy_price,
        current_price=investment.current_price,
        buy_date=investment.buy_date,
        currency=investment.currency,
        notes=investment.notes,
        gain_loss=round(current - invested, 2),
        gain_loss_pct=round(((current - invested) / invested * 100) if invested > 0 else 0, 2),
        total_invested=round(invested, 2),
        total_current=round(current, 2),
    )


@router.put("/{investment_id}", response_model=InvestmentOut)
async def update_investment(
    investment_id: int,
    req: InvestmentUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an investment holding."""
    investment = await InvestmentService.update_investment(
        db, user.id, investment_id, req.model_dump(exclude_unset=True)
    )
    if not investment:
        raise HTTPException(status_code=404, detail="Investment not found")

    invested = investment.quantity * investment.buy_price
    current = investment.quantity * (investment.current_price or investment.buy_price)
    return InvestmentOut(
        id=investment.id,
        name=investment.name,
        symbol=investment.symbol,
        asset_type=investment.asset_type,
        quantity=investment.quantity,
        buy_price=investment.buy_price,
        current_price=investment.current_price,
        buy_date=investment.buy_date,
        currency=investment.currency,
        notes=investment.notes,
        gain_loss=round(current - invested, 2),
        gain_loss_pct=round(((current - invested) / invested * 100) if invested > 0 else 0, 2),
        total_invested=round(invested, 2),
        total_current=round(current, 2),
    )


@router.delete("/{investment_id}")
async def delete_investment(
    investment_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove an investment holding."""
    success = await InvestmentService.delete_investment(db, user.id, investment_id)
    if not success:
        raise HTTPException(status_code=404, detail="Investment not found")
    return {"success": True}


@router.post("/snapshot")
async def take_snapshot(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Take a daily portfolio value snapshot."""
    snapshot = await InvestmentService.take_snapshot(db, user.id)
    if not snapshot:
        return {"message": "Snapshot already taken today or no investments found"}
    return InvestmentSnapshotOut.model_validate(snapshot)


@router.get("/performance", response_model=list[InvestmentSnapshotOut])
async def get_performance(
    days: int = Query(90, ge=7, le=365),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get portfolio performance history."""
    snapshots = await InvestmentService.get_performance_history(db, user.id, days)
    return [InvestmentSnapshotOut.model_validate(s) for s in snapshots]
