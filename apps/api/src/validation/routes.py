"""
API routes for the Understanding Validation Engine.

Provides endpoints for:
- Story 4.1: Prompt generation and comprehension evaluation
- Story 4.2: Clinical scenario generation and reasoning evaluation
"""

from fastapi import APIRouter, HTTPException, status, Request
from fastapi.responses import JSONResponse
from datetime import datetime
from typing import Union
from .models import (
    PromptGenerationRequest,
    PromptGenerationResponse,
    EvaluationRequest,
    EvaluationResult,
    ScenarioGenerationRequest,
    ScenarioGenerationResponse,
    ClinicalEvaluationRequest,
    ClinicalEvaluationResult,
    ChallengeIdentificationRequest,
    ChallengeGenerationRequest,
    ErrorResponse,
)
from .evaluator import ValidationEvaluator
from .scenario_generator import ClinicalScenarioGenerator
from .scenario_evaluator import ClinicalReasoningEvaluator
from .challenge_identifier import ChallengeIdentifier, ChallengeIdentificationResult
from .challenge_question_generator import ChallengeQuestionGenerator, ChallengeQuestionResponse

# Create router
router = APIRouter(prefix="/validation", tags=["validation"])

# Initialize evaluators (singleton pattern)
evaluator = ValidationEvaluator()
scenario_generator = ClinicalScenarioGenerator()
scenario_evaluator = ClinicalReasoningEvaluator()
challenge_identifier = ChallengeIdentifier()
challenge_generator = ChallengeQuestionGenerator()


# ============================================================================
# Custom Exception Handlers
# ============================================================================

class ValidationException(Exception):
    """Custom exception for validation service errors."""

    def __init__(self, message: str, error_type: str = "validation_error", details: dict = None):
        self.message = message
        self.error_type = error_type
        self.details = details or {}
        super().__init__(self.message)


async def validation_exception_handler(request: Request, exc: ValidationException):
    """Custom exception handler for validation service errors."""
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=ErrorResponse(
            error=exc.error_type,
            message=exc.message,
            details=exc.details,
            timestamp=datetime.utcnow().isoformat()
        ).dict()
    )


# ============================================================================
# Validation Helper Functions
# ============================================================================

def validate_scenario_request(request: ScenarioGenerationRequest) -> None:
    """
    Validate scenario generation request for business logic constraints.

    Args:
        request: ScenarioGenerationRequest to validate

    Raises:
        ValidationException: If request fails business validation
    """
    if len(request.objective_text.strip()) < 10:
        raise ValidationException(
            "Objective text must be at least 10 characters long",
            "invalid_objective",
            {"field": "objective_text", "min_length": 10}
        )

    if len(request.board_exam_tags) == 0:
        raise ValidationException(
            "At least one board exam tag must be provided",
            "missing_board_tags",
            {"field": "board_exam_tags", "min_count": 1}
        )

    # Validate board exam tag format
    valid_tags_prefixes = ["USMLE-", "COMLEX-", "NBME-"]
    for tag in request.board_exam_tags:
        if not any(tag.startswith(prefix) for prefix in valid_tags_prefixes):
            raise ValidationException(
                f"Invalid board exam tag format: {tag}",
                "invalid_board_tag",
                {"field": "board_exam_tags", "invalid_tag": tag, "valid_prefixes": valid_tags_prefixes}
            )


def validate_evaluation_request(request: ClinicalEvaluationRequest) -> None:
    """
    Validate clinical evaluation request for business logic constraints.

    Args:
        request: ClinicalEvaluationRequest to validate

    Raises:
        ValidationException: If request fails business validation
    """
    if request.time_spent < 0:
        raise ValidationException(
            "Time spent cannot be negative",
            "invalid_time_spent",
            {"field": "time_spent", "min_value": 0}
        )

    if request.time_spent > 3600:  # 1 hour max
        raise ValidationException(
            "Time spent exceeds maximum allowed duration",
            "invalid_time_spent",
            {"field": "time_spent", "max_value": 3600}
        )

    if len(request.user_reasoning.strip()) < 10:
        raise ValidationException(
            "User reasoning must be at least 10 characters long",
            "invalid_reasoning",
            {"field": "user_reasoning", "min_length": 10}
        )

    if not request.user_choices:
        raise ValidationException(
            "At least one user choice must be provided",
            "missing_choices",
            {"field": "user_choices", "min_count": 1}
        )


