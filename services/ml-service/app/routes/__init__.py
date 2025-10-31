"""Route modules exposed by the Americano ML service."""

from .health import router as health_router
from .interventions import router as interventions_router
from .model_performance import router as model_performance_router
from .predictions import router as predictions_router
from .predictions_feedback import router as predictions_feedback_router
from .predictions_generate import router as predictions_generate_router
from .struggle_reduction import router as struggle_reduction_router

__all__ = [
    "health_router",
    "interventions_router",
    "model_performance_router",
    "predictions_router",
    "predictions_feedback_router",
    "predictions_generate_router",
    "struggle_reduction_router",
]

