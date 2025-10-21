#!/usr/bin/env python3
"""
Training Script for Struggle Prediction Model
==============================================

Extracts historical data from PostgreSQL, trains XGBoost model,
and generates comprehensive evaluation report.

Usage:
    python scripts/train_model.py --tune  # With hyperparameter tuning
    python scripts/train_model.py         # Default hyperparameters

Requirements:
    - Prisma database with struggle_predictions table
    - At least 100 samples with actualOutcome labeled
    - .env file with DATABASE_URL configured
"""

import sys
import asyncio
import argparse
import logging
from pathlib import Path
from datetime import datetime, timedelta
import json
import numpy as np
import pandas as pd

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.ml import StrugglePredictionModel, FEATURE_NAMES
from app.services.database import prisma
from app.utils.logging import setup_logging

setup_logging()
logger = logging.getLogger(__name__)


async def extract_training_data() -> tuple[pd.DataFrame, pd.DataFrame]:
    """
    Extract training data from Prisma database.

    Returns:
        Tuple of (struggle_predictions_df, feature_vectors_df)
    """
    logger.info("Connecting to database...")
    await prisma.connect()

    logger.info("Querying struggle predictions with outcomes...")

    # Query all struggle predictions with actual outcomes
    predictions = await prisma.struggleprediction.find_many(
        where={
            'actualOutcome': {'not': None},  # Only labeled data
            'featureVector': {'not': None},  # Must have features
        },
        order_by={'predictedAt': 'desc'},
    )

    logger.info(f"Found {len(predictions)} labeled predictions")

    if len(predictions) < 100:
        logger.warning(
            f"Only {len(predictions)} samples available. "
            "Need at least 100 for reliable training. "
            "Consider waiting for more data collection."
        )

    # Convert to DataFrames
    prediction_data = []
    feature_data = []

    for pred in predictions:
        # Extract prediction metadata
        prediction_data.append({
            'id': pred.id,
            'userId': pred.userId,
            'learningObjectiveId': pred.learningObjectiveId,
            'actualOutcome': pred.actualOutcome,
            'predictedStruggleProbability': pred.predictedStruggleProbability,
            'predictionConfidence': pred.predictionConfidence,
            'predictionDate': pred.predictionDate,
        })

        # Extract feature vector (JSON to dict)
        if pred.featureVector:
            features = json.loads(pred.featureVector) if isinstance(pred.featureVector, str) else pred.featureVector

            # Map camelCase to snake_case for consistency
            feature_row = {
                'retention_score': features.get('retentionScore', 0.5),
                'retention_decline_rate': features.get('retentionDeclineRate', 0.5),
                'review_lapse_rate': features.get('reviewLapseRate', 0.5),
                'session_performance_score': features.get('sessionPerformanceScore', 0.5),
                'validation_score': features.get('validationScore', 0.5),
                'prerequisite_gap_count': features.get('prerequisiteGapCount', 0.5),
                'prerequisite_mastery_gap': features.get('prerequisiteMasteryGap', 0.5),
                'content_complexity': features.get('contentComplexity', 0.5),
                'complexity_mismatch': features.get('complexityMismatch', 0.5),
                'historical_struggle_score': features.get('historicalStruggleScore', 0.5),
                'content_type_mismatch': features.get('contentTypeMismatch', 0.5),
                'cognitive_load_indicator': features.get('cognitiveLoadIndicator', 0.5),
                'days_until_exam': features.get('daysUntilExam', 1.0),
                'days_since_last_study': features.get('daysSinceLastStudy', 0.5),
                'workload_level': features.get('workloadLevel', 0.5),
            }
            feature_data.append(feature_row)
        else:
            # Default features if missing
            feature_data.append({name: 0.5 for name in FEATURE_NAMES})

    predictions_df = pd.DataFrame(prediction_data)
    features_df = pd.DataFrame(feature_data)

    logger.info(f"Extracted {len(predictions_df)} samples")
    logger.info(f"Feature matrix shape: {features_df.shape}")
    logger.info(f"Class distribution:\n{predictions_df['actualOutcome'].value_counts()}")

    await prisma.disconnect()

    return predictions_df, features_df


