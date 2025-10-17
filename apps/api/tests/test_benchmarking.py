"""
Unit tests for PeerBenchmarkingEngine (Story 4.6).

Tests cover:
- Privacy enforcement (minimum 50 users)
- Percentile calculations
- Relative strengths/weaknesses identification
- Box plot distributions (IQR, whiskers)
- Opt-in consent checks

Author: Claude Code (Story 4.6)
Date: 2025-10-17
"""

import pytest
import numpy as np
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

from src.analytics.benchmarking import PeerBenchmarkingEngine
from src.analytics.models import (
    PeerDistribution,
    RelativeStrength,
    RelativeWeakness,
)


@pytest.fixture
def mock_session():
    """Create mock AsyncSession for testing."""
    session = AsyncMock()
    return session


@pytest.fixture
def engine(mock_session):
    """Create PeerBenchmarkingEngine instance."""
    return PeerBenchmarkingEngine(mock_session)


class TestPrivacyEnforcement:
    """Test privacy constraints (C-5): minimum 50 users."""

    @pytest.mark.asyncio
    async def test_aggregate_peer_data_insufficient_users(self, engine, mock_session):
        """Test that < 50 users raises ValueError."""
        # Mock query result with only 30 users
        mock_result = MagicMock()
        mock_result.fetchall.return_value = [(f"user{i}", 75.0, 80.0, 70.0, 85.0, 5) for i in range(30)]
        mock_session.execute.return_value = mock_result

        with pytest.raises(ValueError, match="Insufficient peer data: 30 users"):
            await engine.aggregate_peer_data(user_id="user1")

    @pytest.mark.asyncio
    async def test_aggregate_peer_data_sufficient_users(self, engine, mock_session):
        """Test that >= 50 users succeeds."""
        # Mock first query (aggregate_peer_data main query) with 60 users
        mock_result_1 = MagicMock()
        mock_result_1.fetchall.return_value = [(f"user{i}", 75.0, 80.0, 70.0, 85.0, 5) for i in range(60)]

        # Mock second query (_get_user_overall_percentile fallback query) - return None to use first query data
        mock_result_2 = MagicMock()
        mock_result_2.fetchone.return_value = None

        # Mock third query (_identify_relative_performance) - return empty to skip strengths/weaknesses
        mock_result_3 = MagicMock()
        mock_result_3.fetchall.return_value = []

        # Set up side_effect for multiple execute calls
        mock_session.execute.side_effect = [mock_result_1, mock_result_2, mock_result_3]

        result = await engine.aggregate_peer_data(user_id="user1")

        assert result.peer_distribution.sample_size == 60
        assert result.peer_distribution is not None
        assert result.user_id == "user1"

    @pytest.mark.asyncio
    async def test_calculate_percentile_insufficient_peers(self, engine, mock_session):
        """Test percentile calculation with < 50 peers raises error."""
        # Mock user score query
        user_result = MagicMock()
        user_result.fetchone.return_value = (75.0,)

        # Mock peer scores query with only 30 peers
        peer_result = MagicMock()
        peer_result.fetchall.return_value = [(f"user{i}", 70.0 + i) for i in range(30)]

        mock_session.execute.side_effect = [user_result, peer_result]

        with pytest.raises(ValueError, match="Insufficient peer data: 30 users"):
            await engine.calculate_user_percentile("user1", "obj1", "comprehension_score")


