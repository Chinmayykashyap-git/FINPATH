# FinPath AI — Enterprise Transaction Intelligence & Failure Prediction Platform

> **An AI-powered transaction intelligence and failure prediction platform that analyzes transaction performance, predicts transaction success, identifies potential failure points, and generates actionable operational insights.**

---

## 1. Executive Overview

**FinPath AI** transforms a 200,000-row synthetic financial transaction telemetry dataset and a dual-stage Scikit-Learn **Random Forest** machine learning pipeline into a full-stack enterprise SaaS application:

1. **Model 1 — Transaction Success Predictor (`RandomForestClassifier`)**:
   - Evaluates 5 real-time telemetry parameters (`time`, `user_latency`, `server_latency`, `bank_latency`, `load`) to estimate the probability of transaction completion (`1 = Success`, `0 = Failure`).
2. **Model 2 — Failure Node Analyzer (`RandomForestClassifier`)**:
   - For transactions predicted to fail (or under diagnostic inspection), estimates class probabilities across the three infrastructure nodes (`User`, `Server`, `Bank`) to isolate the primary bottleneck layer.

### Methodological & Synthetic Data Transparency
- **Synthetic Dataset Disclosure**: All 200,000 initial transactions are synthetically generated (`SEED = 42`) for operational modeling and demonstration.
- **Failure-Node Heuristic Disclosure**: In this synthetic dataset, failed transactions are labeled with the component (`User`, `Server`, or `Bank`) exhibiting the highest latency during the transaction. This is clearly documented throughout the UI as a synthetic labeling rule rather than verified production distributed-trace root-cause attribution.

---

## 2. Engineering Improvements Over Original Prototype (`fin_path.py`)

| Area | Original Prototype (`fin_path.py`) | Production Implementation (`ml/` & `backend/`) |
| :--- | :--- | :--- |
| **Data Generation Speed** | List comprehension + `DataFrame.apply()` over 200,000 rows (~45s) | Fully vectorized NumPy array operations (~0.4s) |
| **Seed Reproducibility** | Only `np.random.seed(42)` set (`random.randint` unseeded) | Both `random.seed(42)`, `np.random.seed(42)`, and `default_rng(42)` fixed |
| **Failure Probability Logic** | Max failure probability capped at `0.14` (`assign_failure`), causing severe class starvation | Vectorized threshold + continuous excess severity scaling clamped to `[0.005, 0.985]` |
| **Train/Test Splitting** | Unseeded, unstratified `train_test_split(X, y, test_size=0.2)` | Stratified `train_test_split(..., stratify=y, random_state=42)` |
| **Class Imbalance** | Default unweighted Random Forest | `class_weight="balanced_subsample"` with Precision, Recall, F1, Confusion Matrices |
| **Model Persistence** | Retrained from scratch on every script execution | Saved via `joblib` (`model1_success.joblib`, `model2_failure_node.joblib`) and loaded once at FastAPI startup |

---

## 3. Project Structure

```text
finpath-ai/
├── frontend/                       # React 18 + Vite + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── components/             # InfoTooltip, TransactionDrawer
│   │   ├── contexts/               # AuthContext (JWT session persistence)
│   │   ├── layouts/                # DashboardLayout (Collapsible sidebar + topbar)
│   │   ├── pages/                  # Login, Overview, Monitor, Predictions, Failure Intel, Bank Insights, Simulator, Model Performance, Settings
│   │   ├── services/               # Typed REST API client + CSV export handler
│   │   └── types/                  # TypeScript interfaces
│   ├── Dockerfile                  # Multi-stage Node 20 build -> Nginx 1.27 alpine
│   ├── nginx.conf                  # SPA routing + reverse proxy to FastAPI
│   └── package.json
├── backend/                        # Python FastAPI + SQLAlchemy 2.0 + Scikit-Learn
│   ├── app/
│   │   ├── api/routes/             # auth, dashboard, transactions, predictions, insights, models, simulator
│   │   ├── core/                   # config.py, security.py (bcrypt + JWT)
│   │   ├── database/               # session.py, init_db.py (SQLite / PostgreSQL ready)
│   │   ├── ml/                     # engine.py (Singleton joblib loader & live inference)
│   │   ├── models/                 # User & Transaction SQLAlchemy ORM models
│   │   ├── schemas/                # Pydantic v2 request/response validation schemas
│   │   └── main.py                 # FastAPI entrypoint + Swagger docs + /health
│   ├── Dockerfile
│   └── requirements.txt
├── ml/                             # Reproducible ML Pipeline
│   ├── generate_data.py            # Vectorized 200,000 transaction generator
│   ├── train.py                    # Stratified training + artifact persistence
│   ├── evaluate.py                 # Precision, Recall, F1, Confusion Matrix, Feature Metadata
│   └── artifacts/                  # Saved .joblib models & JSON evaluation metrics
├── FinPath_AI_Colab_Builder.ipynb  # Complete Google Colab execution & packaging notebook
├── docker-compose.yml              # One-command full-stack container orchestration
├── .env.example                    # Production environment variable template
└── README.md
```

---

## 4. Quick Start — Running with Docker Compose (Recommended)

1. Copy the environment template:
   ```bash
   cp .env.example .env
   ```
2. Build and start both containers:
   ```bash
   docker compose up --build
   ```
3. Access the application:
   - **Frontend Web App**: http://localhost:3000
   - **Backend FastAPI Swagger UI**: http://localhost:8000/docs
   - **Health Check**: http://localhost:8000/health

---

## 5. Running Locally Without Docker

### Step 1: Train Models & Start the FastAPI Backend
```bash
# From the repository root
pip install -r backend/requirements.txt

# Train both Random Forest models on 200,000 synthetic transactions and save artifacts
python -m ml.train

# Start the FastAPI server (auto-seeds SQLite database on first startup)
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Step 2: Start the React + Vite Frontend
```bash
cd frontend
npm install
npm run dev
```
Open http://localhost:5173 in your browser. Click **"Launch Interactive Demo Workspace"** on the login screen or register a new analyst account.

---

## 6. Cloud Deployment Guide (Render / Railway / AWS / DigitalOcean)

### Required Production Environment Variables
Configure the following variables in your cloud provider dashboard:
- `JWT_SECRET_KEY`: Generate a strong 64-character secret (`openssl rand -hex 32`).
- `ENVIRONMENT`: `production`
- `DATABASE_URL`:
  - For managed **PostgreSQL** (recommended in production):
    `postgresql+psycopg2://USER:PASSWORD@HOST:5432/DBNAME`
  - For persistent **SQLite** volume:
    `sqlite:////workspace/backend/data/finpath.db`
- `CORS_ORIGINS`: Comma-separated list of allowed frontend domains (e.g., `https://finpath-ai.yourdomain.com`).

### Deploying on Render or Railway
1. **Backend Service**:
   - Point to `backend/Dockerfile` with build context at the repository root (`.`).
   - Set health check path to `/health`.
   - Attach a managed PostgreSQL database (set `DATABASE_URL`) or mount a persistent disk at `/workspace/backend/data`.
2. **Frontend Service**:
   - Point to `frontend/Dockerfile` (or deploy as a Static Site with build command `npm install && npm run build`, publish directory `dist`, and `VITE_API_BASE_URL=https://your-backend-service.onrender.com`).
3. Never commit `.env` or expose `JWT_SECRET_KEY` in frontend environment variables (`VITE_*`).

