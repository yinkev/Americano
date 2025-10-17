"""
Challenge Question Generator (Story 4.3 Task 3)

Generates challenging questions using ChatMock/GPT-4 with instructor library.
Creates "near-miss" distractors designed to expose knowledge gaps.
"""

from typing import List, Literal
import instructor
from openai import OpenAI
from pydantic import BaseModel, Field

from ..config import settings


class MultipleChoiceOption(BaseModel):
    """Model for a multiple choice option."""

    option_letter: str = Field(..., description="Option letter (A, B, C, D, E)")
    option_text: str = Field(..., description="Full text of the option")
    is_correct: bool = Field(..., description="Whether this is the correct answer")
    distractor_rationale: str = Field(
        ...,
        description="Why this distractor is plausible (empty for correct answer)"
    )


class ChallengeQuestion(BaseModel):
    """
    Structured challenge question from ChatMock via instructor.

    This model is used as the response_model for instructor, ensuring
    the LLM returns data in exactly this format with validation.
    """

    question_stem: str = Field(
        ...,
        description="The main question text (may include clinical vignette)"
    )

    clinical_vignette: str = Field(
        default="",
        description="Optional patient scenario context (if applicable)"
    )

    options: List[MultipleChoiceOption] = Field(
        ...,
        min_length=4,
        max_length=5,
        description="4-5 multiple choice options with near-miss distractors"
    )

    correct_answer_letter: str = Field(
        ...,
        description="Letter of the correct answer (A, B, C, D, or E)"
    )

    explanation: str = Field(
        ...,
        description="Detailed explanation of correct answer and why distractors are incorrect"
    )

    teaching_point: str = Field(
        ...,
        description="Key learning point or clinical pearl"
    )

    difficulty_rationale: str = Field(
        ...,
        description="Why this question is challenging for the identified vulnerability"
    )


class ChallengeQuestionResponse(BaseModel):
    """Response model for generated challenge question."""

    question: ChallengeQuestion = Field(..., description="The generated challenge question")
    objective_id: str = Field(..., description="Source learning objective ID")
    vulnerability_type: str = Field(..., description="Type of vulnerability targeted")
    prompt_type: Literal["CONTROLLED_FAILURE"] = Field(
        default="CONTROLLED_FAILURE",
        description="Prompt type for database storage"
    )


class ChallengeQuestionGenerator:
    """
    Generates challenging questions using ChatMock/GPT-4 with structured outputs.

    Uses the instructor library to ensure structured, validated responses
    from the LLM that conform to Pydantic models.
    """

    def __init__(self):
        """Initialize the generator with instructor-patched OpenAI client."""
        # Use instructor to patch OpenAI client for structured outputs
        self.client = instructor.from_openai(
            OpenAI(api_key=settings.openai_api_key)
        )

    async def generate_challenge(
        self,
        objective_id: str,
        objective_text: str,
        vulnerability_type: str
    ) -> ChallengeQuestionResponse:
        """
        Generate a challenging question designed to expose knowledge gaps.

        Uses ChatMock/GPT-4 with instructor library for structured output.
        Creates "near-miss" distractors (plausible but incorrect) tailored
        to the specific vulnerability type.

        Args:
            objective_id: ID of the learning objective
            objective_text: Text content of the learning objective
            vulnerability_type: Type of vulnerability (overconfidence | partial_understanding | recent_mistakes)

        Returns:
            ChallengeQuestionResponse with structured question and metadata
        """
        # Build system prompt based on vulnerability type
        system_prompt = self._build_system_prompt(vulnerability_type)

        # Build user prompt with objective context
        user_prompt = f"""Learning Objective: {objective_text}

Generate a challenging multiple-choice question for this learning objective.

Requirements:
- The question should target {vulnerability_type}
- Create 4-5 answer options
- Use "near-miss" distractors (plausible but subtly incorrect)
- Include clinical vignette if appropriate
- Provide detailed explanation
- Include teaching point or clinical pearl

Focus: Make this question challenging enough to reveal knowledge gaps, but fair and educational."""

        # Use instructor for structured output
        challenge_question = self.client.chat.completions.create(
            model=settings.openai_model,  # GPT-4 or GPT-5 when available
            response_model=ChallengeQuestion,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7,  # Higher temperature for creative distractors
            max_tokens=2000,
        )

        return ChallengeQuestionResponse(
            question=challenge_question,
            objective_id=objective_id,
            vulnerability_type=vulnerability_type,
            prompt_type="CONTROLLED_FAILURE"
        )

    def _build_system_prompt(self, vulnerability_type: str) -> str:
        """
        Build specialized system prompt based on vulnerability type.

        Args:
            vulnerability_type: Type of vulnerability to target

        Returns:
            System prompt string optimized for the vulnerability type
        """
        base_prompt = """You are a medical education expert creating challenging multiple-choice questions.

Your goal is to create questions that:
1. Use "near-miss" distractors - options that are plausible but subtly incorrect
2. Expose knowledge gaps and misconceptions
3. Are educational and fair (not trick questions)
4. Include detailed explanations that teach

"""

        if vulnerability_type == "overconfidence":
            specific_instructions = """Target: OVERCONFIDENCE
The student feels confident but has knowledge gaps.

Focus on:
- Subtle nuances and fine distinctions
- Questions where "close enough" is wrong
- Common misconceptions that sound right
- Details that confident students often miss

Example distractor strategy:
- Correct answer: "Atrial fibrillation"
- Near-miss: "Atrial flutter" (similar rhythm, different treatment)
- Near-miss: "Multifocal atrial tachycardia" (irregular like AFib, but different mechanism)

Make the student think twice about their "confident" answer.
"""

        elif vulnerability_type == "partial_understanding":
            specific_instructions = """Target: PARTIAL UNDERSTANDING
The student has ~70% comprehension - gets the basics but misses depth.

Focus on:
- Application of concepts in complex scenarios
- Integration of related concepts
- Mechanisms vs memorized facts
- Clinical reasoning steps

Example distractor strategy:
- Correct answer: Requires understanding mechanism
- Near-miss: Matches memorized association but wrong mechanism
- Near-miss: Correct in different clinical context

Push the student beyond surface-level understanding.
"""

        elif vulnerability_type == "recent_mistakes":
            specific_instructions = """Target: RECENT MISTAKES
The student has made 3+ errors recently on this concept.

Focus on:
- Common confusion points for this topic
- Clarifying similar concepts
- Reinforcing correct associations
- Building systematic approach

Example distractor strategy:
- Correct answer: Clear and defensible
- Near-miss: The common mistake (what they likely got wrong before)
- Near-miss: Related but distinct concept

Help the student overcome their recurring errors.
"""

        else:
            specific_instructions = """Target: GENERAL CHALLENGE

Focus on:
- Testing depth of understanding
- Applying concepts clinically
- Distinguishing similar conditions
- Avoiding cognitive biases
"""

        return base_prompt + specific_instructions + """

Format requirements:
- Question stem: Clear and concise (may include clinical vignette)
- Options: 4-5 choices, each plausible
- Each distractor should have a rationale explaining why it's tempting but wrong
- Explanation: Comprehensive teaching moment
- Teaching point: One memorable clinical pearl

Remember: This is CHALLENGE MODE - designed to be difficult but fair.
"""
