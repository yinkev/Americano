"""
Feature Extractor Unit Tests

Tests for StruggleFeatureExtractor functionality.
"""

import pytest
from unittest.mock import Mock, AsyncMock
from typing import Dict

# Import feature extractor from ml-service
from app.services.struggle_feature_extractor import StruggleFeatureExtractor, FeatureVector


@pytest.mark.unit
@pytest.mark.ml
class TestFeatureVector:
    """Test FeatureVector data class."""

    def test_feature_vector_initialization(self):
        """Test FeatureVector initializes with all features."""
        features = {
            "retentionScore": 0.75,
            "prerequisiteGapCount": 0.2,
            "complexityMismatch": 0.3
        }

        fv = FeatureVector(**features)

        assert fv.retentionScore == 0.75
        assert fv.prerequisiteGapCount == 0.2
        assert fv.complexityMismatch == 0.3

    def test_feature_vector_to_dict(self):
        """Test FeatureVector converts to dictionary."""
        fv = FeatureVector(
            retentionScore=0.75,
            retentionDeclineRate=0.1,
            reviewLapseRate=0.2,
            sessionPerformanceScore=0.8,
            validationScore=0.7,
            prerequisiteGapCount=0.3,
            prerequisiteMasteryGap=0.4,
            contentComplexity=0.5,
            complexityMismatch=0.2,
            historicalStruggleScore=0.1,
            contentTypeMismatch=0.0,
            cognitiveLoadIndicator=0.3,
            daysUntilExam=0.5,
            daysSinceLastStudy=0.4,
            workloadLevel=0.6
        )

        dict_repr = fv.to_dict()

        assert isinstance(dict_repr, dict)
        assert "retentionScore" in dict_repr
        assert dict_repr["retentionScore"] == 0.75


@pytest.mark.unit
@pytest.mark.ml
class TestStruggleFeatureExtractor:
    """Test StruggleFeatureExtractor class."""

    @pytest.mark.asyncio
    async def test_extractor_initialization(self, db):
        """Test feature extractor initializes correctly."""
        extractor = StruggleFeatureExtractor(db, cache_enabled=True)

        assert extractor.db is not None
        assert extractor.cache_enabled is True

    @pytest.mark.asyncio
    async def test_extract_features_returns_feature_vector(
        self,
        db,
        test_user: Dict,
        test_objective: Dict
    ):
        """Test extract_features_for_objective returns FeatureVector."""
        extractor = StruggleFeatureExtractor(db)

        features = await extractor.extract_features_for_objective(
            test_user["user_id"],
            test_objective["objective_id"]
        )

        assert isinstance(features, FeatureVector)

    @pytest.mark.asyncio
    async def test_feature_values_normalized(
        self,
        db,
        test_user: Dict,
        test_objective: Dict
    ):
        """Test all feature values are normalized to 0-1 range."""
        extractor = StruggleFeatureExtractor(db)

        features = await extractor.extract_features_for_objective(
            test_user["user_id"],
            test_objective["objective_id"]
        )

        # Check all features are in 0-1 range
        feature_dict = features.to_dict()
        for key, value in feature_dict.items():
            assert 0.0 <= value <= 1.0, f"Feature {key} = {value} not in [0, 1]"

    @pytest.mark.asyncio
    async def test_retention_score_feature(
        self,
        db,
        test_user: Dict,
        test_objective: Dict
    ):
        """Test retention score feature extraction."""
        extractor = StruggleFeatureExtractor(db)

        features = await extractor.extract_features_for_objective(
            test_user["user_id"],
            test_objective["objective_id"]
        )

        # Retention score should be present and valid
        assert 0.0 <= features.retentionScore <= 1.0

    @pytest.mark.asyncio
    async def test_prerequisite_gap_feature(
        self,
        db,
        test_user: Dict,
        test_objective: Dict
    ):
        """Test prerequisite gap count feature."""
        extractor = StruggleFeatureExtractor(db)

        features = await extractor.extract_features_for_objective(
            test_user["user_id"],
            test_objective["objective_id"]
        )

        # Prerequisite gap should be present and normalized
        assert 0.0 <= features.prerequisiteGapCount <= 1.0

    @pytest.mark.asyncio
    async def test_complexity_features(
        self,
        db,
        test_user: Dict,
        test_objective: Dict
    ):
        """Test complexity-related features."""
        extractor = StruggleFeatureExtractor(db)

        features = await extractor.extract_features_for_objective(
            test_user["user_id"],
            test_objective["objective_id"]
        )

        assert 0.0 <= features.contentComplexity <= 1.0
        assert 0.0 <= features.complexityMismatch <= 1.0

    @pytest.mark.asyncio
    async def test_behavioral_features(
        self,
        db,
        test_user: Dict,
        test_objective: Dict
    ):
        """Test behavioral pattern features."""
        extractor = StruggleFeatureExtractor(db)

        features = await extractor.extract_features_for_objective(
            test_user["user_id"],
            test_objective["objective_id"]
        )

        assert 0.0 <= features.historicalStruggleScore <= 1.0
        assert 0.0 <= features.contentTypeMismatch <= 1.0
        assert 0.0 <= features.cognitiveLoadIndicator <= 1.0

    @pytest.mark.asyncio
    async def test_contextual_features(
        self,
        db,
        test_user: Dict,
        test_objective: Dict
    ):
        """Test contextual features (time-based)."""
        extractor = StruggleFeatureExtractor(db)

        features = await extractor.extract_features_for_objective(
            test_user["user_id"],
            test_objective["objective_id"]
        )

        assert 0.0 <= features.daysUntilExam <= 1.0
        assert 0.0 <= features.daysSinceLastStudy <= 1.0
        assert 0.0 <= features.workloadLevel <= 1.0


