"""
Multi-Armed Bandit Demo - Story 5.5 Task 9

Demonstrates all key features of the MAB implementation:
- Epsilon-greedy strategy selection
- Thompson sampling
- Outcome tracking and learning
- Algorithm comparison
- Persistence

Run: python examples/multi_armed_bandit_demo.py
"""

import sys
sys.path.insert(0, '.')

import numpy as np
from app.services.multi_armed_bandit import (
    MultiArmedBandit,
    StrategyType,
    StrategyOutcome,
    compare_algorithms
)


def print_header(title):
    """Print formatted section header."""
    print(f"\n{'=' * 70}")
    print(f"  {title}")
    print(f"{'=' * 70}\n")


def simulate_personalization_session(strategy_type: StrategyType) -> StrategyOutcome:
    """
    Simulate applying a personalization strategy and observing outcomes.

    Different strategies have different effectiveness (simulated):
    - BALANCED: Best overall (80% base reward)
    - PATTERN_HEAVY: Good (65% base reward)
    - PREDICTION_HEAVY: Moderate (60% base reward)
    - CONSERVATIVE: Safe but limited (55% base reward)
    """
    # Simulate strategy effectiveness
    base_rewards = {
        StrategyType.PATTERN_HEAVY: 0.65,
        StrategyType.PREDICTION_HEAVY: 0.60,
        StrategyType.BALANCED: 0.80,
        StrategyType.CONSERVATIVE: 0.55,
    }

    base_reward = base_rewards[strategy_type]
    # Add noise to simulate real-world variability
    actual_reward = np.clip(np.random.normal(base_reward, 0.1), 0, 1)

    # Create outcome based on reward
    return StrategyOutcome(
        retention_improvement=actual_reward * 2 - 1,  # Convert to -1 to 1 range
        performance_improvement=actual_reward * 2 - 1,
        completion_rate=actual_reward,
        user_satisfaction=actual_reward * 4 + 1  # Convert to 1-5 scale
    )


def demo_basic_usage():
    """Demo 1: Basic MAB usage."""
    print_header("Demo 1: Basic Multi-Armed Bandit Usage")

    # Initialize MAB
    print("Initializing MAB for user 'demo_user'...")
    mab = MultiArmedBandit(user_id="demo_user", epsilon=0.1)
    print(f"✓ MAB initialized with {len(mab.strategies)} strategies")
    print(f"  Epsilon (exploration rate): {mab.epsilon * 100:.0f}%\n")

    # Initial strategy selection (random, no data yet)
    print("Selecting initial strategy (no data, random selection)...")
    strategy = mab.select_strategy("epsilon_greedy")
    print(f"✓ Selected: {strategy.value}\n")

    # Simulate outcome
    print("Simulating personalization session...")
    outcome = simulate_personalization_session(strategy)
    reward = outcome.to_reward()
    print(f"✓ Outcome:")
    print(f"  - Retention improvement: {outcome.retention_improvement:+.1%}")
    print(f"  - Performance improvement: {outcome.performance_improvement:+.1%}")
    print(f"  - Completion rate: {outcome.completion_rate:.1%}")
    print(f"  - User satisfaction: {outcome.user_satisfaction:.1f}/5.0")
    print(f"  - Combined reward: {reward:.3f}\n")

    # Update MAB
    print("Updating MAB with outcome...")
    mab.update(strategy, outcome)
    stats = mab.strategies[strategy]
    print(f"✓ Updated {strategy.value}:")
    print(f"  - Total pulls: {stats.total_pulls}")
    print(f"  - Average reward: {stats.avg_reward:.3f}")
    print(f"  - Confidence: {stats.confidence:.2f}")


def demo_learning_convergence():
    """Demo 2: Learning and convergence over time."""
    print_header("Demo 2: Learning and Convergence (50 rounds)")

    mab = MultiArmedBandit(user_id="learner", epsilon=0.1)

    print("Running 50 personalization sessions...")
    print("(BALANCED strategy is objectively best in this simulation)\n")

    # Track selections
    selection_counts = {s: 0 for s in StrategyType}

    for round_num in range(50):
        strategy = mab.select_strategy("epsilon_greedy")
        selection_counts[strategy] += 1

        outcome = simulate_personalization_session(strategy)
        mab.update(strategy, outcome)

    # Show results
    print("Results after 50 rounds:")
    print("\nStrategy Rankings (by learned reward):")
    ranking = mab.get_strategy_ranking()
    for i, (strategy, avg_reward) in enumerate(ranking, 1):
        stats = mab.strategies[strategy]
        pulls = stats.total_pulls
        confidence = stats.confidence
        bar = '█' * int(avg_reward * 30)
        print(f"  {i}. {strategy.value:20s} {bar:30s} {avg_reward:.3f}")
        print(f"     └─ Pulls: {pulls:2d}, Confidence: {confidence:.2f}")

    print(f"\n✓ Best strategy identified: {ranking[0][0].value}")
    print(f"  Average reward: {ranking[0][1]:.3f}")

    # Show exploration vs exploitation
    best_strategy = ranking[0][0]
    exploitation_rate = selection_counts[best_strategy] / 50
    print(f"\n✓ Exploitation rate: {exploitation_rate:.1%} (selected best strategy)")
    print(f"  Exploration occurred: {1 - exploitation_rate:.1%} (tried other strategies)")


