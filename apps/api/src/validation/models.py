"""
Pydantic models for the Understanding Validation Engine.

These models define request/response structures for the validation API endpoints
and are used with instructor for structured LLM outputs.
"""

from pydantic import BaseModel, Field
from typing import Literal


# ============================================================================
# Request Models
# ============================================================================

class PromptGenerationRequest(BaseModel):
    """Request model for generating comprehension prompts."""

    objective_id: str = Field(..., description="ID of the learning objective")
    objective_text: str = Field(..., description="Text content of the learning objective")


class EvaluationRequest(BaseModel):
    """Request model for evaluating user comprehension."""

    prompt_id: str = Field(..., description="ID of the comprehension prompt")
    user_answer: str = Field(..., description="User's explanation (multi-paragraph allowed)")
    confidence_level: int = Field(..., ge=1, le=5, description="User's self-assessed confidence (1-5 scale)")
    objective_text: str = Field(..., description="The learning objective being tested")


# ============================================================================
# Response Models (Used with instructor for structured LLM outputs)
# ============================================================================

class PromptGenerationResponse(BaseModel):
    """Response model for generated comprehension prompts."""

    prompt_text: str = Field(..., description="The generated prompt text")
    prompt_type: Literal["Direct Question", "Clinical Scenario", "Teaching Simulation"] = Field(
        ...,
        description="Type of prompt template used"
    )
    expected_criteria: list[str] = Field(
        ...,
        description="Key concepts the user should cover in their explanation"
    )


class EvaluationResult(BaseModel):
    """
    Structured evaluation response from ChatMock via instructor.

    This model is used as the response_model for instructor, ensuring
    the LLM returns data in exactly this format with validation.
    """

    overall_score: int = Field(
        ...,
        ge=0,
        le=100,
        description="Weighted average score (terminology*0.20 + relationships*0.30 + application*0.30 + clarity*0.20)"
    )

    terminology_score: int = Field(
        ...,
        ge=0,
        le=100,
        description="Medical terminology usage score (20% weight)"
    )

    relationships_score: int = Field(
        ...,
        ge=0,
        le=100,
        description="Concept connections score (30% weight)"
    )

    application_score: int = Field(
        ...,
        ge=0,
        le=100,
        description="Clinical application score (30% weight)"
    )

    clarity_score: int = Field(
        ...,
        ge=0,
        le=100,
        description="Patient-friendly clarity score (20% weight)"
    )

    strengths: list[str] = Field(
        ...,
        min_length=2,
        max_length=3,
        description="2-3 bullet points on what was explained well"
    )

    gaps: list[str] = Field(
        ...,
        min_length=2,
        max_length=3,
        description="2-3 bullet points on what's missing or incorrect"
    )

    calibration_delta: float = Field(
        default=0.0,
        description="Confidence - Score (calculated post-LLM evaluation)"
    )

    calibration_note: str = Field(
        default="",
        description="User-friendly calibration insight (calculated post-LLM evaluation)"
    )


# ============================================================================
# Utility Models
# ============================================================================

class HealthCheckResponse(BaseModel):
    """Health check endpoint response."""

    status: Literal["healthy", "unhealthy"] = Field(..., description="Service health status")
    service: str = Field(default="americano-validation-api", description="Service name")
    version: str = Field(default="1.0.0", description="API version")


class ErrorResponse(BaseModel):
    """Standardized error response format."""

    error: str = Field(..., description="Error type/category")
    message: str = Field(..., description="Detailed error message")
    details: dict = Field(default_factory=dict, description="Additional error context")
    timestamp: str = Field(default="", description="Error timestamp (ISO format)")


class ValidationErrorDetail(BaseModel):
    """Validation error detail for request/response errors."""

    field: str = Field(..., description="Field that failed validation")
    message: str = Field(..., description="Validation error message")
    value: str = Field(default="", description="Invalid value that was provided")


# ============================================================================
# Story 4.2: Clinical Reasoning Scenarios - Request Models
# ============================================================================

class ScenarioGenerationRequest(BaseModel):
    """Request model for generating clinical case scenarios."""

    objective_id: str = Field(..., description="ID of the learning objective")
    objective_text: str = Field(..., description="Text content of the learning objective")
    board_exam_tags: list[str] = Field(..., description="Board exam topics (USMLE/COMLEX tags)")
    difficulty: Literal["BASIC", "INTERMEDIATE", "ADVANCED"] = Field(
        default="INTERMEDIATE",
        description="Difficulty level for case scenario"
    )


