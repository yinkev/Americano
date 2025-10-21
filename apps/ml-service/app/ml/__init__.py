"""
ML Module for Struggle Prediction

Exports:
- StrugglePredictionModel: Main training and prediction class
- FEATURE_NAMES: List of 15 feature names
- ModelMetadata: Model versioning dataclass
- ModelPerformance: Performance metrics dataclass
"""

from .struggle_model import (
    StrugglePredictionModel,
    FEATURE_NAMES,
    ModelMetadata,
    ModelPerformance,
)

__all__ = [
    "StrugglePredictionModel",
    "FEATURE_NAMES",
    "ModelMetadata",
    "ModelPerformance",
]
