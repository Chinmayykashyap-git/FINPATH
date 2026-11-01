# -*- coding: utf-8 -*-
"""
FinPath AI — Application Configuration
======================================
Loads environment variables for database connections, JWT authentication,
CORS origins, and ML artifact paths.
"""

import os
import secrets
from pathlib import Path
from typing import List

BASE_DIR = Path(__file__).resolve().parent.parent.parent
PROJECT_ROOT = BASE_DIR.parent
DEFAULT_ARTIFACTS_DIR = PROJECT_ROOT / "ml" / "artifacts"
DEFAULT_DB_PATH = BASE_DIR / "data" / "finpath.db"


class Settings:
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "FinPath AI — Transaction Intelligence Platform")
    VERSION: str = os.getenv("VERSION", "1.0.0")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "production")
    API_V1_STR: str = "/api"

    # Security / JWT
    JWT_SECRET_KEY: str = os.getenv(
        "JWT_SECRET_KEY",
        secrets.token_urlsafe(32),
    )
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", str(60 * 24)))

    # Database (SQLite by default; set DATABASE_URL=postgresql+psycopg2://... for PostgreSQL)
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        f"sqlite:///{DEFAULT_DB_PATH.as_posix()}",
    )

    # ML Artifacts Directory
    ARTIFACTS_DIR: Path = Path(os.getenv("ARTIFACTS_DIR", str(DEFAULT_ARTIFACTS_DIR)))

    # Number of transactions to index in SQLite for fast interactive table querying
    # (Full 200,000 dataset is used for ML training, evaluation, and analytics;
    # SQLite stores 25,000 stratified records by default or up to 200,000 via DB_SEED_LIMIT)
    DB_SEED_LIMIT: int = int(os.getenv("DB_SEED_LIMIT", "25000"))

    # CORS Origins
    CORS_ORIGINS: List[str] = [
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000,*",
        ).split(",")
        if origin.strip()
    ]


settings = Settings()

