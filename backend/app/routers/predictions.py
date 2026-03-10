"""Router: Advanced AI Expense Prediction (Enhancement #1)"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models import User
from ..schemas import (
    PredictionRequest, PredictionResponse, PredictionPoint,
    TrainModelRequest, TrainModelResponse, ModelStatusOut,
)
from ..dependencies import get_current_user
from ..services.prediction_service import PredictionService

router = APIRouter(prefix="/api/predictions", tags=["predictions"])


@router.post("", response_model=PredictionResponse)
async def get_predictions(
    req: PredictionRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Generate AI expense predictions using the best available model.

    Model selection (auto):
    - ≥90 samples → LSTM (deep learning)
    - ≥60 samples → Prophet (statistical)
    - <60 samples → Weighted Moving Average (fallback)
    """
    result = await PredictionService.predict(
        db, user.id,
        months_ahead=req.months_ahead,
        model_type=req.model_type,
    )

    predictions = [
        PredictionPoint(
            month=p["month"],
            predicted=p["predicted"],
            confidence_lower=p.get("confidence_lower"),
            confidence_upper=p.get("confidence_upper"),
        )
        for p in result["predictions"]
    ]

    return PredictionResponse(
        predictions=predictions,
        model_used=result["model_used"],
        training_samples=result["training_samples"],
        metrics=result["metrics"],
    )


@router.get("/models", response_model=list[ModelStatusOut])
async def list_models(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all trained ML models for the current user."""
    from sqlalchemy import select
    from ..models import MLModel

    result = await db.execute(
        select(MLModel)
        .where(MLModel.user_id == user.id)
        .order_by(MLModel.trained_at.desc())
    )
    return [ModelStatusOut.model_validate(m) for m in result.scalars().all()]
