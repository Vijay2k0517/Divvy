"""Router: Open Banking / Bank Transaction Sync (Enhancement #5)"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models import User
from ..schemas import (
    BankConnectionCreate, BankConnectionOut,
    BankSyncResponse, BankConnectionListResponse,
)
from ..dependencies import get_current_user
from ..services.bank_sync_service import BankSyncService

router = APIRouter(prefix="/api/bank", tags=["bank-sync"])


@router.post("/connect", response_model=BankConnectionOut)
async def connect_bank(
    req: BankConnectionCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Connect a bank account via Open Banking."""
    connection = await BankSyncService.create_connection(
        db, user.id,
        institution_id=req.institution_id,
        institution_name=req.institution_name,
        consent_token=req.consent_token,
    )
    return BankConnectionOut.model_validate(connection)


@router.get("/connections", response_model=BankConnectionListResponse)
async def list_connections(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List connected bank accounts."""
    result = await BankSyncService.get_connections(db, user.id)
    return BankConnectionListResponse(
        connections=[BankConnectionOut.model_validate(c) for c in result["connections"]],
        total=result["total"],
    )


@router.post("/sync/{connection_id}", response_model=BankSyncResponse)
async def sync_transactions(
    connection_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Sync transactions from a connected bank account."""
    result = await BankSyncService.sync_transactions(db, user.id, connection_id)
    if result.get("sync_status") == "error":
        raise HTTPException(status_code=400, detail=result.get("message"))
    return BankSyncResponse(**result)


@router.delete("/connections/{connection_id}")
async def disconnect_bank(
    connection_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Disconnect a bank account."""
    success = await BankSyncService.disconnect(db, user.id, connection_id)
    if not success:
        raise HTTPException(status_code=404, detail="Connection not found")
    return {"success": True}
