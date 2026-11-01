# -*- coding: utf-8 -*-
"""
FinPath AI — Model Performance & Feature Importance Routes
==========================================================
Serves actual test-set evaluation metrics (Accuracy, Precision, Recall, F1,
Confusion Matrices, Classification Reports) and feature importances for both models.
"""

from typing import Any, Dict
from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.ml.engine import ml_engine
from app.models.user import User

router = APIRouter(prefix="/models", tags=["Model Performance"])


@router.get("/metrics")
def get_model_metrics(
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Return full evaluation metrics, confusion matrices, and classification reports for Model 1 & Model 2."""
    ml_engine.ensure_loaded()
    return ml_engine.evaluation_metrics


@router.get("/feature-importance")
def get_feature_importance(
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Return feature importance rankings and training feature metadata for both models."""
    ml_engine.ensure_loaded()
    metrics = ml_engine.evaluation_metrics
    return {
        "model1_feature_importance": metrics["model1"]["feature_importance"],
        "model2_feature_importance": metrics["model2"]["feature_importance"],
        "feature_metadata": ml_engine.feature_metadata,
    }

