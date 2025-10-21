"""
Quick test of LongitudinalProgressTracker implementation.
Tests the linear regression logic with synthetic data.
"""

import sys
sys.path.insert(0, 'src')

from analytics.progress_tracker import LongitudinalProgressTracker, MetricPoint
from datetime import datetime, timedelta
import asyncio


async def test_linear_regression():
    """Test linear regression prediction logic."""
    print("Testing linear regression for growth trajectory...")

    # Create mock session (None for now, we'll test the math)
    tracker = LongitudinalProgressTracker(session=None)

    # Test case 1: Positive linear growth (should predict mastery)
    historical_scores = [50.0, 55.0, 60.0, 65.0, 70.0]  # +5 points per week
    trajectory = await tracker.predict_growth_trajectory("obj_1", historical_scores)

    if trajectory:
        print(f"✓ Test 1 - Positive growth:")
        print(f"  Slope: {trajectory.slope:.2f} (expected ~5.0)")
        print(f"  Intercept: {trajectory.intercept:.2f}")
        print(f"  R²: {trajectory.r_squared:.3f} (expected ~1.0 for perfect fit)")
        print(f"  Days to mastery: {trajectory.predicted_days_to_mastery}")
        assert abs(trajectory.slope - 5.0) < 0.1, "Slope should be ~5.0"
        assert trajectory.r_squared > 0.99, "R² should be near 1.0 for perfect linear data"
    else:
        print("✗ Test 1 failed: No trajectory returned")
        return False

    # Test case 2: Already at mastery (should return None)
    historical_scores_mastered = [80.0, 82.0, 85.0, 87.0]
    trajectory2 = await tracker.predict_growth_trajectory("obj_2", historical_scores_mastered)

    if trajectory2 is None:
        print("✓ Test 2 - Already mastered: Correctly returns None")
    else:
        print("✗ Test 2 failed: Should return None for mastered objectives")
        return False

    # Test case 3: Insufficient data (< 3 points, should return None)
    historical_scores_short = [50.0, 55.0]
    trajectory3 = await tracker.predict_growth_trajectory("obj_3", historical_scores_short)

    if trajectory3 is None:
        print("✓ Test 3 - Insufficient data: Correctly returns None")
    else:
        print("✗ Test 3 failed: Should return None for < 3 data points")
        return False

    # Test case 4: Negative slope (declining performance, should return None for mastery)
    historical_scores_decline = [70.0, 65.0, 60.0, 55.0]
    trajectory4 = await tracker.predict_growth_trajectory("obj_4", historical_scores_decline)

    if trajectory4:
        print(f"✓ Test 4 - Declining performance:")
        print(f"  Slope: {trajectory4.slope:.2f} (expected ~-5.0)")
        print(f"  Days to mastery: {trajectory4.predicted_days_to_mastery} (expected None)")
        assert trajectory4.slope < 0, "Slope should be negative"
        assert trajectory4.predicted_days_to_mastery is None, "No mastery prediction for negative trend"
    else:
        print("✗ Test 4 failed: Should return trajectory object (even with negative slope)")
        return False

    print("\n✅ All linear regression tests passed!")
    return True


async def test_improvement_rates():
    """Test improvement rate calculation logic."""
    print("\nTesting improvement rate calculations...")

    tracker = LongitudinalProgressTracker(session=None)

    # Create synthetic metrics with clear weekly trend
    now = datetime.utcnow()
    metrics = [
        # Current week (days 0-7): avg 75
        MetricPoint(now - timedelta(days=1), "comprehension", 75.0, 5, "up"),
        MetricPoint(now - timedelta(days=3), "comprehension", 76.0, 5, "up"),
        MetricPoint(now - timedelta(days=6), "comprehension", 74.0, 5, "up"),

        # Previous week (days 8-14): avg 60
        MetricPoint(now - timedelta(days=8), "comprehension", 60.0, 5, "stable"),
        MetricPoint(now - timedelta(days=10), "comprehension", 61.0, 5, "stable"),
        MetricPoint(now - timedelta(days=13), "comprehension", 59.0, 5, "stable"),

        # Current month (days 0-30): avg 70
        MetricPoint(now - timedelta(days=20), "comprehension", 65.0, 5, "up"),
        MetricPoint(now - timedelta(days=25), "comprehension", 68.0, 5, "up"),

        # Previous month (days 31-60): avg 55
        MetricPoint(now - timedelta(days=35), "comprehension", 55.0, 5, "stable"),
        MetricPoint(now - timedelta(days=40), "comprehension", 54.0, 5, "stable"),
        MetricPoint(now - timedelta(days=50), "comprehension", 56.0, 5, "stable"),
    ]

    rates = await tracker.calculate_improvement_rates(metrics)

    print(f"Weekly rate: {rates['week'].rate:.1f}% ({rates['week'].trend})")
    print(f"Monthly rate: {rates['month'].rate:.1f}% ({rates['month'].trend})")

    # Week: (75 - 60) / 60 * 100 = 25%
    expected_weekly = 25.0
    assert abs(rates['week'].rate - expected_weekly) < 5.0, f"Weekly rate should be ~{expected_weekly}%"
    assert rates['week'].trend == "accelerating", "Weekly trend should be accelerating"

    # Month: Note - this is approximate due to averaging multiple data points
    # Expected range: 20-30%
    assert 15.0 <= rates['month'].rate <= 35.0, f"Monthly rate should be between 15-35%"
    assert rates['month'].trend == "accelerating", "Monthly trend should be accelerating"

    print("✅ Improvement rate calculations passed!")
    return True


