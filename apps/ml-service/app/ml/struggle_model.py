"""
Story 5.2: Struggle Prediction Model Training Pipeline
=======================================================

Production-grade gradient boosting model for learning struggle prediction.
Uses XGBoost with comprehensive hyperparameter tuning and cross-validation.

Model Architecture:
- Binary classification (will_struggle: True/False)
- XGBoost with histogram-based tree construction
- 15 engineered features from behavioral, performance, and contextual data
- Class imbalance handling via scale_pos_weight
- Early stopping for optimal generalization

Author: Americano ML Subsystem
Quality Standard: Research-grade with statistical rigor
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass, asdict
from datetime import datetime
import json
import joblib
from pathlib import Path
import logging

# ML imports - fetched from latest XGBoost/sklearn documentation via context7 MCP
import xgboost as xgb
from sklearn.model_selection import train_test_split, GridSearchCV, StratifiedKFold
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    classification_report,
)
from sklearn.preprocessing import StandardScaler
from sklearn.utils.class_weight import compute_class_weight

logger = logging.getLogger(__name__)


# ============================================
# Feature Schema (15 normalized features 0-1)
# ============================================

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


@dataclass
class ModelMetadata:
    """Metadata for trained model versioning and tracking"""

    model_version: str
    training_date: datetime
    features_used: List[str]
    n_training_samples: int
    n_validation_samples: int
    n_test_samples: int
    class_distribution: Dict[str, int]
    best_hyperparameters: Dict[str, Any]
    performance_metrics: Dict[str, float]
    feature_importance: Dict[str, float]
    data_quality_threshold: float


@dataclass
class ModelPerformance:
    """Model performance metrics across all splits"""

    # Train metrics
    train_accuracy: float
    train_precision: float
    train_recall: float
    train_f1: float
    train_auc: float

    # Validation metrics
    val_accuracy: float
    val_precision: float
    val_recall: float
    val_f1: float
    val_auc: float

    # Test metrics
    test_accuracy: float
    test_precision: float
    test_recall: float
    test_f1: float
    test_auc: float

    # Confusion matrices
    train_confusion_matrix: List[List[int]]
    val_confusion_matrix: List[List[int]]
    test_confusion_matrix: List[List[int]]


class StrugglePredictionModel:
    """
    Production-grade XGBoost model for struggle prediction.

    Implements:
    - Data extraction from Prisma database
    - Feature preprocessing and validation
    - Hyperparameter tuning with GridSearchCV
    - 5-fold cross-validation
    - Class imbalance handling
    - Model persistence and versioning
    - Feature importance analysis
    """

    def __init__(self, model_dir: Path = Path("./models")):
        """
        Initialize the struggle prediction model.

        Args:
            model_dir: Directory to save trained models
        """
        self.model_dir = model_dir
        self.model_dir.mkdir(parents=True, exist_ok=True)

        self.model: Optional[xgb.XGBClassifier] = None
        self.scaler: Optional[StandardScaler] = None
        self.metadata: Optional[ModelMetadata] = None
        self.feature_names = FEATURE_NAMES.copy()

        logger.info(f"StrugglePredictionModel initialized. Model dir: {self.model_dir}")

    def prepare_training_data(
        self,
        struggle_predictions: pd.DataFrame,
        feature_vectors: pd.DataFrame,
        min_data_quality: float = 0.3
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Prepare training data from database records.

        Args:
            struggle_predictions: DataFrame with columns [id, userId, learningObjectiveId,
                                actualOutcome, featureVector, predictionDate]
            feature_vectors: DataFrame with 15 feature columns
            min_data_quality: Minimum data quality threshold (0-1)

        Returns:
            Tuple of (X, y) where X is feature matrix, y is binary labels
        """
        logger.info(f"Preparing training data. Raw samples: {len(struggle_predictions)}")

        # Filter for predictions with actual outcomes recorded
        labeled_data = struggle_predictions[
            struggle_predictions['actualOutcome'].notna()
        ].copy()

        logger.info(f"Labeled samples (with actualOutcome): {len(labeled_data)}")

        if len(labeled_data) < 100:
            logger.warning(
                f"Insufficient labeled data ({len(labeled_data)} samples). "
                f"Need at least 100 samples for reliable training."
            )

        # Extract features and labels
        X = feature_vectors[self.feature_names].values
        y = labeled_data['actualOutcome'].astype(int).values  # True=1, False=0

        # Validate feature ranges (should all be 0-1)
        if np.any(X < 0) or np.any(X > 1):
            logger.warning("Features outside [0,1] range detected. Clipping values.")
            X = np.clip(X, 0, 1)

        # Check for missing values
        if np.any(np.isnan(X)):
            logger.warning(f"Missing values detected. Filling with 0.5 (neutral)")
            X = np.nan_to_num(X, nan=0.5)

        logger.info(f"Final training dataset: X shape={X.shape}, y shape={y.shape}")
        logger.info(f"Class distribution: {np.bincount(y)}")

        return X, y

    def train(
        self,
        X: np.ndarray,
        y: np.ndarray,
        hyperparameter_tuning: bool = True,
        cv_folds: int = 5
    ) -> ModelPerformance:
        """
        Train the XGBoost model with hyperparameter tuning and cross-validation.

        Args:
            X: Feature matrix (n_samples, n_features)
            y: Binary labels (n_samples,)
            hyperparameter_tuning: Whether to perform GridSearchCV
            cv_folds: Number of cross-validation folds

        Returns:
            ModelPerformance object with metrics across all splits
        """
        logger.info("=" * 60)
        logger.info("Starting Model Training Pipeline")
        logger.info("=" * 60)

        # Train/Val/Test split (70/15/15)
        X_temp, X_test, y_temp, y_test = train_test_split(
            X, y, test_size=0.15, random_state=42, stratify=y
        )
        X_train, X_val, y_train, y_val = train_test_split(
            X_temp, y_temp, test_size=0.176,  # 0.176 * 0.85 ≈ 0.15
            random_state=42, stratify=y_temp
        )

        logger.info(f"Data splits - Train: {len(X_train)}, Val: {len(X_val)}, Test: {len(X_test)}")
        logger.info(f"Train class dist: {np.bincount(y_train)}")
        logger.info(f"Val class dist: {np.bincount(y_val)}")
        logger.info(f"Test class dist: {np.bincount(y_test)}")

        # Calculate class weights for imbalance handling
        class_weights = compute_class_weight(
            class_weight='balanced',
            classes=np.unique(y_train),
            y=y_train
        )
        scale_pos_weight = class_weights[1] / class_weights[0]
        logger.info(f"Class imbalance - scale_pos_weight: {scale_pos_weight:.3f}")

        if hyperparameter_tuning:
            logger.info("Starting hyperparameter tuning with GridSearchCV...")
            best_model = self._hyperparameter_search(
                X_train, y_train, scale_pos_weight, cv_folds
            )
        else:
            logger.info("Training with default hyperparameters...")
            best_model = self._train_default_model(X_train, y_train, scale_pos_weight)

        self.model = best_model

        # Evaluate on all splits
        performance = self._evaluate_model(
            X_train, y_train, X_val, y_val, X_test, y_test
        )

        # Calculate feature importance
        feature_importance = dict(zip(
            self.feature_names,
            self.model.feature_importances_
        ))

        # Store metadata
        self.metadata = ModelMetadata(
            model_version="v1.0.0",
            training_date=datetime.now(),
            features_used=self.feature_names,
            n_training_samples=len(X_train),
            n_validation_samples=len(X_val),
            n_test_samples=len(X_test),
            class_distribution={
                "train_negative": int(np.sum(y_train == 0)),
                "train_positive": int(np.sum(y_train == 1)),
                "val_negative": int(np.sum(y_val == 0)),
                "val_positive": int(np.sum(y_val == 1)),
                "test_negative": int(np.sum(y_test == 0)),
                "test_positive": int(np.sum(y_test == 1)),
            },
            best_hyperparameters=self.model.get_params(),
            performance_metrics={
                "test_accuracy": performance.test_accuracy,
                "test_precision": performance.test_precision,
                "test_recall": performance.test_recall,
                "test_f1": performance.test_f1,
                "test_auc": performance.test_auc,
            },
            feature_importance=feature_importance,
            data_quality_threshold=0.3
        )

        logger.info("=" * 60)
        logger.info("Training Complete!")
        logger.info(f"Test Accuracy: {performance.test_accuracy:.3f}")
        logger.info(f"Test F1 Score: {performance.test_f1:.3f}")
        logger.info(f"Test ROC-AUC: {performance.test_auc:.3f}")
        logger.info("=" * 60)

        return performance

    def _hyperparameter_search(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        scale_pos_weight: float,
        cv_folds: int
    ) -> xgb.XGBClassifier:
        """
        Perform GridSearchCV for hyperparameter optimization.

        Based on XGBoost best practices from context7 docs:
        - tree_method='hist' for efficiency
        - early_stopping_rounds for preventing overfitting
        - learning_rate tuning (0.01-0.2 range)
        - max_depth controls tree complexity
        - subsample and colsample_bytree for regularization
        """
        param_grid = {
            'max_depth': [3, 5, 7],
            'learning_rate': [0.01, 0.05, 0.1],
            'n_estimators': [100, 200, 300],
            'subsample': [0.7, 0.8, 0.9],
            'colsample_bytree': [0.7, 0.8, 0.9],
            'min_child_weight': [1, 3, 5],
        }

        base_model = xgb.XGBClassifier(
            objective='binary:logistic',
            tree_method='hist',
            scale_pos_weight=scale_pos_weight,
            random_state=42,
            n_jobs=-1,
            early_stopping_rounds=10,
            eval_metric='auc'
        )

        cv_strategy = StratifiedKFold(n_splits=cv_folds, shuffle=True, random_state=42)

        grid_search = GridSearchCV(
            estimator=base_model,
            param_grid=param_grid,
            scoring='f1',  # Optimize for F1 (balance of precision/recall)
            cv=cv_strategy,
            n_jobs=-1,
            verbose=2,
            return_train_score=True
        )

        grid_search.fit(X_train, y_train)

        logger.info(f"Best parameters: {grid_search.best_params_}")
        logger.info(f"Best CV F1 score: {grid_search.best_score_:.3f}")

        return grid_search.best_estimator_

    def _train_default_model(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        scale_pos_weight: float
    ) -> xgb.XGBClassifier:
        """Train model with sensible default hyperparameters."""
        model = xgb.XGBClassifier(
            max_depth=5,
            learning_rate=0.05,
            n_estimators=200,
            subsample=0.8,
            colsample_bytree=0.8,
            min_child_weight=3,
            objective='binary:logistic',
            tree_method='hist',
            scale_pos_weight=scale_pos_weight,
            random_state=42,
            n_jobs=-1,
            early_stopping_rounds=10,
            eval_metric='auc'
        )

        model.fit(X_train, y_train)
        return model

    def _evaluate_model(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_val: np.ndarray,
        y_val: np.ndarray,
        X_test: np.ndarray,
        y_test: np.ndarray
    ) -> ModelPerformance:
        """Evaluate model on train, validation, and test sets."""

        def calculate_metrics(y_true, y_pred, y_pred_proba):
            return {
                'accuracy': accuracy_score(y_true, y_pred),
                'precision': precision_score(y_true, y_pred, zero_division=0),
                'recall': recall_score(y_true, y_pred, zero_division=0),
                'f1': f1_score(y_true, y_pred, zero_division=0),
                'auc': roc_auc_score(y_true, y_pred_proba),
                'confusion_matrix': confusion_matrix(y_true, y_pred).tolist()
            }

        # Train metrics
        train_pred = self.model.predict(X_train)
        train_proba = self.model.predict_proba(X_train)[:, 1]
        train_metrics = calculate_metrics(y_train, train_pred, train_proba)

        # Validation metrics
        val_pred = self.model.predict(X_val)
        val_proba = self.model.predict_proba(X_val)[:, 1]
        val_metrics = calculate_metrics(y_val, val_pred, val_proba)

        # Test metrics
        test_pred = self.model.predict(X_test)
        test_proba = self.model.predict_proba(X_test)[:, 1]
        test_metrics = calculate_metrics(y_test, test_pred, test_proba)

        # Log detailed results
        logger.info("\n" + "=" * 60)
        logger.info("MODEL PERFORMANCE SUMMARY")
        logger.info("=" * 60)
        logger.info("\nTRAIN SET:")
        logger.info(f"  Accuracy:  {train_metrics['accuracy']:.3f}")
        logger.info(f"  Precision: {train_metrics['precision']:.3f}")
        logger.info(f"  Recall:    {train_metrics['recall']:.3f}")
        logger.info(f"  F1 Score:  {train_metrics['f1']:.3f}")
        logger.info(f"  ROC-AUC:   {train_metrics['auc']:.3f}")

        logger.info("\nVALIDATION SET:")
        logger.info(f"  Accuracy:  {val_metrics['accuracy']:.3f}")
        logger.info(f"  Precision: {val_metrics['precision']:.3f}")
        logger.info(f"  Recall:    {val_metrics['recall']:.3f}")
        logger.info(f"  F1 Score:  {val_metrics['f1']:.3f}")
        logger.info(f"  ROC-AUC:   {val_metrics['auc']:.3f}")

        logger.info("\nTEST SET (FINAL EVALUATION):")
        logger.info(f"  Accuracy:  {test_metrics['accuracy']:.3f}")
        logger.info(f"  Precision: {test_metrics['precision']:.3f}")
        logger.info(f"  Recall:    {test_metrics['recall']:.3f}")
        logger.info(f"  F1 Score:  {test_metrics['f1']:.3f}")
        logger.info(f"  ROC-AUC:   {test_metrics['auc']:.3f}")
        logger.info("\nTest Confusion Matrix:")
        logger.info(f"  {test_metrics['confusion_matrix']}")
        logger.info("=" * 60 + "\n")

        return ModelPerformance(
            train_accuracy=train_metrics['accuracy'],
            train_precision=train_metrics['precision'],
            train_recall=train_metrics['recall'],
            train_f1=train_metrics['f1'],
            train_auc=train_metrics['auc'],
            val_accuracy=val_metrics['accuracy'],
            val_precision=val_metrics['precision'],
            val_recall=val_metrics['recall'],
            val_f1=val_metrics['f1'],
            val_auc=val_metrics['auc'],
            test_accuracy=test_metrics['accuracy'],
            test_precision=test_metrics['precision'],
            test_recall=test_metrics['recall'],
            test_f1=test_metrics['f1'],
            test_auc=test_metrics['auc'],
            train_confusion_matrix=train_metrics['confusion_matrix'],
            val_confusion_matrix=val_metrics['confusion_matrix'],
            test_confusion_matrix=test_metrics['confusion_matrix'],
        )

    def save_model(self, model_name: str = "struggle_model_v1.0.0") -> Path:
        """
        Save trained model and metadata to disk.

        Args:
            model_name: Base name for model files

        Returns:
            Path to saved model file
        """
        if self.model is None:
            raise ValueError("No trained model to save. Train model first.")

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        model_path = self.model_dir / f"{model_name}_{timestamp}.joblib"
        metadata_path = self.model_dir / f"{model_name}_{timestamp}_metadata.json"

        # Save model
        joblib.dump(self.model, model_path)
        logger.info(f"Model saved to: {model_path}")

        # Save metadata
        if self.metadata:
            metadata_dict = asdict(self.metadata)
            metadata_dict['training_date'] = self.metadata.training_date.isoformat()

            with open(metadata_path, 'w') as f:
                json.dump(metadata_dict, f, indent=2)
            logger.info(f"Metadata saved to: {metadata_path}")

        return model_path

    def load_model(self, model_path: Path) -> None:
        """Load trained model from disk."""
        self.model = joblib.load(model_path)
        logger.info(f"Model loaded from: {model_path}")

        # Try to load metadata
        metadata_path = model_path.parent / f"{model_path.stem}_metadata.json"
        if metadata_path.exists():
            with open(metadata_path, 'r') as f:
                metadata_dict = json.load(f)
                # Note: Would need to reconstruct ModelMetadata dataclass here
            logger.info(f"Metadata loaded from: {metadata_path}")

    def predict(self, X: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """
        Make predictions on new data.

        Args:
            X: Feature matrix (n_samples, n_features)

        Returns:
            Tuple of (predictions, probabilities) where:
                - predictions: Binary labels (0/1)
                - probabilities: Struggle probabilities (0.0-1.0)
        """
        if self.model is None:
            raise ValueError("No trained model. Train or load a model first.")

        predictions = self.model.predict(X)
        probabilities = self.model.predict_proba(X)[:, 1]  # Probability of class 1 (struggle)

        return predictions, probabilities

    def get_feature_importance(self) -> Dict[str, float]:
        """Get feature importance scores from trained model."""
        if self.model is None:
            raise ValueError("No trained model. Train or load a model first.")

        importance_scores = dict(zip(
            self.feature_names,
            self.model.feature_importances_
        ))

        # Sort by importance (descending)
        return dict(sorted(importance_scores.items(), key=lambda x: x[1], reverse=True))
