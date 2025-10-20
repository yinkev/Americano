"""
Test suite for RecommendationEngine (Story 4.6).

Tests all 5 methods with mock data and ChatMock integration.
"""

import pytest
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, patch, MagicMock
from sqlalchemy.ext.asyncio import AsyncSession

from .recommendations import RecommendationEngine
from .models import (
    DailyInsight,
    WeeklyTopObjective,
    InterventionSuggestion,
)


# ============================================================================
# Fixtures
# ============================================================================

@pytest.fixture
def mock_session():
    """Mock AsyncSession for database queries."""
    session = AsyncMock(spec=AsyncSession)
    return session


@pytest.fixture
def recommendation_engine(mock_session):
    """Create RecommendationEngine instance with mock session."""
    return RecommendationEngine(mock_session)


# ============================================================================
# Test Method 1: Daily Insight Generation
# ============================================================================

@pytest.mark.asyncio
async def test_generate_daily_insight_success(recommendation_engine, mock_session):
    """Test daily insight generation with valid data."""
    # Mock database response
    mock_row = MagicMock()
    mock_row.objective_id = "obj_123"
    mock_row.objective_name = "Cardiac Physiology"
    mock_row.avg_score = 55.0
    mock_row.avg_calibration_delta = 12.0
    mock_row.response_count = 5
    mock_row.priority_score = 10

    mock_result = AsyncMock()
    mock_result.fetchone.return_value = mock_row
    mock_session.execute.return_value = mock_result

    # Mock ChatMock response
    with patch('src.analytics.recommendations.client') as mock_client:
        mock_completion = MagicMock()
        mock_completion.priority_objective_id = "obj_123"
        mock_completion.priority_objective_name = "Cardiac Physiology"
        mock_completion.insight_category = "dangerous_gap"
        mock_completion.title = "Address Cardiac Physiology Gap"
        mock_completion.description = "Your understanding is 18% below mastery with signs of overconfidence."
        mock_completion.action_items = [
            "Review cardiac conduction system",
            "Complete 3 practice scenarios",
            "Test knowledge with follow-up questions"
        ]
        mock_completion.estimated_time_minutes = 45

        mock_client.chat.completions.create.return_value = mock_completion

        # Execute
        result = await recommendation_engine.generate_daily_insight("user_123")

        # Assertions
        assert isinstance(result, DailyInsight)
        assert result.user_id == "user_123"
        assert result.priority_objective_id == "obj_123"
        assert result.insight_category == "dangerous_gap"
        assert len(result.action_items) >= 2
        assert result.estimated_time_minutes > 0


@pytest.mark.asyncio
async def test_generate_daily_insight_no_data(recommendation_engine, mock_session):
    """Test daily insight with no user data (new user)."""
    # Mock empty database response
    mock_result = AsyncMock()
    mock_result.fetchone.return_value = None
    mock_session.execute.return_value = mock_result

    # Execute
    result = await recommendation_engine.generate_daily_insight("new_user")

    # Assertions
    assert isinstance(result, DailyInsight)
    assert result.user_id == "new_user"
    assert result.priority_objective_id == "onboarding"
    assert result.insight_category == "optimization"


@pytest.mark.asyncio
async def test_generate_daily_insight_ai_failure(recommendation_engine, mock_session):
    """Test fallback when ChatMock fails."""
    # Mock database response
    mock_row = MagicMock()
    mock_row.objective_id = "obj_456"
    mock_row.objective_name = "Respiratory System"
    mock_row.avg_score = 62.0
    mock_row.avg_calibration_delta = 5.0
    mock_row.response_count = 3
    mock_row.priority_score = 6

    mock_result = AsyncMock()
    mock_result.fetchone.return_value = mock_row
    mock_session.execute.return_value = mock_result

    # Mock ChatMock failure
    with patch('src.analytics.recommendations.client') as mock_client:
        mock_client.chat.completions.create.side_effect = Exception("API Error")

        # Execute
        result = await recommendation_engine.generate_daily_insight("user_123")

        # Assertions - should return fallback
        assert isinstance(result, DailyInsight)
        assert result.priority_objective_id == "obj_456"
        assert len(result.action_items) == 3


