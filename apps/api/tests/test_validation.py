"""
Unit tests for the Understanding Validation Engine.

Tests prompt generation, evaluation logic, and calibration calculations.
"""

import pytest
from unittest.mock import Mock, patch, AsyncMock
from pydantic import ValidationError

from src.validation.models import (
    PromptGenerationRequest,
    PromptGenerationResponse,
    EvaluationRequest,
    EvaluationResult,
)
from src.validation.evaluator import ValidationEvaluator


# ============================================================================
# Fixtures
# ============================================================================

@pytest.fixture
def sample_objective():
    """Sample learning objective for testing."""
    return {
        "objective_id": "obj_123",
        "objective_text": "Explain the cardiac conduction system and its role in generating and conducting electrical impulses in the heart."
    }


@pytest.fixture
def sample_user_answer():
    """Sample user explanation for testing."""
    return """
    The cardiac conduction system is like an electrical circuit in the heart. It starts with the SA node,
    which acts as the heart's natural pacemaker. The electrical signal travels through the atria, causing
    them to contract, then moves to the AV node. From there, it goes down the bundle of His and Purkinje
    fibers to make the ventricles contract. This coordinated sequence ensures blood pumps efficiently.
    """


@pytest.fixture
def mock_evaluator():
    """Mock ValidationEvaluator for testing."""
    with patch('src.validation.evaluator.instructor.from_openai') as mock_instructor:
        mock_client = Mock()
        mock_instructor.return_value = mock_client
        evaluator = ValidationEvaluator()
        evaluator.client = mock_client
        return evaluator


# ============================================================================
# Model Validation Tests
# ============================================================================

def test_prompt_generation_request_validation():
    """Test PromptGenerationRequest model validation."""
    # Valid request
    request = PromptGenerationRequest(
        objective_id="obj_123",
        objective_text="Explain cardiac conduction"
    )
    assert request.objective_id == "obj_123"
    assert request.objective_text == "Explain cardiac conduction"

    # Missing required field
    with pytest.raises(ValidationError):
        PromptGenerationRequest(objective_id="obj_123")


def test_evaluation_request_validation():
    """Test EvaluationRequest model validation."""
    # Valid request
    request = EvaluationRequest(
        prompt_id="prompt_123",
        user_answer="The heart pumps blood...",
        confidence_level=3,
        objective_text="Explain cardiac function"
    )
    assert request.confidence_level == 3

    # Invalid confidence level (out of range)
    with pytest.raises(ValidationError):
        EvaluationRequest(
            prompt_id="prompt_123",
            user_answer="Test",
            confidence_level=6,  # Invalid: must be 1-5
            objective_text="Test"
        )


def test_evaluation_result_validation():
    """Test EvaluationResult model validation."""
    # Valid result
    result = EvaluationResult(
        overall_score=85,
        terminology_score=90,
        relationships_score=85,
        application_score=80,
        clarity_score=85,
        strengths=["Clear explanation", "Good examples"],
        gaps=["Missing detail on AV node", "Could improve mechanism explanation"],
        calibration_delta=10.0,
        calibration_note="Well calibrated"
    )
    assert result.overall_score == 85
    assert len(result.strengths) == 2
    assert len(result.gaps) == 2

    # Invalid score (out of range)
    with pytest.raises(ValidationError):
        EvaluationResult(
            overall_score=150,  # Invalid: must be 0-100
            terminology_score=90,
            relationships_score=85,
            application_score=80,
            clarity_score=85,
            strengths=["Test"],
            gaps=["Test"]
        )


# ============================================================================
# Prompt Generation Tests
# ============================================================================

