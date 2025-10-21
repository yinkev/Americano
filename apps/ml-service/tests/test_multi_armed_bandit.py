"""
Tests for Multi-Armed Bandit Algorithm

Comprehensive test suite covering:
- Strategy selection (epsilon-greedy, Thompson sampling)
- Outcome updates and learning
- Statistical properties and convergence
- Persistence and serialization
- Algorithm comparison

Author: Americano ML Subsystem
Story: 5.5 - Adaptive Personalization Engine (Task 9)
"""

import pytest
import numpy as np
from datetime import datetime
import tempfile
import os

from app.services.multi_armed_bandit import (
    MultiArmedBandit,
    StrategyType,
    StrategyOutcome,
    StrategyStats,
    compare_algorithms,
)


# ==================== FIXTURES ====================

@pytest.fixture
def mab():
    """Create fresh MAB instance for testing."""
    return MultiArmedBandit(user_id="test_user", epsilon=0.1)


@pytest.fixture
def mab_with_data():
    """Create MAB with some historical data."""
    mab = MultiArmedBandit(user_id="test_user", epsilon=0.1)

    # Simulate outcomes for different strategies
    strategies_and_rewards = [
        (StrategyType.BALANCED, 0.8),
        (StrategyType.BALANCED, 0.75),
        (StrategyType.BALANCED, 0.82),
        (StrategyType.PATTERN_HEAVY, 0.6),
        (StrategyType.PATTERN_HEAVY, 0.65),
        (StrategyType.PREDICTION_HEAVY, 0.5),
        (StrategyType.CONSERVATIVE, 0.45),
    ]

    for strategy, reward in strategies_and_rewards:
        outcome = StrategyOutcome(
            retention_improvement=reward * 2 - 1,
            performance_improvement=reward * 2 - 1,
            completion_rate=reward,
            user_satisfaction=reward * 5
        )
        mab.update(strategy, outcome)

    return mab


# ==================== INITIALIZATION TESTS ====================

def test_mab_initialization():
    """Test MAB initializes with correct default values."""
    mab = MultiArmedBandit(user_id="user123", epsilon=0.1)

    assert mab.user_id == "user123"
    assert mab.epsilon == 0.1
    assert len(mab.strategies) == 4  # 4 strategy types

    # Check all strategies initialized
    for strategy_type in StrategyType:
        assert strategy_type in mab.strategies
        stats = mab.strategies[strategy_type]
        assert stats.alpha == 1.0
        assert stats.beta == 1.0
        assert stats.total_pulls == 0
        assert stats.avg_reward == 0.0


def test_strategy_stats_initialization():
    """Test StrategyStats initializes correctly."""
    stats = StrategyStats(strategy_type=StrategyType.BALANCED)

    assert stats.strategy_type == StrategyType.BALANCED
    assert stats.alpha == 1.0
    assert stats.beta == 1.0
    assert stats.total_pulls == 0
    assert stats.avg_reward == 0.0
    assert stats.confidence == 0.5
    assert stats.last_used_at is None


# ==================== OUTCOME TESTS ====================

def test_outcome_to_reward_positive():
    """Test outcome converts to reward correctly for positive outcomes."""
    outcome = StrategyOutcome(
        retention_improvement=0.2,  # 20% improvement
        performance_improvement=0.15,  # 15% improvement
        completion_rate=0.9,  # 90% completion
        user_satisfaction=4.5  # 4.5/5 satisfaction
    )

    reward = outcome.to_reward()

    # Should be positive (above 0.5) for good outcomes
    assert 0.5 < reward <= 1.0


def test_outcome_to_reward_negative():
    """Test outcome converts to reward correctly for negative outcomes."""
    outcome = StrategyOutcome(
        retention_improvement=-0.1,  # 10% decline
        performance_improvement=-0.05,  # 5% decline
        completion_rate=0.4,  # 40% completion
        user_satisfaction=2.0  # 2/5 satisfaction
    )

    reward = outcome.to_reward()

    # Should be negative (below 0.5) for poor outcomes
    assert 0.0 <= reward < 0.5


