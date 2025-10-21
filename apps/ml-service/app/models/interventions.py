"""
Intervention Request/Response Models

Pydantic V2 models for intervention recommendation endpoints.
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from enum import Enum


class InterventionType(str, Enum):
    """Intervention type enum matching Prisma schema"""
    PREREQUISITE_REVIEW = "PREREQUISITE_REVIEW"
    DIFFICULTY_PROGRESSION = "DIFFICULTY_PROGRESSION"
    CONTENT_FORMAT_ADAPT = "CONTENT_FORMAT_ADAPT"
    COGNITIVE_LOAD_REDUCE = "COGNITIVE_LOAD_REDUCE"
    SPACED_REPETITION_BOOST = "SPACED_REPETITION_BOOST"
    BREAK_SCHEDULE_ADJUST = "BREAK_SCHEDULE_ADJUST"


class InterventionStatus(str, Enum):
    """Intervention status enum matching Prisma schema"""
    PENDING = "PENDING"
    APPLIED = "APPLIED"
    COMPLETED = "COMPLETED"
    DISMISSED = "DISMISSED"


# ==================== RESPONSE MODELS ====================

class InterventionResponse(BaseModel):
    """
    Intervention recommendation response.
    """
    id: str = Field(..., description="Intervention ID")
    prediction_id: str
    user_id: str
    intervention_type: InterventionType
    description: str
    reasoning: str
    priority: int = Field(..., ge=1, le=10)
    status: InterventionStatus
    applied_at: Optional[datetime] = None
    applied_to_mission_id: Optional[str] = None
    effectiveness: Optional[float] = Field(None, ge=0.0, le=1.0)
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": "int_abc123",
                "prediction_id": "pred_abc123",
                "user_id": "user_abc123",
                "intervention_type": "PREREQUISITE_REVIEW",
                "description": "Review prerequisite concepts before studying this objective",
                "reasoning": "You have 2 prerequisite concepts that need review.",
                "priority": 9,
                "status": "PENDING",
                "created_at": "2025-10-16T19:00:00Z"
            }
        }
    )


# ==================== REQUEST MODELS ====================

class InterventionApplyRequest(BaseModel):
    """
    Request to apply an intervention to a mission.
    """
    mission_id: Optional[str] = Field(None, description="Specific mission ID (or next available)")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "mission_id": "mission_xyz789"
            }
        }
    )


class InterventionApplyResponse(BaseModel):
    """
    Response after applying an intervention.
    """
    success: bool
    intervention_id: str
    mission_id: str
    message: str
    applied_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "success": True,
                "intervention_id": "int_abc123",
                "mission_id": "mission_xyz789",
                "message": "Intervention applied successfully to mission",
                "applied_at": "2025-10-16T19:00:00Z"
            }
        }
    )
