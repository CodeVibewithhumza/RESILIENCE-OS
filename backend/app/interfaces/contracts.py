"""Interfaces defining communication boundaries between ResilienceOS modules."""

from typing import Any, Protocol


class StateEngineInterface(Protocol):
    """Contract for reading and updating hospital infrastructure state."""

    def get_resilience_breakdown(self) -> Any:
        """Return the current resilience breakdown."""
        ...

    def inject_failure(self, request: Any) -> Any:
        """Inject a failure into the hospital model."""
        ...

    def reset_to_baseline(self) -> Any:
        """Restore the hospital model to baseline state."""
        ...


class CascadeEngineInterface(Protocol):
    """Contract for propagating infrastructure failures."""

    def simulate_failure_cascade(
        self,
        request: Any,
        assets: Any,
        services: Any,
    ) -> Any:
        """Simulate failure propagation across dependent assets and services."""
        ...


class WhatIfEngineInterface(Protocol):
    """Contract for evaluating response strategies."""

    def compare_strategies(self, *args: Any, **kwargs: Any) -> Any:
        """Return strategy comparison results."""
        ...


class ExplanationEngineInterface(Protocol):
    """Contract for generating causal explanations."""

    def explain_service_risk(
        self,
        service_id: str,
        failed_asset_id: str,
    ) -> Any:
        """Explain why a service is at risk."""
        ...