# ============================================================================
# Test Method 2: Weekly Summary Generation
# ============================================================================

@pytest.mark.asyncio
async def test_generate_weekly_summary_success(recommendation_engine, mock_session):
    """Test weekly summary with valid data."""
    # Mock database response with 5 objectives
    mock_objectives = []
    for i in range(5):
        obj = MagicMock()
        obj.objective_id = f"obj_{i}"
        obj.objective_name = f"Objective {i}"
        obj.avg_score = 60.0 + i * 5
        obj.avg_calibration_delta = 8.0 - i
        obj.response_count = 4 + i
        obj.score_variability = 10.0
        obj.last_attempt = datetime.utcnow() - timedelta(days=i * 5)
        mock_objectives.append(obj)

    mock_result = AsyncMock()
    mock_result.fetchall.return_value = mock_objectives
    mock_session.execute.return_value = mock_result

    # Mock ChatMock response
    with patch('src.analytics.recommendations.client') as mock_client:
        mock_weekly = MagicMock()
        mock_weekly.top_objectives = [
            WeeklyTopObjective(
                objective_id="obj_0",
                objective_name="Objective 0",
                rationale="Lowest score requiring immediate attention",
                estimated_hours=5.0
            ),
            WeeklyTopObjective(
                objective_id="obj_1",
                objective_name="Objective 1",
                rationale="Foundational objective blocking progress",
                estimated_hours=4.0
            ),
            WeeklyTopObjective(
                objective_id="obj_2",
                objective_name="Objective 2",
                rationale="High-yield topic for board exams",
                estimated_hours=3.0
            )
        ]
        mock_weekly.overall_strategy = "Focus on foundational gaps first"

        mock_client.chat.completions.create.return_value = mock_weekly

        # Execute
        result = await recommendation_engine.generate_weekly_summary("user_123")

        # Assertions
        assert isinstance(result, list)
        assert len(result) == 3
        assert all(isinstance(obj, WeeklyTopObjective) for obj in result)
        assert all(obj.estimated_hours > 0 for obj in result)
        assert all(len(obj.rationale) >= 50 for obj in result)


@pytest.mark.asyncio
async def test_generate_weekly_summary_no_data(recommendation_engine, mock_session):
    """Test weekly summary with no data (new user)."""
    # Mock empty database response
    mock_result = AsyncMock()
    mock_result.fetchall.return_value = []
    mock_session.execute.return_value = mock_result

    # Execute
    result = await recommendation_engine.generate_weekly_summary("new_user")

    # Assertions
    assert isinstance(result, list)
    assert len(result) == 3  # Default objectives
    assert all(isinstance(obj, WeeklyTopObjective) for obj in result)


# ============================================================================
# Test Method 3: Intervention Suggestions
# ============================================================================

@pytest.mark.asyncio
async def test_generate_intervention_suggestions_all_patterns(recommendation_engine):
    """Test intervention generation with all patterns detected."""
    patterns = {
        "overconfident_count": 3,
        "avg_reasoning": 55.0,
        "avg_retention": 65.0,
        "bottleneck_count": 2,
        "regression_count": 1
    }

    # Execute
    result = await recommendation_engine.generate_intervention_suggestions(patterns)

    # Assertions
    assert isinstance(result, list)
    assert len(result) == 5  # All 5 patterns detected
    assert all(isinstance(i, InterventionSuggestion) for i in result)

    # Check all patterns present
    pattern_types = {i.pattern_detected for i in result}
    assert "overconfidence" in pattern_types
    assert "weak_reasoning" in pattern_types
    assert "poor_retention" in pattern_types
    assert "bottleneck_detected" in pattern_types
    assert "regression_detected" in pattern_types

    # Check priority ordering (high first)
    high_priority_count = sum(1 for i in result if i.priority == "high")
    assert high_priority_count >= 3


