"""FastAPI Application Entrypoint for ResilienceOS."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.config import settings
from backend.app.api.hospital import router as hospital_router
from backend.app.api.simulation import router as simulation_router
from backend.app.api.graph import router as graph_router
from backend.app.api.websocket import router as websocket_router

from contextlib import asynccontextmanager

from database.session import init_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(
    title="ResilienceOS API",
    description="AI-Powered Intelligent Hospital Digital Twin for Infrastructure Resilience Decision Support",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS for frontend dashboard and 3D canvas
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routes
app.include_router(hospital_router, prefix="/api")
app.include_router(simulation_router, prefix="/api")
app.include_router(graph_router, prefix="/api")
app.include_router(websocket_router)

@app.get("/")
def root():
    return {
        "name": "ResilienceOS API",
        "status": "online",
        "version": "1.0.0",
        "docs_url": "/docs",
        "mission": "Hospital Infrastructure Resilience & Decision Support Digital Twin"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
