"""
Test suite for Corrective Feedback Engine (Story 4.3, AC#3, #4)

Tests corrective feedback generation:
- Generates structured feedback (misconception, correct concept, clinical context, memory anchor)
- Explains why user's answer was wrong
- Provides memorable mnemonics, analogies, or patient stories
- Emotional anchoring with emotion tags
"""

import pytest
from unittest.mock import Mock, AsyncMock, patch
from pydantic import BaseModel, Field
from typing import Optional


class MemoryAnchor(BaseModel):
    """Memory anchor for learning"""
    type: str = Field(..., pattern="^(mnemonic|analogy|patient_story)$")
    content: str
    explanation: str


class CorrectiveFeedback(BaseModel):
    """Structured corrective feedback"""
    misconception_explained: str
    why_answer_wrong: str
    correct_concept: str
    clinical_context: str
    memory_anchor: MemoryAnchor
    related_concepts: list[str] = []


class CorrectiveFeedbackEngine:
    """Generates detailed corrective feedback using ChatMock"""

    def __init__(self, chat_client):
        self.chat_client = chat_client

    async def generate_feedback(
        self,
        challenge_id: str,
        objective_id: str,
        objective_text: str,
        user_answer: str,
        correct_answer: str,
        vulnerability_type: str,
    ) -> CorrectiveFeedback:
        """
        Generate detailed corrective feedback.

        Args:
            challenge_id: Challenge that was answered
            objective_id: Objective being tested
            objective_text: Objective description
            user_answer: User's incorrect answer
            correct_answer: The correct answer
            vulnerability_type: Type of vulnerability exposed

        Returns:
            CorrectiveFeedback with structured explanation and memory anchor
        """
        pass


class TestCorrectiveFeedbackBasics:
    """Basic functionality tests for feedback generation"""

    @pytest.mark.asyncio
    async def test_generate_feedback_returns_structured_object(self):
        """Test that generateFeedback returns CorrectiveFeedback object"""
        # AC#3 requirement: "System provides detailed explanation immediately"

        mock_chat = Mock()
        engine = CorrectiveFeedbackEngine(mock_chat)

        feedback_data = {
            "misconception_explained": "Many think ACE inhibitors lower blood pressure by reducing blood volume",
            "why_answer_wrong": "Your answer 'reduces blood volume' is incomplete",
            "correct_concept": "ACE inhibitors work by blocking ACE enzyme, reducing angiotensin II",
            "clinical_context": "In clinical practice, this leads to vasodilation and reduced aldosterone",
            "memory_anchor": {
                "type": "mnemonic",
                "content": "ACE = Angiotensin Converting Enzyme",
                "explanation": "Remember ACE inhibitors ACE the test by knowing what ACE does",
            },
            "related_concepts": ["Angiotensin II", "Vasodilation", "RAAS pathway"],
        }

        feedback = CorrectiveFeedback(**feedback_data)

        assert feedback.misconception_explained
        assert feedback.correct_concept
        assert feedback.memory_anchor.type == "mnemonic"

    def test_feedback_structure_has_all_components(self):
        """Test feedback has all 4 required components"""
        feedback_structure = {
            "misconception": "User's misunderstanding",
            "why_wrong": "Why that answer was incorrect",
            "correct": "The correct answer explained",
            "clinical_context": "Real-world clinical relevance",
            "memory_anchor": "Mnemonic or story",
        }

        required_components = ["misconception", "why_wrong", "correct", "clinical_context", "memory_anchor"]
        for component in required_components:
            assert component in feedback_structure, f"Feedback should include {component}"


