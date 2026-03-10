"""Seed the database with demo user, transactions, and budgets."""
import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from .models import User, Transaction, Budget, Goal
from .auth import hash_password


DEMO_TRANSACTIONS = [
    {"date": "2026-02-27", "category": "Food & Dining", "description": "Swiggy Order", "amount": -580, "mode": "UPI"},
    {"date": "2026-02-26", "category": "Transportation", "description": "Uber Ride", "amount": -245, "mode": "Credit Card"},
    {"date": "2026-02-26", "category": "Shopping", "description": "Amazon Purchase", "amount": -3299, "mode": "Debit Card"},
    {"date": "2026-02-25", "category": "Income", "description": "Salary Credit", "amount": 75000, "mode": "Bank Transfer"},
    {"date": "2026-02-25", "category": "Bills & Utilities", "description": "Electricity Bill", "amount": -2100, "mode": "Auto Debit"},
    {"date": "2026-02-24", "category": "Entertainment", "description": "Netflix Subscription", "amount": -649, "mode": "Credit Card"},
    {"date": "2026-02-24", "category": "Food & Dining", "description": "Zomato Order", "amount": -420, "mode": "UPI"},
    {"date": "2026-02-23", "category": "Shopping", "description": "Myntra Fashion", "amount": -1890, "mode": "Credit Card"},
    {"date": "2026-02-23", "category": "Transportation", "description": "Ola Ride", "amount": -185, "mode": "UPI"},
    {"date": "2026-02-22", "category": "Bills & Utilities", "description": "Internet Bill", "amount": -999, "mode": "Auto Debit"},
    {"date": "2026-02-22", "category": "Food & Dining", "description": "Grocery Store", "amount": -2340, "mode": "Debit Card"},
    {"date": "2026-02-21", "category": "Subscriptions", "description": "Spotify Premium", "amount": -119, "mode": "Credit Card"},
    {"date": "2026-02-21", "category": "Entertainment", "description": "Movie Tickets", "amount": -800, "mode": "UPI"},
    {"date": "2026-02-20", "category": "Shopping", "description": "Flipkart Electronics", "amount": -4500, "mode": "Credit Card"},
    {"date": "2026-02-20", "category": "Food & Dining", "description": "Restaurant Dinner", "amount": -1650, "mode": "Credit Card"},
    # January 2026
    {"date": "2026-01-28", "category": "Income", "description": "Salary Credit", "amount": 75000, "mode": "Bank Transfer"},
    {"date": "2026-01-27", "category": "Food & Dining", "description": "Swiggy Order", "amount": -650, "mode": "UPI"},
    {"date": "2026-01-26", "category": "Shopping", "description": "Amazon Purchase", "amount": -2800, "mode": "Credit Card"},
    {"date": "2026-01-25", "category": "Transportation", "description": "Uber Rides", "amount": -1200, "mode": "UPI"},
    {"date": "2026-01-24", "category": "Bills & Utilities", "description": "Electricity Bill", "amount": -1900, "mode": "Auto Debit"},
    {"date": "2026-01-23", "category": "Entertainment", "description": "Netflix", "amount": -649, "mode": "Credit Card"},
    {"date": "2026-01-22", "category": "Food & Dining", "description": "Grocery Store", "amount": -3200, "mode": "Debit Card"},
    {"date": "2026-01-21", "category": "Subscriptions", "description": "Spotify + YouTube", "amount": -348, "mode": "Credit Card"},
    {"date": "2026-01-20", "category": "Shopping", "description": "Clothes Shopping", "amount": -4200, "mode": "Credit Card"},
    {"date": "2026-01-19", "category": "Food & Dining", "description": "Restaurant", "amount": -1800, "mode": "UPI"},
    {"date": "2026-01-18", "category": "Transportation", "description": "Metro Card Recharge", "amount": -500, "mode": "UPI"},
    {"date": "2026-01-17", "category": "Bills & Utilities", "description": "Phone Bill", "amount": -599, "mode": "Auto Debit"},
    {"date": "2026-01-15", "category": "Entertainment", "description": "Concert Tickets", "amount": -2500, "mode": "Credit Card"},
    {"date": "2026-01-10", "category": "Food & Dining", "description": "Zomato Orders", "amount": -1400, "mode": "UPI"},
    {"date": "2026-01-05", "category": "Subscriptions", "description": "Gym Membership", "amount": -3200, "mode": "Auto Debit"},
    # December 2025
    {"date": "2025-12-28", "category": "Income", "description": "Salary Credit", "amount": 72000, "mode": "Bank Transfer"},
    {"date": "2025-12-25", "category": "Shopping", "description": "Christmas Shopping", "amount": -8500, "mode": "Credit Card"},
    {"date": "2025-12-22", "category": "Food & Dining", "description": "Party Catering", "amount": -5600, "mode": "UPI"},
    {"date": "2025-12-20", "category": "Entertainment", "description": "Year-end Party", "amount": -3200, "mode": "UPI"},
    {"date": "2025-12-18", "category": "Transportation", "description": "Holiday Travel", "amount": -4500, "mode": "Credit Card"},
    {"date": "2025-12-15", "category": "Bills & Utilities", "description": "Electricity Bill", "amount": -2200, "mode": "Auto Debit"},
    {"date": "2025-12-12", "category": "Subscriptions", "description": "Annual Renewals", "amount": -5000, "mode": "Credit Card"},
    {"date": "2025-12-10", "category": "Food & Dining", "description": "Groceries", "amount": -3500, "mode": "Debit Card"},
    {"date": "2025-12-05", "category": "Shopping", "description": "Gadgets", "amount": -12000, "mode": "Credit Card"},
    {"date": "2025-12-02", "category": "Food & Dining", "description": "Dining Out", "amount": -2200, "mode": "Credit Card"},
    # November 2025
    {"date": "2025-11-28", "category": "Income", "description": "Salary Credit", "amount": 72000, "mode": "Bank Transfer"},
    {"date": "2025-11-25", "category": "Food & Dining", "description": "Swiggy Orders", "amount": -1800, "mode": "UPI"},
    {"date": "2025-11-22", "category": "Shopping", "description": "Diwali Shopping", "amount": -6500, "mode": "Credit Card"},
    {"date": "2025-11-20", "category": "Entertainment", "description": "Firecracker Budget", "amount": -2000, "mode": "UPI"},
    {"date": "2025-11-18", "category": "Transportation", "description": "Travel", "amount": -1800, "mode": "UPI"},
    {"date": "2025-11-15", "category": "Bills & Utilities", "description": "Bills", "amount": -3100, "mode": "Auto Debit"},
    {"date": "2025-11-10", "category": "Food & Dining", "description": "Groceries", "amount": -2800, "mode": "Debit Card"},
    {"date": "2025-11-05", "category": "Subscriptions", "description": "Spotify + Gym", "amount": -3500, "mode": "Credit Card"},
    # October 2025
    {"date": "2025-10-28", "category": "Income", "description": "Salary Credit", "amount": 72000, "mode": "Bank Transfer"},
    {"date": "2025-10-25", "category": "Food & Dining", "description": "Restaurants", "amount": -3200, "mode": "Credit Card"},
    {"date": "2025-10-22", "category": "Shopping", "description": "Online Shopping", "amount": -5200, "mode": "Credit Card"},
    {"date": "2025-10-18", "category": "Transportation", "description": "Uber Rides", "amount": -1600, "mode": "UPI"},
    {"date": "2025-10-15", "category": "Bills & Utilities", "description": "All Bills", "amount": -4200, "mode": "Auto Debit"},
    {"date": "2025-10-10", "category": "Entertainment", "description": "Movies & Games", "amount": -2400, "mode": "UPI"},
    {"date": "2025-10-05", "category": "Subscriptions", "description": "Subscriptions", "amount": -3200, "mode": "Credit Card"},
    {"date": "2025-10-02", "category": "Food & Dining", "description": "Groceries", "amount": -2500, "mode": "Debit Card"},
    # September 2025
    {"date": "2025-09-28", "category": "Income", "description": "Salary Credit", "amount": 70000, "mode": "Bank Transfer"},
    {"date": "2025-09-24", "category": "Food & Dining", "description": "Food Orders", "amount": -2800, "mode": "UPI"},
    {"date": "2025-09-20", "category": "Shopping", "description": "Clothes", "amount": -3800, "mode": "Credit Card"},
    {"date": "2025-09-16", "category": "Transportation", "description": "Travel", "amount": -1400, "mode": "UPI"},
    {"date": "2025-09-12", "category": "Bills & Utilities", "description": "Bills", "amount": -3000, "mode": "Auto Debit"},
    {"date": "2025-09-08", "category": "Entertainment", "description": "Entertainment", "amount": -1800, "mode": "Credit Card"},
    {"date": "2025-09-04", "category": "Subscriptions", "description": "All Subs", "amount": -2200, "mode": "Credit Card"},
    # August 2025
    {"date": "2025-08-28", "category": "Income", "description": "Salary Credit", "amount": 70000, "mode": "Bank Transfer"},
    {"date": "2025-08-24", "category": "Food & Dining", "description": "Food", "amount": -3500, "mode": "UPI"},
    {"date": "2025-08-20", "category": "Shopping", "description": "Shopping", "amount": -4200, "mode": "Credit Card"},
    {"date": "2025-08-16", "category": "Transportation", "description": "Rides", "amount": -1800, "mode": "UPI"},
    {"date": "2025-08-12", "category": "Bills & Utilities", "description": "Utilities", "amount": -3200, "mode": "Auto Debit"},
    {"date": "2025-08-08", "category": "Entertainment", "description": "Fun", "amount": -2100, "mode": "Credit Card"},
    {"date": "2025-08-04", "category": "Subscriptions", "description": "Subs", "amount": -2500, "mode": "Credit Card"},
]

