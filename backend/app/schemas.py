import datetime
from pydantic import BaseModel, EmailStr, Field
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
    ml_category: Optional[str] = None
    ml_confidence: Optional[float] = None
    is_anomaly: bool = False
    anomaly_score: Optional[float] = None

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
    confidence_lower: Optional[float] = None
    confidence_upper: Optional[float] = None


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


# ═══════════════════════════════════════════════════════
#  NEW ENHANCEMENT SCHEMAS
# ═══════════════════════════════════════════════════════


# ── 1. Advanced AI Prediction ────────────────────────

class PredictionRequest(BaseModel):
    months_ahead: int = Field(3, ge=1, le=12)
    model_type: str = Field("auto", pattern="^(auto|prophet|lstm|moving_avg)$")


class PredictionResponse(BaseModel):
    predictions: list[PredictionPoint]
    model_used: str
    training_samples: int
    metrics: dict


class ModelStatusOut(BaseModel):
    model_type: str
    version: int
    is_active: bool
    training_samples: int
    metrics: Optional[dict] = None
    trained_at: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True


class TrainModelRequest(BaseModel):
    model_type: str = Field(..., pattern="^(prediction|categorizer|anomaly)$")


class TrainModelResponse(BaseModel):
    status: str
    message: str
    model_type: str
    version: int


# ── 2. ML Transaction Categorization ─────────────────

class CategorizationRequest(BaseModel):
    description: str
    amount: float
    mode: Optional[str] = None


class CategorizationResponse(BaseModel):
    predicted_category: str
    confidence: float
    alternatives: list[dict]    # [{"category": "Food", "confidence": 0.15}]


class BulkCategorizationRequest(BaseModel):
    transaction_ids: list[int]


class BulkCategorizationResponse(BaseModel):
    updated: int
    results: list[dict]


# ── 3. Anomaly Detection ─────────────────────────────

class AnomalyOut(BaseModel):
    id: int
    transaction_id: Optional[int]
    anomaly_type: str
    severity: str
    description: str
    score: float
    is_acknowledged: bool
    detected_at: datetime.datetime

    class Config:
        from_attributes = True


class AnomalyListResponse(BaseModel):
    anomalies: list[AnomalyOut]
    total: int
    unacknowledged: int


class AnomalyScanResponse(BaseModel):
    new_anomalies: int
    total_scanned: int
    severity_breakdown: dict


# ── 4. Conversational AI ─────────────────────────────

class ChatMessageIn(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)