def test_outcome_to_reward_without_satisfaction():
    """Test outcome works without user satisfaction."""
    outcome = StrategyOutcome(
        retention_improvement=0.1,
        performance_improvement=0.1,
        completion_rate=0.8
    )

    reward = outcome.to_reward()

    # Should still produce valid reward
    assert 0.0 <= reward <= 1.0


# ==================== EPSILON-GREEDY TESTS ====================

def test_epsilon_greedy_selection(mab_with_data):
    """Test epsilon-greedy selects best strategy most of the time."""
    selections = []

    # Run many selections
    for _ in range(1000):
        strategy = mab_with_data.select_strategy("epsilon_greedy")
        selections.append(strategy)

    # Best strategy (BALANCED) should be selected most often
    # With epsilon=0.1, expect ~90% exploitation + ~2.5% exploration
    balanced_count = selections.count(StrategyType.BALANCED)
    exploit_rate = balanced_count / len(selections)

    # Should be around 90% (allow some variance)
    assert 0.85 <= exploit_rate <= 0.95


def test_epsilon_greedy_explores(mab_with_data):
    """Test epsilon-greedy explores all strategies."""
    selections = []

    # Run many selections
    for _ in range(1000):
        strategy = mab_with_data.select_strategy("epsilon_greedy")
        selections.append(strategy)

    # All strategies should be selected at least once due to exploration
    unique_strategies = set(selections)
    assert len(unique_strategies) == 4


# ==================== THOMPSON SAMPLING TESTS ====================

def test_thompson_sampling_selection(mab_with_data):
    """Test Thompson sampling selects strategies."""
    selections = []

    # Run many selections
    for _ in range(100):
        strategy = mab_with_data.select_strategy("thompson_sampling")
        selections.append(strategy)

    # Should select strategies (not necessarily deterministic)
    unique_strategies = set(selections)
    assert len(unique_strategies) >= 1

    # Best strategy should be selected frequently
    # (but less deterministically than epsilon-greedy)
    balanced_count = selections.count(StrategyType.BALANCED)
    assert balanced_count > 0


def test_thompson_sampling_bayesian_update(mab):
    """Test Thompson sampling updates Bayesian parameters correctly."""
    strategy = StrategyType.BALANCED

    # Apply positive outcome
    outcome = StrategyOutcome(
        retention_improvement=0.3,
        performance_improvement=0.2,
        completion_rate=0.85
    )
    mab.update(strategy, outcome)

    stats = mab.strategies[strategy]

    # Alpha should increase (positive reward > 0.5)
    assert stats.alpha == 2.0
    assert stats.beta == 1.0

    # Apply negative outcome
    outcome_neg = StrategyOutcome(
        retention_improvement=-0.2,
        performance_improvement=-0.1,
        completion_rate=0.3
    )
    mab.update(strategy, outcome_neg)

    # Beta should increase (negative reward < 0.5)
    assert stats.alpha == 2.0
    assert stats.beta == 2.0


# ==================== UPDATE TESTS ====================

def test_update_increments_pulls(mab):
    """Test update increments total pulls correctly."""
    strategy = StrategyType.BALANCED

    assert mab.strategies[strategy].total_pulls == 0

    outcome = StrategyOutcome(
        retention_improvement=0.1,
        performance_improvement=0.1,
        completion_rate=0.8
    )
    mab.update(strategy, outcome)

    assert mab.strategies[strategy].total_pulls == 1


def test_update_computes_running_average(mab):
    """Test update computes running averages correctly."""
    strategy = StrategyType.BALANCED

    outcomes = [
        StrategyOutcome(0.2, 0.15, 0.9),
        StrategyOutcome(0.3, 0.25, 0.85),
        StrategyOutcome(0.1, 0.1, 0.8),
    ]

    for outcome in outcomes:
        mab.update(strategy, outcome)

    stats = mab.strategies[strategy]

    # Check averages are computed
    assert stats.avg_retention_improvement > 0
    assert stats.avg_performance_improvement > 0
    assert stats.avg_completion_rate > 0

    # Check average is reasonable (should be around mean of inputs)
    expected_retention = (0.2 + 0.3 + 0.1) / 3
    assert abs(stats.avg_retention_improvement - expected_retention) < 0.01


