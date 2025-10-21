"""
Pydantic models for Story 4.3 Tasks 4-5: Corrective Feedback and Retry Scheduling.

Models for:
- Task 4: CorrectiveFeedbackEngine
- Task 5: RetryScheduler
"""

from datetime import datetime, date
from typing import List, Literal
from pydantic import BaseModel, Field


# ============================================================================
# Task 4: Corrective Feedback Engine - Request/Response Models
# ============================================================================

class FeedbackRequest(BaseModel):
    """
    Request model for generating corrective feedback.

    Attributes:
        challenge_id: ID of the challenge attempt
        user_answer: User's incorrect answer
        correct_answer: The correct answer
        objective_text: Learning objective being tested
        misconception_type: Optional hint about the type of error
    """
    challenge_id: str = Field(..., description="ID of the challenge attempt")
    user_answer: str = Field(..., description="User's incorrect answer")
    correct_answer: str = Field(..., description="The correct answer")
    objective_text: str = Field(..., description="Learning objective text")
    misconception_type: str = Field(
        default="general",
        description="Type of misconception (overconfidence, partial_understanding, recent_mistakes)"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "challenge_id": "challenge_001",
                "user_answer": "ACE inhibitors cause hyperkalemia by blocking aldosterone",
                "correct_answer": "ACE inhibitors cause hyperkalemia by reducing aldosterone secretion",
                "objective_text": "Explain the mechanism of ACE inhibitor-induced hyperkalemia",
                "misconception_type": "partial_understanding"
            }
        }


class StructuredFeedback(BaseModel):
    """
    Structured corrective feedback from ChatMock via instructor.

    This model enforces the rubric:
    1. Explain misconception
    2. Clarify correct concept
    3. Provide clinical context
    4. Create memorable anchor

    Used as response_model for instructor to ensure structured output.
    """
    misconception_explained: str = Field(
        ...,
        description="Clear explanation of why the user's answer was wrong (2-3 sentences)"
    )

    correct_concept: str = Field(
        ...,
        description="Clarification of the correct concept with clinical context (3-4 sentences)"
    )

    clinical_context: str = Field(
        ...,
        description="Real-world clinical scenario or patient example demonstrating the concept (2-3 sentences)"
    )

    memory_anchor: str = Field(
        ...,
        description="Memorable mnemonic, visual analogy, or patient story to aid retention (1-2 sentences)"
    )

    memory_anchor_type: Literal["mnemonic", "visual_analogy", "patient_story", "clinical_pearl"] = Field(
        ...,
        description="Type of memory anchor created"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "misconception_explained": "You stated ACE inhibitors 'block' aldosterone, which implies direct inhibition. This is incorrect - they don't block aldosterone itself.",
                "correct_concept": "ACE inhibitors reduce aldosterone secretion indirectly by blocking angiotensin II formation. Less Ang II means less stimulation of aldosterone release from the adrenal cortex. The aldosterone itself isn't blocked.",
                "clinical_context": "In a patient with heart failure on lisinopril, you monitor potassium because reduced aldosterone means less K+ excretion in the distal tubule. This is why we avoid K+ supplements and K+-sparing diuretics with ACE inhibitors.",
                "memory_anchor": "Think 'ACE = LESS aldosterone MADE' (not blocked, just less production). Picture a factory slowing down production, not a roadblock.",
                "memory_anchor_type": "visual_analogy"
            }
        }


class FeedbackResponse(BaseModel):
    """
    Complete response with feedback and metadata for user interaction.

    Includes the structured feedback plus fields for emotion tagging
    and personal notes (captured in UI, stored in database).
    """
    challenge_id: str
    feedback: StructuredFeedback
    emotion_tag: Literal["SURPRISE", "CONFUSION", "FRUSTRATION", "AHA_MOMENT", ""] = Field(
        default="",
        description="User-selected emotion tag (captured after feedback shown)"
    )
    personal_notes: str = Field(
        default="",
        description="User's personal notes about what clicked (captured in UI)"
    )
    generated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_schema_extra = {
            "example": {
                "challenge_id": "challenge_001",
                "feedback": {
                    "misconception_explained": "You confused blocking with reducing secretion.",
                    "correct_concept": "ACE inhibitors reduce aldosterone indirectly via Ang II.",
                    "clinical_context": "Monitor K+ in patients on ACE inhibitors for this reason.",
                    "memory_anchor": "ACE = LESS aldosterone MADE, not blocked",
                    "memory_anchor_type": "mnemonic"
                },
                "emotion_tag": "AHA_MOMENT",
                "personal_notes": "Ah! It's about production, not blocking. Makes sense now!",
                "generated_at": "2025-10-17T10:00:00Z"
            }
        }


# ============================================================================
# Task 5: Retry Scheduler - Request/Response Models
# ============================================================================

