# -*- coding: utf-8 -*-
"""
FinPath AI — Model Evaluation & Dataset Analytics Extractor
===========================================================
Computes reproducible evaluation metrics on held-out stratified test sets for:
- Model 1: Transaction Success Predictor (Binary: Failure=0, Success=1)
- Model 2: Failure Node Analyzer (Multi-class: Bank, Server, User)

Also computes training distribution percentiles and dataset-wide operational
aggregations so the backend can serve real metrics quickly.
"""

from typing import Any, Dict, List
import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report,
)

FEATURES = ["time", "user_latency", "server_latency", "bank_latency", "load"]

FEATURE_DESCRIPTIONS = {
    "time": {
        "label": "Transaction Hour (0–23)",
        "unit": "hour (24h UTC)",
        "description": "Hour of the day when the transaction was initiated. Peak evening hours (18:00–22:00) experience elevated concurrency.",
    },
    "user_latency": {
        "label": "User Network Latency",
        "unit": "ms",
        "description": "Round-trip network latency between the customer device and the FinPath edge gateway. Baseline mean is ~50ms.",
    },
    "server_latency": {
        "label": "Server Processing Latency",
        "unit": "ms",
        "description": "Internal microservice orchestration and validation time. Values above 90ms indicate server processing contention.",
    },
    "bank_latency": {
        "label": "Bank Gateway Latency",
        "unit": "ms",
        "description": "Response time from the upstream acquiring/issuing bank network. Values above 80ms correlate strongly with timeout failures.",
    },
    "load": {
        "label": "Concurrent System Load",
        "unit": "req/sec",
        "description": "Active concurrent transactions per second across the platform. Loads above 20,000 req/s increase queue contention.",
    },
}


def evaluate_model1(
    model1: Any,
    X_test: pd.DataFrame,
    y_test: pd.Series,
    X_train: pd.DataFrame,
    y_train: pd.Series,
) -> Dict[str, Any]:
    """Evaluate Model 1 (Transaction Success Predictor) on the held-out test set."""
    y_pred = model1.predict(X_test)
    labels = [0, 1]
    label_names = ["Failure (0)", "Success (1)"]

    cm = confusion_matrix(y_test, y_pred, labels=labels)
    report_dict = classification_report(
        y_test,
        y_pred,
        labels=labels,
        target_names=["Failure", "Success"],
        output_dict=True,
        zero_division=0,
    )

    importances = [
        {
            "feature": feat,
            "label": FEATURE_DESCRIPTIONS[feat]["label"],
            "importance": round(float(imp), 4),
            "description": FEATURE_DESCRIPTIONS[feat]["description"],
        }
        for feat, imp in zip(FEATURES, model1.feature_importances_)
    ]
    importances.sort(key=lambda x: x["importance"], reverse=True)

    return {
        "model_name": "Model 1: Transaction Success Predictor",
        "algorithm": "Random Forest Classifier",
        "task_type": "Binary Classification (0 = Failure, 1 = Success)",
        "train_samples": int(len(X_train)),
        "test_samples": int(len(X_test)),
        "positive_class_rate_train": round(float(y_train.mean()), 4),
        "failure_class_rate_train": round(float(1.0 - y_train.mean()), 4),
        "accuracy": round(float(accuracy_score(y_test, y_pred)), 4),
        "precision_macro": round(float(precision_score(y_test, y_pred, average="macro", zero_division=0)), 4),
        "recall_macro": round(float(recall_score(y_test, y_pred, average="macro", zero_division=0)), 4),
        "f1_macro": round(float(f1_score(y_test, y_pred, average="macro", zero_division=0)), 4),
        "precision_weighted": round(float(precision_score(y_test, y_pred, average="weighted", zero_division=0)), 4),
        "recall_weighted": round(float(recall_score(y_test, y_pred, average="weighted", zero_division=0)), 4),
        "f1_weighted": round(float(f1_score(y_test, y_pred, average="weighted", zero_division=0)), 4),
        "failure_class_metrics": {
            "precision": round(float(report_dict["Failure"]["precision"]), 4),
            "recall": round(float(report_dict["Failure"]["recall"]), 4),
            "f1_score": round(float(report_dict["Failure"]["f1-score"]), 4),
            "support": int(report_dict["Failure"]["support"]),
        },
        "success_class_metrics": {
            "precision": round(float(report_dict["Success"]["precision"]), 4),
            "recall": round(float(report_dict["Success"]["recall"]), 4),
            "f1_score": round(float(report_dict["Success"]["f1-score"]), 4),
            "support": int(report_dict["Success"]["support"]),
        },
        "confusion_matrix": {
            "labels": label_names,
            "matrix": cm.tolist(),
            "true_failure_pred_failure": int(cm[0][0]),
            "true_failure_pred_success": int(cm[0][1]),
            "true_success_pred_failure": int(cm[1][0]),
            "true_success_pred_success": int(cm[1][1]),
        },
        "classification_report": [
            {
                "class_name": "Failure (0)",
                "precision": round(float(report_dict["Failure"]["precision"]), 4),
                "recall": round(float(report_dict["Failure"]["recall"]), 4),
                "f1_score": round(float(report_dict["Failure"]["f1-score"]), 4),
                "support": int(report_dict["Failure"]["support"]),
            },
            {
                "class_name": "Success (1)",
                "precision": round(float(report_dict["Success"]["precision"]), 4),
                "recall": round(float(report_dict["Success"]["recall"]), 4),
                "f1_score": round(float(report_dict["Success"]["f1-score"]), 4),
                "support": int(report_dict["Success"]["support"]),
            },
        ],
        "feature_importance": importances,
        "hyperparameters": {
            "n_estimators": int(model1.n_estimators),
            "max_depth": model1.max_depth,
            "min_samples_split": int(model1.min_samples_split),
            "class_weight": str(model1.class_weight),
            "random_state": int(model1.random_state),
        },
    }


