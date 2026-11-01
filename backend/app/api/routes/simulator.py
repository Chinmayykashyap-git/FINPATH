# -*- coding: utf-8 -*-
"""
FinPath AI — Interactive Transaction Simulator Routes
=====================================================
Executes live Model 1 and Model 2 inference on user-configured transaction
scenarios and explains parameter elevation relative to training distributions.
"""

from typing import Any, Dict, List
from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.ml.engine import ml_engine
from app.models.user import User
from app.schemas.prediction import FullAnalysisResponse, TransactionFeaturesInput

router = APIRouter(prefix="/simulator", tags=["Transaction Simulator"])


@router.get("/presets")
def get_simulator_presets(
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Return curated realistic operational scenarios and training baseline metadata."""
    ml_engine.ensure_loaded()
    presets: List[Dict[str, Any]] = [
        {
            "id": "baseline-healthy",
            "name": "Healthy Baseline Traffic",
            "badge": "Nominal",
            "description": "Mid-day transaction with typical client, server, and bank gateway latencies.",
            "inputs": {
                "time": 11,
                "user_latency": 48.0,
                "server_latency": 66.0,
                "bank_latency": 57.0,
                "load": 14200,
            },
        },
        {
            "id": "server-contention",
            "name": "Server Microservice Contention",
            "badge": "Server Bottleneck",
            "description": "High server processing latency (114ms) combined with heavy evening concurrency.",
            "inputs": {
                "time": 20,
                "user_latency": 52.0,
                "server_latency": 114.0,
                "bank_latency": 64.0,
                "load": 22400,
            },
        },
        {
            "id": "bank-gateway-degradation",
            "name": "Acquiring Bank Gateway Spike",
            "badge": "Bank Bottleneck",
            "description": "Upstream bank gateway latency spike (108ms) under elevated queue load.",
            "inputs": {
                "time": 19,
                "user_latency": 49.0,
                "server_latency": 74.0,
                "bank_latency": 108.0,
                "load": 21800,
            },
        },
        {
            "id": "client-edge-degradation",
            "name": "Mobile Edge Network Congestion",
            "badge": "User Bottleneck",
            "description": "Severe client-side packet delay (105ms) paired with elevated system load.",
            "inputs": {
                "time": 18,
                "user_latency": 105.0,
                "server_latency": 72.0,
                "bank_latency": 61.0,
                "load": 21500,
            },
        },
        {
            "id": "cascading-peak-overload",
            "name": "Peak Hour Cascading Overload",
            "badge": "Multi-Node Stress",
            "description": "Simultaneous server (106ms) and bank (96ms) congestion at maximum system load (24,500 req/s).",
            "inputs": {
                "time": 21,
                "user_latency": 68.0,
                "server_latency": 106.0,
                "bank_latency": 96.0,
                "load": 24500,
            },
        },
    ]
    return {
        "presets": presets,
        "feature_metadata": ml_engine.feature_metadata,
    }


@router.post("/analyze", response_model=FullAnalysisResponse)
def simulate_transaction(
    payload: TransactionFeaturesInput,
    current_user: User = Depends(get_current_user),
) -> FullAnalysisResponse:
    """
    Run live Model 1 & Model 2 inference on the simulated transaction parameters
    and return probability breakdowns plus training-distribution comparisons.
    """
    result = ml_engine.full_analysis(
        time=payload.time,
        user_latency=payload.user_latency,
        server_latency=payload.server_latency,
        bank_latency=payload.bank_latency,
        load=payload.load,
    )
    return FullAnalysisResponse(**result)

