# -*- coding: utf-8 -*-
"""
FinPath AI — Machine Learning Prediction Routes
===============================================
Exposes Model 1 (Transaction Success Predictor), Model 2 (Failure Node Analyzer),
and combined analysis endpoints.
"""

from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.ml.engine import ml_engine
from app.models.user import User
from app.schemas.prediction import (
    FailureNodePredictionResponse,
    FullAnalysisResponse,
    SuccessPredictionResponse,
    TransactionFeaturesInput,
)

router = APIRouter(prefix="/predict", tags=["Predictions"])


@router.post("/success", response_model=SuccessPredictionResponse)
def predict_transaction_success(
    payload: TransactionFeaturesInput,
    current_user: User = Depends(get_current_user),
) -> SuccessPredictionResponse:
    """Run Model 1 (Transaction Success Predictor) on input transaction conditions."""
    result = ml_engine.predict_success(
        time=payload.time,
        user_latency=payload.user_latency,
        server_latency=payload.server_latency,
        bank_latency=payload.bank_latency,
        load=payload.load,
    )
    return SuccessPredictionResponse(**result)


@router.post("/failure-node", response_model=FailureNodePredictionResponse)
def predict_failure_component(
    payload: TransactionFeaturesInput,
    current_user: User = Depends(get_current_user),
) -> FailureNodePredictionResponse:
    """Run Model 2 (Failure Node Analyzer) to estimate the most likely failure component."""
    result = ml_engine.predict_failure_node(
        time=payload.time,
        user_latency=payload.user_latency,
        server_latency=payload.server_latency,
        bank_latency=payload.bank_latency,
        load=payload.load,
    )
    return FailureNodePredictionResponse(**result)


@router.post("/analyze", response_model=FullAnalysisResponse)
def analyze_transaction_models(
    payload: TransactionFeaturesInput,
    current_user: User = Depends(get_current_user),
) -> FullAnalysisResponse:
    """Run both Model 1 and Model 2 with training distribution percentile comparisons."""
    result = ml_engine.full_analysis(
        time=payload.time,
        user_latency=payload.user_latency,
        server_latency=payload.server_latency,
        bank_latency=payload.bank_latency,
        load=payload.load,
    )
    return FullAnalysisResponse(**result)

