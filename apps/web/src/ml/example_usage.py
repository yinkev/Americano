"""
Example Usage - Struggle Prediction System

This script demonstrates how to use the ML package for struggle prediction.

Author: Americano ML Subsystem
"""

import asyncio
from datetime import datetime
from typing import List

from struggle_feature_extractor import StruggleFeatureExtractor, FeatureVector
from struggle_prediction_model import (
    StrugglePredictionModel,
    TrainingExample,
    PredictionResult,
    ModelMetrics,
)


# ==================== EXAMPLE 1: Basic Prediction (Rule-Based) ====================

async def example_rule_based_prediction():
    """
    Demonstrates basic prediction using rule-based model.
    No training data required - works out of the box.
    """
    print("=" * 60)
    print("EXAMPLE 1: Rule-Based Prediction (MVP)")
    print("=" * 60)

    # Initialize components (mock db_client for example)
    db_client = None  # In production: prisma.Prisma()
    extractor = StruggleFeatureExtractor(db_client, cache_enabled=False)
    model = StrugglePredictionModel(model_version="demo_v1")

    # Create a sample feature vector (simulating high-risk scenario)
    features = FeatureVector(
        # Performance features - poor performance
        retention_score=0.35,  # Low retention (35%)
        retention_decline_rate=0.6,  # Declining
        review_lapse_rate=0.4,  # 40% AGAIN ratings
        session_performance_score=0.45,  # Below average
        validation_score=0.5,  # Neutral

        # Prerequisites - major gaps
        prerequisite_gap_count=0.6,  # 60% prerequisites unmastered
        prerequisite_mastery_gap=0.55,  # Significant gap

        # Complexity - difficult content
        content_complexity=0.9,  # ADVANCED content
        complexity_mismatch=0.5,  # Significant mismatch

        # Behavioral - historical struggles
        historical_struggle_score=0.8,  # Strong struggle history
        content_type_mismatch=0.6,  # Style mismatch
        cognitive_load_indicator=0.7,  # High load

        # Contextual - urgent situation
        days_until_exam=0.8,  # Exam soon (low days remaining)
        days_since_last_study=0.4,  # Moderate recency
        workload_level=0.6,  # High workload

        # Metadata
        extracted_at=datetime.utcnow(),
        data_quality=0.85,  # Good data quality
    )

    # Predict
    prediction = model.predict(features)

    # Display results
    print(f"\n📊 Prediction Results:")
    print(f"  Struggle Probability: {prediction.probability:.1%}")
    print(f"  Risk Level: {prediction.risk_level}")
    print(f"  Confidence: {prediction.confidence:.1%}")
    print(f"  Model: {prediction.model_version}")
    print(f"\n💡 Reasoning: {prediction.reasoning}")

    print(f"\n🔍 Top Contributing Features:")
    for feature, contribution in list(prediction.contributing_features.items())[:3]:
        print(f"  - {feature}: {contribution:.3f}")

    return prediction


# ==================== EXAMPLE 2: Training ML Model ====================

def example_train_ml_model():
    """
    Demonstrates training a logistic regression model with historical data.
    Requires at least 50 training examples.
    """
    print("\n" + "=" * 60)
    print("EXAMPLE 2: Training ML Model (Post-MVP)")
    print("=" * 60)

    # Create synthetic training data
    print("\n📚 Creating synthetic training data...")
    training_data = create_synthetic_training_data(n_samples=100)
    print(f"  Generated {len(training_data)} training examples")

    # Split into strugglers and non-strugglers
    strugglers = sum(1 for ex in training_data if ex.struggled)
    print(f"  - Struggled: {strugglers}")
    print(f"  - Did not struggle: {len(training_data) - strugglers}")

    # Initialize and train model
    model = StrugglePredictionModel(model_version="trained_v1")

    print("\n🔧 Training logistic regression model...")
    metrics = model.train(
        training_data=training_data,
        test_size=0.2,  # 20% for testing
        calibrate=True,  # Apply probability calibration
        random_state=42
    )

    # Display evaluation metrics
    print(f"\n📈 Model Performance:")
    print(f"  Accuracy:  {metrics.accuracy:.1%} (target: ≥75%)")
    print(f"  Precision: {metrics.precision:.1%} (target: ≥65%)")
    print(f"  Recall:    {metrics.recall:.1%} (target: ≥70%)")
    print(f"  F1 Score:  {metrics.f1_score:.1%}")
    print(f"  AUC-ROC:   {metrics.auc_roc:.3f}")

    print(f"\n🎯 Performance vs. Targets:")
    print(f"  Accuracy:  {'✅ PASS' if metrics.accuracy >= 0.75 else '❌ FAIL'}")
    print(f"  Precision: {'✅ PASS' if metrics.precision >= 0.65 else '❌ FAIL'}")
    print(f"  Recall:    {'✅ PASS' if metrics.recall >= 0.70 else '❌ FAIL'}")

    print(f"\n📊 Confusion Matrix:")
    cm = metrics.confusion_matrix
    print(f"  [[TN={cm[0][0]}, FP={cm[0][1]}],")
    print(f"   [FN={cm[1][0]}, TP={cm[1][1]}]]")

    # Feature importance
    print(f"\n🔝 Top 5 Most Important Features:")
    if model.feature_importance:
        sorted_features = sorted(
            model.feature_importance.items(),
            key=lambda x: x[1],
            reverse=True
        )
        for i, (feature, importance) in enumerate(sorted_features[:5], 1):
            print(f"  {i}. {feature}: {importance:.3f}")

    # Save model
    model_path = "/tmp/struggle_prediction_trained.pkl"
    model.save(model_path)
    print(f"\n💾 Model saved to: {model_path}")

    return model, metrics


