#!/usr/bin/env python3
"""
Generate Synthetic Labeled Dataset for Struggle Prediction Validation

Creates realistic training data based on heuristic rules when real labels are unavailable.
This follows the research-grade standards from CLAUDE.md.

Dataset Generation Rules:
- STRUGGLED = True if:
  * retentionScore < 0.4
  * reviewLapseRate > 0.5
  * prerequisiteGapCount > 0.6
  * sessionPerformanceScore < 40

- NOT_STRUGGLED = True if:
  * retentionScore > 0.7
  * reviewLapseRate < 0.2
  * All prerequisites mastered
  * High confidence ratings

Target: 200+ examples (70% not struggled, 30% struggled - realistic distribution)
"""

import numpy as np
import pandas as pd
from pathlib import Path
from datetime import datetime, timedelta
import json

# Random seed for reproducibility (research-grade requirement)
np.random.seed(42)

# Feature names (from struggle_model.py)
FEATURE_NAMES = [
    # Performance features (5)
    "retention_score",
    "retention_decline_rate",
    "review_lapse_rate",
    "session_performance_score",
    "validation_score",
    # Prerequisite features (2)
    "prerequisite_gap_count",
    "prerequisite_mastery_gap",
    # Complexity features (2)
    "content_complexity",
    "complexity_mismatch",
    # Behavioral features (3)
    "historical_struggle_score",
    "content_type_mismatch",
    "cognitive_load_indicator",
    # Contextual features (3)
    "days_until_exam",
    "days_since_last_study",
    "workload_level",
]


def generate_struggle_sample() -> dict:
    """
    Generate a sample that clearly indicates struggle.

    Characteristics:
    - Low retention (< 0.4)
    - High review lapses (> 0.5)
    - Prerequisite gaps (> 0.6)
    - Low session performance (< 0.4)
    """
    return {
        # Performance: Poor across the board
        "retention_score": np.random.uniform(0.1, 0.4),
        "retention_decline_rate": np.random.uniform(0.6, 0.9),  # Rapidly declining
        "review_lapse_rate": np.random.uniform(0.5, 0.9),  # Many AGAIN ratings
        "session_performance_score": np.random.uniform(0.1, 0.4),
        "validation_score": np.random.uniform(0.2, 0.45),

        # Prerequisites: Significant gaps
        "prerequisite_gap_count": np.random.uniform(0.6, 1.0),
        "prerequisite_mastery_gap": np.random.uniform(0.5, 0.9),

        # Complexity: Too difficult for user
        "content_complexity": np.random.uniform(0.7, 0.95),  # Advanced content
        "complexity_mismatch": np.random.uniform(0.4, 0.7),  # Large gap

        # Behavioral: History of struggles
        "historical_struggle_score": np.random.uniform(0.6, 0.95),
        "content_type_mismatch": np.random.uniform(0.4, 0.8),
        "cognitive_load_indicator": np.random.uniform(0.6, 0.95),  # High load

        # Contextual: Time pressure
        "days_until_exam": np.random.uniform(0.0, 0.3),  # Exam soon, not ready
        "days_since_last_study": np.random.uniform(0.6, 1.0),  # Long gap
        "workload_level": np.random.uniform(0.6, 1.0),  # High workload
    }


def generate_no_struggle_sample() -> dict:
    """
    Generate a sample that indicates no struggle.

    Characteristics:
    - High retention (> 0.7)
    - Low review lapses (< 0.2)
    - Strong prerequisites
    - Good session performance
    """
    return {
        # Performance: Strong across the board
        "retention_score": np.random.uniform(0.7, 0.95),
        "retention_decline_rate": np.random.uniform(0.1, 0.4),  # Stable
        "review_lapse_rate": np.random.uniform(0.0, 0.2),  # Few lapses
        "session_performance_score": np.random.uniform(0.6, 0.95),
        "validation_score": np.random.uniform(0.65, 0.95),

        # Prerequisites: Well mastered
        "prerequisite_gap_count": np.random.uniform(0.0, 0.2),
        "prerequisite_mastery_gap": np.random.uniform(0.0, 0.3),

        # Complexity: Appropriate for user
        "content_complexity": np.random.uniform(0.3, 0.7),  # Intermediate
        "complexity_mismatch": np.random.uniform(0.0, 0.2),  # Small gap

        # Behavioral: No history of struggles
        "historical_struggle_score": np.random.uniform(0.0, 0.3),
        "content_type_mismatch": np.random.uniform(0.0, 0.3),
        "cognitive_load_indicator": np.random.uniform(0.2, 0.5),  # Manageable

        # Contextual: Good timing
        "days_until_exam": np.random.uniform(0.5, 1.0),  # Plenty of time or no exam
        "days_since_last_study": np.random.uniform(0.0, 0.3),  # Recent study
        "workload_level": np.random.uniform(0.2, 0.6),  # Moderate workload
    }


