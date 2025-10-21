"""
Pydantic models for adaptive questioning endpoints.

Defines request/response models for IRT-based adaptive assessment.
"""

from pydantic import BaseModel, Field
from typing import Optional, List


# ============================================================================
# Request Models
# ============================================================================

class NextQuestionRequest(BaseModel):
    """
    Request for next adaptive question.

    Includes session context and optionally the last response for difficulty adjustment.
    """
    session_id: str = Field(..., description="Learning session ID")
    objective_id: str = Field(..., description="Learning objective being assessed")
    question_id: Optional[str] = Field(None, description="ID of last question answered (if any)")
    user_answer: Optional[str] = Field(None, description="User's answer to last question")
    current_difficulty: int = Field(50, ge=0, le=100, description="Current difficulty level (0-100)")

    class Config:
        json_schema_extra = {
            "example": {
                "session_id": "sess_abc123",
                "objective_id": "obj_cardiac_conduction",
                "question_id": "q_123",
                "user_answer": "The sinoatrial node...",
                "current_difficulty": 65
            }
        }


# ============================================================================
# Response Models
# ============================================================================

class IRTMetrics(BaseModel):
    """IRT algorithm metrics (knowledge estimate and convergence)."""
    theta: float = Field(..., description="Knowledge estimate (ability parameter)")
    standard_error: float = Field(..., description="Standard error of theta estimate")
    confidence_interval: float = Field(..., description="95% confidence interval width")
    iterations: int = Field(..., description="Number of IRT iterations performed")
    converged: bool = Field(..., description="Whether IRT algorithm converged")


class EfficiencyMetrics(BaseModel):
    """Assessment efficiency metrics."""
    questions_asked: int = Field(..., description="Number of questions asked so far")
    baseline_questions: int = Field(15, description="Baseline questions without adaptive (default 15)")
    time_saved_percent: float = Field(..., description="Percentage of time saved vs baseline")
    efficiency_score: float = Field(..., description="Overall efficiency score (0-100)")


class QuestionData(BaseModel):
    """Generated or selected question data."""
    question_id: str = Field(..., description="Unique question identifier")
    question_text: str = Field(..., description="The actual question content")
    difficulty: int = Field(..., ge=0, le=100, description="Question difficulty (0-100)")
    discrimination: float = Field(..., description="Item discrimination parameter (IRT)")
    is_follow_up: bool = Field(False, description="Whether this is a follow-up question")
    parent_question_id: Optional[str] = Field(None, description="Parent question ID if follow-up")


class NextQuestionResponse(BaseModel):
    """
    Response with next adaptive question.

    Includes the question, IRT metrics, efficiency metrics, and early stop flag.
    """
    question: QuestionData = Field(..., description="Next question to present")
    irt_metrics: IRTMetrics = Field(..., description="IRT algorithm metrics")
    efficiency_metrics: EfficiencyMetrics = Field(..., description="Assessment efficiency")
    should_end: bool = Field(..., description="Recommendation to end assessment (early stop)")
    adjustment_reason: Optional[str] = Field(None, description="Reason for difficulty adjustment")

    class Config:
        json_schema_extra = {
            "example": {
                "question": {
                    "question_id": "q_456",
                    "question_text": "Explain the role of the AV node in cardiac conduction...",
                    "difficulty": 70,
                    "discrimination": 1.2,
                    "is_follow_up": False,
                    "parent_question_id": None
                },
                "irt_metrics": {
                    "theta": 0.45,
                    "standard_error": 0.15,
                    "confidence_interval": 0.29,
                    "iterations": 4,
                    "converged": True
                },
                "efficiency_metrics": {
                    "questions_asked": 4,
                    "baseline_questions": 15,
                    "time_saved_percent": 73.3,
                    "efficiency_score": 85.0
                },
                "should_end": False,
                "adjustment_reason": "Score > 85% - increasing difficulty by 15 points"
            }
        }


class SessionMetricsResponse(BaseModel):
    """
    Session-level IRT and efficiency metrics.

    Provides overall assessment metrics for a session.
    """
    session_id: str = Field(..., description="Learning session ID")
    objective_id: str = Field(..., description="Learning objective ID")
    irt_metrics: IRTMetrics = Field(..., description="Final IRT metrics")
    efficiency_metrics: EfficiencyMetrics = Field(..., description="Efficiency metrics")
    convergence_history: List[float] = Field(..., description="Theta estimates over iterations")
    baseline_comparison: dict = Field(..., description="Comparison to non-adaptive baseline")

    class Config:
        json_schema_extra = {
            "example": {
                "session_id": "sess_abc123",
                "objective_id": "obj_cardiac_conduction",
                "irt_metrics": {
                    "theta": 0.52,
                    "standard_error": 0.12,
                    "confidence_interval": 0.24,
                    "iterations": 5,
                    "converged": True
                },
                "efficiency_metrics": {
                    "questions_asked": 5,
                    "baseline_questions": 15,
                    "time_saved_percent": 66.7,
                    "efficiency_score": 88.0
                },
                "convergence_history": [0.0, 0.3, 0.45, 0.50, 0.52],
                "baseline_comparison": {
                    "questions_saved": 10,
                    "estimated_time_saved_minutes": 15,
                    "accuracy_maintained": True
                }
            }
        }


# ============================================================================
# Internal Models (used by IRT engine)
# ============================================================================

class ResponseRecord(BaseModel):
    """Individual response record for IRT calculation."""
    question_id: str
    correct: bool
    difficulty: float = Field(..., ge=-3, le=3, description="Item difficulty (beta, IRT scale -3 to +3)")
    discrimination: float = Field(1.0, description="Item discrimination (alpha)")


class IRTCalculationInput(BaseModel):
    """Input for IRT theta estimation."""
    responses: List[ResponseRecord] = Field(..., description="Response history")
    initial_theta: float = Field(0.0, description="Initial theta estimate")
    max_iterations: int = Field(10, description="Maximum Newton-Raphson iterations")
    tolerance: float = Field(0.01, description="Convergence tolerance")
