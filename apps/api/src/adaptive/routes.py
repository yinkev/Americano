"""
FastAPI routes for adaptive questioning (Story 4.5).

Endpoints:
- POST /adaptive/question/next - Get next adaptive question
- GET /adaptive/session/{session_id}/metrics - Get session IRT metrics
"""

from fastapi import APIRouter, HTTPException, status
from typing import List
import logging

from .models import (
    NextQuestionRequest,
    NextQuestionResponse,
    SessionMetricsResponse,
    QuestionData,
    ResponseRecord,
    EfficiencyMetrics,
)
from .irt_engine import IRTEngine
from .question_selector import QuestionSelector

logger = logging.getLogger(__name__)

# ============================================================================
# Router Configuration
# ============================================================================

router = APIRouter(
    prefix="/adaptive",
    tags=["adaptive"],
)


# ============================================================================
# Dependency: Initialize engines (singleton pattern)
# ============================================================================

_irt_engine = None
_question_selector = None


def get_irt_engine() -> IRTEngine:
    """Get singleton IRT engine instance."""
    global _irt_engine
    if _irt_engine is None:
        _irt_engine = IRTEngine(
            max_iterations=10,
            tolerance=0.01,
            early_stop_ci_threshold=0.3,
        )
    return _irt_engine


def get_question_selector() -> QuestionSelector:
    """Get singleton question selector instance."""
    global _question_selector
    if _question_selector is None:
        _question_selector = QuestionSelector(
            irt_engine=get_irt_engine(),
            cooldown_days=14,
            max_difficulty_adjustments=3,
        )
    return _question_selector


# ============================================================================
# Mock Data (MVP - Replace with database queries in production)
# ============================================================================

# Mock question bank (In production: fetch from database)
MOCK_QUESTION_BANK = [
    QuestionData(
        question_id="q_basic_1",
        question_text="Explain the basic structure of the cardiac conduction system.",
        difficulty=30,
        discrimination=1.0,
        is_follow_up=False,
    ),
    QuestionData(
        question_id="q_intermediate_1",
        question_text="Describe how the AV node regulates ventricular contraction timing.",
        difficulty=50,
        discrimination=1.2,
        is_follow_up=False,
    ),
    QuestionData(
        question_id="q_intermediate_2",
        question_text="Explain the role of the bundle of His in cardiac conduction.",
        difficulty=55,
        discrimination=1.1,
        is_follow_up=False,
    ),
    QuestionData(
        question_id="q_advanced_1",
        question_text="Analyze how autonomic nervous system modulates SA node activity.",
        difficulty=75,
        discrimination=1.3,
        is_follow_up=False,
    ),
    QuestionData(
        question_id="q_advanced_2",
        question_text="Evaluate the clinical implications of AV node dysfunction.",
        difficulty=80,
        discrimination=1.4,
        is_follow_up=False,
    ),
]


# In-memory session storage (MVP - Replace with database in production)
session_store = {}


# ============================================================================
# Endpoints
# ============================================================================

