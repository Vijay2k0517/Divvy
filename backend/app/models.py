import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Date, DateTime, ForeignKey, Boolean, Text,
    JSON, UniqueConstraint,
)
from sqlalchemy.orm import relationship
from .database import Base


# ── Core Models ───────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    avatar_url = Column(String(500), nullable=True)
    plan = Column(String(50), default="Free")
    member_since = Column(Date, default=datetime.date.today)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    transactions = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")
    budgets = relationship("Budget", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    alert_rules = relationship("AlertRule", back_populates="user", cascade="all, delete-orphan")
    investments = relationship("Investment", back_populates="user", cascade="all, delete-orphan")
    bank_connections = relationship("BankConnection", back_populates="user", cascade="all, delete-orphan")
    chat_sessions = relationship("ChatSession", back_populates="user", cascade="all, delete-orphan")
    shared_budgets_owned = relationship("SharedBudget", back_populates="owner", cascade="all, delete-orphan")
    shared_budget_members = relationship("SharedBudgetMember", back_populates="user", cascade="all, delete-orphan")
    goals = relationship("Goal", back_populates="user", cascade="all, delete-orphan")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    date = Column(Date, nullable=False)
    category = Column(String(100), nullable=False, index=True)
    description = Column(String(300), nullable=False)
    amount = Column(Float, nullable=False)  # negative = expense, positive = income
    mode = Column(String(50), nullable=False)  # UPI, Credit Card, etc.
    status = Column(String(30), default="completed")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    # ML-enhanced fields
    ml_category = Column(String(100), nullable=True)       # ML-predicted category
    ml_confidence = Column(Float, nullable=True)            # prediction confidence 0-1
    is_anomaly = Column(Boolean, default=False)             # flagged by anomaly detector
    anomaly_score = Column(Float, nullable=True)            # anomaly severity 0-1
    bank_ref_id = Column(String(200), nullable=True, unique=True)  # external bank reference

    user = relationship("User", back_populates="transactions")


class Budget(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    category = Column(String(100), nullable=False)
    budget = Column(Float, nullable=False)
    color = Column(String(10), default="#8b5cf6")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="budgets")


# ── ML & Prediction Models ───────────────────────────

class MLModel(Base):
    """Registry of trained ML model versions."""
    __tablename__ = "ml_models"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    model_type = Column(String(50), nullable=False)       # "prediction", "categorizer", "anomaly"
    version = Column(Integer, default=1)
    artifact_path = Column(String(500), nullable=False)    # path to serialized model
    metrics = Column(JSON, nullable=True)                  # {"mae": 0.12, "accuracy": 0.94}
    is_active = Column(Boolean, default=True)
    trained_at = Column(DateTime, default=datetime.datetime.utcnow)
    training_samples = Column(Integer, default=0)

    __table_args__ = (
        UniqueConstraint("user_id", "model_type", "version", name="uq_user_model_version"),
    )


class PredictionCache(Base):
    """Cached expense predictions for fast retrieval."""
    __tablename__ = "prediction_cache"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    target_month = Column(Date, nullable=False)
    predicted_amount = Column(Float, nullable=False)
    confidence_lower = Column(Float, nullable=True)
    confidence_upper = Column(Float, nullable=True)
    model_version = Column(Integer, default=1)
    generated_at = Column(DateTime, default=datetime.datetime.utcnow)


# ── Anomaly Detection ────────────────────────────────

class AnomalyLog(Base):
    """Log of detected spending anomalies."""
    __tablename__ = "anomaly_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=True)
    anomaly_type = Column(String(50), nullable=False)      # "spike", "unusual_merchant", "frequency"
    severity = Column(String(20), nullable=False)           # "low", "medium", "high", "critical"
    description = Column(Text, nullable=False)
    score = Column(Float, nullable=False)                   # 0-1
    is_acknowledged = Column(Boolean, default=False)
    detected_at = Column(DateTime, default=datetime.datetime.utcnow)


# ── Conversational AI ────────────────────────────────

class ChatSession(Base):
    """User conversation sessions with AI assistant."""
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(200), default="New conversation")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="chat_sessions")
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")


class ChatMessage(Base):
    """Individual messages in a chat session."""
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id"), nullable=False, index=True)
    role = Column(String(20), nullable=False)               # "user", "assistant"
    content = Column(Text, nullable=False)
    metadata_ = Column("metadata", JSON, nullable=True)     # tool calls, sources, etc.
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    session = relationship("ChatSession", back_populates="messages")


# ── Open Banking / Bank Sync ─────────────────────────

class BankConnection(Base):
    """Connected bank accounts via Open Banking."""
    __tablename__ = "bank_connections"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    institution_name = Column(String(200), nullable=False)
    institution_id = Column(String(100), nullable=False)
    account_id = Column(String(200), nullable=False, unique=True)
    account_name = Column(String(200), nullable=True)
    account_type = Column(String(50), nullable=True)        # "savings", "current", "credit"
    consent_token = Column(String(500), nullable=False)     # encrypted
    consent_expires = Column(DateTime, nullable=False)
    last_synced = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="bank_connections")


