"""
Analytics Response Models

Pydantic V2 models for model performance and struggle reduction endpoints.
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import List, Dict, Any, Optional
from datetime import datetime


# ==================== RESPONSE MODELS ====================

class ModelPerformanceResponse(BaseModel):
    """
    Response for GET /analytics/model-performance

    Returns comprehensive model metrics and performance data.
    """
    accuracy: float = Field(..., ge=0.0, le=1.0, description="Overall accuracy (0-1)")
    precision: float = Field(..., ge=0.0, le=1.0, description="Precision score")
    recall: float = Field(..., ge=0.0, le=1.0, description="Recall score")
    f1_score: float = Field(..., ge=0.0, le=1.0, description="F1 score")
    auc_roc: Optional[float] = Field(None, ge=0.0, le=1.0, description="AUC-ROC score")

    # Calibration metrics
    calibration: Dict[str, List[float]] = Field(..., description="Calibration curve data")

    # Model metadata
    model_type: str = Field(..., description="rule_based or logistic_regression")
    model_version: str
    last_updated: datetime
    data_points: int = Field(..., description="Number of training examples")

    # Feature importance (if available)
    feature_importance: Optional[Dict[str, float]] = None

    # Performance trends
    accuracy_trend: Optional[List[Dict[str, Any]]] = Field(None, description="Accuracy over time")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "accuracy": 0.78,
                "precision": 0.72,
                "recall": 0.75,
                "f1_score": 0.73,
                "auc_roc": 0.82,
                "calibration": {
                    "prob_true": [0.1, 0.3, 0.5, 0.7, 0.9],
                    "prob_pred": [0.15, 0.32, 0.48, 0.68, 0.88]
                },
                "model_type": "rule_based",
                "model_version": "v1.0",
                "last_updated": "2025-10-16T19:00:00Z",
                "data_points": 250
            }
        }
    )


class TimelinePoint(BaseModel):
    """
    Timeline data point for struggle reduction metrics.
    """
    date: datetime
    struggle_rate: float = Field(..., ge=0.0, le=1.0)
    struggles_count: int = Field(..., ge=0)
    topics_studied: int = Field(..., ge=0)

    model_config = ConfigDict(from_attributes=True)


class StruggleReductionResponse(BaseModel):
    """
    Response for GET /analytics/struggle-reduction

    Returns struggle reduction metrics and success data.
    """
    baseline_rate: float = Field(..., ge=0.0, le=1.0, description="Struggle rate before predictions (0-1)")
    current_rate: float = Field(..., ge=0.0, le=1.0, description="Current struggle rate (0-1)")
    reduction_percentage: float = Field(..., description="Percentage reduction (can be negative)")

    # Timeline data
    timeline: List[TimelinePoint] = Field(..., description="Struggle rate over time")

    # Intervention effectiveness
    intervention_effectiveness: List[Dict[str, Any]] = Field(
        ...,
        description="Effectiveness by intervention type"
    )

    # Metadata
    period: str = Field(..., description="Time period: week, month, or all")
    baseline_period_start: Optional[datetime] = None
    baseline_period_end: Optional[datetime] = None
    current_period_start: datetime
    current_period_end: datetime

    # Additional metrics
    total_predictions: int = Field(..., ge=0)
    total_interventions_applied: int = Field(..., ge=0)
    user_feedback_count: int = Field(..., ge=0)

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "baseline_rate": 0.40,
                "current_rate": 0.28,
                "reduction_percentage": 30.0,
                "timeline": [
                    {
                        "date": "2025-10-09T00:00:00Z",
                        "struggle_rate": 0.38,
                        "struggles_count": 5,
                        "topics_studied": 13
                    }
                ],
                "intervention_effectiveness": [
                    {
                        "intervention_type": "PREREQUISITE_REVIEW",
                        "applications": 15,
                        "success_rate": 0.87
                    }
                ],
                "period": "month",
                "current_period_start": "2025-09-16T00:00:00Z",
                "current_period_end": "2025-10-16T00:00:00Z",
                "total_predictions": 45,
                "total_interventions_applied": 28,
                "user_feedback_count": 12
            }
        }
    )