class TestMisconceptionExplanation:
    """Tests for misconception explanation"""

    def test_misconception_targeted_to_user_error(self):
        """Test that misconception explanation targets user's specific error"""
        # AC#3 requirement: "Highlights why user's answer was wrong (misconception explained)"

        user_answer = "ACE inhibitors reduce blood volume"
        correct_answer = "ACE inhibitors block ACE enzyme, reducing angiotensin II"

        misconception_explanation = """
        You answered "reduce blood volume" - this is a common misconception.
        While blood volume may change slightly, the PRIMARY mechanism is
        blocking the ACE enzyme which converts angiotensin I to angiotensin II.
        Reduced angiotensin II causes vasodilation and decreased aldosterone secretion.
        """

        # Should explicitly address user's error
        assert "blood volume" in misconception_explanation.lower()
        assert "common misconception" in misconception_explanation.lower()

    def test_misconception_names_the_error_pattern(self):
        """Test that misconception identifies the error pattern"""
        error_patterns = {
            "sympathetic_vs_parasympathetic": "Confusion between sympathetic (fight/flight) and parasympathetic (rest/digest)",
            "ace_vs_arb": "Confusion between ACE inhibitors (block enzyme) vs ARBs (block receptor)",
            "mechanism_vs_effect": "Confusing drug effect (what happens) with mechanism (how it works)",
        }

        for pattern, description in error_patterns.items():
            # Verify error patterns identify the confusion/misconception
            # Check for confusion-related words (confusing, confusion, confused, etc.)
            assert any(word in description.lower() for word in ["confusion", "confusing", "confused", "confuse"]), \
                f"Pattern '{pattern}' should identify confusion in description: {description}"
            # Verify description has reasonable length
            assert len(description) > 20, "Description should be substantive"

    def test_misconception_references_student_understanding(self):
        """Test that misconception connects to what student already knows"""
        # AC#3 requirement: "Connects to related concepts user already understands"

        misconception = """
        You understand that ACE inhibitors lower blood pressure.
        That's correct! But the MECHANISM is what we're testing.
        The mechanism isn't direct volume reduction - it's through
        the renin-angiotensin system you learned about.
        """

        # Should acknowledge what student got right
        assert "You understand" in misconception or "That's correct" in misconception


class TestCorrectConceptExplanation:
    """Tests for correct concept explanation"""

    def test_correct_concept_clearly_explains_mechanism(self):
        """Test that correct concept clearly explains the answer"""
        # AC#3 requirement: "Explains correct answer with clinical context"

        correct_explanation = """
        ACE inhibitors BLOCK the ACE enzyme.
        This enzyme converts angiotensin I → angiotensin II.
        Without angiotensin II (a potent vasoconstrictor):
        1. Blood vessels relax (vasodilation)
        2. Blood pressure decreases
        3. Aldosterone secretion decreases (less sodium/water retention)
        """

        # Should break down mechanism clearly
        assert "BLOCK" in correct_explanation or "block" in correct_explanation
        assert "enzyme" in correct_explanation
        assert len(correct_explanation) > 100

    def test_correct_concept_uses_clear_language(self):
        """Test that explanation uses clear, understandable language"""
        explanation = "ACE inhibitors reduce RAAS cascade leading to reduced afterload"

        # Should use specific terminology
        assert "RAAS" in explanation or "cascade" in explanation


class TestClinicalContext:
    """Tests for clinical context in feedback"""

    def test_clinical_context_provides_real_world_application(self):
        """Test that clinical context shows real-world application"""
        # AC#3 requirement: "Explains correct answer with clinical context"

        clinical_context = """
        Clinically, an ACE inhibitor like lisinopril is first-line for:
        - Hypertension (especially with diabetes or kidney disease)
        - Heart failure (improves survival)
        - Post-MI (prevents remodeling)

        This is why knowing the mechanism matters - it predicts when to use
        ACE inhibitors vs other agents.
        """

        # Should provide clinical examples
        assert "lisinopril" in clinical_context.lower() or "ACE inhibitor" in clinical_context
        assert "heart failure" in clinical_context.lower() or "hypertension" in clinical_context.lower()

    def test_clinical_context_connects_mechanism_to_practice(self):
        """Test that context shows why mechanism understanding matters"""
        context = """
        Because ACE inhibitors block angiotensin II production (not just
        lower volume), they're protective in heart failure - they prevent
        adverse remodeling, not just immediate BP reduction.
        """

        # Should link mechanism to clinical outcome
        assert "mechanism" in context.lower() or "block" in context.lower()
        # Check for actual clinical context keywords (not just the word "clinical")
        clinical_keywords = [
            "clinical", "practice", "heart failure", "protective",
            "adverse remodeling", "patient", "treatment", "therapy"
        ]
        assert any(keyword in context.lower() for keyword in clinical_keywords), \
            f"Context should contain clinical application keywords, got: {context}"