# ==================== EXAMPLE 3: Model Comparison ====================

def example_model_comparison():
    """
    Compares rule-based vs. ML model performance.
    """
    print("\n" + "=" * 60)
    print("EXAMPLE 3: Model Comparison")
    print("=" * 60)

    # Create test data
    test_data = create_synthetic_training_data(n_samples=50)

    # Rule-based model
    rule_model = StrugglePredictionModel(model_version="rule_based")

    # Train ML model
    train_data = create_synthetic_training_data(n_samples=100)
    ml_model = StrugglePredictionModel(model_version="ml_based")
    ml_model.train(train_data, test_size=0.2, calibrate=True)

    # Compare predictions
    print("\n⚖️  Comparing Models on Test Data:")

    rule_predictions = []
    ml_predictions = []
    actuals = []

    for example in test_data[:10]:  # First 10 examples
        rule_pred = rule_model.predict(example.features)
        ml_pred = ml_model.predict(example.features)

        rule_predictions.append(rule_pred.probability)
        ml_predictions.append(ml_pred.probability)
        actuals.append(example.struggled)

    # Display comparison table
    print(f"\n{'Actual':<10} {'Rule-Based':<15} {'ML Model':<15} {'Difference':<12}")
    print("-" * 52)

    for i, (actual, rule_prob, ml_prob) in enumerate(zip(actuals, rule_predictions, ml_predictions)):
        actual_str = "Struggled" if actual else "No Struggle"
        diff = abs(rule_prob - ml_prob)
        print(f"{actual_str:<10} {rule_prob:.3f} ({_risk_label(rule_prob):<6}) "
              f"{ml_prob:.3f} ({_risk_label(ml_prob):<6}) "
              f"{diff:.3f}")

    # Calculate average absolute difference
    avg_diff = sum(abs(r - m) for r, m in zip(rule_predictions, ml_predictions)) / len(rule_predictions)
    print(f"\n📊 Average Prediction Difference: {avg_diff:.3f}")


# ==================== EXAMPLE 4: Incremental Learning ====================

def example_incremental_learning():
    """
    Demonstrates updating model with new feedback data.
    """
    print("\n" + "=" * 60)
    print("EXAMPLE 4: Incremental Learning")
    print("=" * 60)

    # Initial training
    initial_data = create_synthetic_training_data(n_samples=100)
    model = StrugglePredictionModel(model_version="incremental_v1")

    print("\n📚 Initial Training:")
    initial_metrics = model.train(initial_data, test_size=0.2)
    print(f"  Initial Accuracy: {initial_metrics.accuracy:.1%}")
    print(f"  Training Samples: {len(initial_data)}")

    # Simulate new feedback data
    new_feedback = create_synthetic_training_data(n_samples=20)
    print(f"\n📥 Received {len(new_feedback)} new feedback examples")

    # Update model
    print("\n🔄 Updating model with new data...")
    updated_metrics = model.update_model(new_feedback)

    print(f"\n📈 Performance After Update:")
    print(f"  Updated Accuracy: {updated_metrics.accuracy:.1%}")
    print(f"  Total Training Samples: {model.training_samples}")
    print(f"  Accuracy Change: {(updated_metrics.accuracy - initial_metrics.accuracy):.1%}")


# ==================== HELPER FUNCTIONS ====================

def create_synthetic_training_data(n_samples: int = 100) -> List[TrainingExample]:
    """
    Create synthetic training data for demonstration.

    In production, this would come from historical user data.
    """
    import numpy as np

    training_data = []

    for i in range(n_samples):
        # Create random feature vector
        # Correlation: low retention → high struggle probability
        retention = np.random.beta(2, 2)  # Random 0-1
        struggled = retention < 0.5 or np.random.random() < 0.3

        features = FeatureVector(
            retention_score=retention,
            retention_decline_rate=np.random.random(),
            review_lapse_rate=np.random.random(),
            session_performance_score=np.random.beta(2, 2),
            validation_score=np.random.beta(2, 2),
            prerequisite_gap_count=np.random.beta(2, 2),
            prerequisite_mastery_gap=np.random.beta(2, 2),
            content_complexity=np.random.choice([0.3, 0.6, 0.9]),
            complexity_mismatch=np.random.random(),
            historical_struggle_score=np.random.random(),
            content_type_mismatch=np.random.choice([0.0, 0.6]),
            cognitive_load_indicator=np.random.beta(2, 2),
            days_until_exam=np.random.random(),
            days_since_last_study=np.random.random(),
            workload_level=np.random.beta(2, 2),
            extracted_at=datetime.utcnow(),
            data_quality=np.random.uniform(0.7, 1.0),
        )

        training_data.append(TrainingExample(
            features=features,
            struggled=bool(struggled),
            user_id=f"user_{i}",
            objective_id=f"obj_{i}",
            recorded_at=datetime.utcnow()
        ))

    return training_data


def _risk_label(probability: float) -> str:
    """Convert probability to risk label."""
    if probability >= 0.7:
        return "HIGH"
    elif probability >= 0.4:
        return "MEDIUM"
    else:
        return "LOW"


# ==================== MAIN ====================

async def main():
    """Run all examples."""
    print("\n" + "🎓" * 30)
    print("  Americano ML Package - Struggle Prediction Examples")
    print("🎓" * 30)

    # Example 1: Basic rule-based prediction
    await example_rule_based_prediction()

    # Example 2: Train ML model
    example_train_ml_model()

    # Example 3: Model comparison
    example_model_comparison()

    # Example 4: Incremental learning
    example_incremental_learning()

    print("\n" + "=" * 60)
    print("✅ All examples completed successfully!")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    asyncio.run(main())
