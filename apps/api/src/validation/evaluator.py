"""
AI Evaluation Engine for Understanding Validation.

Uses instructor + OpenAI for structured Pydantic-validated LLM responses.
"""

import random
from typing import Literal
import instructor
from openai import OpenAI
from pydantic import BaseModel, Field

from ..config import settings
from .models import (
    PromptGenerationResponse,
    EvaluationResult,
    EvaluationRequest
)
from .calibrator import ConfidenceCalibrator


class ValidationEvaluator:
    """
    Handles AI-powered comprehension validation using ChatMock/GPT-4.

    Uses the instructor library to ensure structured, validated responses
    from the LLM that conform to Pydantic models.
    """

    def __init__(self):
        """Initialize the evaluator with instructor-patched OpenAI client."""
        # Use instructor to patch OpenAI client for structured outputs
        self.client = instructor.from_openai(
            OpenAI(api_key=settings.openai_api_key)
        )
        # Initialize calibrator for confidence analysis (Task 9)
        self.calibrator = ConfidenceCalibrator()

    async def generate_prompt(
        self,
        objective_id: str,
        objective_text: str
    ) -> PromptGenerationResponse:
        """
        Generate a varied "Explain to a patient" prompt for a learning objective.

        Uses ChatMock to create 3 template types:
        - Direct Question: Direct request to explain concept
        - Clinical Scenario: Patient encounter scenario
        - Teaching Simulation: Teaching to specific audience

        Args:
            objective_id: ID of the learning objective
            objective_text: Text content of the learning objective

        Returns:
            PromptGenerationResponse with prompt_text, prompt_type, expected_criteria
        """
        # Randomly select prompt template type (Task 8.2: Random selection)
        prompt_type = random.choice([
            "Direct Question",
            "Clinical Scenario",
            "Teaching Simulation"
        ])

        # Task 8.1: Define 3 distinct prompt templates
        # Each template has unique system prompt for ChatMock to ensure variation

        if prompt_type == "Direct Question":
            # Direct Question Template: Simple, patient-focused explanation request
            system_prompt = """You are a medical education expert creating direct explanation prompts.

Generate a prompt asking the medical student to explain a concept as if teaching a patient.
The prompt should:
- Start with action verbs like "Explain", "Describe", or "Teach"
- Use patient-appropriate language (no medical jargon in the prompt)
- Be clear and concise
- Focus on practical understanding

Example formats (vary the exact wording):
- "Explain [concept] as if you're talking to a patient who has no medical background."
- "Describe [concept] in simple terms that a patient can understand."
- "How would you explain [concept] to someone asking what it means?"

Return the prompt text and the key medical concepts the student should cover."""

        elif prompt_type == "Clinical Scenario":
            # Clinical Scenario Template: Realistic patient encounter context
            system_prompt = """You are a medical education expert creating clinical scenario prompts.

Generate a prompt that places the student in a realistic patient encounter where they must explain a concept.
The prompt should:
- Create a believable patient interaction scenario
- Start with "A patient asks you..." or "During a clinic visit..."
- Include realistic patient context (age, concern, question)
- Require patient-appropriate language

Example formats (vary the details):
- "A patient asks you about [concept] after being diagnosed with [condition]. How would you explain it?"
- "During a clinic visit, a concerned family member wants to understand [concept]. What would you tell them?"
- "You're seeing a patient who is confused about [concept]. How do you explain it in a way they can understand?"

Return the prompt text and the key medical concepts the student should cover."""

        else:  # Teaching Simulation
            # Teaching Simulation Template: Teaching to specific audience
            system_prompt = """You are a medical education expert creating teaching simulation prompts.

Generate a prompt that asks the student to teach a concept to a specific audience (not necessarily patients).
The prompt should:
- Specify a clear audience (nursing students, family member, patient, medical assistant, etc.)
- Create an educational context
- Start with "You are teaching..." or "A [audience] asks you to explain..."
- Require appropriate language for the audience

Example formats (vary the audience and context):
- "You are teaching a group of nursing students about [concept]. What would you say?"
- "A patient's family member asks you to explain [concept] so they can help with care at home. How do you explain it?"
- "During patient education rounds, you need to explain [concept] to a newly diagnosed patient. What would you teach them?"

Return the prompt text and the key medical concepts the student should cover."""

        # User prompt with learning objective
        user_prompt = f"""Learning Objective: {objective_text}

Generate a "{prompt_type}" style prompt for this learning objective.
Ensure the prompt varies in exact wording - use creative phrasing to prevent students from recognizing patterns.
Include realistic details (patient age, specific concerns, clinical context) when appropriate."""

        # Task 8.4: Use ChatMock with temperature to ensure variation within templates
        # Temperature 0.3 provides balance between consistency and variation
        response = self.client.chat.completions.create(
            model=settings.openai_model,
            response_model=PromptGenerationResponse,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=settings.openai_temperature,  # 0.3 for variation + consistency
            max_tokens=settings.openai_max_tokens,
        )

        # Task 8.3: Template type stored in response (maps to promptData JSON in DB)
        return response

    async def evaluate_comprehension(
        self,
        request: EvaluationRequest
    ) -> EvaluationResult:
        """
        Evaluate user's explanation using ChatMock/GPT-4 with structured output.

        Uses instructor library for Pydantic-validated responses that match
        the 4-dimensional scoring rubric.

        Args:
            request: EvaluationRequest with prompt_id, user_answer, confidence_level, objective_text

        Returns:
            EvaluationResult with scores, strengths, gaps, calibration metrics
        """
        # System prompt with detailed rubric
        system_prompt = """You are a medical education expert evaluating a medical student's explanation.

Evaluate the explanation on 4 dimensions:

1. **Terminology (20%)**: Correct medical terms used appropriately in context
2. **Relationships (30%)**: Demonstrates connections between concepts and underlying mechanisms
3. **Application (30%)**: Applies knowledge to clinical scenarios and patient care
4. **Clarity (20%)**: Patient-friendly language without losing medical accuracy

Scoring Scale (0-100):
- 0-59: Needs Review (significant gaps, inaccurate, or unclear)
- 60-79: Developing (partial understanding, some gaps)
- 80-100: Proficient (comprehensive, accurate, clear)

**IMPORTANT**:
- Preserve medical terminology - do NOT oversimplify clinical terms
- Focus on accuracy AND patient communication
- Be specific in strengths and gaps (2-3 points each)

Calculate overall_score as weighted average:
overall_score = (terminology * 0.20) + (relationships * 0.30) + (application * 0.30) + (clarity * 0.20)"""

        # User prompt with context
        user_prompt = f"""Learning Objective: {request.objective_text}

Student's Explanation:
{request.user_answer}

Evaluate this explanation according to the rubric. Provide:
- Individual scores for each dimension (0-100)
- Overall weighted score
- 2-3 specific strengths (what they explained well)
- 2-3 specific gaps (what's missing or incorrect, with hints for improvement)"""

        # Use instructor for structured output (without calibration fields yet)
        class PreCalibrationEvaluation(BaseModel):
            """Intermediate model without calibration fields."""
            overall_score: int = Field(..., ge=0, le=100)
            terminology_score: int = Field(..., ge=0, le=100)
            relationships_score: int = Field(..., ge=0, le=100)
            application_score: int = Field(..., ge=0, le=100)
            clarity_score: int = Field(..., ge=0, le=100)
            strengths: list[str] = Field(..., min_length=2, max_length=3)
            gaps: list[str] = Field(..., min_length=2, max_length=3)

        evaluation = self.client.chat.completions.create(
            model=settings.openai_model,
            response_model=PreCalibrationEvaluation,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=settings.openai_temperature,
            max_tokens=settings.openai_max_tokens,
        )

        # Task 9: Use ConfidenceCalibrator for calibration analysis
        # TODO: Fetch historical calibration deltas from database for trend analysis
        # historical_deltas = await get_user_calibration_history(user_id, objective_id)
        calibration = self.calibrator.calculate_calibration(
            confidence_level=request.confidence_level,
            score=evaluation.overall_score,
            historical_deltas=None  # Future enhancement: pass historical data
        )

        # Return full EvaluationResult with calibration metrics
        return EvaluationResult(
            overall_score=evaluation.overall_score,
            terminology_score=evaluation.terminology_score,
            relationships_score=evaluation.relationships_score,
            application_score=evaluation.application_score,
            clarity_score=evaluation.clarity_score,
            strengths=evaluation.strengths,
            gaps=evaluation.gaps,
            calibration_delta=calibration.delta,
            calibration_note=calibration.note,
        )
