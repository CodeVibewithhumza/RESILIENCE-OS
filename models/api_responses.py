"""API response models for ResilienceOS."""

from pydantic import BaseModel, Field

from models.incident import IncidentState
from models.resilience import ResilienceIndexBreakdown


class ResetHospitalResponse(BaseModel):
    status: str
    message: str
    resilience_index: float = Field(..., ge=0.0, le=100.0)


class FailureInjectionResponse(BaseModel):
    status: str
    incident: IncidentState
    resilience_index: ResilienceIndexBreakdown
    message: str