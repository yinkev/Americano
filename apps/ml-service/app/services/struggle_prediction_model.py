"""
Struggle Prediction Model - Research-Grade ML Implementation

Implements both rule-based (MVP) and logistic regression (post-MVP) models
for predicting learning struggles. Follows scikit-learn conventions and
production ML best practices.

Author: Americano ML Subsystem
Story: 5.2 - Predictive Analytics for Learning Struggles (Task 3)
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, asdict
from datetime import datetime
import json
import pickle
from pathlib import Path

# Scikit-learn imports
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    classification_report,
)
from sklearn.calibration import CalibratedClassifierCV, calibration_curve
from sklearn.preprocessing import StandardScaler

from app.services.struggle_feature_extractor import FeatureVector


@dataclass
class PredictionResult:
    """
    Prediction result with probability, confidence, and reasoning.
    """
    probability: float  # 0.0-1.0 probability of struggle
    confidence: float  # 0.0-1.0 confidence in prediction
    risk_level: str  # "LOW", "MEDIUM", "HIGH"
    contributing_features: Dict[str, float]  # Top features driving prediction
    reasoning: str  # Human-readable explanation
    model_version: str  # Model identifier
    predicted_at: datetime

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        result = asdict(self)
        result['predicted_at'] = self.predicted_at.isoformat()
        return result


@dataclass
class ModelMetrics:
    """
    Comprehensive model evaluation metrics.
    """
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    auc_roc: float
    confusion_matrix: List[List[int]]
    classification_report: str
    calibration_curve: Dict[str, List[float]]  # {'prob_true': [...], 'prob_pred': [...]}
    sample_size: int
    evaluated_at: datetime

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        result = asdict(self)
        result['evaluated_at'] = self.evaluated_at.isoformat()
        return result


@dataclass
class TrainingExample:
    """
    Training example with features and label.
    """
    features: FeatureVector
    struggled: bool  # Ground truth label
    user_id: str
    objective_id: str
    recorded_at: datetime


class StrugglePredictionModel:
    """
    Production-grade struggle prediction model with two implementations:

    1. Rule-Based Model (MVP): Threshold-based decision rules
    2. Logistic Regression (Post-MVP): Trained ML model with sklearn

    The model automatically uses the ML model if trained, otherwise
    falls back to rule-based predictions.

    Usage:
        # MVP (rule-based)
        model = StrugglePredictionModel()
        prediction = model.predict(feature_vector)

        # Post-MVP (trained ML model)
        model = StrugglePredictionModel()
        metrics = model.train(training_data)
        prediction = model.predict(feature_vector)
        model.save("model_v1.pkl")
    """

    def __init__(self, model_version: str = "v1.0"):
        """
        Initialize prediction model.

        Args:
            model_version: Model version identifier
        """
        self.model_version = model_version
        self.model_type: str = "rule_based"  # "rule_based" or "logistic_regression"

        # ML model components (initialized when trained)
        self.classifier: Optional[LogisticRegression] = None
        self.scaler: Optional[StandardScaler] = None
        self.feature_importance: Optional[Dict[str, float]] = None

        # Model metadata
        self.trained_at: Optional[datetime] = None
        self.training_samples: int = 0

        # Performance targets (Story 5.2 requirements)
        self.TARGET_ACCURACY = 0.75
        self.TARGET_RECALL = 0.70
        self.TARGET_PRECISION = 0.65

    # ==================== PREDICTION METHODS ====================

    def predict(self, feature_vector: FeatureVector) -> PredictionResult:
        """
        Predict struggle probability for a feature vector.

        Automatically uses ML model if available, otherwise rule-based.

        Args:
            feature_vector: Extracted features for prediction

        Returns:
            PredictionResult with probability and reasoning
        """
        if self.model_type == "logistic_regression" and self.classifier is not None:
            return self._predict_ml(feature_vector)
        else:
            return self._predict_rule_based(feature_vector)

    def _predict_rule_based(self, features: FeatureVector) -> PredictionResult:
        """
        Rule-based prediction (MVP implementation).

        High struggle probability (>0.7) if:
        - Retention score <50% for topic area
        - 2+ prerequisite objectives with low mastery (50%+ prerequisites unmastered)
        - Historical struggle in similar topics
        - Complexity mismatch score >0.6

        Medium struggle probability (0.4-0.7) if:
        - Retention score 50-70%
        - 1 prerequisite with low mastery
        - Content type preference mismatch

        Low struggle probability (<0.4) otherwise
        """
        # High risk indicators
        high_risk_conditions = [
            features.retention_score < 0.5,
            features.prerequisite_gap_count > 0.5,  # 50%+ prerequisites unmastered
            features.complexity_mismatch > 0.6,
            features.historical_struggle_score > 0.7,
        ]

        # Medium risk indicators
        medium_risk_conditions = [
            0.5 <= features.retention_score < 0.7,
            features.prerequisite_gap_count > 0.2,  # 20%+ prerequisites unmastered
            features.content_type_mismatch > 0.5,
            features.cognitive_load_indicator > 0.7,
        ]

        # Calculate probability
        if sum(high_risk_conditions) >= 1:
            # High struggle probability
            base_prob = 0.7
            weight_retention = (1 - features.retention_score) * 0.3
            weight_prerequisites = features.prerequisite_gap_count * 0.3
            weight_complexity = features.complexity_mismatch * 0.2
            weight_history = features.historical_struggle_score * 0.2

            probability = base_prob + (weight_retention + weight_prerequisites +
                                      weight_complexity + weight_history)
            probability = min(1.0, probability)
            risk_level = "HIGH"

        elif sum(medium_risk_conditions) >= 1:
            # Medium struggle probability
            base_prob = 0.4
            weight_retention = (1 - features.retention_score) * 0.4
            weight_prerequisites = features.prerequisite_gap_count * 0.3
            weight_content = features.content_type_mismatch * 0.2
            weight_cognitive = features.cognitive_load_indicator * 0.1

            probability = base_prob + (weight_retention + weight_prerequisites +
                                      weight_content + weight_cognitive) * 0.3
            probability = min(0.7, probability)
            risk_level = "MEDIUM"

        else:
            # Low struggle probability
            base_prob = 0.1
            weight_retention = (1 - features.retention_score) * 0.3
            weight_recency = features.days_since_last_study * 0.3
            weight_workload = features.workload_level * 0.2
            weight_session = (1 - features.session_performance_score) * 0.2

            probability = base_prob + (weight_retention + weight_recency +
                                      weight_workload + weight_session) * 0.3
            probability = max(0.0, probability)
            risk_level = "LOW"

        # Calculate confidence based on data quality
        confidence = self._calculate_confidence_rule_based(features)

        # Identify contributing features
        contributing_features = self._identify_contributing_features_rule_based(
            features, high_risk_conditions, medium_risk_conditions
        )

        # Generate reasoning
        reasoning = self._generate_reasoning(features, contributing_features, risk_level)

        return PredictionResult(
            probability=probability,
            confidence=confidence,
            risk_level=risk_level,
            contributing_features=contributing_features,
            reasoning=reasoning,
            model_version=f"{self.model_version}-rule_based",
            predicted_at=datetime.utcnow(),
        )

    def _predict_ml(self, features: FeatureVector) -> PredictionResult:
        """
        Machine learning prediction using trained logistic regression.

        Args:
            features: Feature vector

        Returns:
            PredictionResult with ML-based probability
        """
        if self.classifier is None or self.scaler is None:
            raise ValueError("Model not trained. Call train() first.")

        # Convert features to array and scale
        X = features.to_array().reshape(1, -1)
        X_scaled = self.scaler.transform(X)

        # Predict probability
        probability = self.classifier.predict_proba(X_scaled)[0, 1]  # P(struggle=1)

        # Determine risk level
        if probability >= 0.7:
            risk_level = "HIGH"
        elif probability >= 0.4:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        # Calculate confidence (based on data quality and model certainty)
        confidence = self._calculate_confidence_ml(features, probability)

        # Get contributing features from model coefficients
        contributing_features = self._identify_contributing_features_ml(features)

        # Generate reasoning
        reasoning = self._generate_reasoning(features, contributing_features, risk_level)

        return PredictionResult(
            probability=float(probability),
            confidence=confidence,
            risk_level=risk_level,
            contributing_features=contributing_features,
            reasoning=reasoning,
            model_version=f"{self.model_version}-ml",
            predicted_at=datetime.utcnow(),
        )

    # ==================== TRAINING METHODS ====================

    def train(
        self,
        training_data: List[TrainingExample],
        test_size: float = 0.2,
        calibrate: bool = True,
        random_state: int = 42
    ) -> ModelMetrics:
        """
        Train logistic regression model with training data.

        Args:
            training_data: List of training examples with features and labels
            test_size: Proportion of data for testing (0.2 = 20%)
            calibrate: Apply probability calibration (recommended)
            random_state: Random seed for reproducibility

        Returns:
            ModelMetrics with evaluation results
        """
        if len(training_data) < 50:
            raise ValueError(
                f"Insufficient training data: {len(training_data)} examples. "
                "Minimum 50 required for logistic regression."
            )

        # Extract features and labels
        X = np.array([ex.features.to_array() for ex in training_data])
        y = np.array([ex.struggled for ex in training_data], dtype=int)

        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=random_state, stratify=y
        )

        # Scale features
        self.scaler = StandardScaler()
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)

        # Train logistic regression with L2 regularization
        # Using 'saga' solver for better handling of large datasets
        self.classifier = LogisticRegression(
            penalty='l2',
            C=1.0,  # Regularization strength (inverse)
            solver='saga',
            max_iter=1000,
            random_state=random_state,
            class_weight='balanced',  # Handle class imbalance
        )

        self.classifier.fit(X_train_scaled, y_train)

        # Apply calibration if requested
        if calibrate:
            self.classifier = CalibratedClassifierCV(
                self.classifier,
                method='sigmoid',
                cv=3
            )
            self.classifier.fit(X_train_scaled, y_train)

        # Calculate feature importance
        self._calculate_feature_importance_ml(X_train, y_train)

        # Evaluate model
        metrics = self._evaluate_model(X_test_scaled, y_test)

        # Update model metadata
        self.model_type = "logistic_regression"
        self.trained_at = datetime.utcnow()
        self.training_samples = len(training_data)

        return metrics

    def update_model(
        self,
        new_data: List[TrainingExample],
        warm_start: bool = True
    ) -> ModelMetrics:
        """
        Update model with new data (incremental learning).

        Args:
            new_data: New training examples
            warm_start: Continue training from current weights

        Returns:
            Updated ModelMetrics
        """
        if self.classifier is None:
            raise ValueError("No model to update. Train initial model first.")

        # Extract features and labels
        X_new = np.array([ex.features.to_array() for ex in new_data])
        y_new = np.array([ex.struggled for ex in new_data], dtype=int)

        # Scale features
        X_new_scaled = self.scaler.transform(X_new)

        # Partial fit (if supported) or retrain
        if hasattr(self.classifier, 'partial_fit'):
            self.classifier.partial_fit(X_new_scaled, y_new)
        else:
            # Retrain with combined data (simplified approach)
            # In production, maintain a rolling window of training data
            self.classifier.fit(X_new_scaled, y_new)

        # Re-evaluate
        metrics = self._evaluate_model(X_new_scaled, y_new)

        # Update metadata
        self.training_samples += len(new_data)
        self.trained_at = datetime.utcnow()

        return metrics

    # ==================== EVALUATION METHODS ====================

    def _evaluate_model(
        self,
        X_test: np.ndarray,
        y_test: np.ndarray
    ) -> ModelMetrics:
        """
        Comprehensive model evaluation.

        Calculates:
        - Accuracy, Precision, Recall, F1-score
        - AUC-ROC
        - Confusion matrix
        - Classification report
        - Calibration curve
        """
        # Predictions
        y_pred = self.classifier.predict(X_test)
        y_proba = self.classifier.predict_proba(X_test)[:, 1]

        # Core metrics
        accuracy = accuracy_score(y_test, y_pred)
        precision = precision_score(y_test, y_pred, zero_division=0)
        recall = recall_score(y_test, y_pred, zero_division=0)
        f1 = f1_score(y_test, y_pred, zero_division=0)
        auc_roc = roc_auc_score(y_test, y_proba)

        # Confusion matrix
        cm = confusion_matrix(y_test, y_pred)

        # Classification report
        report = classification_report(y_test, y_pred)

        # Calibration curve
        prob_true, prob_pred = calibration_curve(
            y_test, y_proba, n_bins=10, strategy='uniform'
        )

        return ModelMetrics(
            accuracy=float(accuracy),
            precision=float(precision),
            recall=float(recall),
            f1_score=float(f1),
            auc_roc=float(auc_roc),
            confusion_matrix=cm.tolist(),
            classification_report=report,
            calibration_curve={
                'prob_true': prob_true.tolist(),
                'prob_pred': prob_pred.tolist()
            },
            sample_size=len(y_test),
            evaluated_at=datetime.utcnow(),
        )

    def get_model_performance(self) -> Dict[str, Any]:
        """
        Get current model performance summary.

        Returns:
            Dictionary with model metadata and performance info
        """
        return {
            'model_type': self.model_type,
            'model_version': self.model_version,
            'trained_at': self.trained_at.isoformat() if self.trained_at else None,
            'training_samples': self.training_samples,
            'is_trained': self.classifier is not None,
            'feature_importance': self.feature_importance,
            'target_metrics': {
                'accuracy': self.TARGET_ACCURACY,
                'recall': self.TARGET_RECALL,
                'precision': self.TARGET_PRECISION,
            }
        }

    # ==================== HELPER METHODS ====================

    def _calculate_confidence_rule_based(
        self,
        features: FeatureVector
    ) -> float:
        """
        Calculate confidence for rule-based prediction.

        Confidence based on:
        - Data quality score (primary)
        - Presence of historical data
        - Prerequisite data availability
        """
        # Base confidence from data quality
        confidence = features.data_quality * 0.6

        # Bonus for historical data
        if features.historical_struggle_score > 0:
            confidence += 0.2

        # Bonus for prerequisite data
        if features.prerequisite_gap_count >= 0:
            confidence += 0.2

        return min(1.0, confidence)

    def _calculate_confidence_ml(
        self,
        features: FeatureVector,
        probability: float
    ) -> float:
        """
        Calculate confidence for ML prediction.

        Confidence based on:
        - Data quality
        - Model certainty (distance from 0.5)
        - Training sample size
        """
        # Base confidence from data quality
        confidence = features.data_quality * 0.5

        # Model certainty bonus (higher when probability is far from 0.5)
        certainty = abs(probability - 0.5) * 2  # 0-1 scale
        confidence += certainty * 0.3

        # Sample size bonus
        if self.training_samples >= 100:
            confidence += 0.2
        elif self.training_samples >= 50:
            confidence += 0.1

        return min(1.0, confidence)

    def _identify_contributing_features_rule_based(
        self,
        features: FeatureVector,
        high_risk_conditions: List[bool],
        medium_risk_conditions: List[bool]
    ) -> Dict[str, float]:
        """Identify top contributing features for rule-based prediction."""
        contributions = {}

        # High risk features
        if features.retention_score < 0.5:
            contributions['retention_score'] = 1.0 - features.retention_score

        if features.prerequisite_gap_count > 0.5:
            contributions['prerequisite_gap_count'] = features.prerequisite_gap_count

        if features.complexity_mismatch > 0.6:
            contributions['complexity_mismatch'] = features.complexity_mismatch

        if features.historical_struggle_score > 0.7:
            contributions['historical_struggle_score'] = features.historical_struggle_score

        # Medium risk features
        if features.content_type_mismatch > 0.5:
            contributions['content_type_mismatch'] = features.content_type_mismatch

        if features.cognitive_load_indicator > 0.7:
            contributions['cognitive_load_indicator'] = features.cognitive_load_indicator

        # Sort by contribution value
        contributions = dict(
            sorted(contributions.items(), key=lambda x: x[1], reverse=True)[:5]
        )

        return contributions

    def _identify_contributing_features_ml(
        self,
        features: FeatureVector
    ) -> Dict[str, float]:
        """Identify top contributing features based on model coefficients."""
        if self.feature_importance is None:
            return {}

        # Get feature values
        feature_values = features.to_array()
        feature_names = FeatureVector.feature_names()

        # Calculate contribution (coefficient * value)
        contributions = {}
        for i, name in enumerate(feature_names):
            contribution = self.feature_importance.get(name, 0) * feature_values[i]
            contributions[name] = abs(contribution)

        # Return top 5
        contributions = dict(
            sorted(contributions.items(), key=lambda x: x[1], reverse=True)[:5]
        )

        return contributions

    def _calculate_feature_importance_ml(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray
    ) -> None:
        """Calculate feature importance from model coefficients."""
        if self.classifier is None:
            return

        # Get coefficients from logistic regression
        if hasattr(self.classifier, 'coef_'):
            coefficients = self.classifier.coef_[0]
        else:
            # CalibratedClassifierCV wraps the estimator
            coefficients = self.classifier.base_estimator.coef_[0]

        # Create feature importance dictionary
        feature_names = FeatureVector.feature_names()
        self.feature_importance = {
            name: abs(float(coef))
            for name, coef in zip(feature_names, coefficients)
        }

        # Normalize to sum to 1.0
        total = sum(self.feature_importance.values())
        if total > 0:
            self.feature_importance = {
                k: v / total for k, v in self.feature_importance.items()
            }

    def _generate_reasoning(
        self,
        features: FeatureVector,
        contributing_features: Dict[str, float],
        risk_level: str
    ) -> str:
        """Generate human-readable explanation for prediction."""
        if not contributing_features:
            return f"{risk_level} risk prediction based on overall patterns."

        # Get top feature
        top_feature = list(contributing_features.keys())[0]

        # Create readable explanations
        explanations = {
            'retention_score': "low retention in this topic area",
            'prerequisite_gap_count': "missing prerequisite knowledge",
            'complexity_mismatch': "content difficulty exceeds current level",
            'historical_struggle_score': "past struggles with similar topics",
            'content_type_mismatch': "learning style mismatch with content format",
            'cognitive_load_indicator': "high cognitive load detected",
            'review_lapse_rate': "high frequency of review lapses",
            'days_until_exam': "exam approaching soon",
            'workload_level': "high current workload",
        }

        reason = explanations.get(
            top_feature,
            f"{top_feature.replace('_', ' ')}"
        )

        return f"{risk_level} risk primarily due to {reason}."

    # ==================== PERSISTENCE METHODS ====================

    def save(self, filepath: str) -> None:
        """
        Save model to disk.

        Args:
            filepath: Path to save model (e.g., "model_v1.pkl")
        """
        model_data = {
            'model_version': self.model_version,
            'model_type': self.model_type,
            'classifier': self.classifier,
            'scaler': self.scaler,
            'feature_importance': self.feature_importance,
            'trained_at': self.trained_at,
            'training_samples': self.training_samples,
        }

        with open(filepath, 'wb') as f:
            pickle.dump(model_data, f)

    @classmethod
    def load(cls, filepath: str) -> 'StrugglePredictionModel':
        """
        Load model from disk.

        Args:
            filepath: Path to saved model

        Returns:
            Loaded StrugglePredictionModel instance
        """
        with open(filepath, 'rb') as f:
            model_data = pickle.load(f)

        model = cls(model_version=model_data['model_version'])
        model.model_type = model_data['model_type']
        model.classifier = model_data['classifier']
        model.scaler = model_data['scaler']
        model.feature_importance = model_data['feature_importance']
        model.trained_at = model_data['trained_at']
        model.training_samples = model_data['training_samples']

        return model
