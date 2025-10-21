"""
Cognitive Load Analyzer - ML-based cognitive load assessment
Story 5.3 Task 5: Study intensity modulation based on cognitive load

Uses ensemble ML models to estimate cognitive load from behavioral indicators,
performance metrics, and physiological proxies.

Research-grade implementation following cognitive load theory (Sweller, 1988).
"""

from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
from scipy.stats import zscore
import logging

logger = logging.getLogger(__name__)


@dataclass
class CognitiveLoadAssessment:
    """Cognitive load assessment result with confidence"""

    load_score: float  # 0-100
    load_level: str  # LOW, MEDIUM, HIGH
    confidence: float  # 0.0-1.0
    contributing_factors: List[Dict[str, any]]
    recommendation: str
    trend: Optional[List[float]] = None  # 7-day trend


@dataclass
class StressIndicator:
    """Individual stress/fatigue indicator"""

    type: str  # performance_decline, pause_frequency, abandonment, response_time
    severity: str  # LOW, MEDIUM, HIGH
    value: float
    threshold: float
    description: str


class CognitiveLoadAnalyzer:
    """
    ML-powered cognitive load assessment engine

    Cognitive Load Components (per Sweller, 1988):
    1. Intrinsic Load: Task complexity
    2. Extraneous Load: Presentation/interface factors
    3. Germane Load: Schema construction effort

    Proxy Indicators:
    - Study volume (hours last 7 days vs baseline)
    - Performance trend (accuracy decline)
    - Validation scores (comprehension depth)
    - Behavioral stress signals (pauses, abandonment, response times)

    Model: Gradient Boosting Regressor for load score prediction
    Classification: Random Forest for LOW/MEDIUM/HIGH categorization
    """

    def __init__(self):
        self.load_regressor = GradientBoostingRegressor(
            n_estimators=100,
            max_depth=5,
            learning_rate=0.1,
            subsample=0.8,
            random_state=42,
        )

        self.load_classifier = RandomForestClassifier(
            n_estimators=100,
            max_depth=8,
            min_samples_split=5,
            random_state=42,
            n_jobs=-1,
        )

        self.scaler = StandardScaler()
        self.is_trained = False

        # Feature names for interpretability
        self.feature_names = [
            "study_volume_ratio",  # Recent hours / baseline hours
            "performance_trend_7d",  # Performance change last 7 days
            "avg_performance_last_5",  # Recent performance average
            "validation_score_avg",  # Comprehension depth
            "session_abandonment_rate",  # % abandoned sessions
            "pause_frequency",  # Pauses per hour
            "avg_response_time_ratio",  # Recent / baseline response time
            "consecutive_study_days",  # Days studied without rest
            "session_completion_rate",  # % completed sessions
            "error_rate_trend",  # Error rate change
        ]

        # Thresholds for stress indicators (research-based)
        self.thresholds = {
            "performance_decline": 15.0,  # % drop triggers concern
            "abandonment_rate": 0.25,  # 25% abandonment is high
            "pause_frequency": 10.0,  # Pauses per hour
            "response_time_increase": 1.5,  # 50% slower response time
            "validation_score_low": 60.0,  # Below 60% comprehension
            "consecutive_days_high": 7,  # 7+ days without rest
        }

    async def assess_cognitive_load(
        self,
        user_id: str,
        recent_sessions: pd.DataFrame,
        validation_scores: List[float],
        behavioral_events: pd.DataFrame,
        baseline_metrics: Dict[str, float],
    ) -> CognitiveLoadAssessment:
        """
        Assess current cognitive load for a user

        Args:
            user_id: User identifier
            recent_sessions: Last 7 days of study sessions
            validation_scores: Recent validation prompt scores (0-100)
            behavioral_events: Behavioral events (pauses, abandonments, etc.)
            baseline_metrics: User's baseline metrics for comparison

        Returns:
            CognitiveLoadAssessment with load score, level, and recommendations
        """

        # 1. Extract features
        features = self._extract_features(
            recent_sessions, validation_scores, behavioral_events, baseline_metrics
        )

        # 2. Calculate raw load score (0-100)
        if self.is_trained:
            load_score = self._predict_load_score(features)
        else:
            load_score = self._calculate_heuristic_load(features)

        # 3. Classify load level
        load_level = self._classify_load_level(load_score)

        # 4. Calculate confidence
        confidence = self._calculate_confidence(features, recent_sessions)

        # 5. Identify contributing factors
        contributing_factors = self._identify_contributing_factors(features)

        # 6. Generate recommendation
        recommendation = self._generate_recommendation(load_score, load_level, contributing_factors)

        # 7. Calculate 7-day trend (optional)
        trend = self._calculate_load_trend(recent_sessions, validation_scores, behavioral_events, baseline_metrics)

        return CognitiveLoadAssessment(
            load_score=round(load_score, 1),
            load_level=load_level,
            confidence=round(confidence, 3),
            contributing_factors=contributing_factors,
            recommendation=recommendation,
            trend=trend,
        )

    def _extract_features(
        self,
        recent_sessions: pd.DataFrame,
        validation_scores: List[float],
        behavioral_events: pd.DataFrame,
        baseline_metrics: Dict[str, float],
    ) -> np.ndarray:
        """
        Extract cognitive load features from behavioral data

        Feature Engineering:
        1. Study Volume Ratio: Recent hours / Baseline hours
        2. Performance Trend: Slope of performance over last 7 days
        3. Recent Performance: Average of last 5 sessions
        4. Validation Score: Average comprehension score
        5. Abandonment Rate: % of sessions abandoned
        6. Pause Frequency: Pauses per hour of study
        7. Response Time Ratio: Recent / Baseline response time
        8. Consecutive Study Days: Days without rest
        9. Session Completion Rate: % of sessions completed
        10. Error Rate Trend: Slope of error rate
        """

        features = []

        # 1. Study Volume Ratio
        if not recent_sessions.empty:
            recent_hours = recent_sessions["duration_ms"].sum() / (1000 * 60 * 60)
            baseline_hours = baseline_metrics.get("baseline_weekly_hours", 10.0)
            study_volume_ratio = recent_hours / baseline_hours if baseline_hours > 0 else 1.0
        else:
            study_volume_ratio = 0.0
        features.append(study_volume_ratio)

        # 2. Performance Trend (7-day slope)
        if not recent_sessions.empty and len(recent_sessions) >= 3:
            # Linear regression slope
            days = (recent_sessions["started_at"] - recent_sessions["started_at"].min()).dt.days.values
            performance = recent_sessions["performance_score"].values
            slope = np.polyfit(days, performance, 1)[0] if len(days) > 1 else 0.0
            performance_trend = float(slope)
        else:
            performance_trend = 0.0
        features.append(performance_trend)

        # 3. Recent Performance Average
        if not recent_sessions.empty:
            avg_performance_last_5 = recent_sessions["performance_score"].tail(5).mean()
        else:
            avg_performance_last_5 = 75.0
        features.append(avg_performance_last_5)

        # 4. Validation Score Average
        validation_score_avg = np.mean(validation_scores) if validation_scores else 75.0
        features.append(validation_score_avg)

        # 5. Session Abandonment Rate
        if not recent_sessions.empty:
            abandoned = recent_sessions["completed_at"].isna().sum()
            abandonment_rate = abandoned / len(recent_sessions)
        else:
            abandonment_rate = 0.0
        features.append(abandonment_rate)

        # 6. Pause Frequency
        if not behavioral_events.empty:
            pause_events = behavioral_events[behavioral_events["event_type"] == "SESSION_PAUSED"]
            total_hours = recent_sessions["duration_ms"].sum() / (1000 * 60 * 60) if not recent_sessions.empty else 1.0
            pause_frequency = len(pause_events) / total_hours if total_hours > 0 else 0.0
        else:
            pause_frequency = 0.0
        features.append(pause_frequency)

        # 7. Response Time Ratio
        if not behavioral_events.empty:
            review_events = behavioral_events[behavioral_events["event_type"] == "CARD_REVIEWED"]
            if len(review_events) > 0:
                recent_response_time = review_events["event_data"].apply(
                    lambda x: x.get("timeSpentMs", 5000) if isinstance(x, dict) else 5000
                ).mean()
                baseline_response_time = baseline_metrics.get("baseline_response_time_ms", 5000)
                response_time_ratio = recent_response_time / baseline_response_time if baseline_response_time > 0 else 1.0
            else:
                response_time_ratio = 1.0
        else:
            response_time_ratio = 1.0
        features.append(response_time_ratio)

        # 8. Consecutive Study Days
        if not recent_sessions.empty:
            session_dates = recent_sessions["started_at"].dt.date.unique()
            session_dates_sorted = sorted(session_dates, reverse=True)
            consecutive_days = 1
            for i in range(len(session_dates_sorted) - 1):
                if (session_dates_sorted[i] - session_dates_sorted[i + 1]).days == 1:
                    consecutive_days += 1
                else:
                    break
        else:
            consecutive_days = 0
        features.append(consecutive_days)

        # 9. Session Completion Rate
        if not recent_sessions.empty:
            completed = recent_sessions["completed_at"].notna().sum()
            completion_rate = completed / len(recent_sessions)
        else:
            completion_rate = 1.0
        features.append(completion_rate)

        # 10. Error Rate Trend
        if not recent_sessions.empty and len(recent_sessions) >= 3:
            # Calculate error rate per session (100 - performance_score)
            error_rates = 100 - recent_sessions["performance_score"].values
            days = (recent_sessions["started_at"] - recent_sessions["started_at"].min()).dt.days.values
            error_rate_slope = np.polyfit(days, error_rates, 1)[0] if len(days) > 1 else 0.0
        else:
            error_rate_slope = 0.0
        features.append(error_rate_slope)

        return np.array(features)

    def _predict_load_score(self, features: np.ndarray) -> float:
        """Predict cognitive load score using trained model"""

        features_scaled = self.scaler.transform(features.reshape(1, -1))
        load_score = self.load_regressor.predict(features_scaled)[0]

        return float(np.clip(load_score, 0, 100))

    def _calculate_heuristic_load(self, features: np.ndarray) -> float:
        """
        Calculate heuristic cognitive load when model not trained

        Weighted scoring based on cognitive load theory:
        - Study Volume: 30% weight
        - Performance Decline: 25% weight
        - Stress Indicators: 25% weight
        - Validation Comprehension: 20% weight
        """

        (
            study_volume_ratio,
            performance_trend,
            avg_performance_last_5,
            validation_score_avg,
            abandonment_rate,
            pause_frequency,
            response_time_ratio,
            consecutive_days,
            completion_rate,
            error_rate_trend,
        ) = features

        # Volume load (>1.0 ratio means studying more than baseline)
        volume_load = min(100, (study_volume_ratio - 0.7) / 1.0 * 100) if study_volume_ratio > 0.7 else 0
        volume_load = max(0, volume_load)

        # Performance load (declining performance = high load)
        performance_load = 100 - avg_performance_last_5

        # Stress indicators load
        stress_load = (
            abandonment_rate * 100 * 0.4
            + (pause_frequency / 15) * 100 * 0.3
            + ((response_time_ratio - 1.0) / 0.5) * 100 * 0.3
        )
        stress_load = np.clip(stress_load, 0, 100)

        # Comprehension load (low validation scores = high cognitive load)
        comprehension_load = 100 - validation_score_avg

        # Weighted total
        total_load = (
            volume_load * 0.30
            + performance_load * 0.25
            + stress_load * 0.25
            + comprehension_load * 0.20
        )

        return float(np.clip(total_load, 0, 100))

    def _classify_load_level(self, load_score: float) -> str:
        """Classify cognitive load into LOW/MEDIUM/HIGH"""

        if load_score < 30:
            return "LOW"
        elif load_score < 70:
            return "MEDIUM"
        else:
            return "HIGH"

    def _calculate_confidence(
        self, features: np.ndarray, recent_sessions: pd.DataFrame
    ) -> float:
        """
        Calculate confidence in cognitive load assessment

        Factors:
        1. Data quantity: More sessions = higher confidence
        2. Data quality: Complete sessions boost confidence
        3. Recent data: Sessions within 7 days boost confidence
        """

        # Base confidence from sample size
        sample_size = len(recent_sessions) if not recent_sessions.empty else 0
        base_confidence = min(1.0, sample_size / 10)

        # Completion quality boost
        if not recent_sessions.empty:
            completion_rate = recent_sessions["completed_at"].notna().mean()
            quality_boost = completion_rate * 0.2
        else:
            quality_boost = 0.0

        # Recency boost
        if not recent_sessions.empty:
            recent_count = len(recent_sessions[
                recent_sessions["started_at"] >= (datetime.now() - timedelta(days=3))
            ])
            recency_boost = min(0.2, recent_count / 5)
        else:
            recency_boost = 0.0

        confidence = base_confidence + quality_boost + recency_boost

        return float(np.clip(confidence, 0.0, 1.0))

    def _identify_contributing_factors(
        self, features: np.ndarray
    ) -> List[Dict[str, any]]:
        """
        Identify top contributing factors to cognitive load

        Returns factors sorted by impact (highest first)
        """

        (
            study_volume_ratio,
            performance_trend,
            avg_performance_last_5,
            validation_score_avg,
            abandonment_rate,
            pause_frequency,
            response_time_ratio,
            consecutive_days,
            completion_rate,
            error_rate_trend,
        ) = features

        factors = []

        # High study volume
        if study_volume_ratio > 1.2:
            factors.append({
                "factor": "High Study Volume",
                "impact": min(100, (study_volume_ratio - 1.0) * 100),
                "description": f"Studying {study_volume_ratio:.1f}x your baseline (potential overload)",
                "severity": "HIGH" if study_volume_ratio > 1.5 else "MEDIUM",
            })

        # Performance decline
        if avg_performance_last_5 < 70:
            factors.append({
                "factor": "Performance Decline",
                "impact": 100 - avg_performance_last_5,
                "description": f"Recent performance at {avg_performance_last_5:.0f}% (below optimal)",
                "severity": "HIGH" if avg_performance_last_5 < 60 else "MEDIUM",
            })

        # High abandonment rate
        if abandonment_rate > self.thresholds["abandonment_rate"]:
            factors.append({
                "factor": "Frequent Session Abandonment",
                "impact": abandonment_rate * 100,
                "description": f"{abandonment_rate * 100:.0f}% of sessions abandoned (fatigue signal)",
                "severity": "HIGH" if abandonment_rate > 0.4 else "MEDIUM",
            })

        # Frequent pauses
        if pause_frequency > self.thresholds["pause_frequency"]:
            factors.append({
                "factor": "Frequent Pauses",
                "impact": min(100, pause_frequency / 0.15),
                "description": f"{pause_frequency:.1f} pauses per hour (attention fatigue)",
                "severity": "MEDIUM",
            })

        # Slow response times
        if response_time_ratio > self.thresholds["response_time_increase"]:
            factors.append({
                "factor": "Increased Response Times",
                "impact": (response_time_ratio - 1.0) * 100,
                "description": f"Response times {response_time_ratio:.1f}x baseline (cognitive slowdown)",
                "severity": "MEDIUM",
            })

        # Consecutive study days without rest
        if consecutive_days >= self.thresholds["consecutive_days_high"]:
            factors.append({
                "factor": "No Rest Days",
                "impact": min(100, consecutive_days / 10 * 100),
                "description": f"{consecutive_days} consecutive study days without rest",
                "severity": "HIGH" if consecutive_days > 10 else "MEDIUM",
            })

        # Low validation scores
        if validation_score_avg < self.thresholds["validation_score_low"]:
            factors.append({
                "factor": "Low Comprehension Depth",
                "impact": 100 - validation_score_avg,
                "description": f"Validation scores at {validation_score_avg:.0f}% (comprehension struggling)",
                "severity": "HIGH" if validation_score_avg < 50 else "MEDIUM",
            })

        # Sort by impact (highest first)
        factors.sort(key=lambda f: f["impact"], reverse=True)

        return factors[:5]  # Top 5 factors

    def _generate_recommendation(
        self, load_score: float, load_level: str, contributing_factors: List[Dict]
    ) -> str:
        """Generate actionable recommendation based on cognitive load"""

        if load_level == "LOW":
            return "Your cognitive load is manageable. You can handle standard intensity sessions."

        elif load_level == "MEDIUM":
            # Check top contributing factor
            if contributing_factors and contributing_factors[0]["factor"] == "High Study Volume":
                return "Your study volume is elevated. Consider taking shorter sessions with more breaks."
            elif contributing_factors and "Performance" in contributing_factors[0]["factor"]:
                return "Your performance is declining. Consider reviewing easier material or taking a rest day."
            else:
                return "Your cognitive load is moderate. Consider balanced sessions with regular breaks."

        else:  # HIGH
            # Check for burnout risk
            burnout_indicators = [
                f for f in contributing_factors
                if f.get("severity") == "HIGH"
            ]

            if len(burnout_indicators) >= 2:
                return "⚠️ High burnout risk detected. Strongly recommend taking a rest day or light review session."
            elif any(f["factor"] == "No Rest Days" for f in contributing_factors):
                return "You've been studying continuously without rest. Take a rest day to recover cognitive capacity."
            else:
                return "Your cognitive load is high. Reduce session duration by 40% and focus on review only."

    def _calculate_load_trend(
        self,
        recent_sessions: pd.DataFrame,
        validation_scores: List[float],
        behavioral_events: pd.DataFrame,
        baseline_metrics: Dict[str, float],
    ) -> List[float]:
        """
        Calculate 7-day cognitive load trend

        Returns array of 7 load scores (most recent last)
        """

        if recent_sessions.empty:
            return []

        # Group sessions by day
        recent_sessions["date"] = recent_sessions["started_at"].dt.date
        daily_sessions = recent_sessions.groupby("date")

        trend = []

        # Calculate load for each of last 7 days
        for date in pd.date_range(end=datetime.now().date(), periods=7).date:
            day_sessions = recent_sessions[recent_sessions["date"] == date]

            if not day_sessions.empty:
                # Extract features for this day
                day_features = self._extract_features(
                    day_sessions, validation_scores, behavioral_events, baseline_metrics
                )
                day_load = self._calculate_heuristic_load(day_features)
            else:
                day_load = 0.0  # No study on this day

            trend.append(round(day_load, 1))

        return trend

    def detect_burnout_risk(
        self, assessment: CognitiveLoadAssessment
    ) -> Tuple[bool, str, List[str]]:
        """
        Detect burnout risk from cognitive load assessment

        Returns:
            (is_at_risk, risk_level, warning_signals)
        """

        # Check for burnout indicators
        high_load = assessment.load_score > 70
        high_factors = [
            f for f in assessment.contributing_factors
            if f.get("severity") == "HIGH"
        ]

        no_rest_detected = any(
            f["factor"] == "No Rest Days" for f in assessment.contributing_factors
        )

        performance_decline = any(
            "Performance" in f["factor"] for f in assessment.contributing_factors
        )

        # Trend analysis (if available)
        sustained_high_load = False
        if assessment.trend and len(assessment.trend) >= 5:
            # Check if load > 60 for last 5 days
            sustained_high_load = all(load > 60 for load in assessment.trend[-5:])

        # Determine risk
        is_at_risk = False
        risk_level = "LOW"
        warning_signals = []

        if sustained_high_load and len(high_factors) >= 2:
            is_at_risk = True
            risk_level = "CRITICAL"
            warning_signals.append("Sustained high cognitive load for 5+ days")
            warning_signals.append(f"{len(high_factors)} high-severity stress indicators")
        elif (high_load and no_rest_detected) or (sustained_high_load):
            is_at_risk = True
            risk_level = "HIGH"
            warning_signals.append("High cognitive load with no rest days")
        elif high_load and performance_decline:
            is_at_risk = True
            risk_level = "MEDIUM"
            warning_signals.append("High load coinciding with performance decline")

        # Add specific warning signals from factors
        for factor in high_factors:
            warning_signals.append(factor["description"])

        return is_at_risk, risk_level, warning_signals[:5]  # Top 5 warnings

    def train_model(
        self, training_sessions: pd.DataFrame, training_labels: np.ndarray
    ) -> Dict[str, float]:
        """
        Train cognitive load models on labeled data

        Args:
            training_sessions: Historical sessions with features
            training_labels: Ground truth cognitive load scores (0-100)

        Returns:
            Dictionary with training metrics (R², accuracy)
        """

        try:
            # Extract features
            X = training_sessions[self.feature_names].values
            y = training_labels

            # Scale features
            X_scaled = self.scaler.fit_transform(X)

            # Train regressor
            self.load_regressor.fit(X_scaled, y)

            # Train classifier (LOW/MEDIUM/HIGH)
            y_classes = np.where(y < 30, 0, np.where(y < 70, 1, 2))
            self.load_classifier.fit(X_scaled, y_classes)

            self.is_trained = True

            # Evaluate
            from sklearn.model_selection import cross_val_score
            from sklearn.metrics import r2_score, accuracy_score

            r2 = cross_val_score(self.load_regressor, X_scaled, y, cv=5, scoring="r2").mean()
            accuracy = cross_val_score(self.load_classifier, X_scaled, y_classes, cv=5, scoring="accuracy").mean()

            logger.info(f"Cognitive Load model trained - R²: {r2:.3f}, Accuracy: {accuracy:.3f}")

            return {
                "r2_score": float(r2),
                "classification_accuracy": float(accuracy),
            }

        except Exception as e:
            logger.error(f"Model training failed: {e}")
            return {"error": str(e)}