@pytest.mark.asyncio
async def test_generate_intervention_suggestions_no_patterns(recommendation_engine):
    """Test intervention generation with no patterns detected."""
    patterns = {
        "overconfident_count": 0,
        "avg_reasoning": 75.0,
        "avg_retention": 80.0,
        "bottleneck_count": 0,
        "regression_count": 0
    }

    # Execute
    result = await recommendation_engine.generate_intervention_suggestions(patterns)

    # Assertions
    assert isinstance(result, list)
    assert len(result) == 0  # No interventions needed


@pytest.mark.asyncio
async def test_generate_intervention_suggestions_partial_patterns(recommendation_engine):
    """Test intervention generation with some patterns."""
    patterns = {
        "overconfident_count": 2,
        "avg_reasoning": 75.0,  # Good reasoning
        "avg_retention": 65.0,  # Poor retention
        "bottleneck_count": 0,
        "regression_count": 0
    }

    # Execute
    result = await recommendation_engine.generate_intervention_suggestions(patterns)

    # Assertions
    assert isinstance(result, list)
    assert len(result) == 2  # Overconfidence + poor retention
    pattern_types = {i.pattern_detected for i in result}
    assert "overconfidence" in pattern_types
    assert "poor_retention" in pattern_types


# ============================================================================
# Test Method 4: Time to Mastery Estimation
# ============================================================================

@pytest.mark.asyncio
async def test_estimate_time_to_mastery_positive_trend(recommendation_engine, mock_session):
    """Test time estimation with positive trend."""
    # Mock database response
    mock_row = MagicMock()
    mock_row.difficulty = 5  # Medium difficulty

    mock_result = AsyncMock()
    mock_result.fetchone.return_value = mock_row
    mock_session.execute.return_value = mock_result

    # Execute (current: 60%, trend: +7 points/week)
    result = await recommendation_engine.estimate_time_to_mastery(
        objective_id="obj_123",
        current_score=60.0,
        trend=7.0
    )

    # Assertions
    assert isinstance(result, int)
    assert result > 0
    assert result <= 50  # Capped at 50 hours
    # 20 points needed / (7 points/week / 7 days/week) = ~20 days = ~20 hours (1pt/hour)
    assert 15 <= result <= 25  # Reasonable range


@pytest.mark.asyncio
async def test_estimate_time_to_mastery_already_mastered(recommendation_engine, mock_session):
    """Test time estimation when already at mastery."""
    mock_row = MagicMock()
    mock_row.difficulty = 5

    mock_result = AsyncMock()
    mock_result.fetchone.return_value = mock_row
    mock_session.execute.return_value = mock_result

    # Execute (current: 85% - already mastered)
    result = await recommendation_engine.estimate_time_to_mastery(
        objective_id="obj_123",
        current_score=85.0,
        trend=5.0
    )

    # Assertions
    assert result == 0


@pytest.mark.asyncio
async def test_estimate_time_to_mastery_negative_trend(recommendation_engine, mock_session):
    """Test time estimation with negative trend (declining)."""
    mock_row = MagicMock()
    mock_row.difficulty = 5

    mock_result = AsyncMock()
    mock_result.fetchone.return_value = mock_row
    mock_session.execute.return_value = mock_result

    # Execute (negative trend)
    result = await recommendation_engine.estimate_time_to_mastery(
        objective_id="obj_123",
        current_score=60.0,
        trend=-2.0
    )

    # Assertions
    assert result is None  # Mastery unlikely with declining trend


