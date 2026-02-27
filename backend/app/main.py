from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import get_settings
from .database import init_db, async_session
from .seed import seed_demo_data
from .routers import auth, dashboard, transactions, analytics, insights, budgets, users

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
    version="1.0.0",
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

# Routers
app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(transactions.router)
app.include_router(analytics.router)
app.include_router(insights.router)
app.include_router(budgets.router)
app.include_router(users.router)


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
