"""
Chat Service — Conversational AI financial assistant.

Architecture:
  Router → ChatService → LLM API (OpenAI-compatible) + Financial Context Builder

The assistant has access to user's financial context (spending, budgets, goals)
and answers questions using RAG-style context injection.
"""

import datetime
import calendar
import logging
import json
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from ..models import (
    Transaction, Budget, ChatSession, ChatMessage, User,
)
from ..config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

SYSTEM_PROMPT = """You are Divvy AI, an intelligent personal finance assistant. You help users understand their spending, budgets, and financial health.

Guidelines:
- Be concise, friendly, and actionable
- Use ₹ (INR) for currency
- Reference the user's actual financial data provided in context
- Give specific numbers and percentages
- Suggest concrete actions to improve finances
- Never give investment advice or guarantee returns
- If unsure, say so honestly

You have access to the user's financial context below.
"""


class ChatService:

    @staticmethod
    async def _build_financial_context(
        db: AsyncSession, user_id: int
    ) -> str:
        """Build a summary of user's financial data for LLM context."""
        today = datetime.date.today()
        first_of_month = today.replace(day=1)

        # Current month income/expense
        inc_result = await db.execute(
            select(func.coalesce(func.sum(Transaction.amount), 0))
            .where(and_(
                Transaction.user_id == user_id,
                Transaction.amount > 0,
                Transaction.date >= first_of_month,
            ))
        )
        exp_result = await db.execute(
            select(func.coalesce(func.sum(Transaction.amount), 0))
            .where(and_(
                Transaction.user_id == user_id,
                Transaction.amount < 0,
                Transaction.date >= first_of_month,
            ))
        )
        income = float(inc_result.scalar())
        expense = abs(float(exp_result.scalar()))
        savings_rate = ((income - expense) / income * 100) if income > 0 else 0

        # Category breakdown this month
        cat_result = await db.execute(
            select(
                Transaction.category,
                func.sum(Transaction.amount).label("total"),
                func.count().label("count"),
            )
            .where(and_(
                Transaction.user_id == user_id,
                Transaction.amount < 0,
                Transaction.date >= first_of_month,
            ))
            .group_by(Transaction.category)
            .order_by(func.sum(Transaction.amount))
        )
        categories = [
            {"category": row.category, "spent": abs(float(row.total)), "count": row.count}
            for row in cat_result
        ]

        # Budgets
        budget_result = await db.execute(
            select(Budget).where(Budget.user_id == user_id)
        )
        budgets = []
        for b in budget_result.scalars().all():
            sp = await db.execute(
                select(func.coalesce(func.sum(Transaction.amount), 0))
                .where(and_(
                    Transaction.user_id == user_id,
                    Transaction.category == b.category,
                    Transaction.amount < 0,
                    Transaction.date >= first_of_month,
                ))
            )
            spent = abs(float(sp.scalar()))
            budgets.append({
                "category": b.category,
                "budget": b.budget,
                "spent": spent,
                "remaining": b.budget - spent,
                "utilization_pct": round((spent / b.budget) * 100, 1) if b.budget > 0 else 0,
            })

        # Recent transactions (last 10)
        recent = await db.execute(
            select(Transaction)
            .where(Transaction.user_id == user_id)
            .order_by(Transaction.date.desc())
            .limit(10)
        )
        recent_txns = [
            {
                "date": str(t.date),
                "description": t.description,
                "amount": t.amount,
                "category": t.category,
            }
            for t in recent.scalars().all()
        ]

        context = f"""
## User's Financial Context (as of {today})

### This Month Summary
- Income: ₹{income:,.0f}
- Expenses: ₹{expense:,.0f}
- Savings Rate: {savings_rate:.1f}%

### Category Breakdown (This Month)
{json.dumps(categories, indent=2)}

### Budget Status
{json.dumps(budgets, indent=2)}

### Recent Transactions
{json.dumps(recent_txns, indent=2)}
"""
        return context

    @staticmethod
    async def _call_llm(messages: list[dict]) -> str:
        """Call LLM API (OpenAI-compatible). Falls back to rule-based responses."""
        if not settings.LLM_API_KEY:
            return ChatService._rule_based_response(messages[-1]["content"])

        try:
            import httpx

            async with httpx.AsyncClient(timeout=30) as client:
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {settings.LLM_API_KEY}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": settings.LLM_MODEL,
                        "messages": messages,
                        "max_tokens": settings.LLM_MAX_TOKENS,
                        "temperature": 0.7,
                    },
                )
                response.raise_for_status()
                data = response.json()
                return data["choices"][0]["message"]["content"]
        except Exception as e:
            logger.error(f"LLM API call failed: {e}")
            return ChatService._rule_based_response(messages[-1]["content"])

    @staticmethod
    def _rule_based_response(user_message: str) -> str:
        """Fallback rule-based responses when LLM is unavailable."""
        msg = user_message.lower()

        if any(w in msg for w in ["spend", "spending", "expense", "spent"]):
            return (
                "Based on your recent transactions, I can see your spending patterns. "
                "Check your Analytics dashboard for detailed category breakdowns and trends. "
                "Would you like tips on reducing spending in a specific category?"
            )
        elif any(w in msg for w in ["budget", "budgeting", "limit"]):
            return (
                "Your budget status is available on the Budgets page. "
                "I recommend setting budgets for your top 3 spending categories first. "
                "A good starting point is allocating 50% to needs, 30% to wants, and 20% to savings."
            )
        elif any(w in msg for w in ["save", "saving", "savings"]):
            return (
                "Great question about savings! The 50/30/20 rule is a solid framework: "
                "50% for needs, 30% for wants, 20% for savings. "
                "Start by automating your savings — even small amounts add up over time."
            )
        elif any(w in msg for w in ["invest", "investment", "stock", "mutual fund"]):
            return (
                "While I can track your investments, I'm not qualified to give investment advice. "
                "Consider consulting a SEBI-registered financial advisor for personalized guidance. "
                "You can add your investment holdings in the Investments section for tracking."
            )
        elif any(w in msg for w in ["hello", "hi", "hey"]):
            return (
                "Hello! I'm Divvy AI, your personal finance assistant. "
                "I can help you understand your spending, manage budgets, and track your financial health. "
                "What would you like to know?"
            )
        else:
            return (
                "I can help you with:\n"
                "• **Spending analysis** — understand where your money goes\n"
                "• **Budget management** — set and track category budgets\n"
                "• **Savings tips** — strategies to save more\n"
                "• **Financial health** — assess your overall financial wellness\n\n"
                "What would you like to explore?"
            )

    @staticmethod
    async def create_session(
        db: AsyncSession, user_id: int, title: str = "New conversation"
    ) -> ChatSession:
        """Create a new chat session."""
        session = ChatSession(user_id=user_id, title=title)
        db.add(session)
        await db.commit()
        await db.refresh(session)
        return session

    @staticmethod
    async def send_message(
        db: AsyncSession,
        user_id: int,
        session_id: int,
        user_message: str,
    ) -> dict:
        """Process a user message and return AI response."""
        # Verify session ownership
        result = await db.execute(
            select(ChatSession)
            .where(ChatSession.id == session_id, ChatSession.user_id == user_id)
        )
        session = result.scalar_one_or_none()
        if not session:
            return None

        # Save user message
        user_msg = ChatMessage(
            session_id=session_id,
            role="user",
            content=user_message,
        )
        db.add(user_msg)

        # Build context
        financial_context = await ChatService._build_financial_context(db, user_id)

        # Get conversation history (last 10 messages for context window)
        history_result = await db.execute(
            select(ChatMessage)
            .where(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.created_at.desc())
            .limit(10)
        )
        history = list(reversed(history_result.scalars().all()))

        # Build messages for LLM
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT + financial_context},
        ]
        for msg in history:
            messages.append({"role": msg.role, "content": msg.content})
        messages.append({"role": "user", "content": user_message})

        # Get AI response
        ai_response = await ChatService._call_llm(messages)

        # Save assistant message
        assistant_msg = ChatMessage(
            session_id=session_id,
            role="assistant",
            content=ai_response,
        )
        db.add(assistant_msg)

        # Update session title from first message
        msg_count = await db.execute(
            select(func.count())
            .select_from(ChatMessage)
            .where(ChatMessage.session_id == session_id)
        )
        if (msg_count.scalar() or 0) <= 2:
            session.title = user_message[:80]

        await db.commit()
        await db.refresh(assistant_msg)

        return {
            "session_id": session_id,
            "reply": assistant_msg,
            "sources": ["spending_data", "budget_data", "transaction_history"],
        }

    @staticmethod
    async def get_sessions(
        db: AsyncSession, user_id: int, limit: int = 20
    ) -> dict:
        """List user's chat sessions."""
        result = await db.execute(
            select(ChatSession)
            .where(ChatSession.user_id == user_id)
            .order_by(ChatSession.updated_at.desc())
            .limit(limit)
        )
        sessions = result.scalars().all()

        session_list = []
        for s in sessions:
            msg_count = await db.execute(
                select(func.count())
                .select_from(ChatMessage)
                .where(ChatMessage.session_id == s.id)
            )
            session_list.append({
                "id": s.id,
                "title": s.title,
                "created_at": s.created_at,
                "updated_at": s.updated_at,
                "message_count": msg_count.scalar() or 0,
            })

        return {"sessions": session_list, "total": len(session_list)}

    @staticmethod
    async def get_session_messages(
        db: AsyncSession, user_id: int, session_id: int
    ) -> list:
        """Get all messages in a session."""
        # Verify ownership
        session = await db.execute(
            select(ChatSession)
            .where(ChatSession.id == session_id, ChatSession.user_id == user_id)
        )
        if not session.scalar_one_or_none():
            return None

        result = await db.execute(
            select(ChatMessage)
            .where(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.created_at)
        )
        return result.scalars().all()

    @staticmethod
    async def delete_session(
        db: AsyncSession, user_id: int, session_id: int
    ) -> bool:
        """Delete a chat session and all its messages."""
        result = await db.execute(
            select(ChatSession)
            .where(ChatSession.id == session_id, ChatSession.user_id == user_id)
        )
        session = result.scalar_one_or_none()
        if not session:
            return False

        await db.delete(session)
        await db.commit()
        return True
