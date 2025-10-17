"""
Clinical Reasoning Evaluator for Story 4.2.

Uses instructor + OpenAI to evaluate student clinical reasoning
on case scenarios with competency-based scoring.
"""

import json
import instructor
from openai import OpenAI

from ..config import settings
from .models import ClinicalEvaluationResult


class ClinicalReasoningEvaluator:
    """
    Evaluates clinical reasoning on case scenarios using ChatMock/GPT-4.

    Scores across 4 competencies:
    - Data Gathering (20%): History/exam collection
    - Diagnosis (30%): Diagnostic reasoning
    - Management (30%): Treatment planning
    - Clinical Reasoning (20%): Systematic thinking
    """

    def __init__(self):
        """Initialize the evaluator with instructor-patched OpenAI client."""
        self.client = instructor.from_openai(
            OpenAI(api_key=settings.openai_api_key)
        )

    async def evaluate_reasoning(
        self,
        scenario_id: str,
        user_choices: dict,
        user_reasoning: str,
        case_summary: str
    ) -> ClinicalEvaluationResult:
        """
        Evaluate clinical reasoning using ChatMock/GPT-4 with structured output.

        Analyzes student's decision-making process across the clinical case,
        identifying strengths, weaknesses, missed findings, and cognitive biases.

        Args:
            scenario_id: ID of the clinical scenario
            user_choices: JSON dict of user selections at each decision point
            user_reasoning: Free text explanation of clinical reasoning
            case_summary: Summary of the case for evaluation context

        Returns:
            ClinicalEvaluationResult with scores, feedback, and teaching points
        """
        # System prompt with competency-based rubric
        system_prompt = """You are a medical education expert evaluating a medical student's clinical reasoning on a case scenario.

Score on 4 competencies (0-100 each):

**1. Data Gathering (20% weight):**
- Did they obtain relevant history and exam findings?
- Did they avoid unnecessary tests (shotgun approach)?
- Did they recognize red flags and critical findings?
- Was their diagnostic workup logical and cost-effective?

**2. Diagnosis (30% weight):**
- Is differential diagnosis appropriate and prioritized correctly?
- Are diagnostic tests ordered appropriately for likelihood?
- Did they reach the correct diagnosis (or close differential)?
- Was clinical reasoning systematic (not random guessing)?

**3. Management (30% weight):**
- Is treatment plan safe, effective, and evidence-based?
- Are medications dosed correctly and contraindications considered?
- Did they manage complications appropriately?
- Was management sequenced logically (stabilize, diagnose, treat)?

**4. Clinical Reasoning (20% weight):**
- Is thought process logical and systematic?
- Did they avoid cognitive biases (anchoring, premature closure, availability)?
- Can they justify decisions with evidence-based reasoning?
- Did they consider alternative explanations?

**Scoring Scale:**
- 0-59: Unsafe/Incorrect (errors that could harm patient)
- 60-79: Developing (partial reasoning, some gaps)
- 80-100: Competent (systematic, safe, evidence-based)

**Overall Score Calculation:**
overall_score = (data_gathering × 0.20) + (diagnosis × 0.30) + (management × 0.30) + (clinical_reasoning × 0.20)

**Cognitive Biases to Detect:**
- **Anchoring**: Fixating on initial impression despite contradictory data
- **Premature Closure**: Stopping diagnostic workup before confirming diagnosis
- **Availability Bias**: Diagnosing based on recent cases, not clinical evidence
- **Confirmation Bias**: Seeking data that confirms initial hypothesis, ignoring alternatives
- **Zebra Hunting**: Overdiagnosing rare conditions when common ones fit better
- **Sutton's Law Violation**: Not going for most likely diagnosis first

**Feedback Requirements:**
- Strengths: 2-3 specific things they did well (with clinical reasoning)
- Weaknesses: 2-3 specific errors or missed opportunities (with consequences)
- Missed Findings: Critical findings they overlooked (empty list if none)
- Cognitive Biases: Which biases were demonstrated (empty list if none)
- Optimal Pathway: Brief ideal approach (2-3 sentences)
- Teaching Points: 2-4 key learning points with resource suggestions (e.g., "Review Ottawa Ankle Rules - UpToDate", "Practice Ranson criteria for pancreatitis - USMLE-Rx")"""

        # Format user choices for evaluation
        user_choices_formatted = json.dumps(user_choices, indent=2)

        user_prompt = f"""Case Summary:
{case_summary}

Student Choices (at each decision point):
{user_choices_formatted}

Student Reasoning (free text explanation):
{user_reasoning}

Evaluate this student's clinical reasoning comprehensively. Provide:
1. Competency scores (0-100 each) with weighted overall score
2. Strengths (what they did well, 2-3 points)
3. Weaknesses (errors, missed opportunities, 2-3 points)
4. Missed findings (critical findings they overlooked)
5. Cognitive biases detected (if any)
6. Optimal pathway (ideal diagnostic/management approach)
7. Teaching points with specific resource suggestions (2-4 points)

Be specific in feedback - cite exact choices and reasoning statements."""

        # Use instructor for structured output
        # Temperature 0.3 for consistent scoring
        evaluation = self.client.chat.completions.create(
            model=settings.openai_model,
            response_model=ClinicalEvaluationResult,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.3,  # Consistent scoring
            max_tokens=2000,
        )

        return evaluation
