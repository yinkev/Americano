"""
Feedback Request/Response Models

Pydantic V2 models for prediction feedback endpoints.
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime
from enum import Enum


class FeedbackType(str, Enum):
    """Feedback type enum matching Prisma schema"""
    HELPFUL = "HELPFUL"
    NOT_HELPFUL = "NOT_HELPFUL"
    INACCURATE = "INACCURATE"
    INTERVENTION_GOOD = "INTERVENTION_GOOD"
    INTERVENTION_BAD = "INTERVENTION_BAD"


# ==================== REQUEST MODELS ====================

class FeedbackRequest(BaseModel):
    """
    Request body for POST /predictions/{id}/feedback

    Records user feedback on prediction accuracy.
    """
    actual_struggle: bool = Field(..., description="Did user actually struggle?")
    feedback_type: FeedbackType
    comments: Optional[str] = Field(None, max_length=1000, description="Optional feedback comments")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "actual_struggle": True,
                "feedback_type": "HELPFUL",
                "comments": "The prediction was accurate and helpful"
            }
        }
    )


# ==================== RESPONSE MODELS ====================

class FeedbackResponse(BaseModel):
    """
    Response for feedback submission.
    """
    feedback_recorded: bool
    prediction_id: str
    feedback_id: str
    model_accuracy_update: Optional[float] = Field(None, description="Updated model accuracy if calculated")
    message: str = "Feedback recorded successfully"
    submitted_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "feedback_recorded": True,
                "prediction_id": "pred_abc123",
                "feedback_id": "fb_xyz789",
                "model_accuracy_update": 0.78,
                "message": "Feedback recorded successfully. Model accuracy updated to 78%",
                "submitted_at": "2025-10-16T19:00:00Z"
            }
        }
    )
