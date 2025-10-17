"""
Prediction Request/Response Models

Pydantic V2 models for struggle prediction endpoints.
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class PredictionStatus(str, Enum):
    """Prediction status enum matching Prisma schema"""
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    FALSE_POSITIVE = "FALSE_POSITIVE"
    MISSED = "MISSED"


class Severity(str, Enum):
    """Indicator severity enum matching Prisma schema"""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class AlertType(str, Enum):
    """Alert type for user notifications"""
    PROACTIVE_WARNING = "PROACTIVE_WARNING"
    PREREQUISITE_ALERT = "PREREQUISITE_ALERT"
    REAL_TIME_ALERT = "REAL_TIME_ALERT"
    INTERVENTION_SUGGESTION = "INTERVENTION_SUGGESTION"


# ==================== REQUEST MODELS ====================

class PredictionRequest(BaseModel):
    """
    Request body for POST /predictions/generate

    Triggers prediction analysis for a user.
    """
    user_id: str = Field(..., description="User identifier")
    days_ahead: int = Field(default=7, ge=1, le=30, description="Days ahead to predict (1-30)")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "user_id": "user_abc123",
                "days_ahead": 7
            }
        }
    )


# ==================== RESPONSE MODELS ====================

class PredictionDetail(BaseModel):
    """
    Detailed prediction information for a single objective.
    """
    id: str = Field(..., description="Prediction ID")
    user_id: str
    learning_objective_id: Optional[str] = None
    topic_id: Optional[str] = None
    prediction_date: datetime
    predicted_struggle_probability: float = Field(..., ge=0.0, le=1.0)
    prediction_confidence: float = Field(..., ge=0.0, le=1.0)
    prediction_status: PredictionStatus
    feature_vector: Dict[str, Any] = Field(..., description="Features used for prediction")
    risk_level: str = Field(..., description="LOW, MEDIUM, or HIGH")
    reasoning: str = Field(..., description="Human-readable explanation")

    # Optional related data
    objective_name: Optional[str] = None
    course_name: Optional[str] = None
    indicators: List[Dict[str, Any]] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class AlertResponse(BaseModel):
    """
    Alert notification for user.
    """
    id: str
    type: AlertType
    title: str
    message: str
    severity: Severity
    priority: float = Field(..., ge=0, le=100)
    prediction_id: Optional[str] = None
    intervention_id: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PredictionResponse(BaseModel):
    """
    Response for POST /predictions/generate and GET /predictions
    """
    predictions: List[PredictionDetail]
    alerts: Optional[List[AlertResponse]] = None
    total_count: int
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int
    generated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "predictions": [
                    {
                        "id": "pred_abc123",
                        "user_id": "user_abc123",
                        "learning_objective_id": "obj_xyz789",
                        "predicted_struggle_probability": 0.75,
                        "prediction_confidence": 0.82,
                        "prediction_status": "PENDING",
                        "risk_level": "HIGH",
                        "reasoning": "HIGH risk primarily due to low retention in this topic area.",
                        "objective_name": "Cardiac electrophysiology",
                        "course_name": "Cardiovascular Physiology"
                    }
                ],
                "total_count": 1,
                "high_risk_count": 1,
                "medium_risk_count": 0,
                "low_risk_count": 0
            }
        }
    )
