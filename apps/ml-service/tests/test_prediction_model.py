"""
Prediction Model Unit Tests

Tests for StrugglePredictionModel rule-based and ML models.
"""

import pytest
from typing import Dict

# Import prediction model from ml-service
from app.services.struggle_prediction_model import StrugglePredictionModel, PredictionResult
from app.services.struggle_feature_extractor import FeatureVector


@pytest.mark.unit
@pytest.mark.ml
class TestPredictionModel:
    """Test StrugglePredictionModel class."""

    def test_model_initialization(self):
        """Test prediction model initializes correctly."""
        model = StrugglePredictionModel()

        assert model is not None

    def test_predict_returns_prediction_result(self, sample_feature_vector: Dict):
        """Test predict returns PredictionResult."""
        model = StrugglePredictionModel()

        features = FeatureVector(**sample_feature_vector)
        result = model.predict(features)

        assert isinstance(result, PredictionResult)
        assert hasattr(result, 'probability')
        assert hasattr(result, 'confidence')

    def test_prediction_probability_range(self, sample_feature_vector: Dict):
        """Test prediction probability is in 0-1 range."""
        model = StrugglePredictionModel()

        features = FeatureVector(**sample_feature_vector)
        result = model.predict(features)

        assert 0.0 <= result.probability <= 1.0

    def test_prediction_confidence_range(self, sample_feature_vector: Dict):
        """Test prediction confidence is in 0-1 range."""
        model = StrugglePredictionModel()

        features = FeatureVector(**sample_feature_vector)
        result = model.predict(features)

        assert 0.0 <= result.confidence <= 1.0


@pytest.mark.unit
@pytest.mark.ml
class TestRuleBasedModel:
    """Test rule-based prediction logic."""

    def test_high_struggle_probability_low_retention(self):
        """Test high probability for low retention score."""
        model = StrugglePredictionModel()

        # Low retention scenario
        features = FeatureVector(
            retentionScore=0.3,  # Low
            retentionDeclineRate=0.5,
            reviewLapseRate=0.4,
            sessionPerformanceScore=0.5,
            validationScore=0.5,
            prerequisiteGapCount=0.2,
            prerequisiteMasteryGap=0.3,
            contentComplexity=0.6,
            complexityMismatch=0.3,
            historicalStruggleScore=0.4,
            contentTypeMismatch=0.3,
            cognitiveLoadIndicator=0.4,
            daysUntilExam=0.5,
            daysSinceLastStudy=0.3,
            workloadLevel=0.5
        )

        result = model.predict(features)

        # Should predict high struggle probability
        assert result.probability >= 0.6

    def test_high_struggle_probability_prerequisite_gaps(self):
        """Test high probability for multiple prerequisite gaps."""
        model = StrugglePredictionModel()

        # High prerequisite gaps
        features = FeatureVector(
            retentionScore=0.6,
            retentionDeclineRate=0.3,
            reviewLapseRate=0.3,
            sessionPerformanceScore=0.6,
            validationScore=0.6,
            prerequisiteGapCount=0.8,  # High gaps
            prerequisiteMasteryGap=0.7,
            contentComplexity=0.6,
            complexityMismatch=0.5,
            historicalStruggleScore=0.4,
            contentTypeMismatch=0.3,
            cognitiveLoadIndicator=0.4,
            daysUntilExam=0.5,
            daysSinceLastStudy=0.3,
            workloadLevel=0.5
        )

        result = model.predict(features)

        # Should predict high probability
        assert result.probability >= 0.6

    def test_high_struggle_probability_complexity_mismatch(self):
        """Test high probability for complexity mismatch."""
        model = StrugglePredictionModel()

        # High complexity mismatch
        features = FeatureVector(
            retentionScore=0.6,
            retentionDeclineRate=0.3,
            reviewLapseRate=0.3,
            sessionPerformanceScore=0.6,
            validationScore=0.6,
            prerequisiteGapCount=0.3,
            prerequisiteMasteryGap=0.3,
            contentComplexity=0.9,
            complexityMismatch=0.8,  # High mismatch
            historicalStruggleScore=0.4,
            contentTypeMismatch=0.3,
            cognitiveLoadIndicator=0.4,
            daysUntilExam=0.5,
            daysSinceLastStudy=0.3,
            workloadLevel=0.5
        )

        result = model.predict(features)

        # Should predict high probability
        assert result.probability >= 0.6

    def test_high_struggle_probability_historical_patterns(self):
        """Test high probability for historical struggle patterns."""
        model = StrugglePredictionModel()

        # Strong historical struggle pattern
        features = FeatureVector(
            retentionScore=0.6,
            retentionDeclineRate=0.3,
            reviewLapseRate=0.3,
            sessionPerformanceScore=0.6,
            validationScore=0.6,
            prerequisiteGapCount=0.3,
            prerequisiteMasteryGap=0.3,
            contentComplexity=0.6,
            complexityMismatch=0.3,
            historicalStruggleScore=0.9,  # High historical struggles
            contentTypeMismatch=0.3,
            cognitiveLoadIndicator=0.4,
            daysUntilExam=0.5,
            daysSinceLastStudy=0.3,
            workloadLevel=0.5
        )

        result = model.predict(features)

        # Should predict high probability
        assert result.probability >= 0.6

    def test_low_struggle_probability_good_metrics(self):
        """Test low probability for good performance metrics."""
        model = StrugglePredictionModel()

        # All good metrics
        features = FeatureVector(
            retentionScore=0.9,  # High retention
            retentionDeclineRate=0.1,
            reviewLapseRate=0.1,
            sessionPerformanceScore=0.9,
            validationScore=0.9,
            prerequisiteGapCount=0.1,  # Few gaps
            prerequisiteMasteryGap=0.1,
            contentComplexity=0.5,
            complexityMismatch=0.1,  # Good match
            historicalStruggleScore=0.1,  # No history of struggles
            contentTypeMismatch=0.1,
            cognitiveLoadIndicator=0.2,
            daysUntilExam=0.5,
            daysSinceLastStudy=0.2,
            workloadLevel=0.3
        )

        result = model.predict(features)

        # Should predict low probability
        assert result.probability <= 0.5

    def test_medium_struggle_probability(self):
        """Test medium probability for mixed metrics."""
        model = StrugglePredictionModel()

        # Mixed metrics
        features = FeatureVector(
            retentionScore=0.6,  # Medium retention
            retentionDeclineRate=0.3,
            reviewLapseRate=0.3,
            sessionPerformanceScore=0.6,
            validationScore=0.6,
            prerequisiteGapCount=0.3,  # Some gaps
            prerequisiteMasteryGap=0.3,
            contentComplexity=0.6,
            complexityMismatch=0.4,
            historicalStruggleScore=0.4,
            contentTypeMismatch=0.5,
            cognitiveLoadIndicator=0.5,
            daysUntilExam=0.5,
            daysSinceLastStudy=0.4,
            workloadLevel=0.6
        )

        result = model.predict(features)

        # Should predict medium probability
        assert 0.3 <= result.probability <= 0.8