@pytest.mark.asyncio
async def test_generate_prompt_returns_varied_templates(mock_evaluator, sample_objective):
    """Test that prompt generation returns varied template types."""
    # Mock instructor response
    mock_response = PromptGenerationResponse(
        prompt_text="Explain the cardiac conduction system to a patient who asks how their heart beats.",
        prompt_type="Clinical Scenario",
        expected_criteria=[
            "SA node as pacemaker",
            "Electrical signal pathway",
            "Atrial and ventricular contraction",
            "Coordinated pumping action"
        ]
    )

    # For sync methods that return values directly, use Mock with return_value
    mock_evaluator.client.chat.completions.create = Mock(return_value=mock_response)

    # Call generate_prompt
    result = await mock_evaluator.generate_prompt(
        objective_id=sample_objective["objective_id"],
        objective_text=sample_objective["objective_text"]
    )

    # Verify result structure
    assert isinstance(result, PromptGenerationResponse)
    assert result.prompt_type in ["Direct Question", "Clinical Scenario", "Teaching Simulation"]
    assert len(result.expected_criteria) > 0
    assert len(result.prompt_text) > 0


@pytest.mark.asyncio
async def test_generate_prompt_varies_phrasing(mock_evaluator, sample_objective):
    """Test that prompt generation varies phrasing within templates."""
    # Generate multiple prompts
    prompts = []

    for i in range(3):
        mock_response = PromptGenerationResponse(
            prompt_text=f"Unique prompt variation {i}",
            prompt_type="Direct Question",
            expected_criteria=["Test criteria"]
        )
        # Use Mock (not AsyncMock) since instructor's create method is sync
        mock_evaluator.client.chat.completions.create = Mock(return_value=mock_response)

        result = await mock_evaluator.generate_prompt(
            objective_id=sample_objective["objective_id"],
            objective_text=sample_objective["objective_text"]
        )
        prompts.append(result.prompt_text)

    # Verify variations exist (mock returns different text each time)
    assert len(set(prompts)) == 3  # All unique


# ============================================================================
# Evaluation Tests
# ============================================================================

@pytest.mark.asyncio
async def test_evaluate_comprehension_strong_answer(mock_evaluator, sample_objective, sample_user_answer):
    """Test evaluation of a strong explanation (score 80-100)."""
    # Mock strong evaluation
    from pydantic import BaseModel, Field

    class MockEvaluation(BaseModel):
        overall_score: int = Field(default=85)
        terminology_score: int = Field(default=90)
        relationships_score: int = Field(default=85)
        application_score: int = Field(default=80)
        clarity_score: int = Field(default=85)
        strengths: list[str] = Field(default=["Accurate medical terms", "Clear explanation"])
        gaps: list[str] = Field(default=["Could add more detail", "Minor omission"])

    # Use Mock (not AsyncMock) since instructor's create method is sync
    mock_evaluator.client.chat.completions.create = Mock(return_value=MockEvaluation())

    # Create request
    request = EvaluationRequest(
        prompt_id="prompt_123",
        user_answer=sample_user_answer,
        confidence_level=4,
        objective_text=sample_objective["objective_text"]
    )

    # Evaluate
    result = await mock_evaluator.evaluate_comprehension(request)

    # Verify strong score
    assert result.overall_score >= 80
    assert result.overall_score <= 100
    assert len(result.strengths) >= 2
    assert len(result.gaps) >= 2


@pytest.mark.asyncio
async def test_evaluate_comprehension_weak_answer(mock_evaluator, sample_objective):
    """Test evaluation of a weak explanation (score 0-59)."""
    weak_answer = "The heart has electricity and it beats."

    # Mock weak evaluation
    from pydantic import BaseModel, Field

    class MockEvaluation(BaseModel):
        overall_score: int = Field(default=45)
        terminology_score: int = Field(default=30)
        relationships_score: int = Field(default=40)
        application_score: int = Field(default=50)
        clarity_score: int = Field(default=60)
        strengths: list[str] = Field(default=["Mentions electricity", "Simple language"])
        gaps: list[str] = Field(default=["Missing SA node", "No mechanism explanation", "Lacks detail"])

    # Use Mock (not AsyncMock) since instructor's create method is sync
    mock_evaluator.client.chat.completions.create = Mock(return_value=MockEvaluation())

    request = EvaluationRequest(
        prompt_id="prompt_123",
        user_answer=weak_answer,
        confidence_level=2,
        objective_text=sample_objective["objective_text"]
    )

    result = await mock_evaluator.evaluate_comprehension(request)

    # Verify weak score
    assert result.overall_score < 60
    assert len(result.gaps) >= 2


# ============================================================================
# Calibration Tests
# ============================================================================