def demo_thompson_sampling():
    """Demo 3: Thompson sampling (Bayesian approach)."""
    print_header("Demo 3: Thompson Sampling (Bayesian Approach)")

    mab = MultiArmedBandit(user_id="bayesian_learner", epsilon=0.1)

    print("Running 50 rounds with Thompson Sampling...")
    print("(Thompson Sampling uses Bayesian posterior distributions)\n")

    for round_num in range(50):
        strategy = mab.select_strategy("thompson_sampling")
        outcome = simulate_personalization_session(strategy)
        mab.update(strategy, outcome)

    # Show posterior distributions
    print("Learned Posterior Distributions (Beta distributions):")
    distributions = mab.get_posterior_distributions()

    for strategy_type in StrategyType:
        dist = distributions[strategy_type]
        alpha, beta_param = dist['alpha'], dist['beta']
        mean, std = dist['mean'], dist['std']

        # Visual representation of uncertainty
        bar = '█' * int(mean * 30)
        uncertainty_bar = '░' * int(std * 50)

        print(f"\n  {strategy_type.value:20s}")
        print(f"     Mean: {bar:30s} {mean:.3f}")
        print(f"     Uncertainty: {uncertainty_bar:20s} (std: {std:.3f})")
        print(f"     Beta(α={alpha:.1f}, β={beta_param:.1f})")

    # Best strategy
    best_strategy = max(distributions.items(), key=lambda x: x[1]['mean'])
    print(f"\n✓ Best strategy (highest posterior mean): {best_strategy[0].value}")
    print(f"  Mean reward: {best_strategy[1]['mean']:.3f}")
    print(f"  Uncertainty: {best_strategy[1]['std']:.3f}")


def demo_algorithm_comparison():
    """Demo 4: Compare epsilon-greedy vs Thompson sampling."""
    print_header("Demo 4: Algorithm Comparison (500 rounds each)")

    print("Comparing Epsilon-Greedy vs Thompson Sampling...")
    print("Running 500 rounds for each algorithm...\n")

    results = compare_algorithms(n_rounds=500)

    # Extract results
    eps_summary = results['summary']['epsilon_greedy']
    ts_summary = results['summary']['thompson_sampling']

    print("Epsilon-Greedy Results:")
    print(f"  Total Reward:    {eps_summary['total_reward']:.1f}")
    print(f"  Average Reward:  {eps_summary['avg_reward']:.4f}")
    print(f"  Final Regret:    {eps_summary['final_regret']:.2f}")
    print(f"  Best Strategy:   {eps_summary['best_strategy']}")

    print("\nThompson Sampling Results:")
    print(f"  Total Reward:    {ts_summary['total_reward']:.1f}")
    print(f"  Average Reward:  {ts_summary['avg_reward']:.4f}")
    print(f"  Final Regret:    {ts_summary['final_regret']:.2f}")
    print(f"  Best Strategy:   {ts_summary['best_strategy']}")

    # Winner
    if eps_summary['avg_reward'] > ts_summary['avg_reward']:
        winner = "Epsilon-Greedy"
        advantage = eps_summary['avg_reward'] - ts_summary['avg_reward']
    else:
        winner = "Thompson Sampling"
        advantage = ts_summary['avg_reward'] - eps_summary['avg_reward']

    print(f"\n✓ Winner: {winner}")
    print(f"  Advantage: {advantage:.4f} average reward")

    # Regret comparison
    eps_regret = eps_summary['final_regret']
    ts_regret = ts_summary['final_regret']

    if eps_regret < ts_regret:
        regret_winner = "Epsilon-Greedy"
        regret_diff = ts_regret - eps_regret
    else:
        regret_winner = "Thompson Sampling"
        regret_diff = eps_regret - ts_regret

    print(f"\n✓ Lower Regret: {regret_winner}")
    print(f"  Regret saved: {regret_diff:.2f}")


