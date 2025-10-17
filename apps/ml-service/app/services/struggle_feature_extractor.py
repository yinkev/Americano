"""
Struggle Feature Extractor for Learning Analytics

This module implements research-grade feature engineering for predicting learning struggles.
Follows scikit-learn conventions and best practices for production ML systems.

Author: Americano ML Subsystem
Story: 5.2 - Predictive Analytics for Learning Struggles (Task 2)
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
from functools import lru_cache
import json


@dataclass
class FeatureVector:
    """
    Normalized feature vector (all values 0-1 scale) for struggle prediction.

    Features are organized into 5 categories:
    - Performance: retention, review patterns, validation scores
    - Prerequisites: gap detection, mastery levels
    - Complexity: content difficulty, user-content mismatch
    - Behavioral: historical patterns, learning style fit, cognitive load
    - Contextual: temporal urgency, workload, recency
    """
    # Performance features (5 features)
    retention_score: float  # Average retention for topic area (last 30 days)
    retention_decline_rate: float  # Rate of retention degradation over time
    review_lapse_rate: float  # Frequency of AGAIN ratings
    session_performance_score: float  # Recent session performance
    validation_score: float  # Validation prompt average scores

    # Prerequisite features (2 features)
    prerequisite_gap_count: float  # Ratio of unmastered prerequisites
    prerequisite_mastery_gap: float  # Average mastery gap for prerequisites

    # Complexity features (2 features)
    content_complexity: float  # Objective difficulty level (BASIC/INTERMEDIATE/ADVANCED)
    complexity_mismatch: float  # Difficulty vs. user ability gap

    # Behavioral features (3 features)
    historical_struggle_score: float  # Past struggles in similar topics
    content_type_mismatch: float  # Content format vs. learning style
    cognitive_load_indicator: float  # Current cognitive load level

    # Contextual features (3 features)
    days_until_exam: float  # Urgency factor (normalized)
    days_since_last_study: float  # Recency (normalized)
    workload_level: float  # Current workload (normalized)

    # Metadata
    extracted_at: datetime
    data_quality: float  # 0-1, based on feature availability

    def to_array(self) -> np.ndarray:
        """Convert feature vector to numpy array for ML models."""
        return np.array([
            self.retention_score,
            self.retention_decline_rate,
            self.review_lapse_rate,
            self.session_performance_score,
            self.validation_score,
            self.prerequisite_gap_count,
            self.prerequisite_mastery_gap,
            self.content_complexity,
            self.complexity_mismatch,
            self.historical_struggle_score,
            self.content_type_mismatch,
            self.cognitive_load_indicator,
            self.days_until_exam,
            self.days_since_last_study,
            self.workload_level,
        ])

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        result = asdict(self)
        result['extracted_at'] = self.extracted_at.isoformat()
        return result

    @classmethod
    def feature_names(cls) -> List[str]:
        """Get ordered list of feature names."""
        return [
            'retention_score',
            'retention_decline_rate',
            'review_lapse_rate',
            'session_performance_score',
            'validation_score',
            'prerequisite_gap_count',
            'prerequisite_mastery_gap',
            'content_complexity',
            'complexity_mismatch',
            'historical_struggle_score',
            'content_type_mismatch',
            'cognitive_load_indicator',
            'days_until_exam',
            'days_since_last_study',
            'workload_level',
        ]


class StruggleFeatureExtractor:
    """
    Production-grade feature extractor for learning struggle prediction.

    Implements 3-tier caching strategy:
    - L1: User learning profile (1 hour TTL)
    - L2: Behavioral patterns (12 hour TTL)
    - L3: Performance metrics (30 minute TTL)

    Usage:
        extractor = StruggleFeatureExtractor(db_client)
        features = extractor.extract_features_for_objective(user_id, objective_id)
        importance = extractor.calculate_feature_importance(training_data)
    """

    def __init__(self, db_client: Any, cache_enabled: bool = True):
        """
        Initialize feature extractor.

        Args:
            db_client: Database client (e.g., Prisma client) for data access
            cache_enabled: Enable caching for performance optimization
        """
        self.db = db_client
        self.cache_enabled = cache_enabled
        self._cache: Dict[str, Tuple[Any, datetime]] = {}

        # Cache TTLs
        self.TTL_PROFILE = timedelta(hours=1)
        self.TTL_PATTERNS = timedelta(hours=12)
        self.TTL_METRICS = timedelta(minutes=30)

    # ==================== PUBLIC API ====================

    async def extract_features_for_objective(
        self,
        user_id: str,
        objective_id: str
    ) -> FeatureVector:
        """
        Extract complete feature vector for a learning objective.

        Args:
            user_id: User identifier
            objective_id: Learning objective identifier

        Returns:
            FeatureVector with all 15 normalized features
        """
        # Fetch required data
        objective = await self._get_objective(objective_id)
        user_profile = await self._get_user_learning_profile(user_id)
        behavioral_patterns = await self._get_behavioral_patterns(user_id)

        # Extract features by category
        performance_features = await self._extract_performance_features(
            user_id, objective
        )
        prerequisite_features = await self._extract_prerequisite_features(
            user_id, objective
        )
        complexity_features = await self._extract_complexity_features(
            user_id, objective, user_profile
        )
        behavioral_features = await self._extract_behavioral_features(
            user_id, objective, behavioral_patterns, user_profile
        )
        contextual_features = await self._extract_contextual_features(
            user_id, objective
        )

        # Calculate data quality score
        data_quality = self._calculate_data_quality(
            performance_features,
            prerequisite_features,
            complexity_features,
            behavioral_features,
            contextual_features,
        )

        # Construct feature vector
        return FeatureVector(
            # Performance
            retention_score=performance_features['retention_score'],
            retention_decline_rate=performance_features['retention_decline_rate'],
            review_lapse_rate=performance_features['review_lapse_rate'],
            session_performance_score=performance_features['session_performance_score'],
            validation_score=performance_features['validation_score'],
            # Prerequisites
            prerequisite_gap_count=prerequisite_features['gap_count'],
            prerequisite_mastery_gap=prerequisite_features['mastery_gap'],
            # Complexity
            content_complexity=complexity_features['content_complexity'],
            complexity_mismatch=complexity_features['complexity_mismatch'],
            # Behavioral
            historical_struggle_score=behavioral_features['historical_struggle_score'],
            content_type_mismatch=behavioral_features['content_type_mismatch'],
            cognitive_load_indicator=behavioral_features['cognitive_load'],
            # Contextual
            days_until_exam=contextual_features['days_until_exam'],
            days_since_last_study=contextual_features['days_since_last_study'],
            workload_level=contextual_features['workload_level'],
            # Metadata
            extracted_at=datetime.utcnow(),
            data_quality=data_quality,
        )

    async def extract_features_for_topic(
        self,
        user_id: str,
        topic_id: str
    ) -> FeatureVector:
        """
        Extract features for a topic (aggregated across objectives).

        Args:
            user_id: User identifier
            topic_id: Topic/subject area identifier

        Returns:
            FeatureVector with aggregated features for the topic
        """
        # Get all objectives in topic
        objectives = await self._get_objectives_for_topic(topic_id)

        if not objectives:
            # Return default features if no objectives
            return self._create_default_feature_vector()

        # Extract features for each objective and aggregate
        feature_vectors = []
        for obj in objectives:
            features = await self.extract_features_for_objective(user_id, obj['id'])
            feature_vectors.append(features.to_array())

        # Aggregate (mean) across objectives
        aggregated = np.mean(feature_vectors, axis=0)

        # Create feature vector from aggregated values
        feature_dict = dict(zip(FeatureVector.feature_names(), aggregated))

        return FeatureVector(
            **feature_dict,
            extracted_at=datetime.utcnow(),
            data_quality=np.mean([fv.data_quality for fv in
                                  [self._deserialize_feature_vector(fv)
                                   for fv in feature_vectors]])
        )

    def calculate_feature_importance(
        self,
        training_data: List[Tuple[FeatureVector, bool]]
    ) -> Dict[str, float]:
        """
        Calculate feature importance scores from training data.

        Uses correlation-based importance for interpretability.

        Args:
            training_data: List of (feature_vector, struggled) tuples

        Returns:
            Dictionary mapping feature names to importance scores (0-1)
        """
        if not training_data:
            # Return equal weights if no data
            return {name: 1.0 / 15 for name in FeatureVector.feature_names()}

        # Convert to numpy arrays
        X = np.array([fv.to_array() for fv, _ in training_data])
        y = np.array([struggled for _, struggled in training_data], dtype=float)

        # Calculate correlation-based importance
        feature_names = FeatureVector.feature_names()
        importance_scores = {}

        for i, feature_name in enumerate(feature_names):
            # Pearson correlation between feature and outcome
            correlation = np.corrcoef(X[:, i], y)[0, 1]
            # Absolute correlation as importance (0-1 scale)
            importance_scores[feature_name] = abs(correlation)

        # Normalize to sum to 1.0
        total_importance = sum(importance_scores.values())
        if total_importance > 0:
            importance_scores = {
                k: v / total_importance
                for k, v in importance_scores.items()
            }

        return importance_scores

    # ==================== FEATURE EXTRACTION METHODS ====================

    async def _extract_performance_features(
        self,
        user_id: str,
        objective: Dict[str, Any]
    ) -> Dict[str, float]:
        """Extract performance-based features (retention, reviews, validation)."""
        # Get topic area for objective
        topic_area = await self._get_topic_area(objective['id'])

        # Retention metrics (last 30 days)
        retention_data = await self._get_retention_data(
            user_id, topic_area, days=30
        )
        retention_score = self._calculate_average_retention(retention_data)
        retention_decline_rate = self._calculate_decline_rate(retention_data)

        # Review history
        review_history = await self._get_review_history(user_id, objective['id'])
        review_lapse_rate = self._calculate_lapse_rate(review_history)

        # Session performance
        session_performance = await self._get_recent_session_performance(
            user_id, topic_area
        )

        # Validation scores
        validation_score = await self._get_validation_prompt_average(
            user_id, objective['id']
        )

        return {
            'retention_score': retention_score,
            'retention_decline_rate': retention_decline_rate,
            'review_lapse_rate': review_lapse_rate,
            'session_performance_score': session_performance,
            'validation_score': validation_score,
        }

    async def _extract_prerequisite_features(
        self,
        user_id: str,
        objective: Dict[str, Any]
    ) -> Dict[str, float]:
        """Extract prerequisite-related features."""
        # Get prerequisites
        prerequisites = await self._get_prerequisites(objective['id'])

        if not prerequisites:
            # No prerequisites = no gap
            return {'gap_count': 0.0, 'mastery_gap': 0.0}

        # Get mastery levels for prerequisites
        mastery_levels = []
        for prereq in prerequisites:
            mastery = await self._get_mastery_level(user_id, prereq['id'])
            mastery_levels.append(mastery)

        # Calculate gap metrics
        threshold = 0.7  # 70% mastery threshold
        gap_count = sum(1 for m in mastery_levels if m < threshold) / len(mastery_levels)
        mastery_gap = 1.0 - np.mean(mastery_levels)

        return {
            'gap_count': gap_count,
            'mastery_gap': max(0.0, mastery_gap),  # Clamp to [0, 1]
        }

    async def _extract_complexity_features(
        self,
        user_id: str,
        objective: Dict[str, Any],
        user_profile: Optional[Dict[str, Any]]
    ) -> Dict[str, float]:
        """Extract content complexity features."""
        # Content complexity (BASIC=0.3, INTERMEDIATE=0.6, ADVANCED=0.9)
        complexity_map = {'BASIC': 0.3, 'INTERMEDIATE': 0.6, 'ADVANCED': 0.9}
        content_complexity = complexity_map.get(
            objective.get('complexity', 'INTERMEDIATE'),
            0.6
        )

        # User ability level
        topic_area = await self._get_topic_area(objective['id'])
        user_ability = await self._get_user_ability_level(user_id, topic_area)

        # Complexity mismatch (how much harder is content than user's level)
        complexity_mismatch = max(0.0, content_complexity - user_ability)

        return {
            'content_complexity': content_complexity,
            'complexity_mismatch': complexity_mismatch,
        }

    async def _extract_behavioral_features(
        self,
        user_id: str,
        objective: Dict[str, Any],
        behavioral_patterns: List[Dict[str, Any]],
        user_profile: Optional[Dict[str, Any]]
    ) -> Dict[str, float]:
        """Extract behavioral pattern features."""
        topic_area = await self._get_topic_area(objective['id'])

        # Historical struggles
        historical_struggle_score = self._calculate_historical_struggle_score(
            behavioral_patterns, topic_area
        )

        # Content type mismatch
        content_type = self._infer_content_type(objective)
        preferred_type = self._get_preferred_content_type(user_profile)
        content_type_mismatch = 0.6 if content_type != preferred_type else 0.0

        # Cognitive load
        cognitive_load = await self._get_cognitive_load_indicator(user_id)

        return {
            'historical_struggle_score': historical_struggle_score,
            'content_type_mismatch': content_type_mismatch,
            'cognitive_load': cognitive_load,
        }

    async def _extract_contextual_features(
        self,
        user_id: str,
        objective: Dict[str, Any]
    ) -> Dict[str, float]:
        """Extract contextual temporal/workload features."""
        topic_area = await self._get_topic_area(objective['id'])

        # Days until exam (normalized to 0-1, 90 days max)
        next_exam = await self._get_next_exam_for_topic(user_id, topic_area)
        if next_exam:
            days = (next_exam['date'] - datetime.utcnow()).days
            days_until_exam = 1.0 - min(1.0, max(0.0, days / 90.0))
        else:
            days_until_exam = 0.5  # Neutral if no exam scheduled

        # Days since last study (normalized to 0-1, 30 days max)
        last_study = await self._get_last_study_session(user_id, topic_area)
        if last_study:
            days = (datetime.utcnow() - last_study['date']).days
            days_since_last_study = min(1.0, days / 30.0)
        else:
            days_since_last_study = 0.5  # Neutral if never studied

        # Workload level (normalized to 0-1, 50 objectives = max)
        pending_count = await self._get_pending_objectives_count(user_id)
        workload_level = min(1.0, pending_count / 50.0)

        return {
            'days_until_exam': days_until_exam,
            'days_since_last_study': days_since_last_study,
            'workload_level': workload_level,
        }

    # ==================== HELPER METHODS ====================

    def _calculate_average_retention(
        self,
        retention_data: List[Dict[str, Any]]
    ) -> float:
        """Calculate average retention score from time-series data."""
        if not retention_data:
            return 0.5  # Neutral default

        scores = [d['retentionScore'] for d in retention_data]
        return float(np.mean(scores))

    def _calculate_decline_rate(
        self,
        retention_data: List[Dict[str, Any]]
    ) -> float:
        """Calculate retention decline rate (linear regression slope)."""
        if len(retention_data) < 2:
            return 0.0  # No decline if insufficient data

        # Sort by date
        retention_data = sorted(retention_data, key=lambda x: x['date'])

        # Extract scores
        scores = np.array([d['retentionScore'] for d in retention_data])

        # Calculate linear trend (simple slope)
        x = np.arange(len(scores))
        slope = np.polyfit(x, scores, 1)[0]

        # Normalize to 0-1 (decline = negative slope, clamped)
        decline_rate = max(0.0, -slope)
        return min(1.0, decline_rate * 10)  # Scale for interpretability

    def _calculate_lapse_rate(
        self,
        review_history: List[Dict[str, Any]]
    ) -> float:
        """Calculate frequency of AGAIN ratings (lapses)."""
        if not review_history:
            return 0.5  # Neutral default

        lapse_count = sum(1 for r in review_history if r['rating'] == 'AGAIN')
        return lapse_count / len(review_history)

    def _calculate_historical_struggle_score(
        self,
        behavioral_patterns: List[Dict[str, Any]],
        topic_area: str
    ) -> float:
        """Calculate historical struggle score from behavioral patterns."""
        struggle_patterns = [
            p for p in behavioral_patterns
            if p['patternType'] == 'STRUGGLE_TOPIC' and
               p.get('patternData', {}).get('topicArea') == topic_area
        ]

        if not struggle_patterns:
            return 0.0

        # Average confidence across struggle patterns
        confidences = [p['confidence'] for p in struggle_patterns]
        return float(np.mean(confidences))

    def _infer_content_type(self, objective: Dict[str, Any]) -> str:
        """Infer content type from objective metadata."""
        # Simple heuristic: check objective text for keywords
        objective_text = objective.get('objective', '').lower()

        if any(word in objective_text for word in ['diagram', 'image', 'visual', 'anatomy']):
            return 'visual'
        elif any(word in objective_text for word in ['case', 'patient', 'clinical']):
            return 'clinical'
        else:
            return 'text'

    def _get_preferred_content_type(
        self,
        user_profile: Optional[Dict[str, Any]]
    ) -> str:
        """Get preferred content type from learning style profile."""
        if not user_profile:
            return 'text'  # Default

        learning_style = user_profile.get('learningStyleProfile', {})

        # VARK model: visual, auditory, kinesthetic, reading
        max_score = 0
        preferred = 'text'

        if learning_style.get('visual', 0) > max_score:
            max_score = learning_style['visual']
            preferred = 'visual'
        if learning_style.get('kinesthetic', 0) > max_score:
            preferred = 'clinical'

        return preferred

    def _calculate_data_quality(self, *feature_dicts) -> float:
        """
        Calculate data quality score based on feature availability.

        Returns value 0-1 indicating what proportion of features have
        real data vs. default values.
        """
        total_features = 0
        real_features = 0

        for feature_dict in feature_dicts:
            for value in feature_dict.values():
                total_features += 1
                # Consider non-default if not exactly 0.5 (our neutral default)
                if abs(value - 0.5) > 0.01:
                    real_features += 1

        return real_features / total_features if total_features > 0 else 0.0

    def _create_default_feature_vector(self) -> FeatureVector:
        """Create feature vector with all default (neutral) values."""
        return FeatureVector(
            retention_score=0.5,
            retention_decline_rate=0.0,
            review_lapse_rate=0.5,
            session_performance_score=0.5,
            validation_score=0.5,
            prerequisite_gap_count=0.0,
            prerequisite_mastery_gap=0.0,
            content_complexity=0.6,
            complexity_mismatch=0.0,
            historical_struggle_score=0.0,
            content_type_mismatch=0.0,
            cognitive_load_indicator=0.5,
            days_until_exam=0.5,
            days_since_last_study=0.5,
            workload_level=0.5,
            extracted_at=datetime.utcnow(),
            data_quality=0.0,
        )

    # ==================== DATABASE ACCESS METHODS ====================
    # These would be implemented to query actual Prisma database

    async def _get_objective(self, objective_id: str) -> Dict[str, Any]:
        """Fetch learning objective from database."""
        # TODO: Implement Prisma query
        raise NotImplementedError("Database integration pending")

    async def _get_user_learning_profile(
        self,
        user_id: str
    ) -> Optional[Dict[str, Any]]:
        """Fetch user learning profile with L1 caching."""
        cache_key = f"profile:{user_id}"

        if self.cache_enabled:
            cached = self._get_from_cache(cache_key, self.TTL_PROFILE)
            if cached is not None:
                return cached

        # TODO: Implement Prisma query
        # profile = await self.db.userLearningProfile.findUnique(...)
        # self._set_cache(cache_key, profile)
        # return profile
        raise NotImplementedError("Database integration pending")

    async def _get_behavioral_patterns(
        self,
        user_id: str
    ) -> List[Dict[str, Any]]:
        """Fetch behavioral patterns with L2 caching."""
        cache_key = f"patterns:{user_id}"

        if self.cache_enabled:
            cached = self._get_from_cache(cache_key, self.TTL_PATTERNS)
            if cached is not None:
                return cached

        # TODO: Implement Prisma query
        # patterns = await self.db.behavioralPattern.findMany(...)
        # self._set_cache(cache_key, patterns)
        # return patterns
        raise NotImplementedError("Database integration pending")

    async def _get_retention_data(
        self,
        user_id: str,
        topic_area: str,
        days: int
    ) -> List[Dict[str, Any]]:
        """Fetch retention time-series data."""
        # TODO: Implement Prisma query
        raise NotImplementedError("Database integration pending")

    async def _get_review_history(
        self,
        user_id: str,
        objective_id: str
    ) -> List[Dict[str, Any]]:
        """Fetch review history for objective."""
        # TODO: Implement Prisma query
        raise NotImplementedError("Database integration pending")

    async def _get_recent_session_performance(
        self,
        user_id: str,
        topic_area: str
    ) -> float:
        """Get recent session performance score."""
        # TODO: Implement Prisma query
        return 0.5  # Placeholder

    async def _get_validation_prompt_average(
        self,
        user_id: str,
        objective_id: str
    ) -> float:
        """Get average validation prompt score."""
        # TODO: Implement Prisma query
        return 0.5  # Placeholder

    async def _get_prerequisites(
        self,
        objective_id: str
    ) -> List[Dict[str, Any]]:
        """Get prerequisites for objective."""
        # TODO: Implement Prisma query
        raise NotImplementedError("Database integration pending")

    async def _get_mastery_level(
        self,
        user_id: str,
        objective_id: str
    ) -> float:
        """Get mastery level (0-1) for objective."""
        # TODO: Implement Prisma query based on masteryLevel enum
        return 0.5  # Placeholder

    async def _get_topic_area(self, objective_id: str) -> str:
        """Get topic area for objective."""
        # TODO: Implement Prisma query
        return "unknown"  # Placeholder

    async def _get_user_ability_level(
        self,
        user_id: str,
        topic_area: str
    ) -> float:
        """Calculate user's ability level in topic area."""
        # TODO: Aggregate mastery across objectives in topic
        return 0.6  # Placeholder

    async def _get_cognitive_load_indicator(self, user_id: str) -> float:
        """Get current cognitive load indicator."""
        # TODO: Calculate from recent session patterns
        return 0.5  # Placeholder

    async def _get_next_exam_for_topic(
        self,
        user_id: str,
        topic_area: str
    ) -> Optional[Dict[str, Any]]:
        """Get next scheduled exam for topic."""
        # TODO: Implement Prisma query
        return None  # Placeholder

    async def _get_last_study_session(
        self,
        user_id: str,
        topic_area: str
    ) -> Optional[Dict[str, Any]]:
        """Get last study session for topic."""
        # TODO: Implement Prisma query
        return None  # Placeholder

    async def _get_pending_objectives_count(self, user_id: str) -> int:
        """Get count of pending objectives."""
        # TODO: Implement Prisma query
        return 0  # Placeholder

    async def _get_objectives_for_topic(
        self,
        topic_id: str
    ) -> List[Dict[str, Any]]:
        """Get all objectives for a topic."""
        # TODO: Implement Prisma query
        raise NotImplementedError("Database integration pending")

    # ==================== CACHE METHODS ====================

    def _get_from_cache(
        self,
        key: str,
        ttl: timedelta
    ) -> Optional[Any]:
        """Get value from cache if not expired."""
        if key not in self._cache:
            return None

        value, timestamp = self._cache[key]
        if datetime.utcnow() - timestamp > ttl:
            # Expired
            del self._cache[key]
            return None

        return value

    def _set_cache(self, key: str, value: Any) -> None:
        """Set cache value with current timestamp."""
        self._cache[key] = (value, datetime.utcnow())

    def clear_cache(self) -> None:
        """Clear all cached data."""
        self._cache.clear()
