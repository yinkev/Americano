"""Shared request and response schemas for the Americano ML service."""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import List, Literal, Optional

from pydantic import BaseModel, Field


class PredictionStatus(str, Enum):
    """Lifecycle states for predictions shared with the web tier."""

    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    FALSE_POSITIVE = "FALSE_POSITIVE"
    MISSED = "MISSED"


class Prediction(BaseModel):
    """Detailed information for a struggle prediction."""

    id: str
    userId: str
    learningObjectiveId: str
    topicId: str
    predictionDate: datetime
    predictedStruggleProbability: float = Field(ge=0, le=1)
    predictionConfidence: float = Field(ge=0, le=1)
    predictionStatus: PredictionStatus
    actualOutcome: Optional[str] = None


class PredictionsResponse(BaseModel):
    """Envelope returned by ``GET /predictions``."""

    success: bool
    dataSource: Literal["mock"]
    count: int
    predictions: List[Prediction]


class PredictionGenerationRequest(BaseModel):
    """Payload accepted by ``POST /predictions/generate``."""

    userId: str
    daysAhead: Optional[int] = Field(default=None, ge=1, le=30)


class PredictionAlert(BaseModel):
    """Alert generated as part of prediction runs."""

    id: str
    type: str
    message: str
    priority: int


class PredictionGenerationResponse(BaseModel):
    """Envelope returned by ``POST /predictions/generate``."""

    success: bool
    dataSource: Literal["mock"]
    predictions: List[Prediction]
    alerts: List[PredictionAlert]


class PredictionFeedbackRequest(BaseModel):
    """Payload accepted by ``POST /predictions/{id}/feedback``."""

    actualStruggle: bool
    feedbackType: str
    comments: Optional[str] = Field(default=None, max_length=1000)


class PredictionFeedbackResponse(BaseModel):
    """Envelope returned after prediction feedback is recorded."""

    success: bool
    dataSource: Literal["mock"]
    feedbackRecorded: bool
    predictionId: str
    modelAccuracyUpdate: float = Field(ge=0, le=1)


class Intervention(BaseModel):
    """A recommended intervention for a user."""

    id: str
    predictionId: str
    userId: str
    interventionType: str
    description: str
    reasoning: str
    priority: int
    status: str
    effectiveness: float = Field(ge=0, le=1)


class InterventionsResponse(BaseModel):
    """Envelope returned by ``GET /interventions``."""

    success: bool
    dataSource: Literal["mock"]
    interventions: List[Intervention]
    count: int


class PerformanceTrendPoint(BaseModel):
    """Historical snapshot of model accuracy."""

    date: str
    accuracy: float = Field(ge=0, le=1)


class ModelPerformanceResponse(BaseModel):
    """Envelope returned by ``GET /model-performance``."""

    success: bool
    dataSource: Literal["mock"]
    userId: str
    accuracy: float = Field(ge=0, le=1)
    precision: float = Field(ge=0, le=1)
    recall: float = Field(ge=0, le=1)
    f1Score: float = Field(ge=0, le=1)
    calibration: float = Field(ge=0, le=1)
    lastUpdated: datetime
    dataPoints: int
    trend: List[PerformanceTrendPoint]


class StruggleTimelinePoint(BaseModel):
    """Weekly view of struggle rate."""

    week: int
    struggleRate: float = Field(ge=0, le=1)


class InterventionEffectiveness(BaseModel):
    """Aggregated effectiveness of an intervention type."""

    type: str
    applicationsCount: int
    successRate: float = Field(ge=0, le=1)


class StruggleReductionResponse(BaseModel):
    """Envelope returned by ``GET /struggle-reduction``."""

    success: bool
    dataSource: Literal["mock"]
    userId: str
    period: str
    baselineRate: float = Field(ge=0, le=1)
    currentRate: float = Field(ge=0, le=1)
    reductionPercentage: float
    timeline: List[StruggleTimelinePoint]
    interventionEffectiveness: List[InterventionEffectiveness]