class RetryScheduleRequest(BaseModel):
    """
    Request model for scheduling retries after a failure.

    Attributes:
        failure_id: ID of the failure record (challenge attempt)
        failed_at: When the failure occurred (defaults to now)
    """
    failure_id: str = Field(..., description="ID of the controlled failure record")
    failed_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="Timestamp when failure occurred"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "failure_id": "failure_001",
                "failed_at": "2025-10-17T10:00:00Z"
            }
        }


class RetryScheduleResponse(BaseModel):
    """
    Response model with calculated retry dates.

    Returns the spaced repetition schedule: [+1, +3, +7, +14, +30 days].
    Includes reasoning for transparency.
    """
    failure_id: str
    retry_dates: List[date] = Field(
        ...,
        min_length=5,
        max_length=5,
        description="Array of 5 retry dates: [+1d, +3d, +7d, +14d, +30d] from failure"
    )
    retry_intervals_days: List[int] = Field(
        default=[1, 3, 7, 14, 30],
        description="Days between failure and each retry"
    )
    reasoning: str = Field(
        ...,
        description="Explanation of the spaced repetition schedule"
    )
    variation_strategy: str = Field(
        ...,
        description="How retry questions will vary to prevent memorization"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "failure_id": "failure_001",
                "retry_dates": [
                    "2025-10-18",
                    "2025-10-20",
                    "2025-10-24",
                    "2025-10-31",
                    "2025-11-16"
                ],
                "retry_intervals_days": [1, 3, 7, 14, 30],
                "reasoning": "Spaced repetition schedule optimizes memory consolidation. Short initial interval (1 day) tests if corrective feedback stuck, then expanding intervals for long-term retention.",
                "variation_strategy": "Each retry uses slightly different question format (different clinical scenario, different distractors) to test understanding, not memorization of specific wording."
            }
        }


# ============================================================================
# Failure Pattern Models (for completeness, part of Task 6 but used in feedback)
# ============================================================================

class FailurePattern(BaseModel):
    """
    Represents a detected failure pattern for a user.

    Attributes:
        id: Unique identifier (generated by database)
        user_id: User who has this pattern
        pattern_type: Type of pattern (category, systematic_error, etc.)
        pattern_description: Human-readable description
        affected_objectives: List of objective IDs showing this pattern
        frequency: How many times this pattern appeared
        remediation: Recommended resources or actions
        detected_at: When pattern was first detected
    """
    id: str | None = None
    user_id: str
    pattern_type: str = Field(..., description="Type: 'category', 'systematic_error', 'topic'")
    pattern_description: str = Field(..., description="Human-readable pattern description")
    affected_objectives: List[str] = Field(default_factory=list, description="Objective IDs with this pattern")
    frequency: int = Field(..., ge=1, description="Number of failures showing this pattern")
    remediation: str = Field(..., description="Recommended remediation actions")
    detected_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "user123",
                "pattern_type": "category",
                "pattern_description": "Struggles with Pharmacology - ACE Inhibitors vs ARBs",
                "affected_objectives": ["obj1", "obj2", "obj3"],
                "frequency": 5,
                "remediation": "Review drug classes comparison chart. Practice with clinical vignettes distinguishing ACE-I vs ARB mechanisms.",
                "detected_at": "2025-10-17T10:00:00Z"
            }
        }


class PatternDetectionRequest(BaseModel):
    """Request to detect failure patterns for a user."""
    user_id: str
    min_frequency: int = Field(default=3, ge=1, description="Minimum frequency to consider a pattern")


class PatternDetectionResponse(BaseModel):
    """Response containing detected failure patterns."""
    patterns: List[FailurePattern]
    total_patterns: int
    detection_timestamp: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_schema_extra = {
            "example": {
                "patterns": [
                    {
                        "user_id": "user123",
                        "pattern_type": "category",
                        "pattern_description": "Pharmacology - Drug Classes",
                        "affected_objectives": ["obj1", "obj2", "obj3"],
                        "frequency": 5,
                        "remediation": "Review drug classification charts"
                    }
                ],
                "total_patterns": 1,
                "detection_timestamp": "2025-10-17T10:00:00Z"
            }
        }


class ControlledFailureRecord(BaseModel):
    """
    Represents a controlled failure attempt (from ValidationResponse).

    This is a simplified view used for pattern detection.
    In production, this would map to actual ValidationResponse records.
    """
    id: str
    user_id: str
    objective_id: str
    prompt_id: str
    is_correct: bool
    score: float = Field(..., ge=0.0, le=1.0)
    confidence_level: int | None = Field(None, ge=1, le=5)
    responded_at: datetime

    # Additional metadata for pattern detection
    concept_name: str | None = None
    course_name: str | None = None
    topic_tags: List[str] = Field(default_factory=list)
    board_exam_tags: List[str] = Field(default_factory=list)