class TestPercentileCalculations:
    """Test percentile rank formula: (count_below / total_peers) * 100."""

    @pytest.mark.asyncio
    async def test_calculate_user_percentile_exact(self, engine, mock_session):
        """Test exact percentile calculation."""
        # User score: 75
        user_result = MagicMock()
        user_result.fetchone.return_value = (75.0,)

        # Peer scores: [40, 50, 60, 70, 75, 80, 85, 90, 95]
        # Count below or equal to 75: 5
        # Percentile: (5 / 9) * 100 = 55.56
        peer_scores = [40, 50, 60, 70, 75, 80, 85, 90, 95]
        peer_result = MagicMock()
        peer_result.fetchall.return_value = [(f"user{i}", score) for i, score in enumerate(peer_scores)]

        # Need to pad to 50 users for privacy check
        peer_result.fetchall.return_value = [(f"user{i}", score) for i, score in enumerate(peer_scores)] + \
                                             [(f"user{i+9}", 70.0) for i in range(41)]

        mock_session.execute.side_effect = [user_result, peer_result]

        percentile = await engine.calculate_user_percentile("user1", "obj1", "comprehension_score")

        # 5 scores <= 75, total 50 peers -> (5 + 41 + 4) / 50 = 100% (since we padded with 70s)
        # Actually: count_below = 5 (original) + 41 (padding at 70) = 46
        # Total = 50, percentile = (46 / 50) * 100 = 92
        # Wait, let me recalculate: peer_scores has 5 scores <= 75
        # We add 41 users with score 70 (all <= 75)
        # Total <= 75: 5 + 41 = 46
        # Percentile = (46 / 50) * 100 = 92
        assert percentile >= 90.0  # Approximately 92

    @pytest.mark.asyncio
    async def test_calculate_user_percentile_bottom(self, engine, mock_session):
        """Test user at bottom percentile."""
        # User score: 30 (lowest)
        user_result = MagicMock()
        user_result.fetchone.return_value = (30.0,)

        # Peer scores: 30, 40, 50, ..., 95 (50 users)
        peer_scores = [30 + i * 1.5 for i in range(50)]
        peer_result = MagicMock()
        peer_result.fetchall.return_value = [(f"user{i}", score) for i, score in enumerate(peer_scores)]

        mock_session.execute.side_effect = [user_result, peer_result]

        percentile = await engine.calculate_user_percentile("user1", "obj1", "comprehension_score")

        # Only 1 score <= 30 (the user themselves)
        # Percentile = (1 / 50) * 100 = 2
        assert percentile <= 5.0

    @pytest.mark.asyncio
    async def test_calculate_user_percentile_top(self, engine, mock_session):
        """Test user at top percentile."""
        # User score: 98
        user_result = MagicMock()
        user_result.fetchone.return_value = (98.0,)

        # Peer scores: 40, 50, ..., 95, 98 (50 users)
        peer_scores = [40 + i * 1.2 for i in range(49)] + [98.0]
        peer_result = MagicMock()
        peer_result.fetchall.return_value = [(f"user{i}", score) for i, score in enumerate(peer_scores)]

        mock_session.execute.side_effect = [user_result, peer_result]

        percentile = await engine.calculate_user_percentile("user1", "obj1", "comprehension_score")

        # All 50 scores <= 98 (user has highest)
        # Percentile = (50 / 50) * 100 = 100
        assert percentile >= 95.0


class TestRelativeStrengthsWeaknesses:
    """Test identification of relative strengths (>= 75th) and weaknesses (<= 25th)."""

    @pytest.mark.asyncio
    async def test_identify_strengths_and_weaknesses(self, engine, mock_session):
        """Test identification of relative strengths and weaknesses."""
        # Mock query result with 3 objectives
        query_result = MagicMock()
        query_result.fetchall.return_value = [
            ("obj1", "Objective 1", 85.0, 70.0, 50),  # Strength
            ("obj2", "Objective 2", 50.0, 65.0, 50),  # Neither
            ("obj3", "Objective 3", 30.0, 68.0, 50),  # Weakness
        ]
        mock_session.execute.return_value = query_result

        # Mock calculate_user_percentile calls
        with patch.object(engine, 'calculate_user_percentile') as mock_percentile:
            mock_percentile.side_effect = [85.0, 50.0, 15.0]  # Percentiles for obj1, obj2, obj3

            strengths, weaknesses = await engine.identify_relative_strengths_weaknesses("user1")

            # Should have 1 strength (>= 75) and 1 weakness (<= 25)
            assert len(strengths) == 1
            assert len(weaknesses) == 1

            # Verify strength
            assert strengths[0].objective_id == "obj1"
            assert strengths[0].user_percentile == 85.0

            # Verify weakness
            assert weaknesses[0].objective_id == "obj3"
            assert weaknesses[0].user_percentile == 15.0

    @pytest.mark.asyncio
    async def test_no_strengths_or_weaknesses(self, engine, mock_session):
        """Test when user has no extreme strengths or weaknesses."""
        # Mock query result with all mid-range percentiles
        query_result = MagicMock()
        query_result.fetchall.return_value = [
            ("obj1", "Objective 1", 60.0, 62.0, 50),
            ("obj2", "Objective 2", 55.0, 58.0, 50),
        ]
        mock_session.execute.return_value = query_result

        with patch.object(engine, 'calculate_user_percentile') as mock_percentile:
            mock_percentile.side_effect = [55.0, 50.0]  # Mid-range percentiles

            strengths, weaknesses = await engine.identify_relative_strengths_weaknesses("user1")

            assert len(strengths) == 0
            assert len(weaknesses) == 0


