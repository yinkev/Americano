"""
Multi-Armed Bandit Algorithm for Personalization Strategy Selection

Implements research-grade bandit algorithms for adaptive personalization:
- Epsilon-greedy (90% exploit, 10% explore)
- Thompson sampling (Bayesian approach)
- 4 personalization strategy variants

Follows reinforcement learning best practices and production ML standards.

Author: Americano ML Subsystem
Story: 5.5 - Adaptive Personalization Engine (Task 9)
Quality: Research-grade (per CLAUDE.md analytics standards)
"""

import numpy as np
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, asdict
from datetime import datetime
from enum import Enum
import json
from scipy.stats import beta


class StrategyType(Enum):
    """
    Personalization strategy variants (arms in MAB).

    Each strategy represents a different approach to personalization:
    - PATTERN_HEAVY: Prioritizes behavioral patterns over predictions
    - PREDICTION_HEAVY: Prioritizes predictive analytics over patterns
    - BALANCED: Equal weighting of all data sources
    - CONSERVATIVE: Minimal adaptation, gradual changes
    """
    PATTERN_HEAVY = "pattern_heavy"
    PREDICTION_HEAVY = "prediction_heavy"
    BALANCED = "balanced"
    CONSERVATIVE = "conservative"


@dataclass
class StrategyOutcome:
    """
    Outcome of applying a personalization strategy.

    Tracks performance metrics to evaluate strategy effectiveness:
    - retention_improvement: Percentage change in retention rate
    - performance_improvement: Percentage change in session performance
    - completion_rate: Mission/session completion rate
    - user_satisfaction: Explicit user feedback (1-5 scale)
    """
    retention_improvement: float  # -1.0 to 1.0 (percentage change)
    performance_improvement: float  # -1.0 to 1.0 (percentage change)
    completion_rate: float  # 0.0 to 1.0
    user_satisfaction: Optional[float] = None  # 1-5 scale

    def to_reward(self) -> float:
        """
        Convert outcome to single reward signal for MAB.

        Weighted combination of metrics:
        - Retention: 40% weight (most important for learning)
        - Performance: 30% weight (direct learning outcome)
        - Completion: 20% weight (engagement indicator)
        - Satisfaction: 10% weight (user experience)

        Returns:
            Float reward in range [0, 1] where higher is better
        """
        reward = (
            self.retention_improvement * 0.4 +
            self.performance_improvement * 0.3 +
            self.completion_rate * 0.2
        )

        if self.user_satisfaction is not None:
            # Normalize satisfaction from 1-5 to 0-1
            normalized_satisfaction = (self.user_satisfaction - 1) / 4
            reward += normalized_satisfaction * 0.1

        # Normalize to [0, 1] range
        # Improvements can be negative, so shift and scale
        reward = (reward + 1) / 2
        return np.clip(reward, 0, 1)


@dataclass
class StrategyStats:
    """
    Statistics for a personalization strategy (MAB arm).

    Tracks:
    - Bayesian parameters (alpha, beta) for Thompson sampling
    - Empirical statistics for epsilon-greedy
    - Performance metrics for reporting
    """
    strategy_type: StrategyType

    # Bayesian parameters (Beta distribution)
    alpha: float = 1.0  # Prior successes + observed successes
    beta: float = 1.0  # Prior failures + observed failures

    # Empirical statistics
    total_pulls: int = 0
    total_reward: float = 0.0

    # Performance tracking
    avg_reward: float = 0.0
    avg_retention_improvement: float = 0.0
    avg_performance_improvement: float = 0.0
    avg_completion_rate: float = 0.0

    # Metadata
    last_used_at: Optional[datetime] = None
    confidence: float = 0.5  # Confidence in strategy effectiveness [0, 1]

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        result = asdict(self)
        result['strategy_type'] = self.strategy_type.value
        result['last_used_at'] = self.last_used_at.isoformat() if self.last_used_at else None
        return result


