# -*- coding: utf-8 -*-
"""
FinPath AI — Database Initialization & Seeding
==============================================
Creates database tables, seeds the demo analyst account, and populates
transaction records with both actual simulated outcomes and pre-computed
Model 1 & Model 2 predictions for fast searching, filtering, sorting,
pagination, and CSV export.
"""

import os
import secrets
import sys
from pathlib import Path
import numpy as np
import pandas as pd
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import PROJECT_ROOT, settings
from app.core.security import get_password_hash
from app.database.session import Base, SessionLocal, engine
from app.ml.engine import FEATURES, ml_engine
from app.models.transaction import Transaction
from app.models.user import User

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))


DEMO_USER_EMAIL = "demo@finpath.ai"
DEMO_USER_NAME = "Alex Rivera (Demo Analyst)"


def init_database() -> None:
    """Create all SQLAlchemy tables and seed initial data if empty."""
    Base.metadata.create_all(bind=engine)
    ml_engine.ensure_loaded()

    with SessionLocal() as db:
        _ensure_demo_user(db)
        _ensure_transactions_seeded(db)


def _ensure_demo_user(db: Session) -> User:
    """Create a secure demo user account for 1-click demo exploration."""
    existing = db.scalar(select(User).where(User.email == DEMO_USER_EMAIL))
    if existing:
        return existing

    # Generate a strong cryptographic password or use DEMO_ACCOUNT_PASSWORD env var
    raw_secret = os.getenv("DEMO_ACCOUNT_PASSWORD", secrets.token_urlsafe(24))
    demo_user = User(
        full_name=DEMO_USER_NAME,
        email=DEMO_USER_EMAIL,
        hashed_password=get_password_hash(raw_secret),
        role="Principal Transaction Intelligence Analyst",
        is_active=True,
        is_demo=True,
    )
    db.add(demo_user)
    db.commit()
    db.refresh(demo_user)
    return demo_user


def _ensure_transactions_seeded(db: Session) -> None:
    """Seed the `transactions` table from the synthetic dataset with real ML predictions."""
    count = db.scalar(select(func.count(Transaction.id))) or 0
    if count > 0:
        return

    from ml.generate_data import SEED, generate_transactions_dataframe

    seed_limit = min(max(settings.DB_SEED_LIMIT, 5000), 200_000)
    print(f"[FinPath DB] Generating and indexing {seed_limit:,} transactions with live model predictions...")

    full_df = generate_transactions_dataframe(n_samples=200_000, seed=SEED)
    df_slice = full_df.iloc[:seed_limit].copy()

    # Batch inference using loaded Model 1 and Model 2 (vectorized, fast)
    X_slice = df_slice[FEATURES]
    m1_preds = ml_engine.model1.predict(X_slice)
    m1_probs = ml_engine.model1.predict_proba(X_slice)
    m1_classes = list(ml_engine.model1.classes_)
    idx_fail = m1_classes.index(0) if 0 in m1_classes else 0
    idx_succ = m1_classes.index(1) if 1 in m1_classes else 1

    m2_preds = ml_engine.model2.predict(X_slice)

    df_slice["predicted_success"] = m1_preds.astype(int)
    df_slice["failure_probability"] = np.round(m1_probs[:, idx_fail], 4)
    df_slice["success_probability"] = np.round(m1_probs[:, idx_succ], 4)
    df_slice["predicted_failed_node"] = np.where(
        df_slice["predicted_success"] == 1,
        "None",
        m2_preds.astype(str),
    )

    records = [
        {
            "finpath_id": row["finpath_id"],
            "time": int(row["time"]),
            "user_latency": float(row["user_latency"]),
            "server_latency": float(row["server_latency"]),
            "bank_latency": float(row["bank_latency"]),
            "load": int(row["load"]),
            "success": int(row["success"]),
            "failed_node": str(row["failed_node"]),
            "predicted_success": int(row["predicted_success"]),
            "success_probability": float(row["success_probability"]),
            "failure_probability": float(row["failure_probability"]),
            "predicted_failed_node": str(row["predicted_failed_node"]),
        }
        for row in df_slice.to_dict(orient="records")
    ]

    # Bulk insert in chunks of 5,000 for SQLite/PostgreSQL efficiency
    chunk_size = 5000
    for start in range(0, len(records), chunk_size):
        db.bulk_insert_mappings(Transaction, records[start : start + chunk_size])
    db.commit()
    print(f"[FinPath DB] Seeded {len(records):,} transactions into relational database.")