class TestBoxPlotDistributions:
    """Test quartile calculations with IQR and whiskers."""

    def test_calculate_distribution_normal(self, engine):
        """Test distribution calculation for normal distribution."""
        # Create normally distributed scores
        np.random.seed(42)
        scores = np.random.normal(70, 10, 100)  # mean=70, std=10, n=100

        distribution = engine._calculate_distribution(scores)

        # Verify basic statistics
        assert 60 <= distribution.mean <= 80
        assert 65 <= distribution.median <= 75
        assert 8 <= distribution.std_dev <= 12

        # Verify quartiles
        assert distribution.q1 < distribution.q2 < distribution.q3
        assert distribution.q2 == distribution.median

        # Verify IQR
        assert distribution.iqr == round(distribution.q3 - distribution.q1, 2)

        # Verify whiskers
        expected_low = distribution.q1 - 1.5 * distribution.iqr
        expected_high = distribution.q3 + 1.5 * distribution.iqr
        assert distribution.whisker_low >= scores.min()
        assert distribution.whisker_high <= scores.max()

        # Verify sample size
        assert distribution.sample_size == 100

    def test_calculate_distribution_uniform(self, engine):
        """Test distribution calculation for uniform distribution."""
        # Create uniformly distributed scores
        scores = np.linspace(50, 90, 80)  # 80 evenly spaced values

        distribution = engine._calculate_distribution(scores)

        # For uniform distribution, mean ≈ median
        assert abs(distribution.mean - distribution.median) < 2.0

        # Quartiles should be evenly spaced
        q1_to_median = distribution.median - distribution.q1
        median_to_q3 = distribution.q3 - distribution.median
        assert abs(q1_to_median - median_to_q3) < 2.0

        # IQR should be reasonable
        assert distribution.iqr > 0


class TestGetPeerDistribution:
    """Test get_peer_distribution method with caching."""

    @pytest.mark.asyncio
    async def test_get_peer_distribution_success(self, engine, mock_session):
        """Test successful peer distribution retrieval."""
        # Mock query result with 60 users
        mock_result = MagicMock()
        peer_scores = [(f"user{i}", 60.0 + i * 0.5) for i in range(60)]
        mock_result.fetchall.return_value = peer_scores
        mock_session.execute.return_value = mock_result

        distribution = await engine.get_peer_distribution("obj1", "comprehension_score")

        # Verify distribution structure
        assert isinstance(distribution, PeerDistribution)
        assert distribution.sample_size == 60
        assert distribution.q1 < distribution.q2 < distribution.q3
        assert distribution.iqr > 0
        assert distribution.whisker_low < distribution.whisker_high

    @pytest.mark.asyncio
    async def test_get_peer_distribution_invalid_metric(self, engine, mock_session):
        """Test invalid metric raises ValueError."""
        with pytest.raises(ValueError, match="Invalid metric"):
            await engine.get_peer_distribution("obj1", "invalid_metric")

    @pytest.mark.asyncio
    async def test_get_peer_distribution_insufficient_data(self, engine, mock_session):
        """Test insufficient peer data raises ValueError."""
        # Mock query result with only 20 users
        mock_result = MagicMock()
        peer_scores = [(f"user{i}", 70.0) for i in range(20)]
        mock_result.fetchall.return_value = peer_scores
        mock_session.execute.return_value = mock_result

        with pytest.raises(ValueError, match="Insufficient peer data: 20 users"):
            await engine.get_peer_distribution("obj1", "comprehension_score")


class TestEdgeCases:
    """Test edge cases and error handling."""

    @pytest.mark.asyncio
    async def test_calculate_percentile_invalid_metric(self, engine, mock_session):
        """Test invalid metric raises ValueError."""
        with pytest.raises(ValueError, match="Invalid metric"):
            await engine.calculate_user_percentile("user1", "obj1", "invalid_metric")

    @pytest.mark.asyncio
    async def test_calculate_percentile_no_user_data(self, engine, mock_session):
        """Test insufficient user data raises ValueError."""
        # Mock user query returning None
        user_result = MagicMock()
        user_result.fetchone.return_value = None
        mock_session.execute.return_value = user_result

        with pytest.raises(ValueError, match="Insufficient data for user"):
            await engine.calculate_user_percentile("user1", "obj1", "comprehension_score")

    def test_calculate_distribution_minimum_sample(self, engine):
        """Test distribution calculation with minimum sample size."""
        # Create exactly 50 scores
        scores = np.array([50.0 + i for i in range(50)])

        distribution = engine._calculate_distribution(scores)

        assert distribution.sample_size == 50
        assert distribution.q1 < distribution.q2 < distribution.q3
        assert distribution.iqr > 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