DEMO_BUDGETS = [
    {"category": "Food & Dining", "budget": 15000, "color": "#8b5cf6"},
    {"category": "Transportation", "budget": 10000, "color": "#6366f1"},
    {"category": "Shopping", "budget": 8000, "color": "#22d3ee"},
    {"category": "Entertainment", "budget": 5000, "color": "#34d399"},
    {"category": "Bills & Utilities", "budget": 8000, "color": "#f472b6"},
    {"category": "Subscriptions", "budget": 3000, "color": "#fbbf24"},
]

DEMO_GOALS = [
    {"name": "Emergency Fund", "target_amount": 200000, "current_amount": 85000, "category": "emergency", "deadline": "2026-12-31"},
    {"name": "Goa Vacation", "target_amount": 50000, "current_amount": 32000, "category": "vacation", "deadline": "2026-06-15"},
    {"name": "New Laptop", "target_amount": 80000, "current_amount": 45000, "category": "purchase", "deadline": "2026-08-01"},
    {"name": "Investment Corpus", "target_amount": 500000, "current_amount": 120000, "category": "investment", "deadline": "2027-03-31"},
]


async def seed_demo_data(db: AsyncSession):
    """Create demo user with transactions and budgets if not exists."""
    result = await db.execute(select(User).where(User.email == "vijay@divvy.ai"))
    if result.scalar_one_or_none():
        return  # Already seeded

    user = User(
        name="Vijay",
        email="vijay@divvy.ai",
        hashed_password=hash_password("password123"),
        plan="Premium",
        member_since=datetime.date(2025, 1, 15),
    )
    db.add(user)
    await db.flush()

    # Add transactions
    for tx in DEMO_TRANSACTIONS:
        db.add(Transaction(
            user_id=user.id,
            date=datetime.date.fromisoformat(tx["date"]),
            category=tx["category"],
            description=tx["description"],
            amount=tx["amount"],
            mode=tx["mode"],
        ))

    # Add budgets
    for b in DEMO_BUDGETS:
        db.add(Budget(
            user_id=user.id,
            category=b["category"],
            budget=b["budget"],
            color=b["color"],
        ))

    # Add goals
    for g in DEMO_GOALS:
        db.add(Goal(
            user_id=user.id,
            name=g["name"],
            target_amount=g["target_amount"],
            current_amount=g["current_amount"],
            category=g["category"],
            deadline=datetime.date.fromisoformat(g["deadline"]),
        ))

    await db.commit()
