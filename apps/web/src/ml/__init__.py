"""
Americano ML Package - Research-Grade Learning Analytics

This package provides world-class machine learning components for
the Americano adaptive learning platform. All implementations follow
scikit-learn conventions and production ML best practices.

Modules:
- struggle_feature_extractor: Feature engineering for struggle prediction
- struggle_prediction_model: ML models for predicting learning struggles

Author: Americano ML Subsystem
Story: Epic 5 - Behavioral Learning Twin
"""

from .struggle_feature_extractor import (
    StruggleFeatureExtractor,
    FeatureVector,
)

from .struggle_prediction_model import (
    StrugglePredictionModel,
    PredictionResult,
    ModelMetrics,
    TrainingExample,
)

__version__ = "1.0.0"
__all__ = [
    # Feature Extraction
    "StruggleFeatureExtractor",
    "FeatureVector",
    # Prediction Model
    "StrugglePredictionModel",
    "PredictionResult",
    "ModelMetrics",
    "TrainingExample",
]
