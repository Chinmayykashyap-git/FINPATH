# -*- coding: utf-8 -*-
"""
FinPath AI — Failure Intelligence & Bank Operational Insights Routes
====================================================================
Serves data-driven operational findings, hourly heatmaps, component latency
comparisons, and recommendations derived from the 200,000 synthetic dataset.
"""

from typing import Any, Dict
from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.ml.engine import ml_engine
from app.models.user import User

router = APIRouter(prefix="/insights", tags=["Operational Insights"])


@router.get("/failures")
def get_failure_intelligence(
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Return comprehensive Failure Intelligence metrics:
    - Most problematic component
    - Failure distribution by component
    - Failure percentage & frequency by hour
    - Latency distribution (Failed vs Successful)
    - High-load failure patterns
    - Data-driven insights & actionable operational recommendations
    """
    ml_engine.ensure_loaded()
    s = ml_engine.analytics_summary
    return {
        "most_problematic_component": s["most_problematic_component"],
        "peak_failure_hour": s["peak_failure_hour"],
        "total_failures": s["kpis"]["failed_transactions"],
        "failure_percentage": s["kpis"]["failure_rate"],
        "component_distribution": s["component_distribution"],
        "hourly_failures": s["hourly_distribution"],
        "latency_comparison": s["latency_comparison"],
        "load_analysis": s["load_analysis"],
        "insights": s["insights"],
        "recommendations": s["recommendations"],
        "disclaimer": s["disclaimer"],
    }


@router.get("/hourly")
def get_hourly_insights(
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Return hourly failure distribution, failure rates, and 24x3 component failure heatmap."""
    ml_engine.ensure_loaded()
    s = ml_engine.analytics_summary
    hourly = s["hourly_distribution"]
    max_cell = max(
        max(h["user_failures"], h["server_failures"], h["bank_failures"])
        for h in hourly
    ) if hourly else 1

    return {
        "peak_failure_hour": s["peak_failure_hour"],
        "hourly_distribution": hourly,
        "max_component_hourly_failures": max_cell,
        "disclaimer": s["disclaimer"],
    }


@router.get("/components")
def get_component_insights(
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Return component-level performance comparison (User vs Server vs Bank)."""
    ml_engine.ensure_loaded()
    s = ml_engine.analytics_summary
    return {
        "most_problematic_component": s["most_problematic_component"],
        "component_distribution": s["component_distribution"],
        "latency_comparison": s["latency_comparison"],
        "load_analysis": s["load_analysis"],
        "disclaimer": s["disclaimer"],
    }

