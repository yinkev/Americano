"""
Quick integration test for ABAB Randomization Engine.

Tests the engine directly with synthetic data (bypassing FastAPI/Prisma).
Timestamp: 2025-10-27T11:40:00-07:00
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.abab_engine import ABABRandomizationEngine


def test_abab_analysis():
    """Test ABAB analysis with synthetic data."""
    print("=" * 80)
    print("ABAB Engine Integration Test".center(80))
    print("=" * 80)

    # Initialize engine
    print("\n🔧 Initializing ABAB engine...")
    # Database is at /Users/kyin/Projects/Americano/apps/data/
    db_path = Path(__file__).parent.parent.parent / "data" / "behavioral_events.duckdb"
    print(f"   Database path: {db_path}")

    engine = ABABRandomizationEngine(
        db_path=str(db_path),
        mlflow_tracking_uri="file:./mlruns"
    )

    # Run analysis
    print("\n🧪 Running ABAB analysis...")
    print(f"   User ID: cabab00000000000000000001")
    print(f"   Protocol: default")
    print(f"   Outcome: sessionPerformanceScore")
    print(f"   Permutations: 10,000")

    try:
        result = engine.run_analysis(
            user_id="cabab00000000000000000001",
            protocol_id="default",
            outcome_metric="sessionPerformanceScore",
            n_permutations=10000,
            seed=42,
        )

        print("\n✅ ABAB analysis completed successfully!")
        print("\n" + "-" * 80)
        print("Results Summary".center(80))
        print("-" * 80)

        print(f"\n📊 Observed Effect: {result['observed_effect']:.2f} points")
        print(f"   (Intervention mean - Baseline mean)")

        print(f"\n📈 Statistical Significance:")
        print(f"   P-value: {result['p_value']:.4f}")
        print(f"   Significant: {'Yes ✓' if result['p_value'] < 0.05 else 'No ✗'}")

        print(f"\n📏 Effect Size:")
        print(f"   Cohen's d: {result['cohens_d']:.2f}")
        print(f"   Interpretation: {result['wwc_details']['effect_size_interpretation']}")

        print(f"\n🏆 WWC SCED Standards:")
        print(f"   Rating: {result['wwc_details']['wwc_rating']}")
        print(f"   Passes WWC: {'Yes ✓' if result['passes_sced_standards'] else 'No ✗'}")

        print(f"\n📦 Sample Sizes:")
        for phase, count in result['n_observations_per_phase'].items():
            print(f"   {phase}: {count} observations")

        print(f"\n🔬 Provenance:")
        print(f"   MLflow Run ID: {result['mlflow_run_id']}")
        print(f"   Computation Time: {result['computation_time_seconds']:.2f}s")

        print("\n" + "=" * 80)
        print("\n✅ Integration test PASSED!")
        return True

    except Exception as e:
        print(f"\n❌ Integration test FAILED!")
        print(f"\nError: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = test_abab_analysis()
    sys.exit(0 if success else 1)
