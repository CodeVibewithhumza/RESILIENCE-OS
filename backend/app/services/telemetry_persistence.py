"""Persistence helpers for ResilienceOS telemetry records."""

from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from database.models.telemetry_record import TelemetryRecord
from models.telemetry import HospitalTelemetrySnapshot


def snapshot_to_records(
    snapshot: HospitalTelemetrySnapshot,
) -> list[TelemetryRecord]:
    """Convert a telemetry snapshot into database records."""

    timestamp = snapshot.timestamp or datetime.now(timezone.utc)

    telemetry_mapping = [
        ("GRID_MAIN", "grid_voltage", snapshot.grid_voltage_v, "V"),
        ("GRID_MAIN", "grid_frequency", snapshot.grid_frequency_hz, "Hz"),
        ("GRID_MAIN", "grid_power", snapshot.grid_power_kw, "kW"),
        ("GEN_01", "generator_power", snapshot.generator_1_kw, "kW"),
        ("GEN_01", "fuel_level", snapshot.generator_1_fuel_pct, "%"),
        ("GEN_02", "generator_power", snapshot.generator_2_kw, "kW"),
        ("GEN_02", "fuel_level", snapshot.generator_2_fuel_pct, "%"),
        ("UPS_CRITICAL", "load", snapshot.ups_load_kw, "kW"),
        ("UPS_CRITICAL", "battery_level", snapshot.ups_battery_pct, "%"),
        (
            "UPS_CRITICAL",
            "estimated_runtime",
            snapshot.ups_estimated_runtime_min,
            "min",
        ),
        (
            "CHILLER_PLANT",
            "cooling_output",
            snapshot.chiller_cooling_output_kw,
            "kW",
        ),
        ("CHILLER_PLANT", "temperature", snapshot.chiller_temp_c, "°C"),
        ("OXYGEN_MANIFOLD", "pressure", snapshot.oxygen_manifold_psi, "psi"),
        (
            "OXYGEN_MANIFOLD",
            "reserve",
            snapshot.oxygen_reserve_hours,
            "hours",
        ),
        (
            "WATER_PUMP_STATION",
            "pressure",
            snapshot.water_pump_pressure_psi,
            "psi",
        ),
        (
            "WATER_PUMP_STATION",
            "tank_level",
            snapshot.water_tank_level_pct,
            "%",
        ),
        ("MAIN_BUS", "load", snapshot.non_critical_load_kw, "kW"),
        ("EMERGENCY_BUS", "load", snapshot.critical_load_kw, "kW"),
    ]

    return [
        TelemetryRecord(
            timestamp=timestamp,
            asset_id=asset_id,
            metric=metric,
            value=value,
            unit=unit,
        )
        for asset_id, metric, value, unit in telemetry_mapping
    ]


async def persist_snapshot(
    session: AsyncSession,
    snapshot: HospitalTelemetrySnapshot,
) -> int:
    """Persist one telemetry snapshot and return inserted record count."""

    records = snapshot_to_records(snapshot)

    session.add_all(records)
    await session.commit()

    return len(records)


async def get_recent_records(
    session: AsyncSession,
    limit: int = 100,
) -> list[TelemetryRecord]:
    """Retrieve the most recent persisted telemetry records."""

    from sqlalchemy import select

    result = await session.execute(
        select(TelemetryRecord)
        .order_by(TelemetryRecord.timestamp.desc(), TelemetryRecord.id.desc())
        .limit(limit)
    )

    return list(result.scalars().all())