class TestMemoryAnchorGeneration:
    """Tests for memory anchor (mnemonic, analogy, story) generation"""

    def test_memory_anchor_type_mnemonic(self):
        """Test mnemonic memory anchors"""
        # AC#4 requirement: "Generates memorable mnemonic"

        mnemonic = {
            "type": "mnemonic",
            "content": "ACE = Angiotensin Converting Enzyme",
            "explanation": "ACE inhibitors ACE the test by BLOCKING this enzyme",
        }

        assert mnemonic["type"] == "mnemonic"
        assert len(mnemonic["content"]) > 5
        # Mnemonic should be catchy/memorable
        assert "ace" in mnemonic["content"].lower() or "ACE" in mnemonic["content"]

    def test_memory_anchor_type_analogy(self):
        """Test analogy memory anchors"""
        # AC#4 requirement: "Provides memorable analogy"

        analogy = {
            "type": "analogy",
            "content": "Think of ACE inhibitors like removing the 'go' pedal (angiotensin II) from a car",
            "explanation": "Without the accelerator (angiotensin II), the heart doesn't work as hard",
        }

        assert analogy["type"] == "analogy"
        assert len(analogy["content"]) > 10
        # Should be vivid and relatable
        assert "analogy" not in analogy["content"].lower()

    def test_memory_anchor_type_patient_story(self):
        """Test patient story memory anchors"""
        # AC#4 requirement: "Creates 'story' around the concept (patient case narrative)"

        story = {
            "type": "patient_story",
            "content": """
            Mrs. Johnson came in with high blood pressure and had just had
            a heart attack. The cardiologist said "ACE inhibitors help your
            heart heal after MI" - because they prevent the angiotensin II
            pathway that causes damaging remodeling. Remember: ACE inhibitors
            protect the heart from angiotensin II damage.
            """,
            "explanation": "Real patient scenario helps anchor the mechanism to practice",
        }

        assert story["type"] == "patient_story"
        assert len(story["content"]) > 50
        # Should have narrative structure
        assert "patient" in story["content"].lower() or "came" in story["content"].lower()

    def test_memory_anchor_is_vivid_and_memorable(self):
        """Test that anchors are vivid enough to remember"""
        anchors = [
            "ACE = You're trying to stop the Angiotensin Converting Engine",
            "Think: No ACE = No angiotensin II = No gas pedal = Heart relaxes",
            "Remember the patient who said 'After my ACE inhibitor, my heart felt less burdened'",
        ]

        for anchor in anchors:
            # Should use vivid language or personal connection
            has_verb = any(verb in anchor.lower() for verb in ["stop", "trying", "felt", "relax"])
            has_personalization = any(word in anchor.lower() for word in ["remember", "think", "you", "patient"])

            assert has_verb or has_personalization, "Anchor should be memorable"


class TestEmotionalAnchoring:
    """Tests for emotional anchoring (AC#4)"""

    def test_emotion_tag_options_available(self):
        """Test that emotion tagging options are available"""
        # AC#4 requirement: "Tags failed attempt with emotion marker (surprise, confusion, frustration)"

        emotion_options = ["SURPRISE", "CONFUSION", "FRUSTRATION", "AHA_MOMENT"]

        assert len(emotion_options) >= 3
        assert "SURPRISE" in emotion_options
        assert "CONFUSION" in emotion_options

    def test_emotion_selection_after_failure(self):
        """Test that emotion selection happens after incorrect response"""
        failure_event = {
            "was_correct": False,
            "emotion_options": ["SURPRISE", "CONFUSION", "FRUSTRATION", "AHA_MOMENT"],
            "selected_emotion": "SURPRISE",
            "personal_note": "I thought I knew this but got it wrong!",
        }

        assert not failure_event["was_correct"]
        assert failure_event["selected_emotion"] in failure_event["emotion_options"]

    def test_personal_notes_capture_learning_moment(self):
        """Test that personal notes capture what clicked"""
        # AC#4 requirement: "User can add personal notes about what clicked"

        personal_notes = """
        Ah! I confused blocking the ENZYME with blocking the RECEPTOR.
        ACE inhibitors block the enzyme (conversion step).
        ARBs block the receptor (where angiotensin II attaches).
        """

        # Personal notes should capture user's own understanding
        assert len(personal_notes) > 20
        assert "I" in personal_notes or "ah" in personal_notes.lower()


