import datetime
from pydantic import BaseModel, EmailStr
from typing import Optional


# ── Auth ──────────────────────────────────────────────
class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    avatar_url: Optional[str] = None
    plan: str
    member_since: datetime.date

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    user: UserOut
    access_token: str
    token_type: str = "bearer"


# ── Transactions ──────────────────────────────────────
class TransactionCreate(BaseModel):
    date: datetime.date
    category: str
    description: str
    amount: float
    mode: str


class TransactionUpdate(BaseModel):
    date: Optional[datetime.date] = None
    category: Optional[str] = None
    description: Optional[str] = None
    amount: Optional[float] = None
    mode: Optional[str] = None


class TransactionOut(BaseModel):
    id: int
    date: datetime.date
    category: str
    description: str
    amount: float
    mode: str
    status: str

    class Config:
        from_attributes = True


class TransactionListResponse(BaseModel):
    transactions: list[TransactionOut]
    total: int
    page: int
    pages: int


# ── Budgets ───────────────────────────────────────────
class BudgetCreate(BaseModel):
    category: str
    budget: float
    color: str = "#8b5cf6"


class BudgetUpdate(BaseModel):
    budget: Optional[float] = None
    color: Optional[str] = None


class BudgetOut(BaseModel):
    id: int
    category: str
    budget: float
    spent: float = 0.0
    color: str

    class Config:
        from_attributes = True


class BudgetListResponse(BaseModel):
    budgets: list[BudgetOut]
    total_budget: float
    total_spent: float


# ── Dashboard ─────────────────────────────────────────
class StatCard(BaseModel):
    title: str
    value: str
    change: str
    trend: str
    icon: str
    gradient: str


class MonthlySpendingPoint(BaseModel):
    month: str
    amount: float


class CategoryDistPoint(BaseModel):
    name: str
    value: float
    color: str


class WeeklyCompPoint(BaseModel):
    week: str
    thisMonth: float
    lastMonth: float


class AIInsightShort(BaseModel):
    id: int
    icon: str
    text: str
    type: str


# ── Analytics ─────────────────────────────────────────
class MonthlyAnalyticsPoint(BaseModel):
    month: str
    income: float
    expense: float


class HeatmapPoint(BaseModel):
    week: str
    day: str
    value: float


class PredictionPoint(BaseModel):
    month: str
    actual: Optional[float] = None
    predicted: Optional[float] = None


class QuickStat(BaseModel):
    label: str
    value: str
    change: str
    trend: str


# ── Insights ──────────────────────────────────────────
class InsightOut(BaseModel):
    id: int
    type: str
    priority: str
    title: str
    description: str
    category: str
    impact: str
    icon: str
    color: str
    borderColor: str
    iconColor: str
    badgeColor: str


class RiskFactor(BaseModel):
    label: str
    score: int
    color: str


class HealthScoreResponse(BaseModel):
    score: int
    factors: list[RiskFactor]


# ── User / Profile ───────────────────────────────────
class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    avatar_url: Optional[str] = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str
