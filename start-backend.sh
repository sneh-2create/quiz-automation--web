#!/usr/bin/env bash
# Install Python deps (including pandas), then start FastAPI on port 8000.
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT/backend"
echo "Installing backend dependencies (pandas, etc.)..."
python3 -m pip install -r requirements.txt
echo "Starting API on http://0.0.0.0:8000 ..."
exec uvicorn main:app --reload --host 0.0.0.0 --port 8000