def test_update_sets_last_used_at(mab):
    """Test update sets last_used_at timestamp."""
    strategy = StrategyType.BALANCED

    assert mab.strategies[strategy].last_used_at is None

    outcome = StrategyOutcome(0.1, 0.1, 0.8)
    mab.update(strategy, outcome)

    assert mab.strategies[strategy].last_used_at is not None
    assert isinstance(mab.strategies[strategy].last_used_at, datetime)


def test_update_increases_confidence(mab):
    """Test confidence increases with more observations."""
    strategy = StrategyType.BALANCED

    initial_confidence = mab.strategies[strategy].confidence

    # Add multiple observations
    for _ in range(20):
        outcome = StrategyOutcome(0.2, 0.15, 0.85)
        mab.update(strategy, outcome)

    final_confidence = mab.strategies[strategy].confidence

    # Confidence should increase with more data
    assert final_confidence > initial_confidence


# ==================== STATISTICS TESTS ====================

def test_get_statistics(mab_with_data):
    """Test get_statistics returns complete information."""
    stats = mab_with_data.get_statistics()

    assert stats['user_id'] == "test_user"
    assert stats['epsilon'] == 0.1
    assert 'strategies' in stats
    assert 'best_strategy' in stats
    assert 'total_pulls' in stats

    # Check best strategy is identified correctly
    assert stats['best_strategy']['type'] == StrategyType.BALANCED.value


def test_get_strategy_ranking(mab_with_data):
    """Test strategy ranking orders strategies correctly."""
    ranking = mab_with_data.get_strategy_ranking()

    assert len(ranking) == 4

    # First strategy should be best (highest reward)
    assert ranking[0][0] == StrategyType.BALANCED

    # Rewards should be in descending order
    for i in range(len(ranking) - 1):
        assert ranking[i][1] >= ranking[i + 1][1]


def test_get_posterior_distributions(mab_with_data):
    """Test posterior distributions are computed correctly."""
    distributions = mab_with_data.get_posterior_distributions()

    assert len(distributions) == 4

    for strategy_type, dist in distributions.items():
        assert 'alpha' in dist
        assert 'beta' in dist
        assert 'mean' in dist
        assert 'variance' in dist
        assert 'std' in dist

        # Mean should be in [0, 1]
        assert 0 <= dist['mean'] <= 1

        # Variance should be non-negative
        assert dist['variance'] >= 0


# ==================== REGRET TESTS ====================

def test_calculate_regret_zero_pulls(mab):
    """Test regret is zero with no pulls."""
    regret = mab.calculate_regret(optimal_reward=1.0)
    assert regret == 0.0


def test_calculate_regret_increases(mab):
    """Test regret increases with suboptimal choices."""
    strategy = StrategyType.CONSERVATIVE

    # Apply suboptimal outcome
    outcome = StrategyOutcome(-0.1, -0.05, 0.5)
    mab.update(strategy, outcome)

    regret = mab.calculate_regret(optimal_reward=1.0)

    # Regret should be positive (missed optimal reward)
    assert regret > 0


def test_calculate_average_regret(mab_with_data):
    """Test average regret is computed correctly."""
    avg_regret = mab_with_data.calculate_average_regret(optimal_reward=1.0)

    # Average regret should be non-negative
    assert avg_regret >= 0

    # Should be less than optimal reward (can't lose more than max possible)
    assert avg_regret < 1.0


# ==================== PERSISTENCE TESTS ====================

def test_to_dict_serialization(mab_with_data):
    """Test MAB serializes to dictionary correctly."""
    data = mab_with_data.to_dict()

    assert data['user_id'] == "test_user"
    assert data['epsilon'] == 0.1
    assert 'strategies' in data
    assert len(data['strategies']) == 4


def test_from_dict_deserialization(mab_with_data):
    """Test MAB deserializes from dictionary correctly."""
    data = mab_with_data.to_dict()
    mab_restored = MultiArmedBandit.from_dict(data)

    assert mab_restored.user_id == mab_with_data.user_id
    assert mab_restored.epsilon == mab_with_data.epsilon

    # Check strategies restored
    for strategy_type in StrategyType:
        original_stats = mab_with_data.strategies[strategy_type]
        restored_stats = mab_restored.strategies[strategy_type]

        assert restored_stats.alpha == original_stats.alpha
        assert restored_stats.beta == original_stats.beta
        assert restored_stats.total_pulls == original_stats.total_pulls