# ── Investment Tracking ──────────────────────────────

class Investment(Base):
    """User investment portfolio entries."""
    __tablename__ = "investments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    symbol = Column(String(20), nullable=True)              # ticker symbol
    asset_type = Column(String(50), nullable=False)         # "stock", "mutual_fund", "fd", "gold", "crypto"
    quantity = Column(Float, nullable=False, default=0)
    buy_price = Column(Float, nullable=False)
    current_price = Column(Float, nullable=True)
    buy_date = Column(Date, nullable=False)
    currency = Column(String(10), default="INR")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="investments")


class InvestmentSnapshot(Base):
    """Daily portfolio value snapshots for performance tracking."""
    __tablename__ = "investment_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    date = Column(Date, nullable=False)
    total_invested = Column(Float, nullable=False)
    total_current = Column(Float, nullable=False)
    snapshot_at = Column(DateTime, default=datetime.datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("user_id", "date", name="uq_user_date_snapshot"),
    )


# ── Notifications & Alerts ───────────────────────────

class Notification(Base):
    """User notification entries."""
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    type = Column(String(50), nullable=False)               # "budget_alert", "anomaly", "insight", "sync"
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    priority = Column(String(20), default="medium")         # "low", "medium", "high", "critical"
    is_read = Column(Boolean, default=False)
    action_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="notifications")


class AlertRule(Base):
    """User-defined alert rules."""
    __tablename__ = "alert_rules"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    rule_type = Column(String(50), nullable=False)          # "budget_threshold", "spending_limit", "anomaly"
    config = Column(JSON, nullable=False)                   # {"category": "Food", "threshold": 80}
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="alert_rules")


# ── Collaborative Budgeting ──────────────────────────

class SharedBudget(Base):
    """Multi-user shared budget groups."""
    __tablename__ = "shared_budgets"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    total_budget = Column(Float, nullable=False)
    category = Column(String(100), nullable=True)
    invite_code = Column(String(20), unique=True, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    owner = relationship("User", back_populates="shared_budgets_owned")
    members = relationship("SharedBudgetMember", back_populates="shared_budget", cascade="all, delete-orphan")
    contributions = relationship("SharedBudgetContribution", back_populates="shared_budget", cascade="all, delete-orphan")


class SharedBudgetMember(Base):
    """Members of a shared budget group."""
    __tablename__ = "shared_budget_members"

    id = Column(Integer, primary_key=True, index=True)
    shared_budget_id = Column(Integer, ForeignKey("shared_budgets.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    role = Column(String(20), default="member")             # "owner", "admin", "member"
    joined_at = Column(DateTime, default=datetime.datetime.utcnow)

    shared_budget = relationship("SharedBudget", back_populates="members")
    user = relationship("User", back_populates="shared_budget_members")

    __table_args__ = (
        UniqueConstraint("shared_budget_id", "user_id", name="uq_shared_budget_member"),
    )


class SharedBudgetContribution(Base):
    """Spending entries against a shared budget."""
    __tablename__ = "shared_budget_contributions"

    id = Column(Integer, primary_key=True, index=True)
    shared_budget_id = Column(Integer, ForeignKey("shared_budgets.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    description = Column(String(300), nullable=False)
    amount = Column(Float, nullable=False)
    date = Column(Date, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    shared_budget = relationship("SharedBudget", back_populates="contributions")


# ── Recommendation Engine ────────────────────────────

# ── Financial Goals ──────────────────────────────────

class Goal(Base):
    """User financial goals with progress tracking."""
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    target_amount = Column(Float, nullable=False)
    current_amount = Column(Float, default=0.0)
    category = Column(String(100), nullable=True)           # "emergency", "vacation", "house", "car", etc.
    deadline = Column(Date, nullable=True)
    icon = Column(String(50), nullable=True)
    is_completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="goals")
    contributions = relationship("GoalContribution", back_populates="goal", cascade="all, delete-orphan")


class GoalContribution(Base):
    """Individual contributions towards a goal."""
    __tablename__ = "goal_contributions"

    id = Column(Integer, primary_key=True, index=True)
    goal_id = Column(Integer, ForeignKey("goals.id"), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    note = Column(String(300), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    goal = relationship("Goal", back_populates="contributions")


class BudgetRecommendation(Base):
    """AI-generated budget optimization recommendations."""
    __tablename__ = "budget_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    category = Column(String(100), nullable=False)
    current_budget = Column(Float, nullable=True)
    recommended_budget = Column(Float, nullable=False)
    rationale = Column(Text, nullable=False)
    potential_savings = Column(Float, nullable=True)
    confidence = Column(Float, nullable=True)               # 0-1
    status = Column(String(20), default="pending")          # "pending", "accepted", "dismissed"
    generated_at = Column(DateTime, default=datetime.datetime.utcnow)