@router.post(
    "/generate-prompt",
    response_model=PromptGenerationResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate comprehension prompt",
    description="""
    Generate a varied "Explain to a patient" prompt for a learning objective.

    Uses ChatMock/GPT-4 to create prompts in 3 template types:
    - Direct Question
    - Clinical Scenario
    - Teaching Simulation

    Returns the prompt text, type, and expected criteria for evaluation.
    """
)
async def generate_prompt(request: PromptGenerationRequest) -> PromptGenerationResponse:
    """
    Generate a comprehension prompt for a learning objective.

    Args:
        request: PromptGenerationRequest with objective_id and objective_text

    Returns:
        PromptGenerationResponse with prompt_text, prompt_type, expected_criteria

    Raises:
        HTTPException: 500 if prompt generation fails
    """
    try:
        response = await evaluator.generate_prompt(
            objective_id=request.objective_id,
            objective_text=request.objective_text
        )
        return response

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prompt generation failed: {str(e)}"
        )


@router.post(
    "/evaluate",
    response_model=EvaluationResult,
    status_code=status.HTTP_200_OK,
    summary="Evaluate user comprehension",
    description="""
    Evaluate user's explanation using ChatMock/GPT-4 with structured output.

    Uses instructor library for Pydantic-validated responses that match
    the 4-dimensional scoring rubric:
    - Terminology (20%)
    - Relationships (30%)
    - Application (30%)
    - Clarity (20%)

    Also calculates confidence calibration metrics.
    """
)
async def evaluate_comprehension(request: EvaluationRequest) -> EvaluationResult:
    """
    Evaluate user's explanation against learning objective.

    Args:
        request: EvaluationRequest with prompt_id, user_answer, confidence_level, objective_text

    Returns:
        EvaluationResult with scores, strengths, gaps, calibration metrics

    Raises:
        HTTPException: 500 if evaluation fails
    """
    try:
        result = await evaluator.evaluate_comprehension(request)
        return result

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Evaluation failed: {str(e)}"
        )


# ============================================================================
# Story 4.2: Clinical Reasoning Scenarios
# ============================================================================

@router.post(
    "/scenarios/generate",
    response_model=ScenarioGenerationResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate clinical case scenario",
    description="""
    Generate a realistic clinical case scenario from a learning objective.

    Uses ChatMock/GPT-4 to create USMLE/COMLEX-style case vignettes with:
    - Realistic patient presentation (chief complaint, demographics, history)
    - Physical exam findings and vital signs
    - Lab/imaging results and diagnostic options
    - Multi-stage clinical decision questions
    - Board exam topic alignment

    Difficulty levels:
    - BASIC: Classic presentation, 1-2 decision points
    - INTERMEDIATE: Atypical features, 3-4 decision points
    - ADVANCED: Multiple comorbidities, 5+ decision points, cognitive bias traps
    """
)
async def generate_clinical_scenario(request: ScenarioGenerationRequest) -> ScenarioGenerationResponse:
    """
    Generate clinical case scenario for learning objective.

    Args:
        request: ScenarioGenerationRequest with objective_id, objective_text, board_exam_tags, difficulty

    Returns:
        ScenarioGenerationResponse with structured case and decision-point questions

    Raises:
        HTTPException: 500 if scenario generation fails
        ValidationException: If request fails business validation
    """
    try:
        # Validate request for business logic constraints
        validate_scenario_request(request)

        scenario = await scenario_generator.generate_scenario(
            objective_id=request.objective_id,
            objective_text=request.objective_text,
            board_exam_tags=request.board_exam_tags,
            difficulty=request.difficulty
        )
        return scenario

    except ValidationException as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": ve.error_type,
                "message": ve.message,
                "details": ve.details
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Scenario generation failed: {str(e)}"
        )


