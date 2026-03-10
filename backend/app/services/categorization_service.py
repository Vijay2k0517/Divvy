"""
Categorization Service — ML-powered transaction category prediction.

Architecture:
  Router → CategorizationService → TF-IDF + Multinomial NB / SGD classifier

Uses transaction description + amount features to predict category.
Falls back to keyword matching when insufficient training data.
"""

import logging
import os
import pickle
from typing import Optional

import numpy as np
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..models import Transaction, MLModel
from ..config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# Keyword-based fallback rules
KEYWORD_RULES = {
    "Food & Dining": ["swiggy", "zomato", "restaurant", "cafe", "food", "pizza", "burger",
                       "dining", "lunch", "dinner", "breakfast", "meal", "biryani", "coffee"],
    "Transportation": ["uber", "ola", "metro", "fuel", "petrol", "diesel", "parking", "cab",
                        "auto", "bus", "train", "flight", "toll"],
    "Shopping": ["amazon", "flipkart", "myntra", "mall", "store", "shop", "clothing", "shoes",
                 "electronics", "purchase"],
    "Entertainment": ["netflix", "spotify", "movie", "cinema", "game", "concert", "theatre",
                      "disney", "prime video", "hotstar"],
    "Bills & Utilities": ["electricity", "water", "gas", "internet", "broadband", "wifi",
                          "phone", "mobile", "recharge", "rent", "maintenance"],
    "Subscriptions": ["subscription", "premium", "membership", "annual", "monthly plan",
                      "aws", "github", "icloud"],
    "Income": ["salary", "freelance", "interest", "dividend", "refund", "cashback",
               "bonus", "reward", "credit"],
}


class CategorizationService:

    @staticmethod
    def _keyword_categorize(description: str, amount: float) -> dict:
        """Rule-based fallback categorization."""
        desc_lower = description.lower()

        # Income detection by amount sign
        if amount > 0:
            return {
                "predicted_category": "Income",
                "confidence": 0.9,
                "alternatives": [],
            }

        scores = {}
        for category, keywords in KEYWORD_RULES.items():
            score = sum(1 for kw in keywords if kw in desc_lower)
            if score > 0:
                scores[category] = score

        if not scores:
            return {
                "predicted_category": "Shopping",  # default for expenses
                "confidence": 0.3,
                "alternatives": [
                    {"category": "Bills & Utilities", "confidence": 0.2},
                    {"category": "Food & Dining", "confidence": 0.15},
                ],
            }

        total = sum(scores.values())
        sorted_cats = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        best = sorted_cats[0]

        alternatives = [
            {"category": c, "confidence": round(s / total, 3)}
            for c, s in sorted_cats[1:4]
        ]

        return {
            "predicted_category": best[0],
            "confidence": round(best[1] / total, 3),
            "alternatives": alternatives,
        }

    @staticmethod
    async def train_model(db: AsyncSession, user_id: int) -> dict:
        """Train a text classification model on user's labeled transactions."""
        try:
            from sklearn.feature_extraction.text import TfidfVectorizer
            from sklearn.linear_model import SGDClassifier
            from sklearn.pipeline import Pipeline
            from sklearn.model_selection import cross_val_score
        except ImportError:
            return {"status": "error", "message": "scikit-learn not installed"}

        result = await db.execute(
            select(Transaction)
            .where(Transaction.user_id == user_id)
            .where(Transaction.category.isnot(None))
        )
        transactions = result.scalars().all()

        if len(transactions) < settings.MIN_TRAINING_SAMPLES:
            return {
                "status": "insufficient_data",
                "message": f"Need at least {settings.MIN_TRAINING_SAMPLES} labeled transactions, "
                           f"have {len(transactions)}",
                "training_samples": len(transactions),
            }

        # Build features: description + amount sign + payment mode
        texts = []
        labels = []
        for t in transactions:
            feature_text = f"{t.description} {'expense' if t.amount < 0 else 'income'} {t.mode}"
            texts.append(feature_text)
            labels.append(t.category)

        pipeline = Pipeline([
            ("tfidf", TfidfVectorizer(
                max_features=5000,
                ngram_range=(1, 2),
                stop_words="english",
            )),
            ("clf", SGDClassifier(
                loss="modified_huber",   # gives probability estimates
                max_iter=1000,
                random_state=42,
            )),
        ])

        # Cross-validation
        scores = cross_val_score(pipeline, texts, labels, cv=min(5, len(set(labels))), scoring="accuracy")
        accuracy = float(scores.mean())

        # Train final model
        pipeline.fit(texts, labels)

        # Save model
        os.makedirs(settings.ML_MODELS_DIR, exist_ok=True)
        model_path = os.path.join(settings.ML_MODELS_DIR, f"categorizer_user_{user_id}.pkl")
        with open(model_path, "wb") as f:
            pickle.dump(pipeline, f)

        # Get current version
        existing = await db.execute(
            select(MLModel)
            .where(MLModel.user_id == user_id, MLModel.model_type == "categorizer")
            .order_by(MLModel.version.desc())
        )
        latest = existing.scalar_one_or_none()
        new_version = (latest.version + 1) if latest else 1

        if latest:
            latest.is_active = False

        ml_model = MLModel(
            user_id=user_id,
            model_type="categorizer",
            version=new_version,
            artifact_path=model_path,
            metrics={"accuracy": round(accuracy, 4)},
            is_active=True,
            training_samples=len(transactions),
        )
        db.add(ml_model)
        await db.commit()

        return {
            "status": "success",
            "version": new_version,
            "accuracy": round(accuracy, 4),
            "training_samples": len(transactions),
        }

    @staticmethod
    async def predict_category(
        db: AsyncSession,
        user_id: int,
        description: str,
        amount: float,
        mode: Optional[str] = None,
    ) -> dict:
        """Predict category for a transaction description."""
        # Try ML model first
        model_path = os.path.join(settings.ML_MODELS_DIR, f"categorizer_user_{user_id}.pkl")

        if os.path.exists(model_path):
            try:
                with open(model_path, "rb") as f:
                    pipeline = pickle.load(f)

                feature_text = f"{description} {'expense' if amount < 0 else 'income'} {mode or ''}"
                predicted = pipeline.predict([feature_text])[0]

                # Get probabilities
                probs = pipeline.predict_proba([feature_text])[0]
                classes = pipeline.classes_
                sorted_indices = np.argsort(probs)[::-1]

                confidence = float(probs[sorted_indices[0]])
                alternatives = [
                    {"category": classes[idx], "confidence": round(float(probs[idx]), 3)}
                    for idx in sorted_indices[1:4]
                    if float(probs[idx]) > 0.05
                ]

                return {
                    "predicted_category": predicted,
                    "confidence": round(confidence, 3),
                    "alternatives": alternatives,
                }
            except Exception as e:
                logger.error(f"ML categorization failed: {e}")

        # Fallback to keyword matching
        return CategorizationService._keyword_categorize(description, amount)
