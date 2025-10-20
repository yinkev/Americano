"""
Unit tests for Story 4.6 - Dashboard Summary Endpoint

Tests the GET /analytics/understanding/dashboard endpoint with mock database responses.
"""

import pytest
from datetime import datetime, timedelta
from unittest.mock import Mock, AsyncMock, patch
from sqlalchemy.ext.asyncio import AsyncSession

from src.analytics.routes import get_dashboard_summary
from src.analytics.models import DashboardSummary, TrendPoint


# ============================================================================
# Fixtures
# ============================================================================

@pytest.fixture
def mock_db_session():
    """Mock AsyncSession for database queries."""
    session = AsyncMock(spec=AsyncSession)
    return session


@pytest.fixture
def sample_user_id():
    """Sample user ID for testing."""
    return "test_user_123"


@pytest.fixture
def mock_overall_score_result():
    """Mock result for overall score query."""
    mock_row = Mock()
    mock_row.overall_score = 75.5
    return mock_row


@pytest.fixture
def mock_counts_result():
    """Mock result for session/question counts query."""
    mock_row = Mock()
    mock_row.total_sessions = 15
    mock_row.total_questions = 120
    return mock_row


@pytest.fixture
def mock_mastery_results():
    """Mock results for mastery breakdown query."""
    # 3 objectives: 1 beginner, 1 proficient, 1 expert
    mock_rows = [
        Mock(objective_id="obj1", avg_score=55.0),  # beginner
        Mock(objective_id="obj2", avg_score=72.0),  # proficient
        Mock(objective_id="obj3", avg_score=88.0),  # expert
    ]
    return mock_rows


@pytest.fixture
def mock_trends_results():
    """Mock results for recent trends query."""
    today = datetime.now().date()
    mock_rows = [
        Mock(date=today - timedelta(days=6), avg_score=70.0),
        Mock(date=today - timedelta(days=5), avg_score=72.0),
        Mock(date=today - timedelta(days=4), avg_score=74.0),
        Mock(date=today - timedelta(days=3), avg_score=73.0),
        Mock(date=today - timedelta(days=2), avg_score=75.0),
        Mock(date=today - timedelta(days=1), avg_score=77.0),
        Mock(date=today, avg_score=78.0),
    ]
    return mock_rows


@pytest.fixture
def mock_calibration_result():
    """Mock result for calibration query."""
    mock_row = Mock()
    mock_row.avg_calibration_delta = 5.0  # Well-calibrated
    return mock_row


@pytest.fixture
def mock_strengths_results():
    """Mock results for top strengths query."""
    mock_rows = [
        Mock(objective_id="obj1", objective_name="Cardiovascular Physiology", avg_score=92.0),
        Mock(objective_id="obj2", objective_name="Neuroanatomy", avg_score=89.0),
        Mock(objective_id="obj3", objective_name="Pharmacokinetics", avg_score=87.0),
    ]
    return mock_rows


@pytest.fixture
def mock_weaknesses_results():
    """Mock results for improvement areas query."""
    mock_rows = [
        Mock(objective_id="obj4", objective_name="Immunology Basics", avg_score=58.0),
        Mock(objective_id="obj5", objective_name="Biochemistry Pathways", avg_score=62.0),
        Mock(objective_id="obj6", objective_name="Microbiology", avg_score=65.0),
    ]
    return mock_rows


# ============================================================================
# Test Cases
# ============================================================================

