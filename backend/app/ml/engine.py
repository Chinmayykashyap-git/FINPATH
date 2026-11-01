# -*- coding: utf-8 -*-
"""
FinPath AI — Machine Learning Inference & Artifact Engine
=========================================================
Loads pre-trained scikit-learn Random Forest models (`model1_success.joblib`
and `model2_failure_node.joblib`) and evaluation artifacts once at server
startup and serves low-latency predictions and training-set comparisons.
"""

import json
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional
import joblib
import numpy as np
import pandas as pd

from app.core.config import PROJECT_ROOT, settings

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

FEATURES = ["time", "user_latency", "server_latency", "bank_latency", "load"]


class MLEngine:
    """Singleton ML inference manager that loads trained models once at startup."""

    def __init__(self) -> None:
        self.model1: Any = None
        self.model2: Any = None
        self.evaluation_metrics: Dict[str, Any] = {}
        self.feature_metadata: Dict[str, Any] = {}
        self.analytics_summary: Dict[str, Any] = {}
        self.is_loaded: bool = False

    def ensure_loaded(self) -> None:
        """Load models and JSON artifacts from disk, or generate them if missing."""
        if self.is_loaded and self.model1 is not None and self.model2 is not None:
            return

        artifacts_dir: Path = settings.ARTIFACTS_DIR
        m1_path = artifacts_dir / "model1_success.joblib"
        m2_path = artifacts_dir / "model2_failure_node.joblib"
        eval_path = artifacts_dir / "evaluation_metrics.json"
        meta_path = artifacts_dir / "feature_metadata.json"
        analytics_path = artifacts_dir / "analytics_summary.json"

        if not (
            m1_path.exists()
            and m2_path.exists()
            and eval_path.exists()
            and meta_path.exists()
            and analytics_path.exists()
        ):
            print("[FinPath Engine] Artifacts not found on disk. Running initial training pipeline...")
            from ml.train import train_and_save_all

            m1, m2, _, eval_payload, feat_meta, analytics = train_and_save_all(artifacts_dir=artifacts_dir)
            self.model1 = m1
            self.model2 = m2
            self.evaluation_metrics = eval_payload
            self.feature_metadata = feat_meta
            self.analytics_summary = analytics
            self.is_loaded = True
            return

        print(f"[FinPath Engine] Loading trained models and artifacts from {artifacts_dir}...")
        self.model1 = joblib.load(m1_path)
        self.model2 = joblib.load(m2_path)

        with open(eval_path, "r", encoding="utf-8") as f:
            self.evaluation_metrics = json.load(f)

        with open(meta_path, "r", encoding="utf-8") as f:
            self.feature_metadata = json.load(f)

        with open(analytics_path, "r", encoding="utf-8") as f:
            self.analytics_summary = json.load(f)

        self.is_loaded = True
        print("[FinPath Engine] Models and artifacts loaded in memory.")

    def _build_input_df(
        self,
        time: int,
        user_latency: float,
        server_latency: float,
        bank_latency: float,
        load: int,
    ) -> pd.DataFrame:
        return pd.DataFrame(
            [
                {
                    "time": int(time),
                    "user_latency": float(user_latency),
                    "server_latency": float(server_latency),
                    "bank_latency": float(bank_latency),
                    "load": int(load),
                }
            ],
            columns=FEATURES,
        )

    def predict_success(
        self,
        time: int,
        user_latency: float,
        server_latency: float,
        bank_latency: float,
        load: int,
    ) -> Dict[str, Any]:
        """Run Model 1 (Transaction Success Predictor) on validated inputs."""
        self.ensure_loaded()
        X_in = self._build_input_df(time, user_latency, server_latency, bank_latency, load)
        probs = self.model1.predict_proba(X_in)[0]
        classes = list(self.model1.classes_)

        prob_map = {int(cls): float(p) for cls, p in zip(classes, probs)}
        fail_prob = round(prob_map.get(0, 0.0), 4)
        succ_prob = round(prob_map.get(1, 1.0 - fail_prob), 4)
        predicted_class = int(self.model1.predict(X_in)[0])
        predicted_label = "Success" if predicted_class == 1 else "Failure"

        # Prediction margin / ensemble agreement estimate (not guaranteed certainty)
        dominant_prob = max(succ_prob, fail_prob)

        return {
            "predicted_class": predicted_class,
            "predicted_outcome": predicted_label,
            "success_probability": succ_prob,
            "failure_probability": fail_prob,
            "ensemble_agreement": round(dominant_prob, 4),
            "confidence_note": (
                "Probabilities reflect the proportion of decision trees in the Random Forest ensemble "
                "voting for each class on synthetic training data; they do not represent guaranteed certainty."
            ),
        }

    def predict_failure_node(
        self,
        time: int,
        user_latency: float,
        server_latency: float,
        bank_latency: float,
        load: int,
    ) -> Dict[str, Any]:
        """Run Model 2 (Failure Node Analyzer) on validated inputs."""
        self.ensure_loaded()
        X_in = self._build_input_df(time, user_latency, server_latency, bank_latency, load)
        probs = self.model2.predict_proba(X_in)[0]
        classes = [str(c) for c in self.model2.classes_]

        class_probabilities = {cls_name: round(float(p), 4) for cls_name, p in zip(classes, probs)}
        for expected in ["User", "Server", "Bank"]:
            class_probabilities.setdefault(expected, 0.0)

        predicted_node = str(self.model2.predict(X_in)[0])
        return {
            "predicted_failure_component": predicted_node,
            "class_probabilities": class_probabilities,
            "attribution_note": (
                "Model 2 estimates which component ('User', 'Server', or 'Bank') is most likely associated "
                "with a failure based on synthetic highest-latency training labels."
            ),
        }

    def analyze_parameters_vs_training(
        self,
        time: int,
        user_latency: float,
        server_latency: float,
        bank_latency: float,
        load: int,
    ) -> List[Dict[str, Any]]:
        """
        Compare each input parameter against the training dataset distribution
        (mean, std, p50, p90, p95) and explain which values are elevated.
        """
        self.ensure_loaded()
        inputs = {
            "time": float(time),
            "user_latency": float(user_latency),
            "server_latency": float(server_latency),
            "bank_latency": float(bank_latency),
            "load": float(load),
        }
        thresholds = {
            "user_latency": 70.0,
            "server_latency": 90.0,
            "bank_latency": 80.0,
            "load": 20000.0,
        }

        breakdown: List[Dict[str, Any]] = []
        for feat in FEATURES:
            val = inputs[feat]
            meta = self.feature_metadata.get(feat, {})
            mean = float(meta.get("mean", val))
            std = float(meta.get("std", 1.0)) or 1.0
            p50 = float(meta.get("p50", mean))
            p75 = float(meta.get("p75", mean))
            p90 = float(meta.get("p90", mean))
            p95 = float(meta.get("p95", mean))
            z_score = round((val - mean) / std, 2)

            if feat == "time":
                is_peak = 18 <= int(val) <= 22
                status = "Elevated (Peak Window)" if is_peak else "Normal"
                explanation = (
                    f"Hour {int(val):02d}:00 falls within the evening peak concurrency window (18:00–22:00)."
                    if is_peak
                    else f"Hour {int(val):02d}:00 is within standard operating hours."
                )
            else:
                thresh = thresholds.get(feat)
                if val >= p95 or (thresh and val > thresh * 1.12):
                    status = "Critically Elevated (>= P95)"
                elif (thresh and val > thresh) or val >= p90:
                    status = "Elevated (> Threshold / P90)"
                elif val >= p75:
                    status = "Moderately High (P75–P90)"
                else:
                    status = "Normal (< P75)"

                unit = meta.get("unit", "")
                diff_pct = round(((val - mean) / mean) * 100.0, 1) if mean else 0.0
                sign = "+" if diff_pct >= 0 else ""
                explanation = (
                    f"Input {val:g} {unit} is {sign}{diff_pct}% vs training mean ({mean:g} {unit}, "
                    f"P90={p90:g} {unit}, P95={p95:g} {unit}, z={z_score:+.2f})."
                )

            breakdown.append(
                {
                    "feature": feat,
                    "label": meta.get("label", feat),
                    "unit": meta.get("unit", ""),
                    "input_value": val,
                    "training_mean": mean,
                    "training_std": std,
                    "training_p50": p50,
                    "training_p90": p90,
                    "training_p95": p95,
                    "z_score": z_score,
                    "status": status,
                    "is_elevated": status.startswith("Elevated") or status.startswith("Critically"),
                    "explanation": explanation,
                }
            )
        return breakdown

    def full_analysis(
        self,
        time: int,
        user_latency: float,
        server_latency: float,
        bank_latency: float,
        load: int,
    ) -> Dict[str, Any]:
        """
        Execute the complete two-stage FinPath AI pipeline:
        1. Run Model 1 (Transaction Success Predictor).
        2. Run Model 2 (Failure Node Analyzer) — mandatory when Model 1 predicts failure,
           and also provided as diagnostic risk attribution when inspecting elevated conditions.
        3. Compare inputs against training distribution percentiles.
        """
        m1_res = self.predict_success(time, user_latency, server_latency, bank_latency, load)
        m2_res = self.predict_failure_node(time, user_latency, server_latency, bank_latency, load)
        param_breakdown = self.analyze_parameters_vs_training(
            time, user_latency, server_latency, bank_latency, load
        )

        is_failure_predicted = m1_res["predicted_class"] == 0
        elevated_params = [p["label"] for p in param_breakdown if p["is_elevated"]]

        if is_failure_predicted:
            summary_message = (
                f"Model 1 predicts TRANSACTION FAILURE ({m1_res['failure_probability'] * 100:.1f}% failure probability). "
                f"Model 2 identifies '{m2_res['predicted_failure_component']}' as the primary bottleneck component "
                f"({m2_res['class_probabilities'].get(m2_res['predicted_failure_component'], 0.0) * 100:.1f}% class probability)."
            )
        else:
            summary_message = (
                f"Model 1 predicts TRANSACTION SUCCESS ({m1_res['success_probability'] * 100:.1f}% success probability). "
                + (
                    f"Note: {', '.join(elevated_params)} showed elevated values relative to the training baseline."
                    if elevated_params
                    else "All operational parameters are within healthy training baselines."
                )
            )

        return {
            "inputs": {
                "time": int(time),
                "user_latency": float(user_latency),
                "server_latency": float(server_latency),
                "bank_latency": float(bank_latency),
                "load": int(load),
            },
            "model1_prediction": m1_res,
            "model2_triggered": is_failure_predicted,
            "predicted_failure_component": (
                m2_res["predicted_failure_component"] if is_failure_predicted else "None"
            ),
            "model2_prediction": m2_res,
            "parameter_breakdown": param_breakdown,
            "elevated_parameters": elevated_params,
            "summary": summary_message,
        }


ml_engine = MLEngine()