class MultiArmedBandit:
    """
    Multi-Armed Bandit for personalization strategy selection.

    Implements two algorithms:
    1. Epsilon-Greedy: Exploits best strategy 90% of time, explores 10%
    2. Thompson Sampling: Bayesian approach sampling from posterior distributions

    The MAB learns which personalization strategy works best for each user
    by balancing exploration (trying different strategies) with exploitation
    (using the best-known strategy).

    Usage:
        # Initialize MAB for user
        mab = MultiArmedBandit(user_id="user123")

        # Select strategy (epsilon-greedy by default)
        strategy = mab.select_strategy()

        # Apply strategy, observe outcome
        outcome = apply_personalization(strategy)

        # Update MAB with outcome
        mab.update(strategy, outcome)

        # Get performance summary
        stats = mab.get_statistics()
    """

    def __init__(
        self,
        user_id: str,
        epsilon: float = 0.1,
        initial_strategy_stats: Optional[Dict[StrategyType, StrategyStats]] = None
    ):
        """
        Initialize Multi-Armed Bandit.

        Args:
            user_id: User identifier
            epsilon: Exploration rate for epsilon-greedy (default 0.1 = 10%)
            initial_strategy_stats: Pre-existing strategy statistics (for loading)
        """
        self.user_id = user_id
        self.epsilon = epsilon

        # Initialize strategy statistics
        if initial_strategy_stats:
            self.strategies = initial_strategy_stats
        else:
            self.strategies = {
                strategy_type: StrategyStats(strategy_type=strategy_type)
                for strategy_type in StrategyType
            }

        # Algorithm selection
        self.algorithm = "epsilon_greedy"  # or "thompson_sampling"

        # Random state for reproducibility in tests
        self.rng = np.random.default_rng()

    # ==================== STRATEGY SELECTION ====================

    def select_strategy(
        self,
        algorithm: str = "epsilon_greedy"
    ) -> StrategyType:
        """
        Select personalization strategy using MAB algorithm.

        Args:
            algorithm: "epsilon_greedy" or "thompson_sampling"

        Returns:
            Selected StrategyType
        """
        self.algorithm = algorithm

        if algorithm == "thompson_sampling":
            return self._select_thompson_sampling()
        else:
            return self._select_epsilon_greedy()

    def _select_epsilon_greedy(self) -> StrategyType:
        """
        Epsilon-greedy strategy selection.

        With probability epsilon (10%), explore by selecting random strategy.
        With probability 1-epsilon (90%), exploit by selecting best strategy.

        Returns:
            Selected StrategyType
        """
        # Exploration: Random selection
        if self.rng.random() < self.epsilon:
            strategy_type = self.rng.choice(list(StrategyType))
            return strategy_type

        # Exploitation: Best strategy
        best_strategy = max(
            self.strategies.items(),
            key=lambda x: x[1].avg_reward
        )

        return best_strategy[0]

    def _select_thompson_sampling(self) -> StrategyType:
        """
        Thompson sampling strategy selection.

        Samples from posterior Beta distribution for each strategy
        and selects the strategy with highest sampled value.

        This is a Bayesian approach that naturally balances exploration
        and exploitation based on uncertainty in reward estimates.

        Returns:
            Selected StrategyType
        """
        samples = {}

        for strategy_type, stats in self.strategies.items():
            # Sample from Beta(alpha, beta) distribution
            sample = self.rng.beta(stats.alpha, stats.beta)
            samples[strategy_type] = sample

        # Select strategy with highest sampled value
        best_strategy = max(samples.items(), key=lambda x: x[1])
        return best_strategy[0]

    # ==================== UPDATE METHODS ====================

    def update(
        self,
        strategy_type: StrategyType,
        outcome: StrategyOutcome
    ) -> None:
        """
        Update strategy statistics with observed outcome.

        Updates both Bayesian parameters (for Thompson sampling)
        and empirical statistics (for epsilon-greedy and reporting).

        Args:
            strategy_type: Strategy that was applied
            outcome: Observed outcome with performance metrics
        """
        stats = self.strategies[strategy_type]

        # Convert outcome to reward
        reward = outcome.to_reward()

        # Update Bayesian parameters (Beta distribution)
        # Treat reward as Bernoulli: success if reward > 0.5, failure otherwise
        if reward > 0.5:
            stats.alpha += 1
        else:
            stats.beta += 1

        # Update empirical statistics
        stats.total_pulls += 1
        stats.total_reward += reward
        stats.avg_reward = stats.total_reward / stats.total_pulls

        # Update performance metrics (running average)
        n = stats.total_pulls
        stats.avg_retention_improvement = (
            (stats.avg_retention_improvement * (n - 1) + outcome.retention_improvement) / n
        )
        stats.avg_performance_improvement = (
            (stats.avg_performance_improvement * (n - 1) + outcome.performance_improvement) / n
        )
        stats.avg_completion_rate = (
            (stats.avg_completion_rate * (n - 1) + outcome.completion_rate) / n
        )

        # Update confidence (based on number of pulls and reward stability)
        # Higher pulls + consistent rewards = higher confidence
        stats.confidence = self._calculate_confidence(stats)

        # Update metadata
        stats.last_used_at = datetime.utcnow()

    def _calculate_confidence(self, stats: StrategyStats) -> float:
        """
        Calculate confidence in strategy effectiveness.

        Confidence increases with:
        1. Number of observations (more data = more confidence)
        2. Consistency of rewards (lower variance = more confidence)

        Args:
            stats: Strategy statistics

        Returns:
            Confidence score [0, 1]
        """
        # Sample size component (sigmoid curve)
        # Reaches ~95% confidence at 50 pulls
        sample_confidence = 1 / (1 + np.exp(-0.1 * (stats.total_pulls - 25)))

        # Uncertainty component from Beta distribution
        # Lower uncertainty = higher confidence
        if stats.alpha + stats.beta > 2:  # Avoid division by zero
            beta_variance = (stats.alpha * stats.beta) / (
                (stats.alpha + stats.beta) ** 2 * (stats.alpha + stats.beta + 1)
            )
            uncertainty_confidence = 1 - np.sqrt(beta_variance) * 10  # Scale variance
            uncertainty_confidence = np.clip(uncertainty_confidence, 0, 1)
        else:
            uncertainty_confidence = 0.5

        # Combine components
        confidence = 0.6 * sample_confidence + 0.4 * uncertainty_confidence

        return np.clip(confidence, 0, 1)

    # ==================== STATISTICS AND REPORTING ====================

    def get_statistics(self) -> Dict[str, Any]:
        """
        Get comprehensive statistics for all strategies.

        Returns:
            Dictionary with strategy statistics and MAB metadata
        """
        strategy_stats = {
            strategy_type.value: stats.to_dict()
            for strategy_type, stats in self.strategies.items()
        }

        # Identify best strategy
        best_strategy = max(
            self.strategies.items(),
            key=lambda x: x[1].avg_reward
        )

        return {
            'user_id': self.user_id,
            'algorithm': self.algorithm,
            'epsilon': self.epsilon,
            'strategies': strategy_stats,
            'best_strategy': {
                'type': best_strategy[0].value,
                'avg_reward': best_strategy[1].avg_reward,
                'confidence': best_strategy[1].confidence,
                'total_pulls': best_strategy[1].total_pulls,
            },
            'total_pulls': sum(s.total_pulls for s in self.strategies.values()),
        }

    def get_strategy_ranking(self) -> List[Tuple[StrategyType, float]]:
        """
        Get strategies ranked by average reward.

        Returns:
            List of (StrategyType, avg_reward) tuples, sorted descending
        """
        ranking = [
            (strategy_type, stats.avg_reward)
            for strategy_type, stats in self.strategies.items()
        ]

        return sorted(ranking, key=lambda x: x[1], reverse=True)

    def get_posterior_distributions(self) -> Dict[StrategyType, Dict[str, float]]:
        """
        Get posterior Beta distribution parameters for each strategy.

        Useful for visualizing uncertainty and strategy performance.

        Returns:
            Dictionary mapping strategy to {'alpha', 'beta', 'mean', 'variance'}
        """
        distributions = {}

        for strategy_type, stats in self.strategies.items():
            alpha, beta_param = stats.alpha, stats.beta

            # Beta distribution statistics
            mean = alpha / (alpha + beta_param)
            variance = (alpha * beta_param) / (
                (alpha + beta_param) ** 2 * (alpha + beta_param + 1)
            )

            distributions[strategy_type] = {
                'alpha': alpha,
                'beta': beta_param,
                'mean': mean,
                'variance': variance,
                'std': np.sqrt(variance),
            }

        return distributions

    # ==================== REGRET ANALYSIS ====================

    def calculate_regret(self, optimal_reward: float = 1.0) -> float:
        """
        Calculate cumulative regret.

        Regret = sum of (optimal_reward - observed_reward) over all pulls.
        Measures opportunity cost of exploration.

        Args:
            optimal_reward: Theoretical best possible reward (default 1.0)

        Returns:
            Cumulative regret
        """
        total_pulls = sum(s.total_pulls for s in self.strategies.values())
        total_reward = sum(s.total_reward for s in self.strategies.values())

        cumulative_regret = optimal_reward * total_pulls - total_reward

        return cumulative_regret

    def calculate_average_regret(self, optimal_reward: float = 1.0) -> float:
        """
        Calculate average regret per pull.

        Args:
            optimal_reward: Theoretical best possible reward

        Returns:
            Average regret per pull
        """
        total_pulls = sum(s.total_pulls for s in self.strategies.values())

        if total_pulls == 0:
            return 0.0

        return self.calculate_regret(optimal_reward) / total_pulls

    # ==================== PERSISTENCE ====================

    def to_dict(self) -> Dict[str, Any]:
        """
        Serialize MAB state to dictionary.

        Returns:
            Dictionary representation of MAB state
        """
        return {
            'user_id': self.user_id,
            'epsilon': self.epsilon,
            'algorithm': self.algorithm,
            'strategies': {
                strategy_type.value: stats.to_dict()
                for strategy_type, stats in self.strategies.items()
            },
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'MultiArmedBandit':
        """
        Deserialize MAB from dictionary.

        Args:
            data: Dictionary representation

        Returns:
            MultiArmedBandit instance
        """
        # Reconstruct strategy stats
        strategies = {}
        for strategy_name, stats_dict in data['strategies'].items():
            strategy_type = StrategyType(strategy_name)

            # Convert last_used_at back to datetime
            if stats_dict['last_used_at']:
                stats_dict['last_used_at'] = datetime.fromisoformat(
                    stats_dict['last_used_at']
                )

            stats_dict['strategy_type'] = strategy_type
            strategies[strategy_type] = StrategyStats(**stats_dict)

        return cls(
            user_id=data['user_id'],
            epsilon=data['epsilon'],
            initial_strategy_stats=strategies
        )

    def save_json(self, filepath: str) -> None:
        """
        Save MAB state to JSON file.

        Args:
            filepath: Path to save file
        """
        with open(filepath, 'w') as f:
            json.dump(self.to_dict(), f, indent=2, default=str)

    @classmethod
    def load_json(cls, filepath: str) -> 'MultiArmedBandit':
        """
        Load MAB state from JSON file.

        Args:
            filepath: Path to saved file

        Returns:
            MultiArmedBandit instance
        """
        with open(filepath, 'r') as f:
            data = json.load(f)

        return cls.from_dict(data)


# ==================== HELPER FUNCTIONS ====================

def compare_algorithms(
    n_rounds: int = 1000,
    reward_distributions: Optional[Dict[StrategyType, Tuple[float, float]]] = None
) -> Dict[str, Any]:
    """
    Compare epsilon-greedy vs Thompson sampling on simulated data.

    Useful for understanding algorithm behavior and tuning parameters.

    Args:
        n_rounds: Number of simulation rounds
        reward_distributions: Mean/std for each strategy's reward distribution
                             Can be dict of tuples (mean, std) or dict of floats (mean only)

    Returns:
        Comparison results with regret curves
    """
    # Default reward distributions (strategy means)
    if reward_distributions is None:
        reward_distributions = {
            StrategyType.PATTERN_HEAVY: (0.65, 0.1),
            StrategyType.PREDICTION_HEAVY: (0.55, 0.15),
            StrategyType.BALANCED: (0.75, 0.08),  # Best strategy
            StrategyType.CONSERVATIVE: (0.50, 0.12),
        }

    # Normalize reward_distributions to tuple format
    normalized_distributions = {}
    for strategy, value in reward_distributions.items():
        if isinstance(value, tuple):
            normalized_distributions[strategy] = value
        else:
            # If just a float, use default std of 0.1
            normalized_distributions[strategy] = (value, 0.1)

    reward_distributions = normalized_distributions

    # Initialize MABs
    mab_epsilon = MultiArmedBandit(user_id="sim_epsilon", epsilon=0.1)
    mab_thompson = MultiArmedBandit(user_id="sim_thompson", epsilon=0.1)

    # Track results
    results = {
        'epsilon_greedy': {'rewards': [], 'regrets': []},
        'thompson_sampling': {'rewards': [], 'regrets': []},
    }

    optimal_reward = max(mean for mean, _ in reward_distributions.values())

    for i in range(n_rounds):
        # Epsilon-greedy
        strategy_eps = mab_epsilon.select_strategy("epsilon_greedy")
        mean, std = reward_distributions[strategy_eps]
        reward_eps = np.clip(np.random.normal(mean, std), 0, 1)

        outcome_eps = StrategyOutcome(
            retention_improvement=reward_eps * 2 - 1,
            performance_improvement=reward_eps * 2 - 1,
            completion_rate=reward_eps
        )
        mab_epsilon.update(strategy_eps, outcome_eps)

        results['epsilon_greedy']['rewards'].append(reward_eps)
        results['epsilon_greedy']['regrets'].append(
            mab_epsilon.calculate_regret(optimal_reward)
        )

        # Thompson sampling
        strategy_ts = mab_thompson.select_strategy("thompson_sampling")
        mean, std = reward_distributions[strategy_ts]
        reward_ts = np.clip(np.random.normal(mean, std), 0, 1)

        outcome_ts = StrategyOutcome(
            retention_improvement=reward_ts * 2 - 1,
            performance_improvement=reward_ts * 2 - 1,
            completion_rate=reward_ts
        )
        mab_thompson.update(strategy_ts, outcome_ts)

        results['thompson_sampling']['rewards'].append(reward_ts)
        results['thompson_sampling']['regrets'].append(
            mab_thompson.calculate_regret(optimal_reward)
        )

    # Summary statistics
    results['summary'] = {
        'epsilon_greedy': {
            'total_reward': sum(results['epsilon_greedy']['rewards']),
            'avg_reward': np.mean(results['epsilon_greedy']['rewards']),
            'final_regret': results['epsilon_greedy']['regrets'][-1],
            'best_strategy': mab_epsilon.get_strategy_ranking()[0][0].value,
        },
        'thompson_sampling': {
            'total_reward': sum(results['thompson_sampling']['rewards']),
            'avg_reward': np.mean(results['thompson_sampling']['rewards']),
            'final_regret': results['thompson_sampling']['regrets'][-1],
            'best_strategy': mab_thompson.get_strategy_ranking()[0][0].value,
        },
        'optimal_reward': optimal_reward,
        'n_rounds': n_rounds,
    }

    return results
