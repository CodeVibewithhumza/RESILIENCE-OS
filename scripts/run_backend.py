import sys
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

import uvicorn
from backend.app.config import settings

if __name__ == "__main__":
    print(f"[ResilienceOS] Starting Backend Server on http://{settings.HOST}:{settings.PORT} ...")
    uvicorn.run("backend.app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