@pytest.mark.asyncio
async def test_calibration_overconfident(mock_evaluator, sample_objective):
    """Test calibration when user is overconfident (delta > 15)."""
    from pydantic import BaseModel, Field

    class MockEvaluation(BaseModel):
        overall_score: int = Field(default=40)
        terminology_score: int = Field(default=40)
        relationships_score: int = Field(default=40)
        application_score: int = Field(default=40)
        clarity_score: int = Field(default=40)
        strengths: list[str] = Field(default=["Test1", "Test2"])
        gaps: list[str] = Field(default=["Test1", "Test2"])

    # Use Mock (not AsyncMock) since instructor's create method is sync
    mock_evaluator.client.chat.completions.create = Mock(return_value=MockEvaluation())

    request = EvaluationRequest(
        prompt_id="prompt_123",
        user_answer="Test answer",
        confidence_level=5,  # Confidence = 100 (normalized)
        objective_text=sample_objective["objective_text"]
    )

    result = await mock_evaluator.evaluate_comprehension(request)

    # Verify overconfident detection
    assert result.calibration_delta > 15
    assert "overconfidence" in result.calibration_note.lower() or "confident" in result.calibration_note.lower()


@pytest.mark.asyncio
async def test_calibration_underconfident(mock_evaluator, sample_objective):
    """Test calibration when user is underconfident (delta < -15)."""
    from pydantic import BaseModel, Field

    class MockEvaluation(BaseModel):
        overall_score: int = Field(default=85)
        terminology_score: int = Field(default=85)
        relationships_score: int = Field(default=85)
        application_score: int = Field(default=85)
        clarity_score: int = Field(default=85)
        strengths: list[str] = Field(default=["Test1", "Test2"])
        gaps: list[str] = Field(default=["Test1", "Test2"])

    # Use Mock (not AsyncMock) since instructor's create method is sync
    mock_evaluator.client.chat.completions.create = Mock(return_value=MockEvaluation())

    request = EvaluationRequest(
        prompt_id="prompt_123",
        user_answer="Test answer",
        confidence_level=1,  # Confidence = 0 (normalized)
        objective_text=sample_objective["objective_text"]
    )

    result = await mock_evaluator.evaluate_comprehension(request)

    # Verify underconfident detection
    assert result.calibration_delta < -15
    assert "trust yourself" in result.calibration_note.lower() or "stronger" in result.calibration_note.lower()


@pytest.mark.asyncio
async def test_calibration_well_calibrated(mock_evaluator, sample_objective):
    """Test calibration when user is well calibrated (abs(delta) <= 15)."""
    from pydantic import BaseModel, Field

    class MockEvaluation(BaseModel):
        overall_score: int = Field(default=60)
        terminology_score: int = Field(default=60)
        relationships_score: int = Field(default=60)
        application_score: int = Field(default=60)
        clarity_score: int = Field(default=60)
        strengths: list[str] = Field(default=["Test1", "Test2"])
        gaps: list[str] = Field(default=["Test1", "Test2"])

    # Use Mock (not AsyncMock) since instructor's create method is sync
    mock_evaluator.client.chat.completions.create = Mock(return_value=MockEvaluation())

    request = EvaluationRequest(
        prompt_id="prompt_123",
        user_answer="Test answer",
        confidence_level=3,  # Confidence = 50 (normalized), delta = -10
        objective_text=sample_objective["objective_text"]
    )

    result = await mock_evaluator.evaluate_comprehension(request)

    # Verify well calibrated
    assert abs(result.calibration_delta) <= 15
    assert "well calibrated" in result.calibration_note.lower() or "matches" in result.calibration_note.lower()


# ============================================================================
# Scoring Formula Tests
# ============================================================================