@pytest.mark.asyncio
async def test_dashboard_summary_success(
    mock_db_session,
    sample_user_id,
    mock_overall_score_result,
    mock_counts_result,
    mock_mastery_results,
    mock_trends_results,
    mock_calibration_result,
    mock_strengths_results,
    mock_weaknesses_results
):
    """Test successful dashboard summary generation."""

    # Setup mock query results
    mock_db_session.execute = AsyncMock()

    # Mock all query results in sequence
    execute_results = [
        Mock(fetchone=lambda: mock_overall_score_result),  # Overall score
        Mock(fetchone=lambda: mock_counts_result),  # Session/question counts
        Mock(fetchall=lambda: mock_mastery_results),  # Mastery breakdown
        Mock(fetchall=lambda: mock_trends_results),  # Recent trends
        Mock(fetchone=lambda: mock_calibration_result),  # Calibration
        Mock(fetchall=lambda: mock_strengths_results),  # Top strengths
        Mock(fetchall=lambda: mock_weaknesses_results),  # Improvement areas
    ]

    mock_db_session.execute.side_effect = execute_results

    # Call endpoint
    result = await get_dashboard_summary(
        user_id=sample_user_id,
        time_range="7d",
        session=mock_db_session
    )

    # Assertions
    assert isinstance(result, DashboardSummary)
    assert result.overall_score == 75.5
    assert result.total_sessions == 15
    assert result.total_questions == 120
    assert result.mastery_breakdown == {
        "beginner": 1,
        "proficient": 1,
        "expert": 1
    }
    assert len(result.recent_trends) == 7
    assert all(isinstance(point, TrendPoint) for point in result.recent_trends)
    assert result.calibration_status == "well-calibrated"
    assert len(result.top_strengths) == 3
    assert "Cardiovascular Physiology" in result.top_strengths
    assert len(result.improvement_areas) == 3
    assert "Immunology Basics" in result.improvement_areas


@pytest.mark.asyncio
async def test_dashboard_overconfident_calibration(
    mock_db_session,
    sample_user_id,
    mock_overall_score_result,
    mock_counts_result,
    mock_mastery_results,
    mock_trends_results,
    mock_strengths_results,
    mock_weaknesses_results
):
    """Test dashboard with overconfident calibration status."""

    # Mock calibration result showing overconfidence
    mock_calibration = Mock()
    mock_calibration.avg_calibration_delta = 20.0  # Overconfident

    # Setup mock query results
    execute_results = [
        Mock(fetchone=lambda: mock_overall_score_result),
        Mock(fetchone=lambda: mock_counts_result),
        Mock(fetchall=lambda: mock_mastery_results),
        Mock(fetchall=lambda: mock_trends_results),
        Mock(fetchone=lambda: mock_calibration),
        Mock(fetchall=lambda: mock_strengths_results),
        Mock(fetchall=lambda: mock_weaknesses_results),
    ]

    mock_db_session.execute = AsyncMock(side_effect=execute_results)

    # Call endpoint
    result = await get_dashboard_summary(
        user_id=sample_user_id,
        time_range="7d",
        session=mock_db_session
    )

    # Assert calibration status
    assert result.calibration_status == "overconfident"


@pytest.mark.asyncio
async def test_dashboard_underconfident_calibration(
    mock_db_session,
    sample_user_id,
    mock_overall_score_result,
    mock_counts_result,
    mock_mastery_results,
    mock_trends_results,
    mock_strengths_results,
    mock_weaknesses_results
):
    """Test dashboard with underconfident calibration status."""

    # Mock calibration result showing underconfidence
    mock_calibration = Mock()
    mock_calibration.avg_calibration_delta = -20.0  # Underconfident

    # Setup mock query results
    execute_results = [
        Mock(fetchone=lambda: mock_overall_score_result),
        Mock(fetchone=lambda: mock_counts_result),
        Mock(fetchall=lambda: mock_mastery_results),
        Mock(fetchall=lambda: mock_trends_results),
        Mock(fetchone=lambda: mock_calibration),
        Mock(fetchall=lambda: mock_strengths_results),
        Mock(fetchall=lambda: mock_weaknesses_results),
    ]

    mock_db_session.execute = AsyncMock(side_effect=execute_results)

    # Call endpoint
    result = await get_dashboard_summary(
        user_id=sample_user_id,
        time_range="7d",
        session=mock_db_session
    )

    # Assert calibration status
    assert result.calibration_status == "underconfident"


