"""
Prediction Service — Advanced AI expense prediction using Prophet & LSTM.

Architecture:
  Router → PredictionService → Prophet/LSTM model → PredictionCache (DB)

Supports three strategies:
  1. Prophet (preferred with 60+ samples): seasonal decomposition, holiday effects
  2. LSTM (preferred with 90+ samples): deep sequential pattern learning
  3. Weighted Moving Average (fallback): lightweight, always available
"""

import datetime
import calendar
import os
import pickle
import logging
from typing import Optional

import numpy as np
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from ..models import Transaction, MLModel, PredictionCache
from ..config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class PredictionService:

    @staticmethod
    async def get_monthly_spending_history(
        db: AsyncSession, user_id: int, months: int = 24
    ) -> list[dict]:
        """Fetch monthly expense totals for a user."""
        today = datetime.date.today()
        history = []

        for i in range(months - 1, -1, -1):
            d = today - datetime.timedelta(days=30 * i)
            first = d.replace(day=1)
            last_day = calendar.monthrange(d.year, d.month)[1]
            last = d.replace(day=last_day)

            result = await db.execute(
                select(func.coalesce(func.sum(Transaction.amount), 0))
                .where(and_(
                    Transaction.user_id == user_id,
                    Transaction.amount < 0,
                    Transaction.date >= first,
                    Transaction.date <= last,
                ))
            )
            val = abs(float(result.scalar()))
            history.append({
                "date": first,
                "year": d.year,
                "month": d.month,
                "amount": val,
            })

        return history

    @staticmethod
    async def predict_prophet(
        history: list[dict], months_ahead: int = 3
    ) -> dict:
        """Prophet-based forecasting with confidence intervals."""
        try:
            from prophet import Prophet
            import pandas as pd
        except ImportError:
            logger.warning("Prophet not installed, falling back to moving average")
            return PredictionService._predict_moving_avg(history, months_ahead)

        df = pd.DataFrame([
            {"ds": h["date"], "y": h["amount"]}
            for h in history if h["amount"] > 0
        ])

        if len(df) < 12:
            return PredictionService._predict_moving_avg(history, months_ahead)

        model = Prophet(
            yearly_seasonality=True,
            weekly_seasonality=False,
            daily_seasonality=False,
            changepoint_prior_scale=0.05,
        )
        model.fit(df)

        future = model.make_future_dataframe(periods=months_ahead, freq="MS")
        forecast = model.predict(future)

        predictions = []
        for _, row in forecast.tail(months_ahead).iterrows():
            predictions.append({
                "month": row["ds"].strftime("%b"),
                "date": row["ds"].date(),
                "predicted": max(0, round(row["yhat"], 0)),
                "confidence_lower": max(0, round(row["yhat_lower"], 0)),
                "confidence_upper": max(0, round(row["yhat_upper"], 0)),
            })

        # Cross-validation metrics
        mae = float(np.mean(np.abs(
            df["y"].values[-3:] - forecast["yhat"].values[-months_ahead - 3:-months_ahead]
        ))) if len(df) > 3 else 0

        return {
            "predictions": predictions,
            "model_used": "prophet",
            "metrics": {"mae": round(mae, 2)},
        }

    @staticmethod
    async def predict_lstm(
        history: list[dict], months_ahead: int = 3
    ) -> dict:
        """LSTM-based deep learning prediction."""
        try:
            from tensorflow.keras.models import Sequential
            from tensorflow.keras.layers import LSTM, Dense, Dropout
            from sklearn.preprocessing import MinMaxScaler
        except ImportError:
            logger.warning("TensorFlow not installed, falling back to Prophet")
            return await PredictionService.predict_prophet(history, months_ahead)

        amounts = np.array([h["amount"] for h in history if h["amount"] > 0])

        if len(amounts) < 12:
            return PredictionService._predict_moving_avg(history, months_ahead)

        scaler = MinMaxScaler(feature_range=(0, 1))
        scaled = scaler.fit_transform(amounts.reshape(-1, 1))

        # Create sequences (look-back = 6 months)
        look_back = min(6, len(scaled) - 1)
        X, y = [], []
        for i in range(look_back, len(scaled)):
            X.append(scaled[i - look_back:i, 0])
            y.append(scaled[i, 0])

        X = np.array(X).reshape(-1, look_back, 1)
        y = np.array(y)

        model = Sequential([
            LSTM(50, return_sequences=True, input_shape=(look_back, 1)),
            Dropout(0.2),
            LSTM(50, return_sequences=False),
            Dropout(0.2),
            Dense(25),
            Dense(1),
        ])
        model.compile(optimizer="adam", loss="mean_squared_error")
        model.fit(X, y, epochs=50, batch_size=1, verbose=0)

        # Predict future months
        last_sequence = scaled[-look_back:].reshape(1, look_back, 1)
        predictions = []
        today = datetime.date.today()

        for i in range(1, months_ahead + 1):
            pred_scaled = model.predict(last_sequence, verbose=0)
            pred_amount = float(scaler.inverse_transform(pred_scaled)[0, 0])

            future_date = today + datetime.timedelta(days=30 * i)
            predictions.append({
                "month": calendar.month_abbr[future_date.month],
                "date": future_date.replace(day=1),
                "predicted": max(0, round(pred_amount, 0)),
                "confidence_lower": max(0, round(pred_amount * 0.85, 0)),
                "confidence_upper": round(pred_amount * 1.15, 0),
            })

            # Slide window
            new_val = pred_scaled.reshape(1, 1, 1)
            last_sequence = np.concatenate([last_sequence[:, 1:, :], new_val], axis=1)

        # Training MAE
        train_pred = model.predict(X, verbose=0)
        train_pred_inv = scaler.inverse_transform(train_pred)
        y_inv = scaler.inverse_transform(y.reshape(-1, 1))
        mae = float(np.mean(np.abs(y_inv - train_pred_inv)))

        return {
            "predictions": predictions,
            "model_used": "lstm",
            "metrics": {"mae": round(mae, 2)},
        }

    @staticmethod
    def _predict_moving_avg(
        history: list[dict], months_ahead: int = 3
    ) -> dict:
        """Weighted moving average fallback (always available)."""
        amounts = [h["amount"] for h in history if h["amount"] > 0]

        if not amounts:
            today = datetime.date.today()
            return {
                "predictions": [
                    {
                        "month": calendar.month_abbr[(today.month + i - 1) % 12 + 1],
                        "date": (today + datetime.timedelta(days=30 * i)).replace(day=1),
                        "predicted": 0,
                        "confidence_lower": 0,
                        "confidence_upper": 0,
                    }
                    for i in range(1, months_ahead + 1)
                ],
                "model_used": "moving_avg",
                "metrics": {"mae": 0},
            }

        # Exponentially weighted: recent months have more weight
        window = min(6, len(amounts))
        recent = amounts[-window:]
        weights = np.array([0.5 ** (window - 1 - i) for i in range(window)])
        weights /= weights.sum()
        weighted_avg = float(np.dot(recent, weights))

        # Standard deviation for confidence intervals
        std = float(np.std(recent)) if len(recent) > 1 else weighted_avg * 0.1

        predictions = []
        today = datetime.date.today()
        for i in range(1, months_ahead + 1):
            future_date = today + datetime.timedelta(days=30 * i)
            drift = 1 + (i * 0.005)  # slight upward drift
            pred = round(weighted_avg * drift, 0)
            predictions.append({
                "month": calendar.month_abbr[future_date.month],
                "date": future_date.replace(day=1),
                "predicted": max(0, pred),
                "confidence_lower": max(0, round(pred - 1.96 * std, 0)),
                "confidence_upper": round(pred + 1.96 * std, 0),
            })

        # Pseudo MAE from leave-one-out
        if len(amounts) >= 4:
            errors = []
            for j in range(max(0, len(amounts) - 3), len(amounts)):
                subset = amounts[:j]
                if subset:
                    errors.append(abs(amounts[j] - np.mean(subset[-3:])))
            mae = float(np.mean(errors)) if errors else 0
        else:
            mae = 0

        return {
            "predictions": predictions,
            "model_used": "moving_avg",
            "metrics": {"mae": round(mae, 2)},
        }

    @staticmethod
    async def predict(
        db: AsyncSession,
        user_id: int,
        months_ahead: int = 3,
        model_type: str = "auto",
    ) -> dict:
        """Main prediction entry point with auto model selection."""
        history = await PredictionService.get_monthly_spending_history(db, user_id)
        non_zero = [h for h in history if h["amount"] > 0]
        n_samples = len(non_zero)

        if model_type == "auto":
            if n_samples >= 90:
                model_type = "lstm"
            elif n_samples >= 60:
                model_type = "prophet"
            else:
                model_type = "moving_avg"

        if model_type == "lstm":
            result = await PredictionService.predict_lstm(non_zero, months_ahead)
        elif model_type == "prophet":
            result = await PredictionService.predict_prophet(non_zero, months_ahead)
        else:
            result = PredictionService._predict_moving_avg(non_zero, months_ahead)

        result["training_samples"] = n_samples
        return result