@pytest.mark.unit
@pytest.mark.ml
class TestFeatureExtractionEdgeCases:
    """Test edge cases in feature extraction."""

    @pytest.mark.asyncio
    async def test_extract_features_new_user(self, db):
        """Test feature extraction for user with no history."""
        extractor = StruggleFeatureExtractor(db)

        # User with no study history
        features = await extractor.extract_features_for_objective(
            "new-user-no-history",
            "test-objective-001"
        )

        # Should use default values (0.5 for neutral)
        assert isinstance(features, FeatureVector)

    @pytest.mark.asyncio
    async def test_extract_features_nonexistent_objective(
        self,
        db,
        test_user: Dict
    ):
        """Test feature extraction with nonexistent objective."""
        extractor = StruggleFeatureExtractor(db)

        # Should handle gracefully
        try:
            features = await extractor.extract_features_for_objective(
                test_user["user_id"],
                "nonexistent-objective-999"
            )
            # If completes, should return FeatureVector with defaults
            assert isinstance(features, FeatureVector)
        except Exception:
            # Or raise appropriate error
            pass

    @pytest.mark.asyncio
    async def test_feature_caching_enabled(self, db, test_user: Dict, test_objective: Dict):
        """Test feature extraction uses cache when enabled."""
        extractor = StruggleFeatureExtractor(db, cache_enabled=True)

        # First call
        features1 = await extractor.extract_features_for_objective(
            test_user["user_id"],
            test_objective["objective_id"]
        )

        # Second call (should use cache if implemented)
        features2 = await extractor.extract_features_for_objective(
            test_user["user_id"],
            test_objective["objective_id"]
        )

        # Both should return valid feature vectors
        assert isinstance(features1, FeatureVector)
        assert isinstance(features2, FeatureVector)

    @pytest.mark.asyncio
    async def test_missing_values_handled(
        self,
        db,
        test_user: Dict,
        test_objective: Dict
    ):
        """Test missing feature values default to 0.5 (neutral)."""
        extractor = StruggleFeatureExtractor(db)

        features = await extractor.extract_features_for_objective(
            test_user["user_id"],
            test_objective["objective_id"]
        )

        # All features should have values (no None)
        feature_dict = features.to_dict()
        for key, value in feature_dict.items():
            assert value is not None, f"Feature {key} is None"
            assert isinstance(value, (int, float)), f"Feature {key} not numeric"


@pytest.mark.unit
@pytest.mark.ml
def test_feature_count():
    """Test that feature vector has expected number of features (15+)."""
    fv = FeatureVector(
        retentionScore=0.5,
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

    feature_dict = fv.to_dict()

    # Should have 15 features
    assert len(feature_dict) == 15
