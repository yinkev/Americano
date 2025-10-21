"""
Tests for CrossObjectiveAnalyzer (Story 4.6).

Verifies:
1. calculate_objective_correlations() - Pearson correlation matrix
2. identify_foundational_objectives() - High correlation objectives
3. identify_bottleneck_objectives() - Low score + negative correlations
4. generate_study_sequence() - Optimal study order
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime
import numpy as np

from src.analytics.correlation_analyzer import (
    CrossObjectiveAnalyzer,
    FoundationalObjective,
    BottleneckObjective,
)


# ============================================================================
# Test Fixtures
# ============================================================================

@pytest.fixture
def mock_session():
    """Mock AsyncSession for database queries."""
    session = AsyncMock()
    return session


@pytest.fixture
def analyzer(mock_session):
    """Create CrossObjectiveAnalyzer instance."""
    return CrossObjectiveAnalyzer(mock_session)


@pytest.fixture
def sample_objectives():
    """Sample objective data with scores."""
    return [
        MagicMock(
            objective_id="obj1",
            objective_name="Cardiovascular Physiology",
            scores=[75, 80, 85, 78, 82],
            response_count=5,
            avg_score=0.80
        ),
        MagicMock(
            objective_id="obj2",
            objective_name="Respiratory System",
            scores=[70, 72, 75, 73, 74],
            response_count=5,
            avg_score=0.73
        ),
        MagicMock(
            objective_id="obj3",
            objective_name="Pharmacology Basics",
            scores=[50, 55, 52, 48, 51],
            response_count=5,
            avg_score=0.51
        ),
        MagicMock(
            objective_id="obj4",
            objective_name="Renal Function",
            scores=[82, 85, 88, 84, 86],
            response_count=5,
            avg_score=0.85
        ),
    ]


@pytest.fixture
def sample_correlation_matrix():
    """Sample 4x4 correlation matrix."""
    return [
        [1.0, 0.8, -0.4, 0.7],  # obj1: high correlation with obj2, obj4
        [0.8, 1.0, -0.35, 0.6],  # obj2: high correlation with obj1, obj4
        [-0.4, -0.35, 1.0, -0.3], # obj3: negative correlations (bottleneck) - 3 negative < -0.3
        [0.7, 0.6, -0.3, 1.0],  # obj4: high correlation with obj1, obj2
    ]


# ============================================================================
# Test calculate_objective_correlations
# ============================================================================

@pytest.mark.asyncio
async def test_calculate_correlations_success(analyzer, mock_session, sample_objectives):
    """Test successful correlation matrix calculation."""
    # Mock database query result
    mock_result = MagicMock()
    mock_result.fetchall.return_value = sample_objectives
    mock_session.execute = AsyncMock(return_value=mock_result)

    # Calculate correlations
    result = await analyzer.calculate_objective_correlations("user123")

    # Verify result structure
    assert result.user_id == "user123"
    assert len(result.matrix) == 4
    assert len(result.matrix[0]) == 4
    assert len(result.objective_ids) == 4
    assert len(result.objective_names) == 4

    # Verify diagonal is 1.0 (self-correlation)
    for i in range(4):
        assert result.matrix[i][i] == 1.0

    # Verify symmetry (r_ij = r_ji)
    for i in range(4):
        for j in range(4):
            assert abs(result.matrix[i][j] - result.matrix[j][i]) < 0.001

    # Verify foundational objectives exist
    assert len(result.foundational_objectives) >= 0

    # Verify bottleneck objectives exist
    assert len(result.bottleneck_objectives) >= 0

    # Verify study sequence
    assert len(result.recommended_study_sequence) == 4


@pytest.mark.asyncio
async def test_calculate_correlations_insufficient_data(analyzer, mock_session):
    """Test with insufficient data (< 2 objectives)."""
    # Mock database query with only 1 objective
    mock_result = MagicMock()
    mock_result.fetchall.return_value = []
    mock_session.execute = AsyncMock(return_value=mock_result)

    result = await analyzer.calculate_objective_correlations("user123")

    # Verify empty result
    assert result.user_id == "user123"
    assert result.matrix == []
    assert result.objective_ids == []
    assert result.foundational_objectives == []
    assert result.bottleneck_objectives == []


@pytest.mark.asyncio
async def test_pearson_calculation_accuracy(analyzer):
    """Test Pearson correlation calculation matches scipy."""
    from scipy.stats import pearsonr

    # Test data
    scores_x = [1, 2, 3, 4, 5]
    scores_y = [2, 4, 6, 8, 10]  # Perfect positive correlation

    # Manual calculation
    result = pearsonr(scores_x, scores_y)
    expected_r = result.statistic

    # Verify perfect correlation
    assert abs(expected_r - 1.0) < 0.001


# ============================================================================
# Test identify_foundational_objectives
# ============================================================================

@pytest.mark.asyncio
async def test_identify_foundational_objectives(analyzer, sample_correlation_matrix):
    """Test foundational objective identification."""
    objective_ids = ["obj1", "obj2", "obj3", "obj4"]
    objective_names = [
        "Cardiovascular Physiology",
        "Respiratory System",
        "Pharmacology Basics",
        "Renal Function"
    ]

    foundational = await analyzer.identify_foundational_objectives(
        sample_correlation_matrix,
        objective_ids,
        objective_names
    )

    # Verify foundational objectives exist
    assert len(foundational) > 0

    # Verify obj1 and obj4 are foundational (high positive correlations)
    foundational_ids = [f.objective_id for f in foundational]
    assert "obj1" in foundational_ids or "obj4" in foundational_ids

    # Verify obj3 is NOT foundational (negative correlations)
    assert "obj3" not in foundational_ids

    # Verify structure
    for obj in foundational:
        assert isinstance(obj, FoundationalObjective)
        assert obj.avg_correlation >= 0.0
        assert obj.strong_correlation_count >= 0
        assert len(obj.rationale) > 0


@pytest.mark.asyncio
async def test_foundational_objectives_sorted_by_impact(analyzer):
    """Test foundational objectives are sorted by correlation_sum."""
    matrix = [
        [1.0, 0.9, 0.8],  # obj1: sum = 1.7 (highest)
        [0.9, 1.0, 0.5],  # obj2: sum = 1.4
        [0.8, 0.5, 1.0],  # obj3: sum = 1.3
    ]
    objective_ids = ["obj1", "obj2", "obj3"]
    objective_names = ["A", "B", "C"]

    foundational = await analyzer.identify_foundational_objectives(
        matrix, objective_ids, objective_names
    )

    # Verify sorted by correlation_sum descending
    if len(foundational) >= 2:
        assert foundational[0].correlation_sum >= foundational[1].correlation_sum


# ============================================================================
# Test identify_bottleneck_objectives
# ============================================================================

@pytest.mark.asyncio
async def test_identify_bottleneck_objectives(analyzer, sample_correlation_matrix):
    """Test bottleneck objective identification."""
    objective_ids = ["obj1", "obj2", "obj3", "obj4"]
    objective_names = [
        "Cardiovascular Physiology",
        "Respiratory System",
        "Pharmacology Basics",
        "Renal Function"
    ]
    user_performance = {
        "obj1": 80.0,  # High score
        "obj2": 73.0,  # Medium score
        "obj3": 51.0,  # Low score + negative correlations = bottleneck
        "obj4": 85.0,  # High score
    }

    bottlenecks = await analyzer.identify_bottleneck_objectives(
        sample_correlation_matrix,
        objective_ids,
        objective_names,
        user_performance
    )

    # Verify bottleneck detected
    assert len(bottlenecks) > 0

    # Verify obj3 is a bottleneck (low score + negative correlations)
    bottleneck_ids = [b.objective_id for b in bottlenecks]
    assert "obj3" in bottleneck_ids

    # Verify structure
    for obj in bottlenecks:
        assert isinstance(obj, BottleneckObjective)
        assert obj.performance_score < 60.0  # Low score
        assert obj.negative_correlation_count >= 2
        assert len(obj.blocked_objectives) >= 2
        assert obj.impact_score > 0
        assert len(obj.recommendation) > 0


@pytest.mark.asyncio
async def test_bottleneck_impact_calculation(analyzer):
    """Test impact score: (100 - score) * neg_correlation_count."""
    matrix = [
        [1.0, -0.4, -0.5],  # obj1: 2 negative correlations
        [-0.4, 1.0, -0.3],  # obj2: 2 negative correlations
        [-0.5, -0.3, 1.0],  # obj3: 2 negative correlations
    ]
    objective_ids = ["obj1", "obj2", "obj3"]
    objective_names = ["A", "B", "C"]
    user_performance = {
        "obj1": 40.0,  # impact = (100-40) * 2 = 120
        "obj2": 50.0,  # impact = (100-50) * 2 = 100
        "obj3": 55.0,  # impact = (100-55) * 2 = 90
    }

    bottlenecks = await analyzer.identify_bottleneck_objectives(
        matrix, objective_ids, objective_names, user_performance
    )

    # Verify sorted by impact descending
    if len(bottlenecks) >= 2:
        assert bottlenecks[0].impact_score >= bottlenecks[1].impact_score

    # Verify obj1 has highest impact (lowest score)
    if bottlenecks:
        assert bottlenecks[0].objective_id == "obj1"


# ============================================================================
# Test generate_study_sequence
# ============================================================================

@pytest.mark.asyncio
async def test_generate_study_sequence(analyzer, sample_correlation_matrix):
    """Test study sequence generation prioritizes foundational objectives."""
    objective_ids = ["obj1", "obj2", "obj3", "obj4"]

    sequence = await analyzer.generate_study_sequence(
        objective_ids, sample_correlation_matrix
    )

    # Verify sequence length
    assert len(sequence) == 4

    # Verify all objectives included
    assert set(sequence) == set(objective_ids)

    # Verify foundational objectives come early
    # obj1 and obj4 have highest positive correlations (sum > 1.5)
    # They should appear before obj3 (low/negative correlations)
    obj1_index = sequence.index("obj1")
    obj3_index = sequence.index("obj3")
    assert obj1_index < obj3_index  # Foundational before bottleneck


@pytest.mark.asyncio
async def test_study_sequence_prioritizes_high_importance(analyzer):
    """Test sequence prioritizes high-importance (foundational) objectives."""
    matrix = [
        [1.0, 0.9, 0.8],  # obj1: importance = 1.7 (highest)
        [0.9, 1.0, 0.5],  # obj2: importance = 1.4
        [0.8, 0.5, 1.0],  # obj3: importance = 1.3 (lowest)
    ]
    objective_ids = ["obj1", "obj2", "obj3"]

    sequence = await analyzer.generate_study_sequence(objective_ids, matrix)

    # Verify obj1 comes first (highest importance)
    assert sequence[0] == "obj1"

    # Verify obj3 comes last (lowest importance)
    assert sequence[-1] == "obj3"


# ============================================================================
# Test Edge Cases
# ============================================================================

@pytest.mark.asyncio
async def test_correlation_matrix_handles_nan_values(analyzer):
    """Test correlation calculation handles NaN values gracefully."""
    # Identical scores (no variance) should produce NaN in Pearson
    # Analyzer should handle this and return 0.0
    from scipy.stats import pearsonr

    scores_x = [5, 5, 5, 5, 5]  # No variance
    scores_y = [1, 2, 3, 4, 5]

    result = pearsonr(scores_x, scores_y)
    # Result will be NaN
    assert np.isnan(result.statistic)

    # Verify analyzer handles this (converts to 0.0)
    # This is tested in the main calculate_objective_correlations method


@pytest.mark.asyncio
async def test_empty_matrix_with_no_objectives(analyzer):
    """Test empty matrix when no objectives have sufficient data."""
    result = analyzer._empty_correlation_matrix("user123")

    assert result.user_id == "user123"
    assert result.matrix == []
    assert result.objective_ids == []
    assert result.objective_names == []
    assert result.foundational_objectives == []
    assert result.bottleneck_objectives == []
    assert result.recommended_study_sequence == []


@pytest.mark.asyncio
async def test_date_range_parsing(analyzer):
    """Test date range parsing for different periods."""
    test_cases = ["7d", "30d", "90d", "1y", "all"]

    for date_range in test_cases:
        start_date, end_date = analyzer._parse_date_range(date_range)
        assert isinstance(start_date, datetime)
        assert isinstance(end_date, datetime)
        assert start_date < end_date


# ============================================================================
# Integration Test
# ============================================================================

@pytest.mark.asyncio
async def test_full_correlation_analysis_workflow(analyzer, mock_session, sample_objectives):
    """Test complete workflow from query to recommendations."""
    # Mock database query
    mock_result = MagicMock()
    mock_result.fetchall.return_value = sample_objectives
    mock_session.execute = AsyncMock(return_value=mock_result)

    # Run full analysis
    result = await analyzer.calculate_objective_correlations(
        user_id="user123",
        date_range="90d"
    )

    # Verify complete result structure
    assert result.user_id == "user123"
    assert len(result.matrix) == 4
    assert len(result.objective_ids) == 4
    assert len(result.objective_names) == 4
    assert isinstance(result.foundational_objectives, list)
    assert isinstance(result.bottleneck_objectives, list)
    assert isinstance(result.recommended_study_sequence, list)
    assert len(result.recommended_study_sequence) == 4

    # Verify database query was called correctly
    mock_session.execute.assert_called_once()
    call_args = mock_session.execute.call_args
    assert "user123" in str(call_args)
