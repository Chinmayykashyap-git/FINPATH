# -*- coding: utf-8 -*-
"""
FinPath AI — Dashboard Summary & Analytics Charts Routes
========================================================
Serves real dataset KPIs and interactive chart series from the 200,000
synthetic transaction dataset.
"""

from typing import Any, Dict
from fastapi import APIRouter, Depends, Query

from app.api.deps import get_current_user
from app.ml.engine import ml_engine
from app.models.user import User

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary")
def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Return top-level KPI metrics and dataset comparisons."""
    ml_engine.ensure_loaded()
    summary = ml_engine.analytics_summary
    return {
        "kpis": summary["kpis"],
        "most_problematic_component": summary["most_problematic_component"],
        "peak_failure_hour": summary["peak_failure_hour"],
        "disclaimer": summary["disclaimer"],
    }


@router.get("/charts")
def get_dashboard_charts(
    start_hour: int = Query(default=0, ge=0, le=23, description="Filter start hour (0-23)"),
    end_hour: int = Query(default=23, ge=0, le=23, description="Filter end hour (0-23)"),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Return interactive chart datasets:
    A. Transaction Success vs Failure
    B. Transaction Volume Over Time (filtered by start_hour..end_hour)
    C. Failure Distribution by Component
    D. Latency Analysis (User, Server, Bank)
    E. System Load Analysis
    """
    ml_engine.ensure_loaded()
    summary = ml_engine.analytics_summary

    hourly_all = summary["hourly_distribution"]
    if start_hour <= end_hour:
        hourly_filtered = [h for h in hourly_all if start_hour <= h["hour"] <= end_hour]
    else:
        hourly_filtered = [h for h in hourly_all if h["hour"] >= start_hour or h["hour"] <= end_hour]

    filtered_succ = sum(h["successful"] for h in hourly_filtered)
    filtered_fail = sum(h["failed"] for h in hourly_filtered)
    filtered_total = filtered_succ + filtered_fail

    comp_totals = {
        "User": sum(h["user_failures"] for h in hourly_filtered),
        "Server": sum(h["server_failures"] for h in hourly_filtered),
        "Bank": sum(h["bank_failures"] for h in hourly_filtered),
    }
    filtered_components = []
    for comp_name in ["Server", "Bank", "User"]:
        cnt = comp_totals[comp_name]
        pct = round((cnt / filtered_fail) * 100.0, 2) if filtered_fail > 0 else 0.0
        filtered_components.append(
            {
                "component": comp_name,
                "failures": cnt,
                "percentage": pct,
            }
        )
    filtered_components.sort(key=lambda x: x["failures"], reverse=True)

    return {
        "time_filter": {"start_hour": start_hour, "end_hour": end_hour},
        "success_vs_failure": [
            {
                "name": "Successful",
                "count": filtered_succ,
                "percentage": round((filtered_succ / filtered_total) * 100.0, 2) if filtered_total else 0.0,
                "color": "#22C55E",
            },
            {
                "name": "Failed",
                "count": filtered_fail,
                "percentage": round((filtered_fail / filtered_total) * 100.0, 2) if filtered_total else 0.0,
                "color": "#EF4444",
            },
        ],
        "hourly_volume": hourly_filtered,
        "failure_by_component": filtered_components,
        "latency_analysis": summary["latency_comparison"],
        "system_load_analysis": summary["load_analysis"],
    }

