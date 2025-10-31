"""Utilities that provide shared mock payloads for the ML service routers."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import List

from ..schemas import (
    Intervention,
    InterventionEffectiveness,
    InterventionsResponse,
    ModelPerformanceResponse,
    PerformanceTrendPoint,
    Prediction,
    PredictionAlert,
    PredictionFeedbackResponse,
    PredictionGenerationResponse,
    PredictionsResponse,
    StruggleReductionResponse,
    StruggleTimelinePoint,
)

DEFAULT_USER_ID = "kevy@americano.dev"
DEFAULT_STATUS = "PENDING"
DEFAULT_MIN_PROBABILITY = 0.5


def _now() -> datetime:
    return datetime.now(timezone.utc)


def build_predictions(
    user_id: str, status: str, min_probability: float
) -> List[Prediction]:
    """Create a consistent set of mock predictions."""

    base_predictions = [
        Prediction(
            id="pred-1",
            userId=user_id,
            learningObjectiveId="obj-123",
            topicId="topic-456",
            predictionDate=_now(),
            predictedStruggleProbability=0.75,
            predictionConfidence=0.85,
            predictionStatus=status,
            actualOutcome=None,
        ),
        Prediction(
            id="pred-2",
            userId=user_id,
            learningObjectiveId="obj-124",
            topicId="topic-457",
            predictionDate=_now(),
            predictedStruggleProbability=0.62,
            predictionConfidence=0.78,
            predictionStatus=status,
            actualOutcome=None,
        ),
    ]

    return [
        prediction
        for prediction in base_predictions
        if prediction.predictedStruggleProbability >= min_probability
    ]


def build_predictions_response(
    user_id: str,
    status: str,
    min_probability: float,
) -> PredictionsResponse:
    predictions = build_predictions(user_id, status, min_probability)
    return PredictionsResponse(
        success=True,
        dataSource="mock",
        count=len(predictions),
        predictions=predictions,
    )


def build_prediction_generation_response(user_id: str) -> PredictionGenerationResponse:
    predictions = [
        Prediction(
            id="pred-new-1",
            userId=user_id,
            learningObjectiveId="obj-125",
            topicId="topic-458",
            predictionDate=_now(),
            predictedStruggleProbability=0.82,
            predictionConfidence=0.9,
            predictionStatus=DEFAULT_STATUS,
            actualOutcome=None,
        )
    ]

    alerts = [
        PredictionAlert(
            id="alert-1",
            type="PROACTIVE_WARNING",
            message="Mock alert: Potential struggle with Cardiac Electrophysiology",
            priority=8,
        )
    ]

    return PredictionGenerationResponse(
        success=True,
        dataSource="mock",
        predictions=predictions,
        alerts=alerts,
    )


def build_prediction_feedback_response(prediction_id: str) -> PredictionFeedbackResponse:
    return PredictionFeedbackResponse(
        success=True,
        dataSource="mock",
        feedbackRecorded=True,
        predictionId=prediction_id,
        modelAccuracyUpdate=0.78,
    )


def build_interventions_response(user_id: str) -> InterventionsResponse:
    interventions = [
        Intervention(
            id="int-1",
            predictionId="pred-1",
            userId=user_id,
            interventionType="PREREQUISITE_REVIEW",
            description="Mock: Review prerequisite topics before studying",
            reasoning="Mock reasoning: You have 2 unmastered prerequisites",
            priority=9,
            status="PENDING",
            effectiveness=0.85,
        ),
        Intervention(
            id="int-2",
            predictionId="pred-2",
            userId=user_id,
            interventionType="DIFFICULTY_PROGRESSION",
            description="Mock: Start with foundational content",
            reasoning="Mock reasoning: Topic complexity exceeds current level",
            priority=7,
            status="PENDING",
            effectiveness=0.72,
        ),
    ]

    return InterventionsResponse(
        success=True,
        dataSource="mock",
        interventions=interventions,
        count=len(interventions),
    )


def build_model_performance_response(user_id: str) -> ModelPerformanceResponse:
    trend = [
        PerformanceTrendPoint(date="2025-10-01", accuracy=0.72),
        PerformanceTrendPoint(date="2025-10-08", accuracy=0.75),
        PerformanceTrendPoint(date="2025-10-15", accuracy=0.78),
    ]

    return ModelPerformanceResponse(
        success=True,
        dataSource="mock",
        userId=user_id,
        accuracy=0.78,
        precision=0.75,
        recall=0.82,
        f1Score=0.78,
        calibration=0.85,
        lastUpdated=_now(),
        dataPoints=156,
        trend=trend,
    )


def build_struggle_reduction_response(user_id: str, period: str) -> StruggleReductionResponse:
    timeline = [
        StruggleTimelinePoint(week=1, struggleRate=0.42),
        StruggleTimelinePoint(week=2, struggleRate=0.38),
        StruggleTimelinePoint(week=3, struggleRate=0.32),
        StruggleTimelinePoint(week=4, struggleRate=0.28),
    ]

    effectiveness = [
        InterventionEffectiveness(
            type="PREREQUISITE_REVIEW",
            applicationsCount=12,
            successRate=0.85,
        ),
        InterventionEffectiveness(
            type="DIFFICULTY_PROGRESSION",
            applicationsCount=8,
            successRate=0.72,
        ),
    ]

    return StruggleReductionResponse(
        success=True,
        dataSource="mock",
        userId=user_id,
        period=period,
        baselineRate=0.42,
        currentRate=0.28,
        reductionPercentage=33.3,
        timeline=timeline,
        interventionEffectiveness=effectiveness,
    )