async def test_milestone_detection():
    """Test milestone detection logic."""
    print("\nTesting milestone detection...")

    tracker = LongitudinalProgressTracker(session=None)

    now = datetime.utcnow()
    metrics = [
        # Week 1: 60 (below mastery)
        MetricPoint(now - timedelta(days=21), "comprehension", 60.0, 5, "stable"),
        # Week 2: 75 (still below mastery)
        MetricPoint(now - timedelta(days=14), "comprehension", 75.0, 5, "up"),
        # Week 3: 85 (crossed mastery threshold!)
        MetricPoint(now - timedelta(days=7), "comprehension", 85.0, 5, "up"),
        # Week 4: 87 (maintained mastery)
        MetricPoint(now, "comprehension", 87.0, 5, "up"),
    ]

    milestones = await tracker.detect_milestones("test_user", metrics)

    print(f"Detected {len(milestones)} milestone(s)")

    # Should detect mastery_verified (60 → 85 crosses 80% threshold)
    mastery_milestones = [m for m in milestones if m.milestone_type == "mastery_verified"]
    assert len(mastery_milestones) > 0, "Should detect mastery milestone"
    print(f"✓ Mastery milestone detected: {mastery_milestones[0].description}")

    # Should detect streak (3+ consecutive "up" trends)
    streak_milestones = [m for m in milestones if m.milestone_type == "streak_achieved"]
    if len(streak_milestones) > 0:
        print(f"✓ Streak milestone detected: {streak_milestones[0].description}")

    print("✅ Milestone detection passed!")
    return True


async def test_regression_detection():
    """Test regression detection logic."""
    print("\nTesting regression detection...")

    tracker = LongitudinalProgressTracker(session=None)

    now = datetime.utcnow()
    metrics = [
        # Week 1: Achieved mastery (85)
        MetricPoint(now - timedelta(days=60), "reasoning", 85.0, 5, "up"),
        # Week 2-5: Maintained mastery
        MetricPoint(now - timedelta(days=50), "reasoning", 87.0, 5, "stable"),
        MetricPoint(now - timedelta(days=40), "reasoning", 84.0, 5, "stable"),
        MetricPoint(now - timedelta(days=30), "reasoning", 86.0, 5, "stable"),
        # Week 6: Significant decline (dropped to 65, decline of 22 points)
        MetricPoint(now - timedelta(days=7), "reasoning", 65.0, 2, "down"),
    ]

    regressions = await tracker.detect_regressions("test_user", metrics)

    print(f"Detected {len(regressions)} regression(s)")

    if len(regressions) > 0:
        reg = regressions[0]
        print(f"✓ Regression detected:")
        print(f"  Objective: {reg.objective_name}")
        print(f"  Decline: {reg.decline_amount:.1f} points")
        print(f"  Before: {reg.score_before:.1f} → After: {reg.score_after:.1f}")
        print(f"  Possible causes: {', '.join(reg.possible_causes)}")

        assert reg.decline_amount > 15, "Decline should be > 15 points"
        assert reg.score_before >= 80, "Previous score should be >= 80 (mastery)"
    else:
        print("✗ No regression detected (expected at least one)")
        return False

    print("✅ Regression detection passed!")
    return True


async def main():
    """Run all tests."""
    print("=" * 60)
    print("LongitudinalProgressTracker Implementation Tests")
    print("=" * 60)

    tests = [
        test_linear_regression(),
        test_improvement_rates(),
        test_milestone_detection(),
        test_regression_detection(),
    ]

    results = await asyncio.gather(*tests, return_exceptions=True)

    print("\n" + "=" * 60)
    passed = sum(1 for r in results if r is True)
    total = len(results)

    if passed == total:
        print(f"✅ ALL TESTS PASSED ({passed}/{total})")
    else:
        print(f"⚠️  SOME TESTS FAILED ({passed}/{total})")
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                print(f"  Test {i+1} exception: {result}")

    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
