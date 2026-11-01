# -*- coding: utf-8 -*-
"""FinPath AI — Local Server Launcher."""

import os
import sys
from pathlib import Path
import uvicorn

ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "backend"

sys.path.insert(0, str(ROOT_DIR))
sys.path.insert(0, str(BACKEND_DIR))
os.chdir(str(BACKEND_DIR))

if __name__ == "__main__":
    print("Starting FinPath AI on http://localhost:8000 ...")
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, log_level="info")

