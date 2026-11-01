# -*- coding: utf-8 -*-
"""
FinPath AI — Machine Learning Training & Artifact Pipeline
==========================================================
Trains both Random Forest models on the 200,000 synthetic transaction dataset
using stratified train/test splitting and fixed random seeds (`SEED = 42`),
evaluates performance on the held-out test sets, computes dataset-wide
operational analytics, and saves all artifacts to `ml/artifacts/`.
"""

import json
from pathlib import Path
from typing import Any, Dict, Tuple
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split

from ml.generate_data import (
    DEFAULT_NUM_TRANSACTIONS,
    FEATURES,
    SEED,
    generate_transactions_dataframe,
    set_reproducible_seeds,
)
from ml.evaluate import (
    compute_feature_metadata,
    evaluate_model1,
    evaluate_model2,
)


def compute_operational_analytics(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Compute full-dataset operational KPIs, hourly distributions, component failure
    distributions, latency breakdowns, load bucket analysis, and data-driven insights
    from the 200,000 synthetic transactions.
    """
    total_tx = int(len(df))
    success_df = df[df["success"] == 1]
    fail_df = df[df["success"] == 0]

    success_count = int(len(success_df))
    fail_count = int(len(fail_df))
    success_rate = round((success_count / total_tx) * 100.0, 2) if total_tx > 0 else 0.0
    failure_rate = round((fail_count / total_tx) * 100.0, 2) if total_tx > 0 else 0.0

    # Baseline vs peak-window historical comparison for KPI trend indicators
    off_peak_df = df[(df["time"] < 18) | (df["time"] > 22)]
    peak_df = df[(df["time"] >= 18) & (df["time"] <= 22)]

    off_peak_sr = float(off_peak_df["success"].mean() * 100.0) if len(off_peak_df) else success_rate
    peak_sr = float(peak_df["success"].mean() * 100.0) if len(peak_df) else success_rate

    avg_user_lat = round(float(df["user_latency"].mean()), 2)
    avg_server_lat = round(float(df["server_latency"].mean()), 2)
    avg_bank_lat = round(float(df["bank_latency"].mean()), 2)
    avg_load = round(float(df["load"].mean()), 0)

    fail_user_lat = round(float(fail_df["user_latency"].mean()), 2) if fail_count else avg_user_lat
    fail_server_lat = round(float(fail_df["server_latency"].mean()), 2) if fail_count else avg_server_lat
    fail_bank_lat = round(float(fail_df["bank_latency"].mean()), 2) if fail_count else avg_bank_lat
    fail_load = round(float(fail_df["load"].mean()), 0) if fail_count else avg_load

    succ_user_lat = round(float(success_df["user_latency"].mean()), 2) if success_count else avg_user_lat
    succ_server_lat = round(float(success_df["server_latency"].mean()), 2) if success_count else avg_server_lat
    succ_bank_lat = round(float(success_df["bank_latency"].mean()), 2) if success_count else avg_bank_lat
    succ_load = round(float(success_df["load"].mean()), 0) if success_count else avg_load

    # Component failure counts
    node_counts = fail_df["failed_node"].value_counts().to_dict() if fail_count else {}
    component_distribution = []
    for comp in ["Server", "Bank", "User"]:
        cnt = int(node_counts.get(comp, 0))
        pct = round((cnt / fail_count) * 100.0, 2) if fail_count > 0 else 0.0
        comp_sub = fail_df[fail_df["failed_node"] == comp]
        lat_col = f"{comp.lower()}_latency"
        component_distribution.append(
            {
                "component": comp,
                "failures": cnt,
                "percentage": pct,
                "share_of_all_tx": round((cnt / total_tx) * 100.0, 2) if total_tx > 0 else 0.0,
                "avg_latency_ overall": round(float(df[lat_col].mean()), 2),
                "avg_latency_on_failure": round(float(comp_sub[lat_col].mean()), 2) if len(comp_sub) else 0.0,
                "p95_latency": round(float(np.percentile(df[lat_col], 95)), 2),
            }
        )
    component_distribution.sort(key=lambda x: x["failures"], reverse=True)
    most_problematic_node = component_distribution[0]["component"] if component_distribution else "Server"

    # Hourly distribution (0..23) + component failure heatmap
    hourly_stats = []
    for hour in range(24):
        h_df = df[df["time"] == hour]
        h_total = int(len(h_df))
        h_succ = int((h_df["success"] == 1).sum())
        h_fail = h_total - h_succ
        h_fail_df = h_df[h_df["success"] == 0]
        h_nodes = h_fail_df["failed_node"].value_counts().to_dict() if h_fail > 0 else {}
        hourly_stats.append(
            {
                "hour": hour,
                "hour_label": f"{hour:02d}:00",
                "total": h_total,
                "successful": h_succ,
                "failed": h_fail,
                "failure_rate": round((h_fail / h_total) * 100.0, 2) if h_total > 0 else 0.0,
                "success_rate": round((h_succ / h_total) * 100.0, 2) if h_total > 0 else 0.0,
                "avg_user_latency": round(float(h_df["user_latency"].mean()), 2) if h_total else 0.0,
                "avg_server_latency": round(float(h_df["server_latency"].mean()), 2) if h_total else 0.0,
                "avg_bank_latency": round(float(h_df["bank_latency"].mean()), 2) if h_total else 0.0,
                "avg_load": round(float(h_df["load"].mean()), 0) if h_total else 0.0,
                "user_failures": int(h_nodes.get("User", 0)),
                "server_failures": int(h_nodes.get("Server", 0)),
                "bank_failures": int(h_nodes.get("Bank", 0)),
            }
        )

    peak_failure_hour_obj = max(hourly_stats, key=lambda x: x["failed"])
    peak_failure_hour = int(peak_failure_hour_obj["hour"])

    # System Load Buckets Analysis
    load_bins = [
        (10000, 13000, "10k–13k (Low)"),
        (13000, 16000, "13k–16k (Moderate)"),
        (16000, 19000, "16k–19k (Normal)"),
        (19000, 21000, "19k–21k (Elevated)"),
        (21000, 23000, "21k–23k (High)"),
        (23000, 25001, "23k–25k (Critical)"),
    ]
    load_analysis = []
    for low_b, high_b, label in load_bins:
        b_df = df[(df["load"] >= low_b) & (df["load"] < high_b)]
        b_total = int(len(b_df))
        b_succ = int((b_df["success"] == 1).sum())
        b_fail = b_total - b_succ
        load_analysis.append(
            {
                "bucket": label,
                "min_load": low_b,
                "max_load": high_b,
                "total": b_total,
                "successful": b_succ,
                "failed": b_fail,
                "failure_rate": round((b_fail / b_total) * 100.0, 2) if b_total > 0 else 0.0,
            }
        )

    # Latency distribution comparison (Successful vs Failed + Percentiles)
    latency_comparison = [
        {
            "component": "User",
            "overall_mean": avg_user_lat,
            "success_mean": succ_user_lat,
            "failure_mean": fail_user_lat,
            "p50": round(float(np.percentile(df["user_latency"], 50)), 2),
            "p90": round(float(np.percentile(df["user_latency"], 90)), 2),
            "p95": round(float(np.percentile(df["user_latency"], 95)), 2),
            "threshold": 70.0,
        },
        {
            "component": "Server",
            "overall_mean": avg_server_lat,
            "success_mean": succ_server_lat,
            "failure_mean": fail_server_lat,
            "p50": round(float(np.percentile(df["server_latency"], 50)), 2),
            "p90": round(float(np.percentile(df["server_latency"], 90)), 2),
            "p95": round(float(np.percentile(df["server_latency"], 95)), 2),
            "threshold": 90.0,
        },
        {
            "component": "Bank",
            "overall_mean": avg_bank_lat,
            "success_mean": succ_bank_lat,
            "failure_mean": fail_bank_lat,
            "p50": round(float(np.percentile(df["bank_latency"], 50)), 2),
            "p90": round(float(np.percentile(df["bank_latency"], 90)), 2),
            "p95": round(float(np.percentile(df["bank_latency"], 95)), 2),
            "threshold": 80.0,
        },
    ]

    # Data-driven insights generated dynamically from actual dataset metrics
    high_load_df = df[df["load"] > 20000]
    normal_load_df = df[df["load"] <= 20000]
    high_load_fail_rate = round(float((1.0 - high_load_df["success"].mean()) * 100.0), 2) if len(high_load_df) else 0.0
    normal_load_fail_rate = round(float((1.0 - normal_load_df["success"].mean()) * 100.0), 2) if len(normal_load_df) else 0.0

    server_elevated_diff = round(fail_server_lat - succ_server_lat, 2)
    bank_elevated_diff = round(fail_bank_lat - succ_bank_lat, 2)

    insights = [
        {
            "id": "INS-01",
            "severity": "high",
            "category": "Component Latency",
            "title": f"{most_problematic_node} component accounts for {component_distribution[0]['percentage']}% of failed transactions",
            "detail": (
                f"Across {fail_count:,} failed transactions, {most_problematic_node} exhibited the highest component latency "
                f"in {component_distribution[0]['failures']:,} cases ({component_distribution[0]['percentage']}%). "
                f"Server latency averages {fail_server_lat}ms on failed transactions versus {succ_server_lat}ms on successful ones (+{server_elevated_diff}ms)."
            ),
        },
        {
            "id": "INS-02",
            "severity": "high",
            "category": "Gateway Bottleneck",
            "title": "Bank latency is elevated in transactions experiencing failures",
            "detail": (
                f"Failed transactions show an average Bank Gateway latency of {fail_bank_lat}ms compared with {succ_bank_lat}ms "
                f"for successful completions (+{bank_elevated_diff}ms). Transactions exceeding the 80ms bank gateway threshold "
                f"exhibit significantly higher instability."
            ),
        },
        {
            "id": "INS-03",
            "severity": "medium",
            "category": "System Concurrency",
            "title": f"System load above 20,000 req/s increases failure rate from {normal_load_fail_rate}% to {high_load_fail_rate}%",
            "detail": (
                f"When concurrent load exceeds 20,000 req/s, the observed failure rate rises to {high_load_fail_rate}%, "
                f"compared with {normal_load_fail_rate}% under normal operating load (<= 20,000 req/s)."
            ),
        },
        {
            "id": "INS-04",
            "severity": "medium",
            "category": "Temporal Pattern",
            "title": f"Transaction failures peak at {peak_failure_hour:02d}:00 UTC ({peak_failure_hour_obj['failed']:,} failures)",
            "detail": (
                f"Hour {peak_failure_hour:02d}:00 recorded the highest volume of failures ({peak_failure_hour_obj['failed']:,} failed transactions, "
                f"{peak_failure_hour_obj['failure_rate']}% failure rate), coinciding with evening concurrency window (18:00–22:00)."
            ),
        },
    ]

    recommendations = [
        {
            "id": "REC-01",
            "target": "Server Infrastructure",
            "priority": "High",
            "action": "Implement auto-scaling & worker pool pre-warming above 18,500 req/s",
            "rationale": f"Server processing latency averages {fail_server_lat}ms during failures and is the primary highest-latency node ({component_distribution[0]['percentage']}%).",
        },
        {
            "id": "REC-02",
            "target": "Bank Gateway Routing",
            "priority": "High",
            "action": "Enable adaptive timeout & secondary acquirer failover when bank latency exceeds 80ms",
            "rationale": f"Bank latency rises by +{bank_elevated_diff}ms on failed transactions; proactive circuit breaking at 80ms can mitigate cascading timeouts.",
        },
        {
            "id": "REC-03",
            "target": "Traffic Shaping",
            "priority": "Medium",
            "action": f"Schedule non-urgent batch settlements outside peak hours (18:00–22:00, especially {peak_failure_hour:02d}:00)",
            "rationale": "Deferring background batch traffic reduces concurrent queue load below the 20,000 req/s instability threshold.",
        },
    ]

    return {
        "kpis": {
            "total_transactions": total_tx,
            "successful_transactions": success_count,
            "failed_transactions": fail_count,
            "success_rate": success_rate,
            "failure_rate": failure_rate,
            "avg_user_latency": avg_user_lat,
            "avg_server_latency": avg_server_lat,
            "avg_bank_latency": avg_bank_lat,
            "avg_system_load": avg_load,
            "comparisons": {
                "off_peak_success_rate": round(off_peak_sr, 2),
                "peak_window_success_rate": round(peak_sr, 2),
                "failed_vs_success_server_latency_delta": server_elevated_diff,
                "failed_vs_success_bank_latency_delta": bank_elevated_diff,
                "failed_vs_success_user_latency_delta": round(fail_user_lat - succ_user_lat, 2),
            },
        },
        "most_problematic_component": most_problematic_node,
        "peak_failure_hour": peak_failure_hour,
        "component_distribution": component_distribution,
        "hourly_distribution": hourly_stats,
        "load_analysis": load_analysis,
        "latency_comparison": latency_comparison,
        "insights": insights,
        "recommendations": recommendations,
        "disclaimer": (
            "Synthetic Dataset & Attribution Notice: All 200,000 transactions are synthetically generated "
            "for demonstration and operational modeling. Furthermore, the Failure Node label ('User', 'Server', 'Bank') "
            "is assigned using a synthetic heuristic (the component with the highest latency on a failed transaction). "
            "Observed correlations and model predictions do not establish causal root-cause attribution in live banking infrastructure."
        ),
    }


def train_and_save_all(
    artifacts_dir: str | Path | None = None,
    n_samples: int = DEFAULT_NUM_TRANSACTIONS,
    seed: int = SEED,
) -> Tuple[Any, Any, pd.DataFrame, Dict[str, Any], Dict[str, Any], Dict[str, Any]]:
    """
    Execute the complete FinPath AI machine learning pipeline:
    1. Generate 200,000 synthetic transactions (vectorized, reproducible).
    2. Train Model 1 (Transaction Success Predictor) with stratified train/test split.
    3. Train Model 2 (Failure Node Analyzer) on failed transactions with stratified split.
    4. Evaluate both models on held-out test sets.
    5. Compute feature distribution metadata and operational analytics.
    6. Persist models and JSON artifacts to disk.
    """
    set_reproducible_seeds(seed)
    if artifacts_dir is None:
        artifacts_dir = Path(__file__).resolve().parent / "artifacts"
    else:
        artifacts_dir = Path(artifacts_dir)
    artifacts_dir.mkdir(parents=True, exist_ok=True)

    print(f"[FinPath ML] Generating {n_samples:,} synthetic transactions (seed={seed})...")
    df = generate_transactions_dataframe(n_samples=n_samples, seed=seed)

    # ---------------------------------------------------------
    # MODEL 1: Transaction Success Predictor (0=Failure, 1=Success)
    # ---------------------------------------------------------
    X = df[FEATURES]
    y = df["success"]

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.20,
        random_state=seed,
        stratify=y,
    )

    print("[FinPath ML] Training Model 1 (Transaction Success Predictor)...")
    model1 = RandomForestClassifier(
        n_estimators=100,
        max_depth=14,
        min_samples_split=10,
        class_weight="balanced_subsample",
        random_state=seed,
        n_jobs=-1,
    )
    model1.fit(X_train, y_train)

    # ---------------------------------------------------------
    # MODEL 2: Failure Node Analyzer (User, Server, Bank)
    # ---------------------------------------------------------
    fail_df = df[df["success"] == 0].copy()
    X2 = fail_df[FEATURES]
    y2 = fail_df["failed_node"]

    X2_train, X2_test, y2_train, y2_test = train_test_split(
        X2,
        y2,
        test_size=0.20,
        random_state=seed,
        stratify=y2,
    )

    print("[FinPath ML] Training Model 2 (Failure Node Analyzer)...")
    model2 = RandomForestClassifier(
        n_estimators=100,
        max_depth=14,
        min_samples_split=8,
        class_weight="balanced_subsample",
        random_state=seed,
        n_jobs=-1,
    )
    model2.fit(X2_train, y2_train)

    # ---------------------------------------------------------
    # Evaluate both models & compute metadata
    # ---------------------------------------------------------
    print("[FinPath ML] Evaluating models on held-out stratified test sets...")
    m1_metrics = evaluate_model1(model1, X_test, y_test, X_train, y_train)
    m2_metrics = evaluate_model2(model2, X2_test, y2_test, X2_train, y2_train)

    evaluation_payload = {
        "random_state": seed,
        "dataset_size": int(len(df)),
        "test_split_ratio": 0.20,
        "stratified_split": True,
        "class_imbalance_explanation": (
            "In payment processing, successful transactions outnumber failures (~88% vs ~12%). "
            "Because of this class imbalance, a naive classifier predicting 'Success' for every "
            "transaction would still achieve ~88% accuracy while catching 0% of failures. "
            "Therefore, Precision, Recall, F1 Score on the Failure class, and balanced class weights "
            "are essential for evaluating operational utility."
        ),
        "model1": m1_metrics,
        "model2": m2_metrics,
    }

    feature_metadata = compute_feature_metadata(X_train)
    analytics_summary = compute_operational_analytics(df)

    # Save artifacts
    joblib.dump(model1, artifacts_dir / "model1_success.joblib", compress=3)
    joblib.dump(model2, artifacts_dir / "model2_failure_node.joblib", compress=3)

    with open(artifacts_dir / "evaluation_metrics.json", "w", encoding="utf-8") as f:
        json.dump(evaluation_payload, f, indent=2)

    with open(artifacts_dir / "feature_metadata.json", "w", encoding="utf-8") as f:
        json.dump(feature_metadata, f, indent=2)

    with open(artifacts_dir / "analytics_summary.json", "w", encoding="utf-8") as f:
        json.dump(analytics_summary, f, indent=2)

    print(
        f"[FinPath ML] Complete! Model 1 Acc={m1_metrics['accuracy']:.4f} "
        f"(F1 Macro={m1_metrics['f1_macro']:.4f}), "
        f"Model 2 Acc={m2_metrics['accuracy']:.4f} "
        f"(F1 Macro={m2_metrics['f1_macro']:.4f})"
    )
    return model1, model2, df, evaluation_payload, feature_metadata, analytics_summary


if __name__ == "__main__":
    train_and_save_all()

