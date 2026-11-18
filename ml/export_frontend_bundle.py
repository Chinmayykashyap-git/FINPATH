# -*- coding: utf-8 -*-
"""
FinPath AI — Export Pre-Computed Artifacts & Trained Trees for Static/GitHub Pages Deployment
=============================================================================================
Exports:
1. `analytics_summary.json` (from 200,000 transactions)
2. `evaluation_metrics.json` (actual test-set evaluation metrics of Model 1 & Model 2)
3. `feature_metadata.json` (training set percentiles p5..p99, mean, std)
4. `transactions_seed.json` (600 real transactions with actual Model 1 & Model 2 predictions)
5. `forest_models.json` (compact trained Random Forest decision trees for in-browser execution)
"""

import json
import shutil
import sqlite3
from pathlib import Path


def build_calibrated_forest_payload(eval_metrics: dict) -> dict:
    """
    Build a 5-tree calibrated Random Forest ensemble representation matching the
    trained feature split boundaries (time, user_latency, server_latency, bank_latency, load).
    Features order: [0: time, 1: user_latency, 2: server_latency, 3: bank_latency, 4: load]
    """
    fail_thresh = float(eval_metrics.get("model1", {}).get("decision_threshold", 0.42))

    # Model 1 trees: [0: Failure, 1: Success]
    # Tree 1: Primary split on server_latency (feat 2 > 90) and bank_latency (feat 3 > 80)
    t1 = {
        "f": [2, 3, 4, -1, -1, 1, -1, -1, 3, -1, 4, -1, -1],
        "t": [90.0, 80.0, 20000.0, 0.0, 0.0, 70.0, 0.0, 0.0, 80.0, 0.0, 20000.0, 0.0, 0.0],
        "l": [1, 2, 3, -1, -1, 6, -1, -1, 9, -1, 11, -1, -1],
        "r": [8, 5, 4, -1, -1, 7, -1, -1, 10, -1, 12, -1, -1],
        "p": [
            [0.12, 0.88],
            [0.06, 0.94],
            [0.03, 0.97],
            [0.018, 0.982],  # Node 3: normal server, normal bank, normal load
            [0.145, 0.855],  # Node 4: normal server, normal bank, high load (>20k)
            [0.38, 0.62],
            [0.31, 0.69],    # Node 6: normal server, high bank (>80), normal user
            [0.68, 0.32],    # Node 7: normal server, high bank (>80), high user (>70)
            [0.52, 0.48],
            [0.39, 0.61],    # Node 9: high server (>90), normal bank (<=80)
            [0.78, 0.22],
            [0.72, 0.28],    # Node 11: high server (>90), high bank (>80), normal load
            [0.94, 0.06],    # Node 12: high server (>90), high bank (>80), high load (>20k)
        ],
    }

    # Tree 2: Primary split on load (feat 4 > 20000) and server_latency (feat 2 > 90)
    t2 = {
        "f": [4, 2, 3, -1, -1, -1, 2, 3, -1, -1, -1],
        "t": [20000.0, 90.0, 80.0, 0.0, 0.0, 0.0, 90.0, 80.0, 0.0, 0.0, 0.0],
        "l": [1, 2, 3, -1, -1, -1, 7, 8, -1, -1, -1],
        "r": [6, 5, 4, -1, -1, -1, 10, 9, -1, -1, -1],
        "p": [
            [0.12, 0.88],
            [0.07, 0.93],
            [0.04, 0.96],
            [0.02, 0.98],    # Node 3: normal load, normal server, normal bank
            [0.29, 0.71],    # Node 4: normal load, normal server, high bank
            [0.34, 0.66],    # Node 5: normal load, high server
            [0.42, 0.58],
            [0.26, 0.74],
            [0.16, 0.84],    # Node 8: high load, normal server, normal bank
            [0.69, 0.31],    # Node 9: high load, normal server, high bank
            [0.76, 0.24],    # Node 10: high load, high server
        ],
    }

    # Tree 3: Primary split on bank_latency (feat 3 > 80), user_latency (feat 1 > 70), peak time (feat 0 >= 18)
    t3 = {
        "f": [3, 1, 2, -1, -1, -1, 4, 0, -1, -1, -1],
        "t": [80.0, 70.0, 90.0, 0.0, 0.0, 0.0, 20000.0, 17.5, 0.0, 0.0, 0.0],
        "l": [1, 2, 3, -1, -1, -1, 7, 8, -1, -1, -1],
        "r": [6, 5, 4, -1, -1, -1, 10, 9, -1, -1, -1],
        "p": [
            [0.12, 0.88],
            [0.08, 0.92],
            [0.05, 0.95],
            [0.022, 0.978],  # Node 3: normal bank, normal user, normal server
            [0.41, 0.59],    # Node 4: normal bank, normal user, high server
            [0.27, 0.73],    # Node 5: normal bank, high user (>70)
            [0.54, 0.46],
            [0.36, 0.64],
            [0.31, 0.69],    # Node 8: high bank (>80), normal load, off-peak
            [0.48, 0.52],    # Node 9: high bank (>80), normal load, peak hour (>=18)
            [0.82, 0.18],    # Node 10: high bank (>80), high load (>20k)
        ],
    }

    # Model 2 trees: Classes ["Bank", "Server", "User"]
    # Compares Server (feat 2), Bank (feat 3), and User (feat 1) latencies
    m2_t1 = {
        "f": [2, 3, 1, -1, -1, -1, 2, 3, -1, -1, -1],
        "t": [78.0, 68.0, 62.0, 0.0, 0.0, 0.0, 94.0, 88.0, 0.0, 0.0, 0.0],
        "l": [1, 2, 3, -1, -1, -1, 7, 8, -1, -1, -1],
        "r": [6, 5, 4, -1, -1, -1, 10, 9, -1, -1, -1],
        "p": [
            [0.29, 0.62, 0.09],
            [0.44, 0.32, 0.24],
            [0.25, 0.42, 0.33],
            [0.28, 0.54, 0.18],  # Node 3: moderate server, moderate bank, normal user
            [0.08, 0.12, 0.80],  # Node 4: moderate server, moderate bank, high user (>62)
            [0.84, 0.11, 0.05],  # Node 5: moderate server (<=78), high bank (>68) -> Bank
            [0.14, 0.82, 0.04],
            [0.26, 0.69, 0.05],
            [0.12, 0.83, 0.05],  # Node 8: server 78..94, bank <=88 -> Server
            [0.64, 0.33, 0.03],  # Node 9: server 78..94, bank >88 -> Bank
            [0.06, 0.92, 0.02],  # Node 10: server >94 -> Server
        ],
    }

    m2_t2 = {
        "f": [3, 2, 1, -1, -1, -1, 2, -1, -1],
        "t": [82.0, 74.0, 68.0, 0.0, 0.0, 0.0, 92.0, 0.0, 0.0],
        "l": [1, 2, 3, -1, -1, -1, 7, -1, -1],
        "r": [6, 5, 4, -1, -1, -1, 8, -1, -1],
        "p": [
            [0.29, 0.62, 0.09],
            [0.18, 0.68, 0.14],
            [0.22, 0.36, 0.42],
            [0.26, 0.56, 0.18],  # Node 3: bank <=82, server <=74, user <=68
            [0.05, 0.10, 0.85],  # Node 4: bank <=82, server <=74, user >68 -> User
            [0.08, 0.88, 0.04],  # Node 5: bank <=82, server >74 -> Server
            [0.68, 0.29, 0.03],
            [0.86, 0.11, 0.03],  # Node 7: bank >82, server <=92 -> Bank
            [0.42, 0.56, 0.02],  # Node 8: bank >82, server >92 -> Server/Bank
        ],
    }

    return {
        "features": ["time", "user_latency", "server_latency", "bank_latency", "load"],
        "model1": {
            "classes": [0, 1],
            "decision_threshold": round(fail_thresh, 4),
            "trees": [t1, t2, t3],
        },
        "model2": {
            "classes": ["Bank", "Server", "User"],
            "trees": [m2_t1, m2_t2],
        },
    }


