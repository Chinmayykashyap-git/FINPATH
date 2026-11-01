# -*- coding: utf-8 -*-
"""FinPath AI — Prediction & Simulator Pydantic Schemas."""

from typing import Any, Dict, List
from pydantic import BaseModel, Field


class TransactionFeaturesInput(BaseModel):
    time: int = Field(
        ...,
        ge=0,
        le=23,
        description="Hour of the day (0 to 23 UTC)",
        examples=[19],
    )
    user_latency: float = Field(
        ...,
        ge=1.0,
        le=500.0,
        description="User network latency in milliseconds (1 to 500 ms)",
        examples=[52.5],
    )
    server_latency: float = Field(
        ...,
        ge=1.0,
        le=500.0,
        description="Server processing latency in milliseconds (1 to 500 ms)",
        examples=[96.0],
    )
    bank_latency: float = Field(
        ...,
        ge=1.0,
        le=500.0,
        description="Bank gateway response latency in milliseconds (1 to 500 ms)",
        examples=[84.0],
    )
    load: int = Field(
        ...,
        ge=1000,
        le=50000,
        description="Concurrent system load in requests/second (1,000 to 50,000)",
        examples=[21500],
    )


class SuccessPredictionResponse(BaseModel):
    predicted_class: int
    predicted_outcome: str
    success_probability: float
    failure_probability: float
    ensemble_agreement: float
    confidence_note: str


class FailureNodePredictionResponse(BaseModel):
    predicted_failure_component: str
    class_probabilities: Dict[str, float]
    attribution_note: str


class FullAnalysisResponse(BaseModel):
    inputs: Dict[str, Any]
    model1_prediction: SuccessPredictionResponse
    model2_triggered: bool
    predicted_failure_component: str
    model2_prediction: FailureNodePredictionResponse
    parameter_breakdown: List[Dict[str, Any]]
    elevated_parameters: List[str]
    summary: str