@router.post(
    "/scenarios/evaluate",
    response_model=ClinicalEvaluationResult,
    status_code=status.HTTP_200_OK,
    summary="Evaluate clinical reasoning",
    description="""
    Evaluate student's clinical reasoning on a case scenario using ChatMock/GPT-4.

    Uses instructor library for Pydantic-validated responses that score across
    4 competency domains:
    - Data Gathering (20%): History/exam collection, red flag recognition
    - Diagnosis (30%): Differential diagnosis, diagnostic test ordering
    - Management (30%): Treatment planning, safety, evidence-based care
    - Clinical Reasoning (20%): Systematic thinking, avoiding cognitive biases

    Also detects cognitive biases (anchoring, premature closure, confirmation bias, etc.)
    and provides specific teaching points with resource suggestions.
    """
)
async def evaluate_clinical_reasoning(request: ClinicalEvaluationRequest) -> ClinicalEvaluationResult:
    """
    Evaluate student's clinical reasoning on scenario.

    Args:
        request: ClinicalEvaluationRequest with scenario_id, user_choices, user_reasoning, time_spent, case_summary

    Returns:
        ClinicalEvaluationResult with competency scores, strengths, weaknesses, teaching points

    Raises:
        HTTPException: 500 if evaluation fails
        ValidationException: If request fails business validation
    """
    try:
        # Validate request for business logic constraints
        validate_evaluation_request(request)

        evaluation = await scenario_evaluator.evaluate_reasoning(
            scenario_id=request.scenario_id,
            user_choices=request.user_choices,
            user_reasoning=request.user_reasoning,
            case_summary=request.case_summary
        )
        return evaluation

    except ValidationException as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": ve.error_type,
                "message": ve.message,
                "details": ve.details
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Clinical reasoning evaluation failed: {str(e)}"
        )


@router.get(
    "/scenarios/metrics",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    summary="Get clinical reasoning performance metrics",
    description="""
    Retrieve performance metrics for clinical reasoning scenarios.

    Returns aggregate data including:
    - Competency score averages across all scenarios
    - Performance trends over time
    - Weak competency identification
    - Scenario type distribution
    - Board exam topic coverage

    Query Parameters:
    - dateRange: Time period for metrics (7days, 30days, 90days)
    - scenarioType: Filter by scenario type (optional)
    """
)
async def get_clinical_metrics(
    dateRange: str = "30days",
    scenarioType: str = None
) -> dict:
    """
    Get clinical reasoning performance metrics.

    Args:
        dateRange: Time period for metrics aggregation
        scenarioType: Optional filter by scenario type

    Returns:
        Dictionary with performance metrics and analytics

    Raises:
        HTTPException: 500 if metrics retrieval fails
    """
    try:
        # In a real implementation, this would query the database
        # For now, return simulated metrics structure

        # Simulated metrics - in production, calculate from database
        mock_metrics = {
            "period": dateRange,
            "total_scenarios": 15,
            "competency_averages": {
                "data_gathering": 78,
                "diagnosis": 72,
                "management": 75,
                "clinical_reasoning": 80
            },
            "overall_average": 76,
            "weak_competencies": [
                {
                    "competency": "diagnosis",
                    "average_score": 72,
                    "scenarios_count": 15,
                    "recommendation": "Focus on differential diagnosis generation and diagnostic test selection"
                }
            ],
            "scenario_type_distribution": {
                "DIAGNOSIS": 8,
                "MANAGEMENT": 4,
                "DIFFERENTIAL": 2,
                "COMPLICATIONS": 1
            },
            "board_exam_coverage": [
                {"topic": "Cardiology", "count": 5, "average_score": 79},
                {"topic": "Pulmonology", "count": 3, "average_score": 74},
                {"topic": "Gastroenterology", "count": 4, "average_score": 77},
                {"topic": "Neurology", "count": 3, "average_score": 73}
            ],
            "recent_performance": [
                {
                    "date": "2025-01-15",
                    "scenario_id": "scenario_abc123",
                    "scenario_type": "DIAGNOSIS",
                    "overall_score": 82,
                    "competency_scores": {
                        "data_gathering": 85,
                        "diagnosis": 78,
                        "management": 82,
                        "clinical_reasoning": 83
                    }
                }
            ]
        }

        # Filter by scenario type if specified
        if scenarioType:
            # In production, this would filter database queries
            mock_metrics["scenario_type_filter"] = scenarioType

        return mock_metrics

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve metrics: {str(e)}"
        )


