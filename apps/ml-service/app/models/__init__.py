"""
Pydantic V2 Models for API Request/Response

All models use Pydantic V2 with strict validation and type safety.
"""

from app.models.predictions import (
    PredictionRequest,
    PredictionResponse,
    PredictionDetail,
    AlertResponse
)
from app.models.interventions import (
    InterventionResponse,
    InterventionApplyRequest,
    InterventionApplyResponse
)
from app.models.feedback import (
    FeedbackRequest,
    FeedbackResponse
)
from app.models.analytics import (
    ModelPerformanceResponse,
    StruggleReductionResponse,
    TimelinePoint
)

__all__ = [
    "PredictionRequest",
    "PredictionResponse",
    "PredictionDetail",
    "AlertResponse",
    "InterventionResponse",
    "InterventionApplyRequest",
    "InterventionApplyResponse",
    "FeedbackRequest",
    "FeedbackResponse",
    "ModelPerformanceResponse",
    "StruggleReductionResponse",
    "TimelinePoint",
]
