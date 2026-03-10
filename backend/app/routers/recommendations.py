"""Router: Budget Optimization Recommendation Engine (Enhancement #9)"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models import User
from ..schemas import (
    RecommendationOut, RecommendationListResponse, RecommendationAction,
)
from ..dependencies import get_current_user
from ..services.recommendation_service import RecommendationService

router = APIRouter(prefix="/api/recommendations", tags=["recommendations"])


@router.post("/generate", response_model=RecommendationListResponse)
async def generate_recommendations(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate AI budget optimization recommendations based on spending history."""
    recs = await RecommendationService.generate_recommendations(db, user.id)

    total_savings = sum(r.get("potential_savings", 0) or 0 for r in recs)
    return RecommendationListResponse(
        recommendations=[
            RecommendationOut(
                id=0,  # IDs assigned by DB after commit
                category=r["category"],
                current_budget=r["current_budget"],
                recommended_budget=r["recommended_budget"],
                rationale=r["rationale"],
                potential_savings=r["potential_savings"],
                confidence=r["confidence"],
                status="pending",
                generated_at=__import__("datetime").datetime.utcnow(),
            )
            for r in recs
        ],
        total_potential_savings=total_savings,
    )


@router.get("", response_model=RecommendationListResponse)
async def list_recommendations(
    status: str = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List budget recommendations (optionally filtered by status)."""
    result = await RecommendationService.get_recommendations(
        db, user.id, status=status
    )
    return RecommendationListResponse(
        recommendations=[
            RecommendationOut.model_validate(r) for r in result["recommendations"]
        ],
        total_potential_savings=result["total_potential_savings"],
    )


@router.put("/{recommendation_id}")
async def update_recommendation(
    recommendation_id: int,
    req: RecommendationAction,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Accept or dismiss a recommendation. Accepting auto-updates the budget."""
    rec = await RecommendationService.update_recommendation_status(
        db, user.id, recommendation_id, req.status
    )
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    return {
        "success": True,
        "status": rec.status,
        "message": (
            f"Budget for {rec.category} updated to ₹{rec.recommended_budget:,.0f}"
            if rec.status == "accepted"
            else f"Recommendation for {rec.category} dismissed"
        ),
    }
