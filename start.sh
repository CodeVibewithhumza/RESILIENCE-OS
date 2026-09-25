#!/usr/bin/env bash
# =========================================================================
#  ResilienceOS — macOS / Linux One-Click Full-Stack Launcher
# =========================================================================

set -e

echo "========================================================================="
echo "   RESILIENCE OS — HOSPITAL INFRASTRUCTURE DIGITAL TWIN"
echo "   AI Decision Support, Cascade Simulation & 3D Spatial Twin"
echo "========================================================================="
echo ""

# Verify Python
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] python3 could not be found. Please install Python 3.10+."
    exit 1
fi

# Verify Node.js
if ! command -v node &> /dev/null; then
    echo "[ERROR] node could not be found. Please install Node.js 18+."
    exit 1
fi

# 1. Install frontend dependencies if missing
if [ ! -d "frontend/node_modules" ]; then
    echo "[1/3] Installing frontend dependencies..."
    (cd frontend && npm install)
fi

echo "[2/3] Starting FastAPI Backend on http://127.0.0.1:8000 ..."
python3 scripts/run_backend.py &
BACKEND_PID=$!

echo "[3/3] Starting Vite Frontend on http://localhost:5173 ..."
(cd frontend && npm run dev) &
FRONTEND_PID=$!

cleanup() {
    echo ""
    echo "[INFO] Shutting down ResilienceOS services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM

echo ""
echo "========================================================================="
echo "   RESILIENCE OS IS NOW RUNNING!"
echo "   - Frontend Command Center: http://localhost:5173"
echo "   - Backend OpenAPI Swagger: http://127.0.0.1:8000/docs"
echo "   - Live State Endpoint:     http://127.0.0.1:8000/api/hospital/state"
echo "========================================================================="
echo "Press Ctrl+C to stop all services."
echo ""

wait
