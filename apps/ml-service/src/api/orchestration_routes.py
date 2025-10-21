"""
FastAPI Routes for Orchestration ML Service
Story 5.3: Optimal Study Timing & Session Orchestration

Exposes Python ML models as REST API endpoints for TypeScript frontend consumption.
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime
import pandas as pd
import logging

from ..orchestration import (
    StudyTimeRecommender,
    SessionDurationOptimizer,
    CognitiveLoadAnalyzer,
    ContentSequencer,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/orchestration", tags=["orchestration"])


# Request/Response Models
class TimeSlotRequest(BaseModel):
    user_id: str
    target_date: datetime
    historical_sessions: List[Dict[str, Any]]
    calendar_events: List[Dict[str, Any]]
    user_profile: Dict[str, Any]
    mission_id: Optional[str] = None


class TimeSlotResponse(BaseModel):
    recommendations: List[Dict[str, Any]]
    generated_at: datetime


class CognitiveLoadRequest(BaseModel):
    user_id: str
    recent_sessions: List[Dict[str, Any]]
    validation_scores: List[float]
    behavioral_events: List[Dict[str, Any]]
    baseline_metrics: Dict[str, float]


class CognitiveLoadResponse(BaseModel):
    load_score: float
    load_level: str
    confidence: float
    contributing_factors: List[Dict[str, Any]]
    recommendation: str
    trend: Optional[List[float]] = None


class DurationRequest(BaseModel):
    user_id: str
    mission_complexity: str
    time_of_day_hour: int
    user_profile: Dict[str, Any]
    recent_sessions: List[Dict[str, Any]]
    cognitive_load: float


class DurationResponse(BaseModel):
    recommended_duration: int
    min_duration: int
    max_duration: int
    confidence: float
    break_schedule: List[Dict[str, Any]]
    reasoning: List[str]


class ContentSequenceRequest(BaseModel):
    user_id: str
    mission_objectives: List[Dict[str, Any]]
    session_duration: int
    user_profile: Dict[str, Any]
    available_content: Dict[str, List[Dict]]
    cognitive_load: float


class ContentSequenceResponse(BaseModel):
    sequence: List[Dict[str, Any]]
    total_duration: int
    phase_breakdown: Dict[str, int]
    learning_style_match: float
    reasoning: List[str]


# Endpoints
@router.post("/recommendations", response_model=TimeSlotResponse)
async def generate_time_recommendations(request: TimeSlotRequest):
    """
    Generate ML-powered study time recommendations

    Uses ensemble Random Forest + Gradient Boosting models to predict
    optimal study times based on historical performance patterns.
    """

    try:
        # Initialize recommender
        recommender = StudyTimeRecommender()

        # Convert to DataFrame
        sessions_df = pd.DataFrame(request.historical_sessions)

        # Generate recommendations
        recommendations = await recommender.generate_recommendations(
            user_id=request.user_id,
            target_date=request.target_date,
            historical_sessions=sessions_df,
            calendar_events=request.calendar_events,
            user_profile=request.user_profile,
            mission_id=request.mission_id,
        )

        # Convert to dict
        recommendations_dict = [rec.to_dict() for rec in recommendations]

        return TimeSlotResponse(
            recommendations=recommendations_dict,
            generated_at=datetime.now(),
        )

    except Exception as e:
        logger.error(f"Time recommendations failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate recommendations: {str(e)}",
        )


@router.post("/cognitive-load", response_model=CognitiveLoadResponse)
async def assess_cognitive_load(request: CognitiveLoadRequest):
    """
    Assess cognitive load using ML models

    Uses Gradient Boosting Regressor + Random Forest Classifier to predict
    cognitive load from behavioral indicators and performance metrics.
    """

    try:
        # Initialize analyzer
        analyzer = CognitiveLoadAnalyzer()

        # Convert to DataFrames
        sessions_df = pd.DataFrame(request.recent_sessions)
        events_df = pd.DataFrame(request.behavioral_events)

        # Assess load
        assessment = await analyzer.assess_cognitive_load(
            user_id=request.user_id,
            recent_sessions=sessions_df,
            validation_scores=request.validation_scores,
            behavioral_events=events_df,
            baseline_metrics=request.baseline_metrics,
        )

        return CognitiveLoadResponse(
            load_score=assessment.load_score,
            load_level=assessment.load_level,
            confidence=assessment.confidence,
            contributing_factors=assessment.contributing_factors,
            recommendation=assessment.recommendation,
            trend=assessment.trend,
        )

    except Exception as e:
        logger.error(f"Cognitive load assessment failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to assess cognitive load: {str(e)}",
        )


@router.post("/session-duration", response_model=DurationResponse)
async def recommend_session_duration(request: DurationRequest):
    """
    Recommend optimal session duration with break schedule

    Uses ML-based fatigue detection and attention cycle modeling to
    optimize session length and break timing.
    """

    try:
        # Initialize optimizer
        optimizer = SessionDurationOptimizer()

        # Convert to DataFrame
        sessions_df = pd.DataFrame(request.recent_sessions)

        # Recommend duration
        recommendation = await optimizer.recommend_duration(
            user_id=request.user_id,
            mission_complexity=request.mission_complexity,
            time_of_day_hour=request.time_of_day_hour,
            user_profile=request.user_profile,
            recent_sessions=sessions_df,
            cognitive_load=request.cognitive_load,
        )

        return DurationResponse(
            recommended_duration=recommendation.recommended_duration,
            min_duration=recommendation.min_duration,
            max_duration=recommendation.max_duration,
            confidence=recommendation.confidence,
            break_schedule=recommendation.break_schedule,
            reasoning=recommendation.reasoning,
        )

    except Exception as e:
        logger.error(f"Duration recommendation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to recommend duration: {str(e)}",
        )


@router.post("/content-sequence", response_model=ContentSequenceResponse)
async def generate_content_sequence(request: ContentSequenceRequest):
    """
    Generate optimized content sequence

    Uses reinforcement learning (contextual bandit) and learning science
    principles to sequence content for maximum learning efficiency.
    """

    try:
        # Initialize sequencer
        sequencer = ContentSequencer()

        # Generate sequence
        sequence = await sequencer.generate_sequence(
            user_id=request.user_id,
            mission_objectives=request.mission_objectives,
            session_duration=request.session_duration,
            user_profile=request.user_profile,
            available_content=request.available_content,
            cognitive_load=request.cognitive_load,
        )

        # Convert ContentItem objects to dicts
        sequence_dict = [
            {
                "id": item.id,
                "type": item.type,
                "difficulty": item.difficulty,
                "estimatedDuration": item.estimated_duration,
                "phase": item.phase,
                "priority": item.priority,
            }
            for item in sequence.sequence
        ]

        return ContentSequenceResponse(
            sequence=sequence_dict,
            total_duration=sequence.total_duration,
            phase_breakdown=sequence.phase_breakdown,
            learning_style_match=sequence.learning_style_match,
            reasoning=sequence.reasoning,
        )

    except Exception as e:
        logger.error(f"Content sequencing failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate content sequence: {str(e)}",
        )


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "orchestration-ml"}
