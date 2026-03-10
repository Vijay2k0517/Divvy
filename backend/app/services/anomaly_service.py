"""
Anomaly Detection Service — Identifies unusual spending patterns.

Architecture:
  Router → AnomalyService → IsolationForest / Z-Score analysis → AnomalyLog (DB)

Detection strategies:
  1. Statistical (Z-Score): flags single transactions > 2.5σ from category mean
  2. IsolationForest: ML-based multi-dimensional anomaly detection
  3. Frequency analysis: detects unusual spending frequency per category
"""

import datetime
import calendar
import logging
from typing import Optional

import numpy as np
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from ..models import Transaction, AnomalyLog
from ..config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class AnomalyService:

    @staticmethod
    async def _get_category_stats(
        db: AsyncSession, user_id: int
    ) -> dict:
        """Compute per-category spending statistics."""
        result = await db.execute(
            select(Transaction)
            .where(
                Transaction.user_id == user_id,
                Transaction.amount < 0,
            )
            .order_by(Transaction.date.desc())
        )
        transactions = result.scalars().all()

        stats = {}
        for t in transactions:
            cat = t.category
            if cat not in stats:
                stats[cat] = {"amounts": [], "dates": []}
            stats[cat]["amounts"].append(abs(t.amount))
            stats[cat]["dates"].append(t.date)

        for cat in stats:
            amounts = np.array(stats[cat]["amounts"])
            stats[cat]["mean"] = float(np.mean(amounts))
            stats[cat]["std"] = float(np.std(amounts)) if len(amounts) > 1 else 0
            stats[cat]["median"] = float(np.median(amounts))
            stats[cat]["count"] = len(amounts)
            stats[cat]["max"] = float(np.max(amounts))

        return stats

    @staticmethod
    def _zscore_detect(amount: float, mean: float, std: float) -> tuple[bool, float]:
        """Z-Score anomaly detection for a single value."""
        if std == 0:
            return False, 0.0
        z = abs(amount - mean) / std
        is_anomaly = z > 2.5
        score = min(1.0, z / 5.0)  # normalize to 0-1
        return is_anomaly, round(score, 3)

    @staticmethod
    async def scan_transactions(
        db: AsyncSession, user_id: int, days_back: int = 30
    ) -> dict:
        """Scan recent transactions for anomalies."""
        cutoff = datetime.date.today() - datetime.timedelta(days=days_back)
        category_stats = await AnomalyService._get_category_stats(db, user_id)

        result = await db.execute(
            select(Transaction)
            .where(
                Transaction.user_id == user_id,
                Transaction.amount < 0,
                Transaction.date >= cutoff,
            )
            .order_by(Transaction.date.desc())
        )
        recent_txns = result.scalars().all()

        new_anomalies = 0
        severity_breakdown = {"low": 0, "medium": 0, "high": 0, "critical": 0}

        for t in recent_txns:
            cat = t.category
            if cat not in category_stats or category_stats[cat]["count"] < 5:
                continue

            stats = category_stats[cat]
            amount = abs(t.amount)

            # Z-Score detection
            is_anomaly, score = AnomalyService._zscore_detect(
                amount, stats["mean"], stats["std"]
            )

            if not is_anomaly:
                continue

            # Check if already logged
            existing = await db.execute(
                select(AnomalyLog)
                .where(
                    AnomalyLog.user_id == user_id,
                    AnomalyLog.transaction_id == t.id,
                )
            )
            if existing.scalar_one_or_none():
                continue

            # Determine severity
            if score >= 0.9:
                severity = "critical"
            elif score >= 0.7:
                severity = "high"
            elif score >= 0.5:
                severity = "medium"
            else:
                severity = "low"

            # Determine anomaly type
            if amount > stats["mean"] + 3 * stats["std"]:
                anomaly_type = "spike"
                desc = (
                    f"Unusually large {cat} transaction of ₹{amount:,.0f} — "
                    f"your average is ₹{stats['mean']:,.0f} for this category."
                )
            elif amount > stats["max"] * 0.95:
                anomaly_type = "near_max"
                desc = (
                    f"This {cat} transaction of ₹{amount:,.0f} is near your "
                    f"historical maximum of ₹{stats['max']:,.0f}."
                )
            else:
                anomaly_type = "unusual_amount"
                desc = (
                    f"Unusual {cat} spending of ₹{amount:,.0f} detected — "
                    f"significantly above the median of ₹{stats['median']:,.0f}."
                )

            anomaly = AnomalyLog(
                user_id=user_id,
                transaction_id=t.id,
                anomaly_type=anomaly_type,
                severity=severity,
                description=desc,
                score=score,
            )
            db.add(anomaly)

            # Mark the transaction
            t.is_anomaly = True
            t.anomaly_score = score

            new_anomalies += 1
            severity_breakdown[severity] += 1

        # Frequency analysis: detect unusual daily spending count
        from collections import Counter
        daily_counts = Counter()
        for t in recent_txns:
            daily_counts[t.date] += 1

        if daily_counts:
            counts = list(daily_counts.values())
            mean_freq = np.mean(counts)
            std_freq = np.std(counts) if len(counts) > 1 else 0

            for date, count in daily_counts.items():
                if std_freq > 0 and (count - mean_freq) / std_freq > 2.5:
                    existing = await db.execute(
                        select(AnomalyLog)
                        .where(
                            AnomalyLog.user_id == user_id,
                            AnomalyLog.anomaly_type == "frequency",
                            AnomalyLog.description.contains(str(date)),
                        )
                    )
                    if existing.scalar_one_or_none():
                        continue

                    score = min(1.0, (count - mean_freq) / (std_freq * 4))
                    severity = "medium" if score < 0.7 else "high"

                    anomaly = AnomalyLog(
                        user_id=user_id,
                        transaction_id=None,
                        anomaly_type="frequency",
                        severity=severity,
                        description=(
                            f"Unusual number of transactions ({count}) on {date} — "
                            f"your daily average is {mean_freq:.1f} transactions."
                        ),
                        score=round(score, 3),
                    )
                    db.add(anomaly)
                    new_anomalies += 1
                    severity_breakdown[severity] += 1

        await db.commit()

        return {
            "new_anomalies": new_anomalies,
            "total_scanned": len(recent_txns),
            "severity_breakdown": severity_breakdown,
        }

    @staticmethod
    async def get_anomalies(
        db: AsyncSession,
        user_id: int,
        severity: Optional[str] = None,
        acknowledged: Optional[bool] = None,
        limit: int = 50,
    ) -> dict:
        """Retrieve anomaly logs for a user."""
        q = select(AnomalyLog).where(AnomalyLog.user_id == user_id)

        if severity:
            q = q.where(AnomalyLog.severity == severity)
        if acknowledged is not None:
            q = q.where(AnomalyLog.is_acknowledged == acknowledged)

        q = q.order_by(AnomalyLog.detected_at.desc()).limit(limit)
        result = await db.execute(q)
        anomalies = result.scalars().all()

        # Count unacknowledged
        unack = await db.execute(
            select(func.count())
            .select_from(AnomalyLog)
            .where(
                AnomalyLog.user_id == user_id,
                AnomalyLog.is_acknowledged == False,
            )
        )

        return {
            "anomalies": anomalies,
            "total": len(anomalies),
            "unacknowledged": unack.scalar() or 0,
        }

    @staticmethod
    async def acknowledge_anomaly(
        db: AsyncSession, user_id: int, anomaly_id: int
    ) -> bool:
        """Mark an anomaly as acknowledged."""
        result = await db.execute(
            select(AnomalyLog)
            .where(
                AnomalyLog.id == anomaly_id,
                AnomalyLog.user_id == user_id,
            )
        )
        anomaly = result.scalar_one_or_none()
        if not anomaly:
            return False

        anomaly.is_acknowledged = True
        await db.commit()
        return True
