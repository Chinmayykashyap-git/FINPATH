FROM python:3.11-slim

WORKDIR /workspace

# Install system dependencies for building scientific / DB packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt /workspace/backend/requirements.txt
RUN pip install --no-cache-dir -r /workspace/backend/requirements.txt

# Copy ML package and Backend application
COPY ml /workspace/ml
COPY backend /workspace/backend

ENV PYTHONPATH="/workspace:/workspace/backend"
ENV PYTHONUNBUFFERED=1

# Ensure ML artifacts are generated at build time if not already present
RUN python -m ml.train

WORKDIR /workspace/backend
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