class ChatMessageOut(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True


class ChatSessionOut(BaseModel):
    id: int
    title: str
    created_at: datetime.datetime
    updated_at: datetime.datetime
    message_count: int = 0

    class Config:
        from_attributes = True


class ChatResponse(BaseModel):
    session_id: int
    reply: ChatMessageOut
    sources: Optional[list[str]] = None


class ChatSessionListResponse(BaseModel):
    sessions: list[ChatSessionOut]
    total: int


# ── 5. Open Banking / Bank Sync ──────────────────────

class BankConnectionCreate(BaseModel):
    institution_id: str
    institution_name: str
    consent_token: str


class BankConnectionOut(BaseModel):
    id: int
    institution_name: str
    account_id: str
    account_name: Optional[str]
    account_type: Optional[str]
    last_synced: Optional[datetime.datetime]
    is_active: bool

    class Config:
        from_attributes = True


class BankSyncResponse(BaseModel):
    connection_id: int
    new_transactions: int
    updated_transactions: int
    sync_status: str


class BankConnectionListResponse(BaseModel):
    connections: list[BankConnectionOut]
    total: int


# ── 6. Investment Tracking ───────────────────────────

class InvestmentCreate(BaseModel):
    name: str
    symbol: Optional[str] = None
    asset_type: str = Field(..., pattern="^(stock|mutual_fund|fd|gold|crypto|bond|other)$")
    quantity: float = Field(..., gt=0)
    buy_price: float = Field(..., gt=0)
    buy_date: datetime.date
    currency: str = "INR"
    notes: Optional[str] = None


class InvestmentUpdate(BaseModel):
    name: Optional[str] = None
    current_price: Optional[float] = None
    quantity: Optional[float] = None
    notes: Optional[str] = None


class InvestmentOut(BaseModel):
    id: int
    name: str
    symbol: Optional[str]
    asset_type: str
    quantity: float
    buy_price: float
    current_price: Optional[float]
    buy_date: datetime.date
    currency: str
    notes: Optional[str]
    gain_loss: Optional[float] = None
    gain_loss_pct: Optional[float] = None
    total_invested: Optional[float] = None
    total_current: Optional[float] = None

    class Config:
        from_attributes = True


class PortfolioSummary(BaseModel):
    total_invested: float
    total_current: float
    total_gain_loss: float
    total_gain_loss_pct: float
    investments: list[InvestmentOut]
    allocation: list[dict]         # [{"asset_type": "stock", "value": 50000, "pct": 45}]


class InvestmentSnapshotOut(BaseModel):
    date: datetime.date
    total_invested: float
    total_current: float

    class Config:
        from_attributes = True


# ── 7. Notifications & Alerts ────────────────────────

class NotificationOut(BaseModel):
    id: int
    type: str
    title: str
    message: str
    priority: str
    is_read: bool
    action_url: Optional[str]
    created_at: datetime.datetime

    class Config:
        from_attributes = True


class NotificationListResponse(BaseModel):
    notifications: list[NotificationOut]
    total: int
    unread: int


class AlertRuleCreate(BaseModel):
    name: str
    rule_type: str = Field(..., pattern="^(budget_threshold|spending_limit|anomaly|savings_goal)$")
    config: dict


class AlertRuleUpdate(BaseModel):
    name: Optional[str] = None
    config: Optional[dict] = None
    is_active: Optional[bool] = None


class AlertRuleOut(BaseModel):
    id: int
    name: str
    rule_type: str
    config: dict
    is_active: bool
    created_at: datetime.datetime

    class Config:
        from_attributes = True


# ── 8. Collaborative Budgeting ───────────────────────

class SharedBudgetCreate(BaseModel):
    name: str
    description: Optional[str] = None
    total_budget: float = Field(..., gt=0)
    category: Optional[str] = None


class SharedBudgetUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    total_budget: Optional[float] = None


class SharedBudgetMemberOut(BaseModel):
    id: int
    user_id: int
    user_name: str
    role: str
    joined_at: datetime.datetime
    total_spent: float = 0.0

    class Config:
        from_attributes = True


class SharedBudgetOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    total_budget: float
    total_spent: float = 0.0
    category: Optional[str]
    invite_code: str
    is_active: bool
    owner_name: str
    member_count: int = 0
    created_at: datetime.datetime

    class Config:
        from_attributes = True


class SharedBudgetDetailOut(BaseModel):
    budget: SharedBudgetOut
    members: list[SharedBudgetMemberOut]
    recent_contributions: list[dict]


class ContributionCreate(BaseModel):
    description: str
    amount: float = Field(..., gt=0)
    date: datetime.date


class ContributionOut(BaseModel):
    id: int
    user_name: str
    description: str
    amount: float
    date: datetime.date
    created_at: datetime.datetime

    class Config:
        from_attributes = True


class JoinSharedBudgetRequest(BaseModel):
    invite_code: str


# ── 9. Recommendation Engine ─────────────────────────

class RecommendationOut(BaseModel):
    id: int
    category: str
    current_budget: Optional[float]
    recommended_budget: float
    rationale: str
    potential_savings: Optional[float]
    confidence: Optional[float]
    status: str
    generated_at: datetime.datetime

    class Config:
        from_attributes = True


class RecommendationListResponse(BaseModel):
    recommendations: list[RecommendationOut]
    total_potential_savings: float


class RecommendationAction(BaseModel):
    status: str = Field(..., pattern="^(accepted|dismissed)$")


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


# ── 10. Financial Goals ──────────────────────────────

class GoalCreate(BaseModel):
    name: str
    target_amount: float = Field(..., gt=0)
    category: Optional[str] = None
    deadline: Optional[datetime.date] = None
    icon: Optional[str] = None


class GoalUpdate(BaseModel):
    name: Optional[str] = None
    target_amount: Optional[float] = None
    category: Optional[str] = None
    deadline: Optional[datetime.date] = None
    icon: Optional[str] = None


class GoalOut(BaseModel):
    id: int
    name: str
    target_amount: float
    current_amount: float
    category: Optional[str]
    deadline: Optional[datetime.date]
    icon: Optional[str]
    is_completed: bool
    created_at: datetime.datetime

    class Config:
        from_attributes = True


class GoalContributeRequest(BaseModel):
    amount: float = Field(..., gt=0)
    note: Optional[str] = None
