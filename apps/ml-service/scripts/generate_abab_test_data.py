"""
Generate Synthetic ABAB Test Data

Creates 60-day synthetic ABAB reversal design dataset for integration testing.
Implements WWC-compliant single-case experimental design with realistic effect size.

ABAB Phase Design:
- Baseline 1 (days 1-15): mean=70, sd=3
- Intervention A1 (days 16-30): mean=85, sd=3 (+15 point effect)
- Baseline 2 (days 31-45): mean=70, sd=3 (return to baseline)
- Intervention A2 (days 46-60): mean=85, sd=3 (replicate effect)

Effect Size: Cohen's d ≈ 5.0 (very large, ideal for testing)
Expected p-value: < 0.001 (highly significant)

Created: 2025-10-27T11:05:00-07:00
Part of: Day 7-8 Research Analytics Implementation (ADR-006)

Usage:
    python scripts/generate_abab_test_data.py
"""

import sys
from pathlib import Path
from datetime import datetime, timedelta

import duckdb
import numpy as np
import pandas as pd

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.schemas.behavioral_events import BehavioralEventSchema


def generate_abab_data(
    user_id: str = "cabab00000000000000000001",  # CUID format (exactly 25 chars: c + 24 alphanumeric)
    start_date: str = "2025-08-28",  # 60 days ago from Oct 27, ensuring all data is in past
    seed: int = 42,
) -> pd.DataFrame:
    """
    Generate synthetic ABAB reversal design data.

    Args:
        user_id: Test user ID
        start_date: Start date for data generation (ISO 8601)
        seed: Random seed for reproducibility

    Returns:
        DataFrame with 60 days of ABAB data
    """
    rng = np.random.default_rng(seed)

    # Phase parameters
    phases = [
        {
            "name": "baseline_1",
            "days": range(1, 16),  # Days 1-15
            "mean": 70,
            "sd": 3,
        },
        {
            "name": "intervention_A_1",
            "days": range(16, 31),  # Days 16-30
            "mean": 85,
            "sd": 3,
        },
        {
            "name": "baseline_2",
            "days": range(31, 46),  # Days 31-45
            "mean": 70,
            "sd": 3,
        },
        {
            "name": "intervention_A_2",
            "days": range(46, 61),  # Days 46-60
            "mean": 85,
            "sd": 3,
        },
    ]

    # Generate data
    records = []
    base_date = datetime.fromisoformat(start_date)

    for phase in phases:
        for day in phase["days"]:
            # Generate performance score (normal distribution)
            score = rng.normal(phase["mean"], phase["sd"])
            score = np.clip(score, 0, 100)  # Clamp to 0-100 range

            # Create behavioral event record
            timestamp = base_date + timedelta(days=day - 1)

            # Generate CUID-like ID (c + exactly 24 alphanumeric characters)
            # Format: "c" + "abab" + 2-digit day + 18 zeros = 1 + 4 + 2 + 18 = 25 total
            event_id = f"cabab{day:02d}{'0' * 18}"  # CUID format

            record = {
                "id": event_id,
                "userId": user_id,
                "eventType": "SESSION_ENDED",  # From EventType enum
                "eventData": {"session_id": f"session_{day}"},
                "timestamp": timestamp,
                "completionQuality": "NORMAL",
                "contentType": "mixed_review",
                "contextMetadataId": "cmetaabab00000000000001",  # CUID format (required when experimentPhase is set)
                "dayOfWeek": timestamp.weekday(),
                "difficultyLevel": "intermediate",
                "engagementLevel": "MEDIUM",
                "sessionPerformanceScore": int(round(score)),
                "timeOfDay": 14,  # 2 PM study time
                "experimentPhase": phase["name"],
                "randomizationSeed": seed,
            }
            records.append(record)

    df = pd.DataFrame(records)
    return df


def validate_data(df: pd.DataFrame) -> bool:
    """
    Validate data against Pandera schema.

    Args:
        df: DataFrame to validate

    Returns:
        True if validation passes

    Raises:
        SchemaError: If validation fails
    """
    print("\n📋 Validating data against Pandera schema...")
    validated_df = BehavioralEventSchema.validate(df)
    print("✅ Validation passed!")
    return True


def save_to_parquet(df: pd.DataFrame, output_path: Path) -> None:
    """
    Save DataFrame to Parquet file.

    Args:
        df: DataFrame to save
        output_path: Output file path
    """
    output_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_parquet(output_path, index=False)
    print(f"\n💾 Saved to Parquet: {output_path}")