@pytest.mark.asyncio
async def test_estimate_time_to_mastery_no_trend(recommendation_engine, mock_session):
    """Test time estimation with no trend data."""
    mock_row = MagicMock()
    mock_row.difficulty = 5

    mock_result = AsyncMock()
    mock_result.fetchone.return_value = mock_row
    mock_session.execute.return_value = mock_result

    # Execute (zero trend - use empirical rate)
    result = await recommendation_engine.estimate_time_to_mastery(
        objective_id="obj_123",
        current_score=70.0,
        trend=0.0
    )

    # Assertions
    assert isinstance(result, int)
    # 10 points needed / 2 points/hour = 5 hours
    assert result == 5


@pytest.mark.asyncio
async def test_estimate_time_to_mastery_difficulty_multipliers(recommendation_engine, mock_session):
    """Test difficulty multipliers (easy vs hard)."""
    # Easy objective (difficulty 2)
    mock_row_easy = MagicMock()
    mock_row_easy.difficulty = 2

    mock_result_easy = AsyncMock()
    mock_result_easy.fetchone.return_value = mock_row_easy
    mock_session.execute.return_value = mock_result_easy

    result_easy = await recommendation_engine.estimate_time_to_mastery(
        objective_id="obj_easy",
        current_score=60.0,
        trend=0.0  # Use empirical rate
    )

    # Hard objective (difficulty 9)
    mock_row_hard = MagicMock()
    mock_row_hard.difficulty = 9

    mock_result_hard = AsyncMock()
    mock_result_hard.fetchone.return_value = mock_row_hard
    mock_session.execute.return_value = mock_result_hard

    result_hard = await recommendation_engine.estimate_time_to_mastery(
        objective_id="obj_hard",
        current_score=60.0,
        trend=0.0  # Use empirical rate
    )

    # Assertions
    # Easy: 20 pts / 2 pts/hr * 0.8 = 8 hours
    # Hard: 20 pts / 2 pts/hr * 1.5 = 15 hours
    assert result_easy < result_hard
    assert result_easy == 8
    assert result_hard == 15


# ============================================================================
# Test Method 5: Success Probability Prediction
# ============================================================================

@pytest.mark.asyncio
async def test_predict_success_probability_high_confidence(recommendation_engine, mock_session):
    """Test success probability with favorable conditions."""
    # Mock database response
    mock_row = MagicMock()
    mock_row.current_score = 70.0
    mock_row.attempt_count = 10
    mock_row.score_variability = 5.0
    mock_row.improvement_rate_per_hour = 2.5  # Good improvement rate
    mock_row.success_rate = 0.75  # User has 75% success rate
    mock_row.difficulty = 5

    mock_result = AsyncMock()
    mock_result.fetchone.return_value = mock_row
    mock_session.execute.return_value = mock_result

    # Execute (10 hours planned study)
    result = await recommendation_engine.predict_success_probability(
        objective_id="obj_123",
        planned_study_hours=10
    )

    # Assertions
    assert isinstance(result, float)
    assert 0.0 <= result <= 1.0
    # 70 + (10 * 2.5 / 1.0) = 95 (well above 80)
    assert result >= 0.7  # High probability


@pytest.mark.asyncio
async def test_predict_success_probability_low_confidence(recommendation_engine, mock_session):
    """Test success probability with unfavorable conditions."""
    # Mock database response
    mock_row = MagicMock()
    mock_row.current_score = 50.0
    mock_row.attempt_count = 3
    mock_row.score_variability = 15.0
    mock_row.improvement_rate_per_hour = 1.0  # Low improvement rate
    mock_row.success_rate = 0.3  # User has 30% success rate
    mock_row.difficulty = 8  # Hard objective

    mock_result = AsyncMock()
    mock_result.fetchone.return_value = mock_row
    mock_session.execute.return_value = mock_result

    # Execute (5 hours planned study)
    result = await recommendation_engine.predict_success_probability(
        objective_id="obj_123",
        planned_study_hours=5
    )

    # Assertions
    assert isinstance(result, float)
    assert 0.0 <= result <= 1.0
    # 50 + (5 * 1.0 / 1.5) = 53.3 (below 80)
    assert result < 0.5  # Low probability