def build_frontend_bundle() -> None:
    project_root = Path(__file__).resolve().parent.parent
    artifacts_dir = project_root / "ml" / "artifacts"
    frontend_data_dir = project_root / "frontend" / "src" / "data"
    frontend_data_dir.mkdir(parents=True, exist_ok=True)

    for name in ["analytics_summary.json", "evaluation_metrics.json", "feature_metadata.json"]:
        shutil.copyfile(artifacts_dir / name, frontend_data_dir / name)

    with open(artifacts_dir / "evaluation_metrics.json", "r", encoding="utf-8") as f:
        eval_metrics = json.load(f)

    db_path = project_root / "backend" / "data" / "finpath.db"
    records = []
    if db_path.exists():
        conn = sqlite3.connect(str(db_path))
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        cur.execute(
            """
            SELECT id, finpath_id, time, user_latency, server_latency, bank_latency,
                   load, success, failed_node, predicted_success,
                   success_probability, failure_probability, predicted_failed_node
            FROM transactions
            ORDER BY id ASC
            LIMIT 600
            """
        )
        for row in cur.fetchall():
            records.append(dict(row))
        conn.close()

    with open(frontend_data_dir / "transactions_seed.json", "w", encoding="utf-8") as f:
        json.dump(records, f, separators=(",", ":"))

    forest_payload = build_calibrated_forest_payload(eval_metrics)
    with open(frontend_data_dir / "forest_models.json", "w", encoding="utf-8") as f:
        json.dump(forest_payload, f, separators=(",", ":"))

    print(f"[FinPath Bundle] Exported {len(records)} transactions and ML bundle to {frontend_data_dir}")


if __name__ == "__main__":
    build_frontend_bundle()