def generate_ambiguous_sample(struggle: bool) -> dict:
    """
    Generate a more ambiguous sample (harder to classify).

    Makes the classification task realistic by including edge cases.
    """
    if struggle:
        # Struggling but not obviously - some good signs mixed with bad
        return {
            "retention_score": np.random.uniform(0.35, 0.55),
            "retention_decline_rate": np.random.uniform(0.45, 0.65),
            "review_lapse_rate": np.random.uniform(0.35, 0.55),
            "session_performance_score": np.random.uniform(0.35, 0.55),
            "validation_score": np.random.uniform(0.4, 0.6),
            "prerequisite_gap_count": np.random.uniform(0.4, 0.7),
            "prerequisite_mastery_gap": np.random.uniform(0.3, 0.6),
            "content_complexity": np.random.uniform(0.5, 0.8),
            "complexity_mismatch": np.random.uniform(0.2, 0.5),
            "historical_struggle_score": np.random.uniform(0.4, 0.7),
            "content_type_mismatch": np.random.uniform(0.2, 0.5),
            "cognitive_load_indicator": np.random.uniform(0.45, 0.7),
            "days_until_exam": np.random.uniform(0.2, 0.6),
            "days_since_last_study": np.random.uniform(0.3, 0.7),
            "workload_level": np.random.uniform(0.4, 0.8),
        }
    else:
        # Not struggling but with some warning signs
        return {
            "retention_score": np.random.uniform(0.5, 0.7),
            "retention_decline_rate": np.random.uniform(0.3, 0.55),
            "review_lapse_rate": np.random.uniform(0.2, 0.4),
            "session_performance_score": np.random.uniform(0.5, 0.7),
            "validation_score": np.random.uniform(0.5, 0.7),
            "prerequisite_gap_count": np.random.uniform(0.2, 0.5),
            "prerequisite_mastery_gap": np.random.uniform(0.2, 0.5),
            "content_complexity": np.random.uniform(0.4, 0.7),
            "complexity_mismatch": np.random.uniform(0.1, 0.3),
            "historical_struggle_score": np.random.uniform(0.2, 0.5),
            "content_type_mismatch": np.random.uniform(0.1, 0.4),
            "cognitive_load_indicator": np.random.uniform(0.3, 0.6),
            "days_until_exam": np.random.uniform(0.4, 0.9),
            "days_since_last_study": np.random.uniform(0.1, 0.5),
            "workload_level": np.random.uniform(0.3, 0.7),
        }


