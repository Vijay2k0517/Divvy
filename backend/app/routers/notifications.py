"""Router: Notification & Alert Microservice (Enhancement #7)"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models import User
from ..schemas import (
    NotificationOut, NotificationListResponse,
    AlertRuleCreate, AlertRuleUpdate, AlertRuleOut,
)
from ..dependencies import get_current_user
from ..services.notification_service import NotificationService

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


# ── Notifications ─────────────────────────────────────

@router.get("", response_model=NotificationListResponse)
async def list_notifications(
    unread_only: bool = False,
    limit: int = Query(50, ge=1, le=200),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get notifications for the current user."""
    result = await NotificationService.get_notifications(
        db, user.id, unread_only=unread_only, limit=limit,
    )
    return NotificationListResponse(
        notifications=[NotificationOut.model_validate(n) for n in result["notifications"]],
        total=result["total"],
        unread=result["unread"],
    )


@router.put("/{notification_id}/read")
async def mark_notification_read(
    notification_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark a notification as read."""
    success = await NotificationService.mark_read(db, user.id, notification_id)
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"success": True}


@router.put("/read-all")
async def mark_all_read(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark all notifications as read."""
    count = await NotificationService.mark_all_read(db, user.id)
    return {"success": True, "marked": count}


@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a notification."""
    success = await NotificationService.delete_notification(db, user.id, notification_id)
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"success": True}


# ── Alert Rules ───────────────────────────────────────

@router.get("/rules", response_model=list[AlertRuleOut])
async def list_alert_rules(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List user-defined alert rules."""
    rules = await NotificationService.get_alert_rules(db, user.id)
    return [AlertRuleOut.model_validate(r) for r in rules]


@router.post("/rules", response_model=AlertRuleOut, status_code=201)
async def create_alert_rule(
    req: AlertRuleCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a custom alert rule."""
    rule = await NotificationService.create_alert_rule(
        db, user.id, req.model_dump()
    )
    return AlertRuleOut.model_validate(rule)


@router.put("/rules/{rule_id}", response_model=AlertRuleOut)
async def update_alert_rule(
    rule_id: int,
    req: AlertRuleUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an alert rule."""
    rule = await NotificationService.update_alert_rule(
        db, user.id, rule_id, req.model_dump(exclude_unset=True)
    )
    if not rule:
        raise HTTPException(status_code=404, detail="Alert rule not found")
    return AlertRuleOut.model_validate(rule)


@router.delete("/rules/{rule_id}")
async def delete_alert_rule(
    rule_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete an alert rule."""
    success = await NotificationService.delete_alert_rule(db, user.id, rule_id)
    if not success:
        raise HTTPException(status_code=404, detail="Alert rule not found")
    return {"success": True}


@router.post("/evaluate")
async def evaluate_rules(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Manually trigger alert rule evaluation."""
    count = await NotificationService.evaluate_alert_rules(db, user.id)
    return {"notifications_created": count}
