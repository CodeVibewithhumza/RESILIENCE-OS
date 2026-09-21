from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, Float, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column

from database.base import Base


class SimulationRun(Base):
    """PostgreSQL model for ResilienceOS simulation execution records."""

    __tablename__ = "simulation_runs"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )
    incident_id: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )
    strategy_id: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )
    executed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    projected_resilience_score: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )
    result_data: Mapped[dict[str, Any] | None] = mapped_column(
        JSON,
        nullable=True,
    )
    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="completed",
    )