def generate_dataset(
    n_samples: int = 200,
    struggle_ratio: float = 0.3,
    ambiguous_ratio: float = 0.3
) -> pd.DataFrame:
    """
    Generate synthetic labeled dataset.

    Args:
        n_samples: Total number of samples to generate
        struggle_ratio: Proportion of samples that are struggled (realistic: 0.3)
        ambiguous_ratio: Proportion that are ambiguous/edge cases

    Returns:
        DataFrame with features and labels
    """
    n_struggle = int(n_samples * struggle_ratio)
    n_no_struggle = n_samples - n_struggle

    # Calculate ambiguous samples
    n_ambiguous_struggle = int(n_struggle * ambiguous_ratio)
    n_clear_struggle = n_struggle - n_ambiguous_struggle

    n_ambiguous_no_struggle = int(n_no_struggle * ambiguous_ratio)
    n_clear_no_struggle = n_no_struggle - n_ambiguous_no_struggle

    print(f"Generating {n_samples} samples:")
    print(f"  - Clear struggle: {n_clear_struggle}")
    print(f"  - Ambiguous struggle: {n_ambiguous_struggle}")
    print(f"  - Clear no struggle: {n_clear_no_struggle}")
    print(f"  - Ambiguous no struggle: {n_ambiguous_no_struggle}")

    samples = []
    labels = []

    # Generate clear struggle cases
    for _ in range(n_clear_struggle):
        samples.append(generate_struggle_sample())
        labels.append(1)

    # Generate ambiguous struggle cases
    for _ in range(n_ambiguous_struggle):
        samples.append(generate_ambiguous_sample(struggle=True))
        labels.append(1)

    # Generate clear no struggle cases
    for _ in range(n_clear_no_struggle):
        samples.append(generate_no_struggle_sample())
        labels.append(0)

    # Generate ambiguous no struggle cases
    for _ in range(n_ambiguous_no_struggle):
        samples.append(generate_ambiguous_sample(struggle=False))
        labels.append(0)

    # Create DataFrame
    df = pd.DataFrame(samples, columns=FEATURE_NAMES)
    df['actualOutcome'] = labels

    # Shuffle the dataset
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)

    # Validate all features are in 0-1 range
    for col in FEATURE_NAMES:
        assert df[col].min() >= 0.0, f"Feature {col} has values < 0"
        assert df[col].max() <= 1.0, f"Feature {col} has values > 1"

    return df


def main():
    """Generate and save synthetic dataset."""
    print("=" * 80)
    print("SYNTHETIC TRAINING DATASET GENERATION")
    print("Research-Grade Quality Standards")
    print("=" * 80)
    print()

    # Generate dataset
    df = generate_dataset(
        n_samples=200,
        struggle_ratio=0.3,  # 30% struggled (realistic)
        ambiguous_ratio=0.3  # 30% are edge cases
    )

    print(f"\nDataset shape: {df.shape}")
    print(f"\nClass distribution:")
    print(df['actualOutcome'].value_counts())
    print(f"\nClass balance:")
    print(df['actualOutcome'].value_counts(normalize=True))

    # Feature statistics
    print(f"\n" + "=" * 80)
    print("FEATURE STATISTICS")
    print("=" * 80)
    print(df[FEATURE_NAMES].describe())

    # Save to CSV
    output_dir = Path(__file__).parent.parent / "data"
    output_dir.mkdir(parents=True, exist_ok=True)

    csv_path = output_dir / "synthetic_training_dataset.csv"
    df.to_csv(csv_path, index=False)
    print(f"\n✅ Dataset saved to: {csv_path}")

    # Generate metadata
    metadata = {
        "generation_date": datetime.now().isoformat(),
        "n_samples": len(df),
        "n_features": len(FEATURE_NAMES),
        "feature_names": FEATURE_NAMES,
        "class_distribution": {
            "not_struggled": int((df['actualOutcome'] == 0).sum()),
            "struggled": int((df['actualOutcome'] == 1).sum()),
        },
        "generation_parameters": {
            "struggle_ratio": 0.3,
            "ambiguous_ratio": 0.3,
            "random_seed": 42,
        },
        "heuristic_rules": {
            "struggled": {
                "retention_score": "< 0.4",
                "review_lapse_rate": "> 0.5",
                "prerequisite_gap_count": "> 0.6",
                "session_performance_score": "< 0.4",
            },
            "not_struggled": {
                "retention_score": "> 0.7",
                "review_lapse_rate": "< 0.2",
                "prerequisite_gaps": "low",
                "session_performance_score": "> 0.6",
            }
        }
    }

    metadata_path = output_dir / "synthetic_training_dataset_metadata.json"
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    print(f"✅ Metadata saved to: {metadata_path}")

    print("\n" + "=" * 80)
    print("GENERATION COMPLETE")
    print("=" * 80)
    print(f"Ready for model training with {len(df)} labeled samples")
    print("All features normalized to [0, 1] range")
    print("Reproducible with random seed = 42")


if __name__ == "__main__":
    main()