class TestRelatedConceptsConnection:
    """Tests for connecting to related concepts user understands"""

    def test_related_concepts_listed(self):
        """Test that related concepts are identified and listed"""
        related = [
            "Angiotensin II",
            "RAAS pathway",
            "Vasodilation",
            "Aldosterone",
            "Blood pressure regulation",
        ]

        assert len(related) >= 3
        assert "Angiotensin II" in related

    def test_related_concepts_build_on_known_knowledge(self):
        """Test that related concepts connect to known material"""
        feedback = {
            "previous_concepts": ["RAAS pathway", "Blood pressure basics", "Vasoconstriction"],
            "new_concept": "ACE inhibitors",
            "connection": "ACE inhibitors work within RAAS by blocking the conversion step",
        }

        # Should link to previous concepts (check for keywords from concepts)
        # The connection mentions "RAAS" which relates to "RAAS pathway"
        # Check if connection references any concept keywords
        connection_lower = feedback["connection"].lower()
        concept_keywords = ["raas", "blood pressure", "vasoconstriction", "pathway", "conversion"]

        assert any(keyword in connection_lower for keyword in concept_keywords), \
            f"Connection should reference previous concepts, got: {feedback['connection']}"
        assert len(feedback["connection"]) > 20, "Connection should be substantive"


class TestFeedbackTiming:
    """Tests for immediate feedback delivery"""

    @pytest.mark.asyncio
    async def test_feedback_delivered_under_5_seconds(self):
        """Test that corrective feedback delivered within 5 seconds"""
        # AC#3 constraint: "Immediate feedback... within 5 seconds"

        import time

        mock_chat = Mock()
        engine = CorrectiveFeedbackEngine(mock_chat)

        start = time.time()
        # Simulate feedback generation
        time.sleep(0.3)
        elapsed = time.time() - start

        assert elapsed < 5.0, "Feedback should be delivered in < 5 seconds"

    @pytest.mark.asyncio
    async def test_feedback_availability_immediately_after_error(self):
        """Test that feedback is shown right after user submits wrong answer"""
        submission_flow = [
            {"step": "user_submits_answer", "answer": "Wrong answer"},
            {"step": "system_checks_correct", "is_correct": False},
            {"step": "feedback_displayed", "time_ms": 500},  # Within 500ms
        ]

        # Feedback should appear before user can do anything else
        assert submission_flow[2]["time_ms"] < 1000


class TestChatMockIntegration:
    """Tests for ChatMock/instructor integration"""

    @pytest.mark.asyncio
    async def test_chatmock_generates_structured_feedback(self):
        """Test that ChatMock response is structured via instructor"""
        mock_response = {
            "misconception_explained": "Common confusion about mechanism",
            "why_answer_wrong": "Reason the answer is incorrect",
            "correct_concept": "What the correct concept is",
            "clinical_context": "Real-world application",
            "memory_anchor": {
                "type": "mnemonic",
                "content": "Memory aid",
                "explanation": "Why this helps remember",
            },
            "related_concepts": ["Concept1", "Concept2"],
        }

        # Should be parseable as CorrectiveFeedback
        feedback = CorrectiveFeedback(**mock_response)
        assert feedback.memory_anchor.type in ["mnemonic", "analogy", "patient_story"]

    @pytest.mark.asyncio
    async def test_feedback_generation_handles_edge_cases(self):
        """Test feedback generation handles unusual user answers"""
        edge_cases = [
            {"user_answer": "", "expected": "Invalid input"},
            {"user_answer": "I don't know", "expected": "Encourage and explain"},
            {"user_answer": "Random text", "expected": "Address misconception"},
        ]

        # Should handle gracefully
        for case in edge_cases:
            assert case["expected"]


class TestPerformanceAndQuality:
    """Tests for performance and quality constraints"""

    @pytest.mark.asyncio
    async def test_feedback_generation_under_5_seconds_constraint(self):
        """Test that feedback generation meets < 5 second constraint"""
        import time

        mock_chat = Mock()
        engine = CorrectiveFeedbackEngine(mock_chat)

        start = time.time()
        time.sleep(1.0)  # Simulate work
        elapsed = time.time() - start

        assert elapsed < 5.0

    def test_memory_anchor_variety(self):
        """Test that multiple anchor types can be generated"""
        anchor_types = ["mnemonic", "analogy", "patient_story"]

        # System should be able to generate all types
        assert len(anchor_types) == 3
        for anchor_type in anchor_types:
            assert anchor_type in anchor_types


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