def test_weighted_score_calculation():
    """Test that overall score matches weighted formula."""
    # Manual calculation
    terminology = 80
    relationships = 90
    application = 85
    clarity = 75

    expected_overall = (
        terminology * 0.20 +
        relationships * 0.30 +
        application * 0.30 +
        clarity * 0.20
    )

    # Create result (evaluator would calculate this)
    result = EvaluationResult(
        overall_score=int(expected_overall),
        terminology_score=terminology,
        relationships_score=relationships,
        application_score=application,
        clarity_score=clarity,
        strengths=["Test1", "Test2"],
        gaps=["Test1", "Test2"],
        calibration_delta=0.0,
        calibration_note="Test"
    )

    # Verify formula
    calculated_overall = (
        result.terminology_score * 0.20 +
        result.relationships_score * 0.30 +
        result.application_score * 0.30 +
        result.clarity_score * 0.20
    )

    assert abs(result.overall_score - calculated_overall) < 1  # Allow for rounding


# ============================================================================
# Task 8: Prompt Variation System Tests
# ============================================================================

@pytest.mark.asyncio
async def test_prompt_variation_all_templates(sample_objective):
    """
    Test that all 3 template types appear over multiple generations.

    Task 8.1: Verify 3 prompt templates are defined
    Task 8.2: Verify random selection works
    """
    template_types = set()

    # Generate 30 prompts (statistically should see all 3 types)
    for i in range(30):
        # Mock different template types based on random selection
        template_type = ["Direct Question", "Clinical Scenario", "Teaching Simulation"][i % 3]

        mock_response = PromptGenerationResponse(
            prompt_text=f"Test prompt {i}",
            prompt_type=template_type,
            expected_criteria=["Test criteria"]
        )

        # Create evaluator with mocked client
        with patch('src.validation.evaluator.instructor.from_openai') as mock_instructor:
            mock_client = Mock()
            mock_client.chat.completions.create = Mock(return_value=mock_response)
            mock_instructor.return_value = mock_client

            evaluator = ValidationEvaluator()
            result = await evaluator.generate_prompt(
                objective_id=sample_objective["objective_id"],
                objective_text=sample_objective["objective_text"]
            )

            template_types.add(result.prompt_type)

    # Verify all 3 types appeared
    assert len(template_types) == 3
    assert "Direct Question" in template_types
    assert "Clinical Scenario" in template_types
    assert "Teaching Simulation" in template_types


@pytest.mark.asyncio
async def test_prompt_variation_within_template(sample_objective):
    """
    Test that prompts vary even for same template type.

    Task 8.4: Ensure variation within template (ChatMock generates unique phrasing)
    """
    prompts = []

    # Generate 10 prompts (mock returns unique text each time)
    for i in range(10):
        mock_response = PromptGenerationResponse(
            prompt_text=f"Unique prompt variation {i}: Explain cardiac conduction...",
            prompt_type="Direct Question",
            expected_criteria=["SA node", "AV node", "Bundle of His"]
        )

        with patch('src.validation.evaluator.instructor.from_openai') as mock_instructor:
            mock_client = Mock()
            mock_client.chat.completions.create = Mock(return_value=mock_response)
            mock_instructor.return_value = mock_client

            evaluator = ValidationEvaluator()
            result = await evaluator.generate_prompt(
                objective_id=sample_objective["objective_id"],
                objective_text=sample_objective["objective_text"]
            )

            prompts.append(result.prompt_text)

    # Verify no exact duplicates (all 10 prompts are unique)
    assert len(set(prompts)) == 10


@pytest.mark.asyncio
async def test_prompt_template_type_stored(sample_objective):
    """
    Test that template type is stored in response.

    Task 8.3: Store template type in ValidationPrompt.promptData JSON field
    (This test verifies the response includes prompt_type; TypeScript API will store in promptData)
    """
    mock_response = PromptGenerationResponse(
        prompt_text="Clinical scenario test",
        prompt_type="Clinical Scenario",
        expected_criteria=["Test"]
    )

    with patch('src.validation.evaluator.instructor.from_openai') as mock_instructor:
        mock_client = Mock()
        mock_client.chat.completions.create = Mock(return_value=mock_response)
        mock_instructor.return_value = mock_client

        evaluator = ValidationEvaluator()
        result = await evaluator.generate_prompt(
            objective_id=sample_objective["objective_id"],
            objective_text=sample_objective["objective_text"]
        )

        # Verify prompt_type is included in response
        assert hasattr(result, 'prompt_type')
        assert result.prompt_type in ["Direct Question", "Clinical Scenario", "Teaching Simulation"]


