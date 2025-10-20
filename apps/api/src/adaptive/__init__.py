"""
Adaptive Questioning Module - Story 4.5

IRT-based adaptive assessment with real-time difficulty adjustment.
Uses scipy for statistical computations (2PL IRT model).
"""

from .models import (
    NextQuestionRequest,
    NextQuestionResponse,
    SessionMetricsResponse,
    IRTMetrics,
    EfficiencyMetrics,
)
from .irt_engine import IRTEngine
from .question_selector import QuestionSelector
from .routes import router

__all__ = [
    "NextQuestionRequest",
    "NextQuestionResponse",
    "SessionMetricsResponse",
    "IRTMetrics",
    "EfficiencyMetrics",
    "IRTEngine",
    "QuestionSelector",
    "router",
]
