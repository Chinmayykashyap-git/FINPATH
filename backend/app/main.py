# -*- coding: utf-8 -*-
"""
FinPath AI — Production FastAPI Application Entrypoint
======================================================
Integrates JWT authentication, SQLite/PostgreSQL database persistence,
and trained Random Forest models for transaction success prediction and
failure node attribution.
"""

from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any, Dict
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.api.routes import (
    auth,
    dashboard,
    insights,
    models,
    predictions,
    simulator,
    transactions,
)
from app.core.config import PROJECT_ROOT, settings
from app.database.init_db import init_database
from app.ml.engine import ml_engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize ML models and relational database on application startup."""
    init_database()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "AI-powered transaction intelligence and failure prediction platform "
        "that analyzes transaction performance, predicts transaction success, "
        "identifies potential failure points, and generates actionable operational insights."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Configure CORS
allow_all = "*" in settings.CORS_ORIGINS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if allow_all else settings.CORS_ORIGINS,
    allow_credentials=not allow_all,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers under /api
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(dashboard.router, prefix=settings.API_V1_STR)
app.include_router(transactions.router, prefix=settings.API_V1_STR)
app.include_router(predictions.router, prefix=settings.API_V1_STR)
app.include_router(insights.router, prefix=settings.API_V1_STR)
app.include_router(models.router, prefix=settings.API_V1_STR)
app.include_router(simulator.router, prefix=settings.API_V1_STR)


@app.get("/health", tags=["System Health"])
def health_check() -> Dict[str, Any]:
    """Return service health, ML artifact status, and environment metadata."""
    ml_engine.ensure_loaded()
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "models_loaded": ml_engine.is_loaded,
        "dataset_size": ml_engine.evaluation_metrics.get("dataset_size", 200000),
        "database_dialect": "sqlite" if settings.DATABASE_URL.startswith("sqlite") else "postgresql",
    }


FRONTEND_DIST = PROJECT_ROOT / "frontend" / "dist"
if (FRONTEND_DIST / "assets").exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="assets")


@app.get("/{full_path:path}", include_in_schema=False)
def serve_spa(full_path: str):
    """Serve the compiled React SPA for all client-side routes."""
    index_file = FRONTEND_DIST / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file))
    return {"message": "FinPath AI Backend API is running. Visit /docs for Swagger UI."}