def test_save_and_load_json(mab_with_data):
    """Test MAB saves and loads from JSON correctly."""
    # Create temporary file
    with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.json') as f:
        filepath = f.name

    try:
        # Save
        mab_with_data.save_json(filepath)

        # Load
        mab_loaded = MultiArmedBandit.load_json(filepath)

        # Verify loaded data matches
        assert mab_loaded.user_id == mab_with_data.user_id
        assert mab_loaded.epsilon == mab_with_data.epsilon

        # Check strategy statistics match
        for strategy_type in StrategyType:
            original = mab_with_data.strategies[strategy_type]
            loaded = mab_loaded.strategies[strategy_type]

            assert loaded.total_pulls == original.total_pulls
            assert loaded.avg_reward == pytest.approx(original.avg_reward)

    finally:
        # Cleanup
        if os.path.exists(filepath):
            os.remove(filepath)


# ==================== CONVERGENCE TESTS ====================

def test_convergence_to_best_strategy():
    """Test MAB converges to best strategy over time."""
    mab = MultiArmedBandit(user_id="convergence_test", epsilon=0.1)

    # Simulate rewards: BALANCED is best
    reward_means = {
        StrategyType.PATTERN_HEAVY: 0.6,
        StrategyType.PREDICTION_HEAVY: 0.55,
        StrategyType.BALANCED: 0.8,  # Best
        StrategyType.CONSERVATIVE: 0.5,
    }

    # Run many rounds
    for _ in range(200):
        strategy = mab.select_strategy("epsilon_greedy")

        # Generate reward from strategy's distribution
        mean_reward = reward_means[strategy]
        reward = np.clip(np.random.normal(mean_reward, 0.1), 0, 1)

        outcome = StrategyOutcome(
            retention_improvement=reward * 2 - 1,
            performance_improvement=reward * 2 - 1,
            completion_rate=reward
        )
        mab.update(strategy, outcome)

    # After convergence, best strategy should be identified
    ranking = mab.get_strategy_ranking()
    assert ranking[0][0] == StrategyType.BALANCED


def test_thompson_sampling_convergence():
    """Test Thompson sampling converges to best strategy."""
    mab = MultiArmedBandit(user_id="thompson_test", epsilon=0.1)

    reward_means = {
        StrategyType.PATTERN_HEAVY: 0.6,
        StrategyType.PREDICTION_HEAVY: 0.55,
        StrategyType.BALANCED: 0.8,  # Best
        StrategyType.CONSERVATIVE: 0.5,
    }

    # Run many rounds
    for _ in range(200):
        strategy = mab.select_strategy("thompson_sampling")

        mean_reward = reward_means[strategy]
        reward = np.clip(np.random.normal(mean_reward, 0.1), 0, 1)

        outcome = StrategyOutcome(
            retention_improvement=reward * 2 - 1,
            performance_improvement=reward * 2 - 1,
            completion_rate=reward
        )
        mab.update(strategy, outcome)

    # Best strategy should have highest posterior mean
    distributions = mab.get_posterior_distributions()
    best_strategy = max(
        distributions.items(),
        key=lambda x: x[1]['mean']
    )

    assert best_strategy[0] == StrategyType.BALANCED


# ==================== ALGORITHM COMPARISON TESTS ====================

def test_compare_algorithms_runs():
    """Test algorithm comparison runs without errors."""
    results = compare_algorithms(n_rounds=100)

    assert 'epsilon_greedy' in results
    assert 'thompson_sampling' in results
    assert 'summary' in results

    # Check both algorithms collected data
    assert len(results['epsilon_greedy']['rewards']) == 100
    assert len(results['thompson_sampling']['rewards']) == 100