@pytest.mark.unit
@pytest.mark.ml
class TestPredictionConfidence:
    """Test confidence scoring logic."""

    def test_confidence_with_complete_data(self):
        """Test confidence is high with complete feature data."""
        model = StrugglePredictionModel()

        # All features have non-default values
        features = FeatureVector(
            retentionScore=0.8,
            retentionDeclineRate=0.2,
            reviewLapseRate=0.15,
            sessionPerformanceScore=0.85,
            validationScore=0.8,
            prerequisiteGapCount=0.1,
            prerequisiteMasteryGap=0.15,
            contentComplexity=0.6,
            complexityMismatch=0.2,
            historicalStruggleScore=0.2,
            contentTypeMismatch=0.1,
            cognitiveLoadIndicator=0.3,
            daysUntilExam=0.4,
            daysSinceLastStudy=0.3,
            workloadLevel=0.4
        )

        result = model.predict(features)

        # Confidence should be reasonably high with complete data
        assert result.confidence >= 0.6

    def test_confidence_with_missing_data(self):
        """Test confidence is lower with default/missing data."""
        model = StrugglePredictionModel()

        # Many features at default 0.5 (indicating missing data)
        features = FeatureVector(
            retentionScore=0.5,  # Default
            retentionDeclineRate=0.5,
            reviewLapseRate=0.5,
            sessionPerformanceScore=0.5,
            validationScore=0.5,
            prerequisiteGapCount=0.5,
            prerequisiteMasteryGap=0.5,
            contentComplexity=0.5,
            complexityMismatch=0.5,
            historicalStruggleScore=0.5,
            contentTypeMismatch=0.5,
            cognitiveLoadIndicator=0.5,
            daysUntilExam=0.5,
            daysSinceLastStudy=0.5,
            workloadLevel=0.5
        )

        result = model.predict(features)

        # Confidence should reflect data insufficiency
        assert result.confidence <= 0.8


@pytest.mark.unit
@pytest.mark.ml
class TestModelEdgeCases:
    """Test edge cases and boundary conditions."""

    def test_predict_with_all_zeros(self):
        """Test prediction with all zero features."""
        model = StrugglePredictionModel()

        features = FeatureVector(
            retentionScore=0.0,
            retentionDeclineRate=0.0,
            reviewLapseRate=0.0,
            sessionPerformanceScore=0.0,
            validationScore=0.0,
            prerequisiteGapCount=0.0,
            prerequisiteMasteryGap=0.0,
            contentComplexity=0.0,
            complexityMismatch=0.0,
            historicalStruggleScore=0.0,
            contentTypeMismatch=0.0,
            cognitiveLoadIndicator=0.0,
            daysUntilExam=0.0,
            daysSinceLastStudy=0.0,
            workloadLevel=0.0
        )

        result = model.predict(features)

        # Should handle gracefully
        assert 0.0 <= result.probability <= 1.0
        assert 0.0 <= result.confidence <= 1.0

    def test_predict_with_all_ones(self):
        """Test prediction with all maximum features."""
        model = StrugglePredictionModel()

        features = FeatureVector(
            retentionScore=1.0,
            retentionDeclineRate=1.0,
            reviewLapseRate=1.0,
            sessionPerformanceScore=1.0,
            validationScore=1.0,
            prerequisiteGapCount=1.0,
            prerequisiteMasteryGap=1.0,
            contentComplexity=1.0,
            complexityMismatch=1.0,
            historicalStruggleScore=1.0,
            contentTypeMismatch=1.0,
            cognitiveLoadIndicator=1.0,
            daysUntilExam=1.0,
            daysSinceLastStudy=1.0,
            workloadLevel=1.0
        )

        result = model.predict(features)

        # Should handle gracefully
        assert 0.0 <= result.probability <= 1.0
        assert 0.0 <= result.confidence <= 1.0

    def test_prediction_consistency(self, sample_feature_vector: Dict):
        """Test model produces consistent predictions for same input."""
        model = StrugglePredictionModel()

        features = FeatureVector(**sample_feature_vector)

        # Run prediction multiple times
        result1 = model.predict(features)
        result2 = model.predict(features)
        result3 = model.predict(features)

        # All predictions should be identical (deterministic)
        assert result1.probability == result2.probability == result3.probability
        assert result1.confidence == result2.confidence == result3.confidence
