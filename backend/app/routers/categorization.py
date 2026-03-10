"""Router: ML Transaction Categorization (Enhancement #2)"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..database import get_db
from ..models import User, Transaction
from ..schemas import (
    CategorizationRequest, CategorizationResponse,
    BulkCategorizationRequest, BulkCategorizationResponse,
    TrainModelRequest, TrainModelResponse,
)
from ..dependencies import get_current_user
from ..services.categorization_service import CategorizationService

router = APIRouter(prefix="/api/categorization", tags=["categorization"])


@router.post("/predict", response_model=CategorizationResponse)
async def predict_category(
    req: CategorizationRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Predict the category for a transaction description."""
    result = await CategorizationService.predict_category(
        db, user.id,
        description=req.description,
        amount=req.amount,
        mode=req.mode,
    )
    return CategorizationResponse(**result)


@router.post("/bulk", response_model=BulkCategorizationResponse)
async def bulk_categorize(
    req: BulkCategorizationRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Re-categorize multiple transactions using the ML model."""
    results = []
    updated = 0

    for txn_id in req.transaction_ids:
        result = await db.execute(
            select(Transaction)
            .where(Transaction.id == txn_id, Transaction.user_id == user.id)
        )
        txn = result.scalar_one_or_none()
        if not txn:
            results.append({"id": txn_id, "status": "not_found"})
            continue

        prediction = await CategorizationService.predict_category(
            db, user.id,
            description=txn.description,
            amount=txn.amount,
            mode=txn.mode,
        )

        txn.ml_category = prediction["predicted_category"]
        txn.ml_confidence = prediction["confidence"]
        updated += 1

        results.append({
            "id": txn_id,
            "status": "updated",
            "predicted_category": prediction["predicted_category"],
            "confidence": prediction["confidence"],
        })

    await db.commit()
    return BulkCategorizationResponse(updated=updated, results=results)


@router.post("/train", response_model=TrainModelResponse)
async def train_categorizer(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Train/retrain the categorization model on user's labeled data."""
    result = await CategorizationService.train_model(db, user.id)

    if result["status"] == "error":
        raise HTTPException(status_code=500, detail=result["message"])
    if result["status"] == "insufficient_data":
        raise HTTPException(status_code=400, detail=result["message"])

    return TrainModelResponse(
        status="success",
        message=f"Model trained with accuracy {result['accuracy']:.1%}",
        model_type="categorizer",
        version=result["version"],
    )