def evaluate_model2(
    model2: Any,
    X2_test: pd.DataFrame,
    y2_test: pd.Series,
    X2_train: pd.DataFrame,
    y2_train: pd.Series,
) -> Dict[str, Any]:
    """Evaluate Model 2 (Failure Node Analyzer) on the held-out failed transactions test set."""
    y2_pred = model2.predict(X2_test)
    classes: List[str] = ["User", "Server", "Bank"]

    cm = confusion_matrix(y2_test, y2_pred, labels=classes)
    report_dict = classification_report(
        y2_test,
        y2_pred,
        labels=classes,
        target_names=classes,
        output_dict=True,
        zero_division=0,
    )

    importances = [
        {
            "feature": feat,
            "label": FEATURE_DESCRIPTIONS[feat]["label"],
            "importance": round(float(imp), 4),
            "description": FEATURE_DESCRIPTIONS[feat]["description"],
        }
        for feat, imp in zip(FEATURES, model2.feature_importances_)
    ]
    importances.sort(key=lambda x: x["importance"], reverse=True)

    per_class_report = []
    for cls_name in classes:
        cls_stats = report_dict.get(cls_name, {"precision": 0.0, "recall": 0.0, "f1-score": 0.0, "support": 0})
        per_class_report.append(
            {
                "class_name": cls_name,
                "precision": round(float(cls_stats["precision"]), 4),
                "recall": round(float(cls_stats["recall"]), 4),
                "f1_score": round(float(cls_stats["f1-score"]), 4),
                "support": int(cls_stats["support"]),
            }
        )

    return {
        "model_name": "Model 2: Failure Node Analyzer",
        "algorithm": "Random Forest Classifier",
        "task_type": "Multi-class Classification (User, Server, Bank)",
        "train_samples": int(len(X2_train)),
        "test_samples": int(len(X2_test)),
        "accuracy": round(float(accuracy_score(y2_test, y2_pred)), 4),
        "precision_macro": round(float(precision_score(y2_test, y2_pred, average="macro", zero_division=0)), 4),
        "recall_macro": round(float(recall_score(y2_test, y2_pred, average="macro", zero_division=0)), 4),
        "f1_macro": round(float(f1_score(y2_test, y2_pred, average="macro", zero_division=0)), 4),
        "precision_weighted": round(float(precision_score(y2_test, y2_pred, average="weighted", zero_division=0)), 4),
        "recall_weighted": round(float(recall_score(y2_test, y2_pred, average="weighted", zero_division=0)), 4),
        "f1_weighted": round(float(f1_score(y2_test, y2_pred, average="weighted", zero_division=0)), 4),
        "confusion_matrix": {
            "labels": classes,
            "matrix": cm.tolist(),
        },
        "classification_report": per_class_report,
        "feature_importance": importances,
        "hyperparameters": {
            "n_estimators": int(model2.n_estimators),
            "max_depth": model2.max_depth,
            "min_samples_split": int(model2.min_samples_split),
            "class_weight": str(model2.class_weight),
            "random_state": int(model2.random_state),
        },
        "labeling_methodology_note": (
            "Synthetic Labeling Note: In this simulated dataset, failed transactions are labeled "
            "with the component ('User', 'Server', or 'Bank') exhibiting the highest raw latency "
            "during the transaction. This represents a synthetic heuristic rather than verified "
            "production trace root-cause attribution."
        ),
    }


def compute_feature_metadata(df: pd.DataFrame) -> Dict[str, Any]:
    """Compute distribution statistics (mean, std, percentiles) for each input feature."""
    stats: Dict[str, Any] = {}
    for feat in FEATURES:
        col = df[feat].astype(float)
        percentiles = np.percentile(col, [5, 10, 25, 50, 75, 90, 95, 99])
        stats[feat] = {
            "feature": feat,
            "label": FEATURE_DESCRIPTIONS[feat]["label"],
            "unit": FEATURE_DESCRIPTIONS[feat]["unit"],
            "description": FEATURE_DESCRIPTIONS[feat]["description"],
            "mean": round(float(col.mean()), 2),
            "std": round(float(col.std()), 2),
            "min": round(float(col.min()), 2),
            "max": round(float(col.max()), 2),
            "p5": round(float(percentiles[0]), 2),
            "p10": round(float(percentiles[1]), 2),
            "p25": round(float(percentiles[2]), 2),
            "p50": round(float(percentiles[3]), 2),
            "p75": round(float(percentiles[4]), 2),
            "p90": round(float(percentiles[5]), 2),
            "p95": round(float(percentiles[6]), 2),
            "p99": round(float(percentiles[7]), 2),
        }
    return stats

