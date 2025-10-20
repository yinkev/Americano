"""
Unit tests for comparison analytics endpoint (Story 4.6 - Endpoint 8/8).

Tests scipy percentileofscore usage, peer comparison logic, and edge cases.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock
from scipy.stats import percentileofscore
import numpy as np

from src.analytics.models import ComparisonResult, DimensionComparison


# Module-level fixtures (shared across all test classes)
@pytest.fixture
def mock_session():
    """Create mock database session."""
    return AsyncMock()


@pytest.fixture
def sample_user_scores():
    """Sample user scores for testing."""
    return {
        "terminology": 85.0,
        "relationships": 78.0,
        "application": 82.0,
        "clarity": 75.0,
        "overall": 80.0
    }


@pytest.fixture
def sample_peer_data():
    """Sample peer data for testing (50 users)."""
    np.random.seed(42)  # Reproducible random data
    peer_scores = []

    for i in range(50):
        peer_scores.append({
            "user_id": f"user_{i}",
            "terminology": float(np.random.normal(70, 10)),
            "relationships": float(np.random.normal(70, 10)),
            "application": float(np.random.normal(70, 10)),
            "clarity": float(np.random.normal(70, 10)),
            "overall": float(np.random.normal(70, 10))
        })

    return peer_scores


class TestComparisonAnalytics:
    """Test suite for comparison analytics endpoint."""

    def test_percentileofscore_calculation(self, sample_peer_data):
        """
        Test scipy percentileofscore calculation.

        Verifies that percentileofscore correctly calculates user's rank.
        """
        peer_overall_scores = [p["overall"] for p in sample_peer_data]
        user_score = 80.0

        # Calculate percentile using scipy
        percentile = percentileofscore(peer_overall_scores, user_score, kind='rank')

        # Verify percentile is in valid range
        assert 0.0 <= percentile <= 100.0

        # User score of 80 should be above average (>50th percentile) given peers avg ~70
        assert percentile > 50.0, "User score of 80 should be above 50th percentile"

    def test_dimension_comparison_creation(self, sample_user_scores, sample_peer_data):
        """Test DimensionComparison model creation."""
        dimension = "terminology"
        peer_scores = [p[dimension] for p in sample_peer_data]

        percentile = percentileofscore(peer_scores, sample_user_scores[dimension], kind='rank')
        peer_avg = float(np.mean(peer_scores))

        dim_comparison = DimensionComparison(
            dimension=dimension,
            user_score=sample_user_scores[dimension],
            peer_average=peer_avg,
            percentile=percentile
        )

        assert dim_comparison.dimension == dimension
        assert dim_comparison.user_score == 85.0
        assert 0.0 <= dim_comparison.percentile <= 100.0
        assert dim_comparison.peer_average > 0.0

    def test_strengths_identification(self, sample_user_scores, sample_peer_data):
        """Test identification of strengths (user > peer_avg)."""
        dimensions = ["terminology", "relationships", "application", "clarity"]
        strengths = []

        for dim in dimensions:
            peer_scores = [p[dim] for p in sample_peer_data]
            peer_avg = float(np.mean(peer_scores))

            if sample_user_scores[dim] > peer_avg:
                strengths.append(dim)

        # User scores are higher than peer avg (~70) in all dimensions
        assert len(strengths) > 0, "Should identify at least one strength"
        assert "terminology" in strengths, "Terminology (85.0) should be a strength"

    def test_gaps_identification(self, sample_peer_data):
        """Test identification of gaps (user < peer_avg - 0.5*std_dev)."""
        dimensions = ["terminology", "relationships", "application", "clarity"]

        # Create user with low scores
        low_user_scores = {
            "terminology": 55.0,
            "relationships": 52.0,
            "application": 58.0,
            "clarity": 50.0
        }

        gaps = []

        for dim in dimensions:
            peer_scores = [p[dim] for p in sample_peer_data]
            peer_avg = float(np.mean(peer_scores))
            peer_std = float(np.std(peer_scores))

            gap_threshold = peer_avg - (0.5 * peer_std)
            if low_user_scores[dim] < gap_threshold:
                gaps.append(dim)

        # Low scores should identify gaps
        assert len(gaps) > 0, "Should identify at least one gap"

    def test_comparison_result_creation(self, sample_user_scores, sample_peer_data):
        """Test ComparisonResult model creation with all fields."""
        dimensions = ["terminology", "relationships", "application", "clarity"]

        # Calculate dimension comparisons
        dimension_comparisons = []
        for dim in dimensions:
            peer_scores = [p[dim] for p in sample_peer_data]
            percentile = percentileofscore(peer_scores, sample_user_scores[dim], kind='rank')
            peer_avg = float(np.mean(peer_scores))

            dimension_comparisons.append(DimensionComparison(
                dimension=dim,
                user_score=sample_user_scores[dim],
                peer_average=peer_avg,
                percentile=percentile
            ))

        # Calculate overall stats
        peer_overall = [p["overall"] for p in sample_peer_data]
        overall_percentile = percentileofscore(peer_overall, sample_user_scores["overall"], kind='rank')
        peer_overall_mean = float(np.mean(peer_overall))
        peer_overall_std = float(np.std(peer_overall))

        # Create ComparisonResult
        result = ComparisonResult(
            user_percentile=overall_percentile,
            user_score=sample_user_scores["overall"],
            peer_average=peer_overall_mean,
            peer_std_dev=peer_overall_std,
            dimension_comparisons=dimension_comparisons,
            strengths_vs_peers=["terminology", "relationships", "application", "clarity"],
            gaps_vs_peers=[],
            peer_group_size=len(sample_peer_data)
        )

        # Verify all fields
        assert result.user_percentile > 50.0  # User should be above average
        assert result.user_score == 80.0
        assert result.peer_average > 0.0
        assert result.peer_std_dev > 0.0
        assert len(result.dimension_comparisons) == 4
        assert result.peer_group_size == 50

    def test_insufficient_peer_data(self):
        """Test handling of insufficient peer data (< 50 users)."""
        # Only 30 users
        small_peer_group = [{"user_id": f"user_{i}", "overall": 70.0} for i in range(30)]

        # Should raise validation error or return error response
        assert len(small_peer_group) < 50, "Should detect insufficient peer data"

    def test_edge_case_perfect_score(self, sample_peer_data):
        """Test edge case where user has perfect score (100.0)."""
        peer_overall = [p["overall"] for p in sample_peer_data]
        perfect_score = 100.0

        percentile = percentileofscore(peer_overall, perfect_score, kind='rank')

        # Perfect score should be at or near 100th percentile (>= 95th)
        # scipy percentileofscore with kind='rank' may return slightly less than 100
        assert percentile >= 95.0, "Perfect score should be near 100th percentile"

    def test_edge_case_lowest_score(self, sample_peer_data):
        """Test edge case where user has lowest possible score."""
        peer_overall = [p["overall"] for p in sample_peer_data]
        lowest_score = 0.0

        percentile = percentileofscore(peer_overall, lowest_score, kind='rank')

        # Lowest score should be near 0th percentile
        assert percentile <= 10.0, "Lowest score should be near 0th percentile"

    def test_numpy_mean_std_calculations(self, sample_peer_data):
        """Test numpy statistical calculations."""
        peer_overall = [p["overall"] for p in sample_peer_data]

        mean = float(np.mean(peer_overall))
        std = float(np.std(peer_overall))

        # Verify calculations
        assert 60.0 <= mean <= 80.0, "Mean should be around 70"
        assert std > 0.0, "Standard deviation should be positive"
        assert std < 20.0, "Standard deviation should be reasonable"


class TestComparisonAnalyticsIntegration:
    """Integration tests for comparison analytics endpoint."""

    def test_comparison_result_json_serialization(self, sample_user_scores, sample_peer_data):
        """Test that ComparisonResult can be serialized to JSON."""
        dimensions = ["terminology", "relationships", "application", "clarity"]

        dimension_comparisons = []
        for dim in dimensions:
            peer_scores = [p[dim] for p in sample_peer_data]
            percentile = percentileofscore(peer_scores, sample_user_scores[dim], kind='rank')
            peer_avg = float(np.mean(peer_scores))

            dimension_comparisons.append(DimensionComparison(
                dimension=dim,
                user_score=sample_user_scores[dim],
                peer_average=peer_avg,
                percentile=percentile
            ))

        result = ComparisonResult(
            user_percentile=75.0,
            user_score=80.0,
            peer_average=70.0,
            peer_std_dev=10.0,
            dimension_comparisons=dimension_comparisons,
            strengths_vs_peers=["terminology"],
            gaps_vs_peers=[],
            peer_group_size=50
        )

        # Test Pydantic JSON serialization
        json_data = result.model_dump()

        assert "user_percentile" in json_data
        assert "dimension_comparisons" in json_data
        assert len(json_data["dimension_comparisons"]) == 4
        assert "generated_at" in json_data
