import asyncio
import logging
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.pool import NullPool

from backend.app.config import settings
from database.base import Base

import database.models  # noqa: F401

logger = logging.getLogger(__name__)

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    poolclass=NullPool,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def init_db(max_retries: int = 5, retry_delay: float = 2.0) -> None:
    """Initialize database tables with connection retry logic for Docker and container startups."""
    for attempt in range(1, max_retries + 1):
        try:
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            logger.info("Database schema initialized successfully.")
            return
        except Exception as e:
            if attempt < max_retries:
                logger.warning(
                    f"Database connection attempt {attempt}/{max_retries} failed: {e}. "
                    f"Retrying in {retry_delay}s..."
                )
                await asyncio.sleep(retry_delay)
            else:
                logger.error(
                    f"Could not connect to database at {settings.DATABASE_URL} after {max_retries} attempts: {e}. "
                    "Operating with in-memory state coordinators."
                )


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session