# Backend Dockerfile for ResilienceOS (Cross-platform x86_64 and ARM64 / Apple Silicon support)
FROM python:3.11-slim

WORKDIR /app

# Install system build dependencies and networking tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency definition and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend and supporting engine modules
COPY backend ./backend
COPY simulation ./simulation
COPY graph ./graph
COPY models ./models
COPY database ./database
COPY config ./config
COPY scenarios ./scenarios
COPY docs ./docs

# Set python path to root so all internal modules resolve cleanly
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
