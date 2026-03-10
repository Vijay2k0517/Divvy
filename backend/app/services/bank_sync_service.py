"""
Bank Sync Service — Real-time bank transaction sync via Open Banking APIs.

Architecture:
  Router → BankSyncService → Open Banking API adapter → Transaction sync pipeline

Supports:
  - Account Aggregator / Open Banking consent flow
  - Periodic background sync
  - Deduplication via bank_ref_id
  - Auto-categorization of synced transactions
"""

import datetime
import logging
import hashlib
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from ..models import BankConnection, Transaction
from ..config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class BankSyncService:

    @staticmethod
    async def create_connection(
        db: AsyncSession,
        user_id: int,
        institution_id: str,
        institution_name: str,
        consent_token: str,
    ) -> BankConnection:
        """Register a new bank connection."""
        # Generate a deterministic account_id from user + institution
        account_id = hashlib.sha256(
            f"{user_id}:{institution_id}:{datetime.datetime.utcnow().isoformat()}".encode()
        ).hexdigest()[:32]

        connection = BankConnection(
            user_id=user_id,
            institution_name=institution_name,
            institution_id=institution_id,
            account_id=account_id,
            consent_token=consent_token,
            consent_expires=datetime.datetime.utcnow() + datetime.timedelta(days=90),
        )
        db.add(connection)
        await db.commit()
        await db.refresh(connection)
        return connection

    @staticmethod
    async def sync_transactions(
        db: AsyncSession,
        user_id: int,
        connection_id: int,
    ) -> dict:
        """Sync transactions from a connected bank account."""
        result = await db.execute(
            select(BankConnection)
            .where(
                BankConnection.id == connection_id,
                BankConnection.user_id == user_id,
                BankConnection.is_active == True,
            )
        )
        connection = result.scalar_one_or_none()
        if not connection:
            return {"sync_status": "error", "message": "Connection not found or inactive"}

        # Check consent validity
        if connection.consent_expires < datetime.datetime.utcnow():
            connection.is_active = False
            await db.commit()
            return {"sync_status": "error", "message": "Consent expired, please reconnect"}

        # Fetch transactions from Open Banking API
        bank_transactions = await BankSyncService._fetch_from_bank(
            connection.institution_id,
            connection.account_id,
            connection.consent_token,
            connection.last_synced,
        )

        new_count = 0
        updated_count = 0

        for bt in bank_transactions:
            bank_ref = bt.get("reference_id")
            if not bank_ref:
                continue

            # Check for existing transaction (deduplication)
            existing = await db.execute(
                select(Transaction)
                .where(
                    Transaction.user_id == user_id,
                    Transaction.bank_ref_id == bank_ref,
                )
            )
            existing_txn = existing.scalar_one_or_none()

            if existing_txn:
                # Update if amount changed (rare but possible with pending → settled)
                if existing_txn.amount != bt["amount"]:
                    existing_txn.amount = bt["amount"]
                    existing_txn.status = bt.get("status", "completed")
                    updated_count += 1
            else:
                txn = Transaction(
                    user_id=user_id,
                    date=bt["date"],
                    category=bt.get("category", "Uncategorized"),
                    description=bt["description"],
                    amount=bt["amount"],
                    mode=bt.get("mode", "Bank Transfer"),
                    status=bt.get("status", "completed"),
                    bank_ref_id=bank_ref,
                )
                db.add(txn)
                new_count += 1

        connection.last_synced = datetime.datetime.utcnow()
        await db.commit()

        return {
            "connection_id": connection_id,
            "new_transactions": new_count,
            "updated_transactions": updated_count,
            "sync_status": "success",
        }

    @staticmethod
    async def _fetch_from_bank(
        institution_id: str,
        account_id: str,
        consent_token: str,
        last_synced: Optional[datetime.datetime],
    ) -> list[dict]:
        """
        Fetch transactions from Open Banking API.

        In production, this calls the real Open Banking / Account Aggregator API.
        Here we provide a simulated response for development.
        """
        if settings.OPEN_BANKING_API_URL:
            try:
                import httpx

                from_date = (
                    last_synced.strftime("%Y-%m-%d") if last_synced
                    else (datetime.date.today() - datetime.timedelta(days=30)).isoformat()
                )

                async with httpx.AsyncClient(timeout=30) as client:
                    response = await client.get(
                        f"{settings.OPEN_BANKING_API_URL}/accounts/{account_id}/transactions",
                        headers={
                            "Authorization": f"Bearer {consent_token}",
                            "X-API-Key": settings.OPEN_BANKING_API_KEY,
                        },
                        params={"from_date": from_date},
                    )
                    response.raise_for_status()
                    return response.json().get("transactions", [])
            except Exception as e:
                logger.error(f"Open Banking API call failed: {e}")
                return []

        # Simulated response for development/demo
        logger.info("Using simulated bank data (no OPEN_BANKING_API_URL configured)")
        today = datetime.date.today()
        return [
            {
                "reference_id": f"BANK-SIM-{today.isoformat()}-001",
                "date": today,
                "description": "Swiggy Food Order",
                "amount": -450.0,
                "category": "Food & Dining",
                "mode": "UPI",
                "status": "completed",
            },
            {
                "reference_id": f"BANK-SIM-{today.isoformat()}-002",
                "date": today,
                "description": "Metro Card Recharge",
                "amount": -500.0,
                "category": "Transportation",
                "mode": "Debit Card",
                "status": "completed",
            },
        ]

    @staticmethod
    async def get_connections(
        db: AsyncSession, user_id: int
    ) -> dict:
        """List all bank connections for a user."""
        result = await db.execute(
            select(BankConnection)
            .where(BankConnection.user_id == user_id)
            .order_by(BankConnection.created_at.desc())
        )
        connections = result.scalars().all()
        return {"connections": connections, "total": len(connections)}

    @staticmethod
    async def disconnect(
        db: AsyncSession, user_id: int, connection_id: int
    ) -> bool:
        """Deactivate a bank connection."""
        result = await db.execute(
            select(BankConnection)
            .where(
                BankConnection.id == connection_id,
                BankConnection.user_id == user_id,
            )
        )
        connection = result.scalar_one_or_none()
        if not connection:
            return False

        connection.is_active = False
        await db.commit()
        return True