@pytest.mark.asyncio
async def test_predict_success_probability_already_mastered(recommendation_engine, mock_session):
    """Test success probability when already at mastery."""
    # Mock database response
    mock_row = MagicMock()
    mock_row.current_score = 85.0
    mock_row.attempt_count = 5
    mock_row.score_variability = 3.0
    mock_row.improvement_rate_per_hour = 1.5
    mock_row.success_rate = 0.8
    mock_row.difficulty = 5

    mock_result = AsyncMock()
    mock_result.fetchone.return_value = mock_row
    mock_session.execute.return_value = mock_result

    # Execute
    result = await recommendation_engine.predict_success_probability(
        objective_id="obj_123",
        planned_study_hours=5
    )

    # Assertions
    assert result == 0.95  # Max confidence (already mastered)


@pytest.mark.asyncio
async def test_predict_success_probability_no_data(recommendation_engine, mock_session):
    """Test success probability with insufficient data."""
    # Mock empty database response
    mock_result = AsyncMock()
    mock_result.fetchone.return_value = None
    mock_session.execute.return_value = mock_result

    # Execute
    result = await recommendation_engine.predict_success_probability(
        objective_id="obj_unknown",
        planned_study_hours=10
    )

    # Assertions
    assert result == 0.3  # Conservative estimate


# ============================================================================
# Integration Tests
# ============================================================================

@pytest.mark.asyncio
async def test_full_recommendation_workflow(recommendation_engine, mock_session):
    """Test complete workflow: daily insight + weekly summary + interventions."""
    # Setup mock data
    mock_row = MagicMock()
    mock_row.objective_id = "obj_123"
    mock_row.objective_name = "Test Objective"
    mock_row.avg_score = 65.0
    mock_row.avg_calibration_delta = 8.0
    mock_row.response_count = 5
    mock_row.priority_score = 6
    mock_row.score_variability = 10.0
    mock_row.last_attempt = datetime.utcnow()

    mock_result = AsyncMock()
    mock_result.fetchone.return_value = mock_row
    mock_result.fetchall.return_value = [mock_row]
    mock_session.execute.return_value = mock_result

    # Mock AI responses
    with patch('src.analytics.recommendations.client') as mock_client:
        # Daily insight mock
        mock_daily = MagicMock()
        mock_daily.priority_objective_id = "obj_123"
        mock_daily.priority_objective_name = "Test Objective"
        mock_daily.insight_category = "weakness"
        mock_daily.title = "Focus on Test Objective"
        mock_daily.description = "Needs improvement"
        mock_daily.action_items = ["Action 1", "Action 2"]
        mock_daily.estimated_time_minutes = 30

        # Weekly summary mock
        mock_weekly = MagicMock()
        mock_weekly.top_objectives = [
            WeeklyTopObjective(
                objective_id="obj_123",
                objective_name="Test Objective",
                rationale="Priority learning need",
                estimated_hours=5.0
            )
        ]
        mock_weekly.overall_strategy = "Focus on fundamentals"

        mock_client.chat.completions.create.side_effect = [mock_daily, mock_weekly]

        # Execute workflow
        daily = await recommendation_engine.generate_daily_insight("user_123")
        weekly = await recommendation_engine.generate_weekly_summary("user_123")
        interventions = await recommendation_engine.generate_intervention_suggestions({
            "overconfident_count": 1,
            "avg_reasoning": 70.0,
            "avg_retention": 75.0,
            "bottleneck_count": 0,
            "regression_count": 0
        })

        # Assertions
        assert isinstance(daily, DailyInsight)
        assert isinstance(weekly, list)
        assert isinstance(interventions, list)
        assert len(interventions) == 1  # Only overconfidence intervention