async def main():
    """Main training pipeline."""
    parser = argparse.ArgumentParser(description="Train Struggle Prediction Model")
    parser.add_argument(
        '--tune',
        action='store_true',
        help='Enable hyperparameter tuning (slower but better results)'
    )
    parser.add_argument(
        '--cv-folds',
        type=int,
        default=5,
        help='Number of cross-validation folds (default: 5)'
    )
    parser.add_argument(
        '--model-name',
        type=str,
        default='struggle_model_v1.0.0',
        help='Name for saved model files'
    )

    args = parser.parse_args()

    logger.info("=" * 80)
    logger.info("STRUGGLE PREDICTION MODEL TRAINING PIPELINE")
    logger.info("=" * 80)
    logger.info(f"Hyperparameter tuning: {args.tune}")
    logger.info(f"Cross-validation folds: {args.cv_folds}")
    logger.info(f"Model name: {args.model_name}")
    logger.info("=" * 80)

    # Step 1: Extract data from database
    logger.info("\n[Step 1/4] Extracting training data from database...")
    predictions_df, features_df = await extract_training_data()

    if len(predictions_df) < 50:
        logger.error("Insufficient training data. Need at least 50 labeled samples.")
        return

    # Step 2: Prepare data for training
    logger.info("\n[Step 2/4] Preparing training data...")
    model = StrugglePredictionModel()
    X, y = model.prepare_training_data(predictions_df, features_df)

    # Step 3: Train model
    logger.info("\n[Step 3/4] Training model...")
    performance = model.train(
        X, y,
        hyperparameter_tuning=args.tune,
        cv_folds=args.cv_folds
    )

    # Step 4: Save model and generate report
    logger.info("\n[Step 4/4] Saving model and generating report...")
    model_path = model.save_model(args.model_name)

    # Generate comprehensive report
    report = generate_training_report(model, performance, predictions_df, features_df)
    report_path = model.model_dir / f"{args.model_name}_training_report.md"

    with open(report_path, 'w') as f:
        f.write(report)

    logger.info(f"Training report saved to: {report_path}")

    logger.info("\n" + "=" * 80)
    logger.info("TRAINING COMPLETE!")
    logger.info("=" * 80)
    logger.info(f"Model saved: {model_path}")
    logger.info(f"Report saved: {report_path}")
    logger.info("\nKey Metrics:")
    logger.info(f"  Test Accuracy:  {performance.test_accuracy:.3f}")
    logger.info(f"  Test Precision: {performance.test_precision:.3f}")
    logger.info(f"  Test Recall:    {performance.test_recall:.3f}")
    logger.info(f"  Test F1 Score:  {performance.test_f1:.3f}")
    logger.info(f"  Test ROC-AUC:   {performance.test_auc:.3f}")
    logger.info("=" * 80)