class ClinicalEvaluationRequest(BaseModel):
    """Request model for evaluating clinical reasoning on a scenario."""

    scenario_id: str = Field(..., description="ID of the clinical scenario")
    user_choices: dict = Field(..., description="JSON of user selections at each decision point")
    user_reasoning: str = Field(..., description="Free text explanation of clinical reasoning")
    time_spent: int = Field(..., ge=0, description="Time spent on scenario in seconds")
    case_summary: str = Field(..., description="Summary of the case for evaluation context")


# ============================================================================
# Story 4.2: Clinical Reasoning Scenarios - Response Models
# ============================================================================

class CaseStructure(BaseModel):
    """Structured clinical case presentation."""

    chief_complaint: str = Field(..., description="Patient's chief complaint")
    demographics: dict = Field(..., description="Age, sex, occupation, relevant social info")
    history: dict = Field(
        ...,
        description="HPI, PMH, medications, allergies, social history, family history"
    )
    physical_exam: dict = Field(
        ...,
        description="Vitals, general appearance, cardiovascular, respiratory, other systems"
    )
    labs: dict = Field(
        ...,
        description="Available initial labs, imaging results, and options for additional workup"
    )
    questions: list[dict] = Field(
        ...,
        description="Clinical decision questions at key stages (stage, prompt, options, correctAnswer, reasoning)"
    )


class ScenarioGenerationResponse(BaseModel):
    """Response model for generated clinical case scenarios."""

    scenario_id: str = Field(..., description="Generated unique scenario ID")
    objective_id: str = Field(..., description="Source learning objective ID")
    scenario_type: Literal["DIAGNOSIS", "MANAGEMENT", "DIFFERENTIAL", "COMPLICATIONS"] = Field(
        ...,
        description="Type of clinical reasoning tested"
    )
    difficulty: str = Field(..., description="Difficulty level (BASIC/INTERMEDIATE/ADVANCED)")
    case_text: CaseStructure = Field(..., description="Structured clinical case presentation")
    board_exam_topic: str = Field(..., description="Primary board exam topic tested")


class CompetencyScores(BaseModel):
    """Competency-based scores for clinical reasoning evaluation."""

    data_gathering: int = Field(..., ge=0, le=100, description="History/exam collection score")
    diagnosis: int = Field(..., ge=0, le=100, description="Diagnostic reasoning score")
    management: int = Field(..., ge=0, le=100, description="Treatment planning score")
    clinical_reasoning: int = Field(..., ge=0, le=100, description="Systematic thinking score")


class ClinicalEvaluationResult(BaseModel):
    """
    Structured clinical reasoning evaluation response from ChatMock via instructor.

    This model is used as the response_model for instructor, ensuring
    the LLM returns data in exactly this format with validation.
    """

    overall_score: int = Field(
        ...,
        ge=0,
        le=100,
        description="Weighted average of competency scores"
    )

    competency_scores: CompetencyScores = Field(
        ...,
        description="Breakdown by clinical competency domain"
    )

    strengths: list[str] = Field(
        ...,
        min_length=2,
        max_length=3,
        description="2-3 bullet points on what the student did well"
    )

    weaknesses: list[str] = Field(
        ...,
        min_length=2,
        max_length=3,
        description="2-3 bullet points on errors or missed opportunities"
    )

    missed_findings: list[str] = Field(
        ...,
        description="Critical findings the student overlooked (empty if none)"
    )

    cognitive_biases: list[str] = Field(
        ...,
        description="Cognitive biases detected (anchoring, premature closure, etc.)"
    )

    optimal_pathway: str = Field(
        ...,
        description="Brief description of the ideal diagnostic/management approach"
    )

    teaching_points: list[str] = Field(
        ...,
        min_length=2,
        max_length=4,
        description="Key learning points with resource suggestions"
    )


# ============================================================================
# Story 4.3: Controlled Failure and Challenge Generation - Request Models
# ============================================================================

class ChallengeIdentificationRequest(BaseModel):
    """Request model for identifying vulnerable concepts."""

    user_id: str = Field(..., description="User identifier")
    performance_data: list[dict] = Field(
        ...,
        description="List of performance records for analysis"
    )
    limit: int = Field(default=5, ge=1, le=10, description="Max concepts to return")


class ChallengeGenerationRequest(BaseModel):
    """Request model for generating challenge questions."""

    objective_id: str = Field(..., description="ID of the learning objective")
    objective_text: str = Field(..., description="Text content of the learning objective")
    vulnerability_type: str = Field(
        ...,
        description="Type of vulnerability: overconfidence | partial_understanding | recent_mistakes"
    )