def test_compare_algorithms_identifies_best():
    """Test algorithm comparison identifies best strategy."""
    # Custom reward distributions with clear best
    reward_distributions = {
        StrategyType.PATTERN_HEAVY: (0.5, 0.1),
        StrategyType.PREDICTION_HEAVY: (0.45, 0.1),
        StrategyType.BALANCED: (0.85, 0.05),  # Clearly best
        StrategyType.CONSERVATIVE: (0.4, 0.1),
    }

    results = compare_algorithms(
        n_rounds=500,
        reward_distributions=reward_distributions
    )

    # Both algorithms should identify BALANCED as best
    assert results['summary']['epsilon_greedy']['best_strategy'] == 'balanced'
    assert results['summary']['thompson_sampling']['best_strategy'] == 'balanced'


# ==================== EDGE CASE TESTS ====================

def test_zero_epsilon_pure_exploitation(mab_with_data):
    """Test epsilon=0 means pure exploitation (no exploration)."""
    mab_with_data.epsilon = 0.0

    selections = []
    for _ in range(100):
        strategy = mab_with_data.select_strategy("epsilon_greedy")
        selections.append(strategy)

    # Should always select best strategy
    unique_strategies = set(selections)
    assert len(unique_strategies) == 1
    assert list(unique_strategies)[0] == StrategyType.BALANCED


def test_one_epsilon_pure_exploration(mab_with_data):
    """Test epsilon=1.0 means pure exploration (no exploitation)."""
    mab_with_data.epsilon = 1.0

    selections = []
    for _ in range(1000):
        strategy = mab_with_data.select_strategy("epsilon_greedy")
        selections.append(strategy)

    # Should explore all strategies roughly equally
    for strategy_type in StrategyType:
        count = selections.count(strategy_type)
        # Allow some variance, but should be roughly 25% each
        assert 0.15 <= count / len(selections) <= 0.35


def test_update_with_extreme_outcome(mab):
    """Test MAB handles extreme outcomes correctly."""
    strategy = StrategyType.BALANCED

    # Extreme positive outcome
    outcome = StrategyOutcome(
        retention_improvement=1.0,
        performance_improvement=1.0,
        completion_rate=1.0,
        user_satisfaction=5.0
    )
    mab.update(strategy, outcome)

    stats = mab.strategies[strategy]
    assert stats.avg_reward <= 1.0  # Reward should be capped

    # Extreme negative outcome
    outcome_neg = StrategyOutcome(
        retention_improvement=-1.0,
        performance_improvement=-1.0,
        completion_rate=0.0,
        user_satisfaction=1.0
    )
    mab.update(strategy, outcome_neg)

    assert stats.avg_reward >= 0.0  # Reward should be non-negative


# ==================== INTEGRATION TEST ====================

def test_full_mab_workflow():
    """Test complete MAB workflow from initialization to decision making."""
    # Initialize MAB
    mab = MultiArmedBandit(user_id="workflow_test", epsilon=0.1)

    # Simulate learning over 50 rounds
    true_best = StrategyType.BALANCED
    reward_means = {
        StrategyType.PATTERN_HEAVY: 0.6,
        StrategyType.PREDICTION_HEAVY: 0.55,
        StrategyType.BALANCED: 0.8,
        StrategyType.CONSERVATIVE: 0.5,
    }

    for round_num in range(50):
        # Select strategy
        strategy = mab.select_strategy("epsilon_greedy")

        # Simulate outcome
        mean = reward_means[strategy]
        reward = np.clip(np.random.normal(mean, 0.1), 0, 1)

        outcome = StrategyOutcome(
            retention_improvement=reward * 2 - 1,
            performance_improvement=reward * 2 - 1,
            completion_rate=reward,
            user_satisfaction=reward * 5
        )

        # Update MAB
        mab.update(strategy, outcome)

    # Get statistics
    stats = mab.get_statistics()

    # Verify MAB learned
    assert stats['total_pulls'] == 50
    assert stats['best_strategy']['type'] == true_best.value

    # Get ranking
    ranking = mab.get_strategy_ranking()
    assert ranking[0][0] == true_best

    # Calculate regret
    regret = mab.calculate_regret(optimal_reward=1.0)
    assert regret > 0  # Some regret due to exploration

    # Test persistence
    data = mab.to_dict()
    mab_restored = MultiArmedBandit.from_dict(data)
    assert mab_restored.user_id == mab.user_id