def generate_training_report(
    model: StrugglePredictionModel,
    performance,
    predictions_df: pd.DataFrame,
    features_df: pd.DataFrame
) -> str:
    """Generate comprehensive Markdown training report."""

    feature_importance = model.get_feature_importance()

    report = f"""# Struggle Prediction Model Training Report

**Model Version:** {model.metadata.model_version}
**Training Date:** {model.metadata.training_date.strftime("%Y-%m-%d %H:%M:%S")}
**Training Script:** `scripts/train_model.py`

---

## Executive Summary

Trained a gradient boosting model (XGBoost) to predict learning struggles with the following performance:

- **Test Accuracy:** {performance.test_accuracy:.1%}
- **Test F1 Score:** {performance.test_f1:.3f}
- **Test ROC-AUC:** {performance.test_auc:.3f}

{'✅ **Model meets MVP target (60%+ accuracy)**' if performance.test_accuracy >= 0.6 else '⚠️  **Model below MVP target (60%+ accuracy)**'}
{'✅ **Model meets research-grade target (75%+ accuracy)**' if performance.test_accuracy >= 0.75 else ''}

---

## Dataset Statistics

### Training Data Size
- **Total Samples:** {len(predictions_df)}
- **Training Set:** {model.metadata.n_training_samples} (70%)
- **Validation Set:** {model.metadata.n_validation_samples} (15%)
- **Test Set:** {model.metadata.n_test_samples} (15%)

### Class Distribution
```
Training Set:
  - No Struggle (0): {model.metadata.class_distribution['train_negative']}
  - Struggle (1):    {model.metadata.class_distribution['train_positive']}

Validation Set:
  - No Struggle (0): {model.metadata.class_distribution['val_negative']}
  - Struggle (1):    {model.metadata.class_distribution['val_positive']}

Test Set:
  - No Struggle (0): {model.metadata.class_distribution['test_negative']}
  - Struggle (1):    {model.metadata.class_distribution['test_positive']}
```

### Feature Vector
**15 Normalized Features (0-1 scale):**
```
{', '.join(model.metadata.features_used)}
```

---

## Model Architecture

**Algorithm:** XGBoost (Gradient Boosting)
**Tree Method:** Histogram-based (hist)
**Objective:** Binary logistic classification

### Best Hyperparameters
```json
{json.dumps(model.metadata.best_hyperparameters, indent=2)}
```

### Class Imbalance Handling
- **Method:** scale_pos_weight parameter
- **Strategy:** Computed from class weights for balanced training

---

## Performance Metrics

### Training Set
| Metric | Score |
|--------|-------|
| Accuracy | {performance.train_accuracy:.3f} |
| Precision | {performance.train_precision:.3f} |
| Recall | {performance.train_recall:.3f} |
| F1 Score | {performance.train_f1:.3f} |
| ROC-AUC | {performance.train_auc:.3f} |

**Confusion Matrix:**
```
{np.array(performance.train_confusion_matrix)}
```

### Validation Set
| Metric | Score |
|--------|-------|
| Accuracy | {performance.val_accuracy:.3f} |
| Precision | {performance.val_precision:.3f} |
| Recall | {performance.val_recall:.3f} |
| F1 Score | {performance.val_f1:.3f} |
| ROC-AUC | {performance.val_auc:.3f} |

**Confusion Matrix:**
```
{np.array(performance.val_confusion_matrix)}
```

### Test Set (Final Evaluation)
| Metric | Score |
|--------|-------|
| Accuracy | {performance.test_accuracy:.3f} |
| Precision | {performance.test_precision:.3f} |
| Recall | {performance.test_recall:.3f} |
| F1 Score | {performance.test_f1:.3f} |
| ROC-AUC | {performance.test_auc:.3f} |

**Confusion Matrix:**
```
{np.array(performance.test_confusion_matrix)}
```

**Interpretation:**
- **Precision ({performance.test_precision:.3f}):** Of predictions saying "will struggle", {performance.test_precision:.1%} are correct
- **Recall ({performance.test_recall:.3f}):** Of actual struggles, model catches {performance.test_recall:.1%}
- **F1 Score ({performance.test_f1:.3f}):** Harmonic mean of precision and recall

---

## Feature Importance

Top 10 most important features for predicting struggles:

"""

    # Add feature importance table
    for i, (feature, importance) in enumerate(list(feature_importance.items())[:10], 1):
        report += f"{i}. **{feature}**: {importance:.4f}\n"

    report += f"""

---

## Model Validation

### Cross-Validation
- **Strategy:** {model.metadata.n_training_samples // 5}-fold Stratified K-Fold
- **Metric:** F1 Score (optimized for balance of precision/recall)

### Overfitting Analysis
- **Train Accuracy:** {performance.train_accuracy:.3f}
- **Test Accuracy:** {performance.test_accuracy:.3f}
- **Difference:** {abs(performance.train_accuracy - performance.test_accuracy):.3f}

{'✅ Good generalization (< 0.05 difference)' if abs(performance.train_accuracy - performance.test_accuracy) < 0.05 else '⚠️  Possible overfitting (> 0.05 difference)'}

---

## Recommendations for Production Deployment

### MVP Readiness
{'✅ **READY:** Model meets 60%+ accuracy target for MVP deployment' if performance.test_accuracy >= 0.6 else '❌ **NOT READY:** Model below 60% accuracy threshold'}

### Research-Grade Quality
{'✅ **ACHIEVED:** Model meets 75%+ accuracy for research-grade quality' if performance.test_accuracy >= 0.75 else '⚠️  **NOT ACHIEVED:** Continue improving features or collecting more data'}

### Next Steps
1. **API Integration:** Implement prediction endpoint in FastAPI
2. **Monitoring:** Track prediction accuracy in production
3. **A/B Testing:** Compare with rule-based baseline
4. **Continuous Learning:** Retrain weekly with new labeled data

### Known Limitations
- Requires minimum data quality threshold (30%)
- Performance degrades with sparse behavioral data
- May need retraining if user behavior patterns shift

---

## Reproducibility

### Environment
- **Python Version:** 3.13+
- **XGBoost Version:** Latest
- **Scikit-learn Version:** 1.6.1
- **Random Seed:** 42 (for reproducibility)

### Retraining Instructions
```bash
# With hyperparameter tuning (recommended)
python scripts/train_model.py --tune --cv-folds 5

# Fast training (default params)
python scripts/train_model.py
```

---

**Report Generated:** {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
"""

    return report


if __name__ == "__main__":
    asyncio.run(main())
