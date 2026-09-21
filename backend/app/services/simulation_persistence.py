"""Persistence helpers for ResilienceOS simulation runs."""

from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database.models.simulation_run import SimulationRun


async def persist_simulation_run(
    session: AsyncSession,
    *,
    incident_id: str,
    strategy_id: str,
    projected_resilience_score: float | None,
    result_data: dict[str, Any],
    status: str = "completed",
) -> SimulationRun:
    """Persist one simulation execution and return the saved record."""

    simulation_run = SimulationRun(
        incident_id=incident_id,
        strategy_id=strategy_id,
        executed_at=datetime.now(timezone.utc),
        projected_resilience_score=projected_resilience_score,
        result_data=result_data,
        status=status,
    )

    session.add(simulation_run)
    await session.commit()
    await session.refresh(simulation_run)

    return simulation_run


async def get_simulation_run(
    session: AsyncSession,
    simulation_id: int,
) -> SimulationRun | None:
    """Retrieve one persisted simulation run by its database ID."""

    result = await session.execute(
        select(SimulationRun).where(SimulationRun.id == simulation_id)
    )

    return result.scalar_one_or_none()