def demo_persistence():
    """Demo 5: Saving and loading MAB state."""
    print_header("Demo 5: Persistence (Save & Load)")

    import tempfile
    import os

    # Create MAB with some data
    print("Creating MAB with learned data...")
    mab = MultiArmedBandit(user_id="persistent_user", epsilon=0.1)

    for _ in range(30):
        strategy = mab.select_strategy("epsilon_greedy")
        outcome = simulate_personalization_session(strategy)
        mab.update(strategy, outcome)

    original_stats = mab.get_statistics()
    print(f"✓ MAB has {original_stats['total_pulls']} total pulls")
    print(f"  Best strategy: {original_stats['best_strategy']['type']}")

    # Save to file
    with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.json') as f:
        filepath = f.name

    try:
        print(f"\nSaving MAB to file...")
        mab.save_json(filepath)
        file_size = os.path.getsize(filepath)
        print(f"✓ Saved to: {filepath}")
        print(f"  File size: {file_size:,} bytes")

        # Load from file
        print(f"\nLoading MAB from file...")
        mab_loaded = MultiArmedBandit.load_json(filepath)
        loaded_stats = mab_loaded.get_statistics()

        print(f"✓ Loaded successfully")
        print(f"  Total pulls: {loaded_stats['total_pulls']} (matches original: {loaded_stats['total_pulls'] == original_stats['total_pulls']})")
        print(f"  Best strategy: {loaded_stats['best_strategy']['type']} (matches: {loaded_stats['best_strategy']['type'] == original_stats['best_strategy']['type']})")

        # Verify all strategies match
        all_match = True
        for strategy_type in StrategyType:
            original = mab.strategies[strategy_type]
            loaded = mab_loaded.strategies[strategy_type]
            if original.total_pulls != loaded.total_pulls:
                all_match = False
                break

        print(f"\n✓ All strategy statistics preserved: {all_match}")

    finally:
        if os.path.exists(filepath):
            os.remove(filepath)


def demo_regret_analysis():
    """Demo 6: Regret analysis (learning efficiency)."""
    print_header("Demo 6: Regret Analysis (Learning Efficiency)")

    mab = MultiArmedBandit(user_id="regret_tracker", epsilon=0.1)

    print("Running 100 rounds and tracking regret...")
    print("(Regret = opportunity cost of not always selecting optimal strategy)\n")

    regrets = []
    for round_num in range(100):
        strategy = mab.select_strategy("epsilon_greedy")
        outcome = simulate_personalization_session(strategy)
        mab.update(strategy, outcome)

        regret = mab.calculate_regret(optimal_reward=1.0)
        regrets.append(regret)

        if (round_num + 1) % 25 == 0:
            avg_regret = mab.calculate_average_regret(optimal_reward=1.0)
            print(f"Round {round_num + 1:3d}: Cumulative Regret = {regret:6.2f}, Avg per Pull = {avg_regret:.4f}")

    # Final regret
    final_regret = mab.calculate_regret(optimal_reward=1.0)
    final_avg_regret = mab.calculate_average_regret(optimal_reward=1.0)

    print(f"\nFinal Regret Analysis:")
    print(f"  Cumulative Regret: {final_regret:.2f}")
    print(f"  Average per Pull:  {final_avg_regret:.4f}")
    print(f"  Total Pulls:       {mab.get_statistics()['total_pulls']}")

    # Regret rate
    regret_rate = (regrets[-1] - regrets[24]) / 75  # Regret added in last 75 rounds
    print(f"\n✓ Regret growth rate (rounds 26-100): {regret_rate:.3f} per round")
    print(f"  (Lower is better, indicates learning efficiency)")


def main():
    """Run all demos."""
    print("\n" + "█" * 70)
    print("█" + " " * 68 + "█")
    print("█" + "  Multi-Armed Bandit Demo - Story 5.5 Task 9".center(68) + "█")
    print("█" + " " * 68 + "█")
    print("█" * 70)

    demos = [
        ("Basic Usage", demo_basic_usage),
        ("Learning & Convergence", demo_learning_convergence),
        ("Thompson Sampling", demo_thompson_sampling),
        ("Algorithm Comparison", demo_algorithm_comparison),
        ("Persistence", demo_persistence),
        ("Regret Analysis", demo_regret_analysis),
    ]

    for i, (name, demo_func) in enumerate(demos, 1):
        demo_func()
        if i < len(demos):
            input(f"\n{'─' * 70}\nPress Enter to continue to next demo...\n{'─' * 70}")

    print_header("Demo Complete!")
    print("All MAB features demonstrated successfully.\n")
    print("Key Takeaways:")
    print("  • Epsilon-greedy balances exploration (10%) and exploitation (90%)")
    print("  • Thompson sampling uses Bayesian inference for strategy selection")
    print("  • Both algorithms converge to optimal strategy over time")
    print("  • Regret analysis measures learning efficiency")
    print("  • Full persistence support for production deployment")
    print("\nImplementation ready for Story 5.5 PersonalizationEngine integration.")


if __name__ == "__main__":
    main()
