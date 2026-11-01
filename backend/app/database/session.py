# -*- coding: utf-8 -*-
"""
FinPath AI — Database Engine & Session Management
=================================================
Configures SQLAlchemy ORM for SQLite (default) with seamless compatibility
for PostgreSQL when `DATABASE_URL` points to a Postgres instance.
"""

from pathlib import Path
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import DEFAULT_DB_PATH, settings

# Ensure SQLite parent folder exists if using SQLite
if settings.DATABASE_URL.startswith("sqlite"):
    DEFAULT_DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    connect_args = {"check_same_thread": False}
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args=connect_args,
        pool_pre_ping=True,
    )
else:
    # PostgreSQL / production relational database configuration
    engine = create_engine(
        settings.DATABASE_URL,
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True,
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Base declarative class for all FinPath AI ORM models."""
    pass


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency yielding a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