@router.get(
    "/scenarios/{scenario_id}",
    response_model=ScenarioGenerationResponse,
    status_code=status.HTTP_200_OK,
    summary="Get clinical scenario by ID",
    description="""
    Retrieve a previously generated clinical scenario by its ID.

    This endpoint is used to reload scenarios for review or when returning
    to incomplete scenarios. Returns the full scenario structure including
    case details and decision-point questions.
    """
)
async def get_scenario(scenario_id: str) -> ScenarioGenerationResponse:
    """
    Retrieve a clinical scenario by ID.

    Args:
        scenario_id: Unique identifier for the clinical scenario

    Returns:
        ScenarioGenerationResponse with full scenario details

    Raises:
        HTTPException: 404 if scenario not found
        HTTPException: 500 if retrieval fails
    """
    try:
        # In a real implementation, this would retrieve from database
        # For now, return a simulated response structure
        # This would be implemented with actual database persistence

        # Simulate scenario retrieval - in production, fetch from database
        if not scenario_id or not scenario_id.startswith("scenario_"):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Scenario not found: {scenario_id}"
            )

        # This is a placeholder - in production, fetch from database
        # Return a basic structure to satisfy the response model
        from .models import CaseStructure, CompetencyScores
        from uuid import uuid4

        # Placeholder response - would be fetched from database
        mock_response = ScenarioGenerationResponse(
            scenario_id=scenario_id,
            objective_id=f"obj_{uuid4().hex[:8]}",
            scenario_type="DIAGNOSIS",
            difficulty="INTERMEDIATE",
            case_text=CaseStructure(
                chief_complaint="Sample scenario - retrieve from database",
                demographics={"age": 45, "sex": "M"},
                history={"presenting": "Sample history"},
                physical_exam={"vitals": {"BP": "120/80"}},
                labs={"available": False, "options": []},
                questions=[]
            ),
            board_exam_topic="Cardiology"
        )

        return mock_response

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve scenario: {str(e)}"
        )


# ============================================================================
# Story 4.3: Controlled Failure - Challenge Identification and Generation
# ============================================================================

@router.post(
    "/challenge/identify",
    response_model=ChallengeIdentificationResult,
    status_code=status.HTTP_200_OK,
    summary="Identify vulnerable concepts",
    description="""
    Identify vulnerable concepts for targeted challenge generation.

    Analyzes user performance patterns to detect:
    - Overconfidence: High confidence (4-5) but low scores (40-59%)
    - Partial Understanding: Comprehension scores 60-79%
    - Recent Mistakes: 3+ failures in last 7 days

    Uses weighted scoring algorithm:
    vulnerability_score = (overconfidence * 0.4) + (partial_understanding * 0.3) + (recent_mistakes * 0.3)

    Returns top 5 vulnerable concepts ranked by score.
    """
)
async def identify_vulnerable_concepts(
    request: ChallengeIdentificationRequest
) -> ChallengeIdentificationResult:
    """
    Identify vulnerable concepts for challenge generation.

    Args:
        request: ChallengeIdentificationRequest with user_id, performance_data, limit

    Returns:
        ChallengeIdentificationResult with top vulnerable concepts

    Raises:
        HTTPException: 500 if identification fails
    """
    try:
        result = await challenge_identifier.identify_vulnerable_concepts(
            user_id=request.user_id,
            performance_data=request.performance_data,
            limit=request.limit
        )
        return result

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Challenge identification failed: {str(e)}"
        )


@router.post(
    "/challenge/generate",
    response_model=ChallengeQuestionResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate challenge question",
    description="""
    Generate a challenging question using ChatMock/GPT-4 with instructor library.

    Creates "near-miss" distractors (plausible but incorrect) tailored to
    the specific vulnerability type:

    - Overconfidence: Targets subtle nuances and fine distinctions
    - Partial Understanding: Tests application and mechanism understanding
    - Recent Mistakes: Reinforces correct associations and clarifies confusions

    Returns structured question with:
    - Clinical vignette (if applicable)
    - 4-5 multiple choice options
    - Detailed explanation
    - Teaching point or clinical pearl
    - Difficulty rationale

    Stored in ValidationPrompt with promptType='CONTROLLED_FAILURE'
    """
)
async def generate_challenge_question(
    request: ChallengeGenerationRequest
) -> ChallengeQuestionResponse:
    """
    Generate challenge question for learning objective.

    Args:
        request: ChallengeGenerationRequest with objective_id, objective_text, vulnerability_type

    Returns:
        ChallengeQuestionResponse with structured challenge question

    Raises:
        HTTPException: 500 if generation fails
    """
    try:
        challenge = await challenge_generator.generate_challenge(
            objective_id=request.objective_id,
            objective_text=request.objective_text,
            vulnerability_type=request.vulnerability_type
        )
        return challenge

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Challenge generation failed: {str(e)}"
        )
