"""Router: Financial Anomaly Detection (Enhancement #3)"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models import User
from ..schemas import AnomalyOut, AnomalyListResponse, AnomalyScanResponse
from ..dependencies import get_current_user
from ..services.anomaly_service import AnomalyService

router = APIRouter(prefix="/api/anomalies", tags=["anomalies"])


@router.post("/scan", response_model=AnomalyScanResponse)
async def scan_for_anomalies(
    days_back: int = Query(30, ge=1, le=365),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Scan recent transactions for spending anomalies."""
    result = await AnomalyService.scan_transactions(db, user.id, days_back)
    return AnomalyScanResponse(**result)


@router.get("", response_model=AnomalyListResponse)
async def list_anomalies(
    severity: str = None,
    acknowledged: bool = None,
    limit: int = Query(50, ge=1, le=200),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List detected anomalies with optional filters."""
    result = await AnomalyService.get_anomalies(
        db, user.id,
        severity=severity,
        acknowledged=acknowledged,
        limit=limit,
    )
    return AnomalyListResponse(
        anomalies=[AnomalyOut.model_validate(a) for a in result["anomalies"]],
        total=result["total"],
        unacknowledged=result["unacknowledged"],
    )


@router.put("/{anomaly_id}/acknowledge")
async def acknowledge_anomaly(
    anomaly_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Acknowledge an anomaly (dismiss alert)."""
    success = await AnomalyService.acknowledge_anomaly(db, user.id, anomaly_id)
    if not success:
        raise HTTPException(status_code=404, detail="Anomaly not found")
    return {"success": True}