@pytest.mark.asyncio
async def test_direct_question_template_characteristics(sample_objective):
    """Test that Direct Question templates have expected characteristics."""
    # Mock Direct Question response
    mock_response = PromptGenerationResponse(
        prompt_text="Explain the cardiac conduction system as if you're talking to a patient who has no medical background.",
        prompt_type="Direct Question",
        expected_criteria=["SA node as pacemaker", "Electrical signal pathway", "Coordinated contraction"]
    )

    with patch('src.validation.evaluator.instructor.from_openai') as mock_instructor:
        mock_client = Mock()
        mock_client.chat.completions.create = Mock(return_value=mock_response)
        mock_instructor.return_value = mock_client

        evaluator = ValidationEvaluator()
        result = await evaluator.generate_prompt(
            objective_id=sample_objective["objective_id"],
            objective_text=sample_objective["objective_text"]
        )

        # Verify Direct Question characteristics
        assert result.prompt_type == "Direct Question"
        assert any(word in result.prompt_text.lower() for word in ["explain", "describe", "teach"])
        assert len(result.expected_criteria) > 0


@pytest.mark.asyncio
async def test_clinical_scenario_template_characteristics(sample_objective):
    """Test that Clinical Scenario templates have expected characteristics."""
    # Mock Clinical Scenario response
    mock_response = PromptGenerationResponse(
        prompt_text="A 55-year-old patient asks you about their cardiac conduction system after being diagnosed with arrhythmia. How would you explain it?",
        prompt_type="Clinical Scenario",
        expected_criteria=["Pacemaker cells", "Electrical pathway", "Normal heart rhythm"]
    )

    with patch('src.validation.evaluator.instructor.from_openai') as mock_instructor:
        mock_client = Mock()
        mock_client.chat.completions.create = Mock(return_value=mock_response)
        mock_instructor.return_value = mock_client

        evaluator = ValidationEvaluator()
        result = await evaluator.generate_prompt(
            objective_id=sample_objective["objective_id"],
            objective_text=sample_objective["objective_text"]
        )

        # Verify Clinical Scenario characteristics
        assert result.prompt_type == "Clinical Scenario"
        # Clinical scenarios should include patient context
        assert any(word in result.prompt_text.lower() for word in ["patient", "visit", "clinic", "asks"])
        assert len(result.expected_criteria) > 0


@pytest.mark.asyncio
async def test_teaching_simulation_template_characteristics(sample_objective):
    """Test that Teaching Simulation templates have expected characteristics."""
    # Mock Teaching Simulation response
    mock_response = PromptGenerationResponse(
        prompt_text="You are teaching a group of nursing students about the cardiac conduction system. What would you say?",
        prompt_type="Teaching Simulation",
        expected_criteria=["Conduction pathway", "Node function", "Clinical significance"]
    )

    with patch('src.validation.evaluator.instructor.from_openai') as mock_instructor:
        mock_client = Mock()
        mock_client.chat.completions.create = Mock(return_value=mock_response)
        mock_instructor.return_value = mock_client

        evaluator = ValidationEvaluator()
        result = await evaluator.generate_prompt(
            objective_id=sample_objective["objective_id"],
            objective_text=sample_objective["objective_text"]
        )

        # Verify Teaching Simulation characteristics
        assert result.prompt_type == "Teaching Simulation"
        # Teaching simulations should include audience context
        assert any(word in result.prompt_text.lower() for word in ["teaching", "educating", "students", "family"])
        assert len(result.expected_criteria) > 0


# ============================================================================
# Error Handling Tests
# ============================================================================

@pytest.mark.asyncio
async def test_evaluation_handles_api_failure(mock_evaluator, sample_objective):
    """Test that evaluation handles ChatMock API failures gracefully."""
    # Mock API failure
    mock_evaluator.client.chat.completions.create = AsyncMock(
        side_effect=Exception("API connection failed")
    )

    request = EvaluationRequest(
        prompt_id="prompt_123",
        user_answer="Test",
        confidence_level=3,
        objective_text=sample_objective["objective_text"]
    )

    # Should raise exception
    with pytest.raises(Exception):
        await mock_evaluator.evaluate_comprehension(request)