def sync_to_duckdb(df: pd.DataFrame, db_path: Path) -> None:
    """
    Sync DataFrame to DuckDB database.

    Args:
        df: DataFrame to sync
        db_path: DuckDB database path
    """
    conn = duckdb.connect(str(db_path))

    # Create table if not exists
    conn.execute("""
        CREATE TABLE IF NOT EXISTS behavioral_events (
            id VARCHAR PRIMARY KEY,
            userId VARCHAR NOT NULL,
            eventType VARCHAR NOT NULL,
            eventData JSON NOT NULL,
            timestamp TIMESTAMP NOT NULL,
            completionQuality VARCHAR,
            contentType VARCHAR,
            contextMetadataId VARCHAR,
            dayOfWeek INTEGER,
            difficultyLevel VARCHAR,
            engagementLevel VARCHAR,
            sessionPerformanceScore INTEGER,
            timeOfDay INTEGER,
            experimentPhase VARCHAR,
            randomizationSeed INTEGER
        )
    """)

    # Insert data (replace if exists)
    conn.execute("DELETE FROM behavioral_events WHERE userId = ?", [df["userId"].iloc[0]])
    conn.execute("INSERT INTO behavioral_events SELECT * FROM df")

    conn.close()
    print(f"\n🗄️  Synced to DuckDB: {db_path}")


def print_summary(df: pd.DataFrame) -> None:
    """
    Print summary statistics by phase.

    Args:
        df: DataFrame with ABAB data
    """
    print("\n" + "=" * 80)
    print("📊 ABAB Test Data Summary".center(80))
    print("=" * 80)

    print(f"\nTotal observations: {len(df)}")
    print(f"User ID: {df['userId'].iloc[0]}")
    print(f"Date range: {df['timestamp'].min()} to {df['timestamp'].max()}")

    print("\n" + "-" * 80)
    print("Phase Statistics".center(80))
    print("-" * 80)

    phase_stats = df.groupby("experimentPhase")["sessionPerformanceScore"].agg(
        ["count", "mean", "std", "min", "max"]
    )

    print(phase_stats.to_string())

    # Calculate observed effect
    baseline_data = df[
        df["experimentPhase"].isin(["baseline_1", "baseline_2"])
    ]["sessionPerformanceScore"]

    intervention_data = df[
        df["experimentPhase"].isin(["intervention_A_1", "intervention_A_2"])
    ]["sessionPerformanceScore"]

    observed_effect = intervention_data.mean() - baseline_data.mean()
    pooled_sd = np.sqrt(
        ((len(intervention_data) - 1) * intervention_data.var()
         + (len(baseline_data) - 1) * baseline_data.var())
        / (len(intervention_data) + len(baseline_data) - 2)
    )
    cohens_d = observed_effect / pooled_sd if pooled_sd > 0 else 0.0

    print("\n" + "-" * 80)
    print("Expected Effect Size".center(80))
    print("-" * 80)
    print(f"Baseline mean: {baseline_data.mean():.2f}")
    print(f"Intervention mean: {intervention_data.mean():.2f}")
    print(f"Observed effect: {observed_effect:.2f}")
    print(f"Cohen's d: {cohens_d:.2f} (very large)")
    print(f"Expected p-value: < 0.001 (highly significant)")

    print("\n" + "=" * 80)


def main():
    """Main execution function."""
    print("=" * 80)
    print("ABAB Test Data Generator".center(80))
    print("=" * 80)

    # Paths
    project_root = Path(__file__).parent.parent.parent
    data_dir = project_root / "data"
    parquet_path = data_dir / "test_abab_behavioral_events.parquet"
    duckdb_path = data_dir / "behavioral_events.duckdb"

    # Generate data
    print("\n🎲 Generating 60-day ABAB data (seed=42)...")
    df = generate_abab_data()

    # Validate
    validate_data(df)

    # Save
    save_to_parquet(df, parquet_path)
    sync_to_duckdb(df, duckdb_path)

    # Summary
    print_summary(df)

    print("\n✅ ABAB test data generation complete!")
    print(f"\n📁 Files created:")
    print(f"  - Parquet: {parquet_path}")
    print(f"  - DuckDB: {duckdb_path}")
    print(f"\n🚀 Ready for integration testing!")


if __name__ == "__main__":
    main()