@pytest.mark.asyncio
async def test_dashboard_no_data(mock_db_session, sample_user_id):
    """Test dashboard with no user data (new user scenario)."""

    # Mock empty results
    empty_row = Mock()
    empty_row.overall_score = None
    empty_row.total_sessions = 0
    empty_row.total_questions = 0
    empty_row.avg_calibration_delta = None

    execute_results = [
        Mock(fetchone=lambda: empty_row),  # Overall score
        Mock(fetchone=lambda: empty_row),  # Counts
        Mock(fetchall=lambda: []),  # Mastery
        Mock(fetchall=lambda: []),  # Trends
        Mock(fetchone=lambda: empty_row),  # Calibration
        Mock(fetchall=lambda: []),  # Strengths
        Mock(fetchall=lambda: []),  # Weaknesses
    ]

    mock_db_session.execute = AsyncMock(side_effect=execute_results)

    # Call endpoint
    result = await get_dashboard_summary(
        user_id=sample_user_id,
        time_range="7d",
        session=mock_db_session
    )

    # Assertions
    assert result.overall_score == 0.0
    assert result.total_sessions == 0
    assert result.total_questions == 0
    assert result.mastery_breakdown == {
        "beginner": 0,
        "proficient": 0,
        "expert": 0
    }
    assert len(result.recent_trends) == 0
    assert result.calibration_status == "well-calibrated"
    assert len(result.top_strengths) == 0
    assert len(result.improvement_areas) == 0


@pytest.mark.asyncio
async def test_dashboard_time_range_30d(
    mock_db_session,
    sample_user_id,
    mock_overall_score_result,
    mock_counts_result,
    mock_mastery_results,
    mock_trends_results,
    mock_calibration_result,
    mock_strengths_results,
    mock_weaknesses_results
):
    """Test dashboard with 30-day time range."""

    execute_results = [
        Mock(fetchone=lambda: mock_overall_score_result),
        Mock(fetchone=lambda: mock_counts_result),
        Mock(fetchall=lambda: mock_mastery_results),
        Mock(fetchall=lambda: mock_trends_results),
        Mock(fetchone=lambda: mock_calibration_result),
        Mock(fetchall=lambda: mock_strengths_results),
        Mock(fetchall=lambda: mock_weaknesses_results),
    ]

    mock_db_session.execute = AsyncMock(side_effect=execute_results)

    # Call endpoint with 30d time range
    result = await get_dashboard_summary(
        user_id=sample_user_id,
        time_range="30d",
        session=mock_db_session
    )

    # Should still return valid dashboard
    assert isinstance(result, DashboardSummary)
    assert result.overall_score == 75.5


@pytest.mark.asyncio
async def test_dashboard_mastery_breakdown_all_expert(
    mock_db_session,
    sample_user_id,
    mock_overall_score_result,
    mock_counts_result,
    mock_trends_results,
    mock_calibration_result,
    mock_strengths_results,
    mock_weaknesses_results
):
    """Test dashboard when all objectives are at expert level."""

    # All objectives at expert level (>85%)
    mock_mastery = [
        Mock(objective_id="obj1", avg_score=88.0),
        Mock(objective_id="obj2", avg_score=92.0),
        Mock(objective_id="obj3", avg_score=95.0),
    ]

    execute_results = [
        Mock(fetchone=lambda: mock_overall_score_result),
        Mock(fetchone=lambda: mock_counts_result),
        Mock(fetchall=lambda: mock_mastery),
        Mock(fetchall=lambda: mock_trends_results),
        Mock(fetchone=lambda: mock_calibration_result),
        Mock(fetchall=lambda: mock_strengths_results),
        Mock(fetchall=lambda: mock_weaknesses_results),
    ]

    mock_db_session.execute = AsyncMock(side_effect=execute_results)

    result = await get_dashboard_summary(
        user_id=sample_user_id,
        time_range="7d",
        session=mock_db_session
    )

    # Assert mastery breakdown
    assert result.mastery_breakdown == {
        "beginner": 0,
        "proficient": 0,
        "expert": 3
    }


# ============================================================================
# Integration Test Pattern (for reference)
# ============================================================================

@pytest.mark.asyncio
async def test_dashboard_integration_pattern():
    """
    Integration test pattern (requires actual database connection).

    This is a template for future integration tests when database is available.
    NOT run in unit test suite.
    """
    # This test would use a real database connection
    # For now, we only have unit tests with mocked dependencies
    pytest.skip("Integration test - requires database connection")
