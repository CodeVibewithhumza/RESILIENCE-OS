@echo off
TITLE ResilienceOS Launcher
COLOR 0B

echo =========================================================================
echo    RESILIENCE OS - HOSPITAL INFRASTRUCTURE DIGITAL TWIN
echo    AI Decision Support, Cascade Simulation & 3D Spatial Twin
echo =========================================================================
echo.

:: Verify Python installation
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python is not found in PATH. Please install Python 3.10+ and add it to PATH.
    pause
    exit /b 1
)

:: Verify Node.js installation
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not found in PATH. Please install Node.js 18+ and add it to PATH.
    pause
    exit /b 1
)

echo [1/3] Checking dependencies...
if not exist "frontend\node_modules\" (
    echo [INFO] Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
)

echo [2/3] Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "ResilienceOS Backend" cmd /k "python scripts/run_backend.py"

echo [3/3] Starting Vite Frontend on http://localhost:5173 ...
start "ResilienceOS Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo =========================================================================
echo    RESILIENCE OS IS NOW RUNNING!
echo    - Frontend Command Center: http://localhost:5173
echo    - Backend OpenAPI Swagger: http://127.0.0.1:8000/docs
echo    - Live State Endpoint:     http://127.0.0.1:8000/api/hospital/state
echo =========================================================================
echo.
echo Close the respective terminal windows to terminate the services.
echo.
