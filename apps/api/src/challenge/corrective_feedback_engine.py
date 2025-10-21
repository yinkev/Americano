"""
CorrectiveFeedbackEngine for Story 4.3 Task 4.

Generates detailed corrective feedback using ChatMock (GPT-5) via instructor
for structured outputs. Implements the feedback rubric:
1. Explain misconception
2. Clarify correct concept
3. Provide clinical context
4. Create memorable anchor (mnemonic, visual analogy, patient story)
"""

import instructor
from openai import OpenAI
from typing import Optional

from .models import FeedbackRequest, FeedbackResponse, StructuredFeedback
from ..config import settings


class CorrectiveFeedbackEngine:
    """
    Generates corrective feedback for failed challenge attempts.

    Uses instructor library for reliable structured outputs from ChatMock.
    Emphasizes emotional anchoring and memorable learning moments.
    """

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize the feedback engine with OpenAI client and instructor.

        Args:
            api_key: OpenAI API key (defaults to settings)
        """
        self.api_key = api_key or settings.openai_api_key
        # Patch OpenAI client with instructor for structured outputs
        self.client = instructor.from_openai(OpenAI(api_key=self.api_key))

    async def generate_feedback(self, request: FeedbackRequest) -> FeedbackResponse:
        """
        Generate structured corrective feedback for an incorrect answer.

        This method uses ChatMock (GPT-5) with instructor to ensure reliable
        structured output following the feedback rubric.

        Args:
            request: FeedbackRequest with challenge context and answers

        Returns:
            FeedbackResponse with structured feedback and metadata

        Raises:
            Exception: If ChatMock API call fails after retries
        """
        system_prompt = self._build_system_prompt()
        user_prompt = self._build_user_prompt(request)

        try:
            # Use instructor for structured output
            # instructor automatically retries on validation failures
            feedback = self.client.chat.completions.create(
                model=settings.openai_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_model=StructuredFeedback,  # Pydantic model ensures structure
                temperature=0.7,  # Creative for memorable anchors
                max_tokens=1500,  # Enough for detailed feedback
            )

            # Return complete response
            return FeedbackResponse(
                challenge_id=request.challenge_id,
                feedback=feedback,
                # emotion_tag and personal_notes captured in UI later
            )

        except Exception as e:
            # Log error and re-raise
            print(f"L CorrectiveFeedbackEngine error: {e}")
            raise Exception(f"Failed to generate corrective feedback: {str(e)}")

    def _build_system_prompt(self) -> str:
        """
        Build the system prompt for ChatMock.

        Emphasizes:
        - Medical education expertise
        - Growth mindset language
        - Emotional anchoring principles
        - Memorable learning moments
        """
        return """You are a medical education expert specializing in corrective feedback that transforms failures into memorable learning moments.

Your goal is to help medical students learn from mistakes through:
1. **Misconception Explanation**: Clearly identify why their answer was wrong
2. **Correct Concept Clarification**: Explain the right concept with clinical context
3. **Clinical Anchoring**: Provide real-world patient scenarios
4. **Memory Anchoring**: Create memorable mnemonics, visual analogies, or patient stories

**Principles**:
- Use **growth mindset language**: "This is where learning happens!" not "You got it wrong"
- Emphasize **emotional encoding**: Make the correct concept memorable and vivid
- Provide **clinical context**: Always connect to patient care
- Create **memory anchors**: Mnemonics, visual metaphors, or patient narratives

**Rubric**:
1. misconception_explained (2-3 sentences): Why was the user's answer incorrect? What specific error did they make?
2. correct_concept (3-4 sentences): What's the correct understanding? Include mechanism, clinical relevance, and connections
3. clinical_context (2-3 sentences): Real-world patient scenario demonstrating this concept
4. memory_anchor (1-2 sentences): Memorable mnemonic, visual analogy, or patient story to aid retention
5. memory_anchor_type: Choose ONE: mnemonic | visual_analogy | patient_story | clinical_pearl

**Tone**: Encouraging, growth-oriented, clinically grounded. Never punitive or discouraging."""

    def _build_user_prompt(self, request: FeedbackRequest) -> str:
        """
        Build the user prompt with challenge context.

        Args:
            request: FeedbackRequest with answers and context

        Returns:
            Formatted prompt for ChatMock
        """
        return f"""**Learning Objective**: {request.objective_text}

**User's Answer** (INCORRECT):
{request.user_answer}

**Correct Answer**:
{request.correct_answer}

**Misconception Type**: {request.misconception_type}

---

Generate corrective feedback that:
1. Explains what specifically was wrong with the user's answer
2. Clarifies the correct concept with clinical reasoning
3. Provides a patient scenario demonstrating this concept
4. Creates a memorable anchor (choose the MOST effective type for this concept)

Remember: This is a **learning opportunity**, not a failure. Make the correct concept stick!"""

    def generate_feedback_sync(self, request: FeedbackRequest) -> FeedbackResponse:
        """
        Synchronous version of generate_feedback for testing.

        Args:
            request: FeedbackRequest with challenge context

        Returns:
            FeedbackResponse with structured feedback
        """
        system_prompt = self._build_system_prompt()
        user_prompt = self._build_user_prompt(request)

        try:
            feedback = self.client.chat.completions.create(
                model=settings.openai_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_model=StructuredFeedback,
                temperature=0.7,
                max_tokens=1500,
            )

            return FeedbackResponse(
                challenge_id=request.challenge_id,
                feedback=feedback,
            )

        except Exception as e:
            print(f"L CorrectiveFeedbackEngine sync error: {e}")
            raise Exception(f"Failed to generate corrective feedback: {str(e)}")
