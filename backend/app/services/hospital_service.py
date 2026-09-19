"""Singleton instance provider for HospitalStateEngine."""
from simulation.state_engine import HospitalStateEngine

# Shared in-memory instance for API requests and WebSockets
state_engine = HospitalStateEngine()

def get_state_engine() -> HospitalStateEngine:
    return state_engine
