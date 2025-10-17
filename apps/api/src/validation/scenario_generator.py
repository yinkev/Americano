"""
Clinical Scenario Generator for Story 4.2.

Uses instructor + OpenAI to generate realistic clinical case scenarios
from learning objectives with board exam alignment.
"""

import uuid
import instructor
from openai import OpenAI

from ..config import settings
from .models import ScenarioGenerationResponse


class ClinicalScenarioGenerator:
    """
    Generates realistic clinical case scenarios from learning objectives.

    Uses ChatMock/GPT-4 with instructor for structured output that matches
    USMLE/COMLEX case presentation formats.
    """

    def __init__(self):
        """Initialize the generator with instructor-patched OpenAI client."""
        self.client = instructor.from_openai(
            OpenAI(api_key=settings.openai_api_key)
        )

    async def generate_scenario(
        self,
        objective_id: str,
        objective_text: str,
        board_exam_tags: list[str],
        difficulty: str = "INTERMEDIATE"
    ) -> ScenarioGenerationResponse:
        """
        Generate clinical case scenario from learning objective.

        Creates a realistic patient case with:
        - Chief complaint and demographics
        - History (HPI, PMH, medications, social, family)
        - Physical exam findings
        - Lab/imaging results and options
        - Multi-stage clinical decision questions

        Args:
            objective_id: ID of the source learning objective
            objective_text: Text content of the learning objective
            board_exam_tags: Board exam topics (e.g., ["USMLE-Step2-Cardio"])
            difficulty: BASIC, INTERMEDIATE, or ADVANCED

        Returns:
            ScenarioGenerationResponse with structured case and questions
        """
        # Build system prompt based on difficulty level
        difficulty_guidelines = self._get_difficulty_guidelines(difficulty)

        system_prompt = f"""You are a medical education expert creating clinical case scenarios for USMLE/COMLEX board exam preparation.

Create a realistic clinical case that tests diagnostic reasoning, NOT just recall. The case should:
- Present a realistic patient with chief complaint, demographics, history
- Include relevant physical exam findings (vitals, general, system-specific)
- Offer diagnostic workup options (labs, imaging)
- Test clinical decision-making at key decision points
- Align with USMLE/COMLEX case formats
- Match the specified difficulty level

**Difficulty Guidelines:**
{difficulty_guidelines}

**Case Structure Requirements:**
1. Chief Complaint: Patient's presenting concern in their own words
2. Demographics: Age, sex, occupation, relevant social context
3. History:
   - HPI: Detailed presenting illness timeline
   - PMH: Past medical history, prior surgeries
   - Medications: Current medications with dosages
   - Allergies: Drug allergies (or "NKDA")
   - Social: Smoking, alcohol, substance use, occupation
   - Family: Relevant family medical history
4. Physical Exam:
   - Vitals: Temperature, BP, HR, RR, SpO2
   - General: Overall appearance, distress level
   - Cardiovascular: Heart sounds, JVP, edema
   - Respiratory: Breath sounds, chest expansion
   - Other systems: As relevant to chief complaint
5. Labs/Imaging:
   - Initial: What's already available
   - Options: What student can request (with reasonable choices)
6. Questions: 3-5 clinical decision questions at key stages
   - Each question: stage name, prompt, 4 options, correctAnswer, reasoning

**Clinical Realism:**
- Use realistic vital signs and lab values
- Include red herrings (findings that seem relevant but aren't)
- Avoid zebras (rare diagnoses) unless ADVANCED difficulty
- Ensure timeline makes clinical sense
- Use appropriate medical terminology

**Board Exam Alignment:**
Focus on these exam topics: {', '.join(board_exam_tags)}
Use question formats similar to USMLE/COMLEX vignettes."""

        user_prompt = f"""Learning Objective: {objective_text}

Difficulty: {difficulty}
Board Exam Tags: {', '.join(board_exam_tags)}

Generate a complete clinical case scenario that tests this learning objective.
Ensure the case requires clinical reasoning, not just knowledge recall.
Include 3-5 decision-point questions that progressively reveal the case."""

        # Use instructor for structured output
        # Temperature 0.4 for creative but consistent case generation
        response = self.client.chat.completions.create(
            model=settings.openai_model,
            response_model=ScenarioGenerationResponse,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.4,  # Creative but consistent
            max_tokens=4000,  # Scenarios are longer than simple prompts
        )

        # Generate unique scenario ID
        response.scenario_id = f"scenario_{uuid.uuid4().hex[:12]}"
        response.objective_id = objective_id

        return response

    def _get_difficulty_guidelines(self, difficulty: str) -> str:
        """
        Get difficulty-specific guidelines for case generation.

        Args:
            difficulty: BASIC, INTERMEDIATE, or ADVANCED

        Returns:
            Formatted difficulty guidelines string
        """
        guidelines = {
            "BASIC": """
- **BASIC**: Classic presentation, straightforward diagnosis
  - Textbook symptoms and signs
  - 1-2 decision points (diagnosis, initial management)
  - Common conditions (HTN, diabetes, community-acquired pneumonia)
  - Clear-cut next steps
  - Minimal distractors""",

            "INTERMEDIATE": """
- **INTERMEDIATE**: Atypical presentation, differential required
  - Some atypical features (elderly patient, comorbidities)
  - 3-4 decision points (workup, differential, treatment, follow-up)
  - Moderately complex cases requiring systematic approach
  - Multiple reasonable differentials to consider
  - Some red herrings in history/exam""",

            "ADVANCED": """
- **ADVANCED**: Multiple comorbidities, rare conditions, complex pathways
  - Presentation with confounding factors (multiple comorbidities, drug interactions)
  - 5+ decision points across diagnosis and management
  - Rare conditions or complex multi-system involvement
  - Requires integration of multiple knowledge domains
  - Cognitive bias traps (anchoring, premature closure)
  - Management complications or treatment failures"""
        }

        return guidelines.get(difficulty, guidelines["INTERMEDIATE"])
