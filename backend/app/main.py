from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import get_settings
from .database import init_db, async_session
from .seed import seed_demo_data
from .routers import (
    auth, dashboard, transactions, analytics, insights, budgets, users,
    predictions, categorization, anomalies, chat, bank_sync,
    investments, notifications, collaborative, recommendations, goals,
)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables & seed demo data
    await init_db()
    async with async_session() as db:
        await seed_demo_data(db)
    yield
    # Shutdown


app = FastAPI(
    title="Divvy AI — Backend API",
    description="Premium AI Finance Tracker API",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Core Routers ──────────────────────────────────────
app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(transactions.router)
app.include_router(analytics.router)
app.include_router(insights.router)
app.include_router(budgets.router)
app.include_router(users.router)

# ── Enhancement Routers ──────────────────────────────
app.include_router(predictions.router)         # 1. Advanced AI Prediction
app.include_router(categorization.router)      # 2. ML Categorization
app.include_router(anomalies.router)           # 3. Anomaly Detection
app.include_router(chat.router)                # 4. Conversational AI
app.include_router(bank_sync.router)           # 5. Open Banking Sync
app.include_router(investments.router)         # 6. Investment Tracking
app.include_router(notifications.router)       # 7. Notifications & Alerts
app.include_router(collaborative.router)       # 8. Collaborative Budgeting
app.include_router(recommendations.router)     # 9. Recommendation Engine
app.include_router(goals.router)                # 10. Financial Goals


@app.get("/")
async def root():
    return {
        "app": "Divvy AI",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    return {"status": "ok"}