@router.post(
    "/question/next",
    response_model=NextQuestionResponse,
    summary="Get next adaptive question",
    description="Returns next question based on IRT algorithm and difficulty adjustment",
)
async def get_next_question(request: NextQuestionRequest) -> NextQuestionResponse:
    """
    Get next adaptive question based on IRT metrics.

    Algorithm:
    1. If first question: Calculate initial difficulty from history
    2. If subsequent: Adjust difficulty based on last score
    3. Update IRT theta estimate from response pattern
    4. Select question using maximum information principle
    5. Check early stopping criteria (CI < 0.3)
    6. Calculate efficiency metrics

    Args:
        request: NextQuestionRequest with session context

    Returns:
        NextQuestionResponse with next question and metrics
    """
    try:
        irt_engine = get_irt_engine()
        selector = get_question_selector()

        # Get or create session data
        session_key = f"{request.session_id}_{request.objective_id}"
        if session_key not in session_store:
            session_store[session_key] = {
                "responses": [],
                "questions_asked": [],
                "adjustment_count": 0,
                "convergence_history": [],
            }
        session_data = session_store[session_key]

        # Determine if this is first question
        is_first_question = len(session_data["responses"]) == 0

        # Calculate/adjust difficulty
        if is_first_question:
            # MVP: Use default initial difficulty (no history available)
            # Production: Query last 10 assessments from database
            target_difficulty = selector.calculate_initial_difficulty(
                recent_scores=[],  # Empty for MVP
                calibration_accuracy=None,
            )
            adjustment_reason = "Initial difficulty based on default (no history)"
        else:
            # Adjust based on last score (mock score for demo - get from validation API in production)
            last_score = 75.0  # Mock score (would come from validation evaluation)
            target_difficulty, adjustment_reason = selector.adjust_difficulty(
                current_difficulty=request.current_difficulty,
                score=last_score,
                adjustment_count=session_data["adjustment_count"],
            )
            session_data["adjustment_count"] += 1

            # Record last response for IRT calculation (mock)
            if request.question_id and request.user_answer:
                # Mock: Assume correct if score > 70
                is_correct = last_score > 70
                session_data["responses"].append(
                    ResponseRecord(
                        question_id=request.question_id,
                        correct=is_correct,
                        difficulty=(request.current_difficulty - 50) / 20,  # Normalize to -2.5 to +2.5
                        discrimination=1.2,  # Mock discrimination
                    )
                )

        # Calculate IRT metrics from response history
        if session_data["responses"]:
            irt_metrics = irt_engine.calculate_irt_metrics(
                session_data["responses"],
                initial_theta=0.0,
            )
            session_data["convergence_history"].append(irt_metrics.theta)
            current_theta = irt_metrics.theta
        else:
            # First question - no metrics yet
            irt_metrics = irt_engine.calculate_irt_metrics(
                [],
                initial_theta=0.0,
            )
            irt_metrics.theta = 0.0
            irt_metrics.standard_error = 1.0
            irt_metrics.confidence_interval = 1.96
            irt_metrics.iterations = 0
            irt_metrics.converged = False
            current_theta = None

        # Select next question
        recently_answered_ids = [q.question_id for q in session_data["questions_asked"]]
        next_question = selector.select_question(
            target_difficulty=target_difficulty,
            available_questions=MOCK_QUESTION_BANK,
            recently_answered_ids=recently_answered_ids,
            theta=current_theta,
        )

        if not next_question:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No suitable questions available (all in cooldown or depleted)",
            )

        session_data["questions_asked"].append(next_question)

        # Calculate efficiency metrics
        questions_asked = len(session_data["questions_asked"])
        efficiency_dict = selector.calculate_efficiency_metrics(
            questions_asked=questions_asked,
            baseline_questions=15,
        )
        efficiency_metrics = EfficiencyMetrics(**efficiency_dict)

        # Check early stopping
        should_end = False
        if session_data["responses"]:
            should_end = irt_engine.should_stop_early(
                standard_error=irt_metrics.standard_error,
                num_responses=len(session_data["responses"]),
                min_questions=3,
            )

        logger.info(
            f"Next question selected: {next_question.question_id}, "
            f"difficulty={target_difficulty}, theta={current_theta}, should_end={should_end}"
        )

        return NextQuestionResponse(
            question=next_question,
            irt_metrics=irt_metrics,
            efficiency_metrics=efficiency_metrics,
            should_end=should_end,
            adjustment_reason=adjustment_reason,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting next question: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get next question: {str(e)}",
        )


@router.get(
    "/session/{session_id}/metrics",
    response_model=SessionMetricsResponse,
    summary="Get session IRT metrics",
    description="Returns IRT metrics and efficiency data for a completed or ongoing session",
)
async def get_session_metrics(session_id: str, objective_id: str) -> SessionMetricsResponse:
    """
    Get IRT and efficiency metrics for an adaptive session.

    Args:
        session_id: Learning session ID
        objective_id: Learning objective ID

    Returns:
        SessionMetricsResponse with IRT metrics and efficiency data
    """
    try:
        irt_engine = get_irt_engine()
        selector = get_question_selector()

        # Get session data
        session_key = f"{session_id}_{objective_id}"
        if session_key not in session_store:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Session {session_id} not found for objective {objective_id}",
            )

        session_data = session_store[session_key]

        # Calculate final IRT metrics
        if session_data["responses"]:
            irt_metrics = irt_engine.calculate_irt_metrics(
                session_data["responses"],
                initial_theta=0.0,
            )
        else:
            # No responses yet
            irt_metrics = irt_engine.calculate_irt_metrics([])

        # Calculate efficiency metrics
        questions_asked = len(session_data["questions_asked"])
        efficiency_dict = selector.calculate_efficiency_metrics(
            questions_asked=questions_asked,
            baseline_questions=15,
        )
        efficiency_metrics = EfficiencyMetrics(**efficiency_dict)

        # Baseline comparison
        questions_saved = max(0, 15 - questions_asked)
        baseline_comparison = {
            "questions_saved": questions_saved,
            "estimated_time_saved_minutes": questions_saved * 1.5,  # ~1.5 min per question
            "accuracy_maintained": irt_metrics.converged,
        }

        logger.info(
            f"Session metrics: {session_id}, questions={questions_asked}, "
            f"theta={irt_metrics.theta}, efficiency={efficiency_metrics.efficiency_score}"
        )

        return SessionMetricsResponse(
            session_id=session_id,
            objective_id=objective_id,
            irt_metrics=irt_metrics,
            efficiency_metrics=efficiency_metrics,
            convergence_history=session_data.get("convergence_history", []),
            baseline_comparison=baseline_comparison,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting session metrics: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get session metrics: {str(e)}",
        )
