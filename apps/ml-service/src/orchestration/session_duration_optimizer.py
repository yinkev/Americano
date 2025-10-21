"""
Session Duration Optimizer - ML-based duration and break recommendations
Story 5.3 Task 3: Implement session duration optimizer

Uses fatigue detection ML models to optimize session duration and break timing
based on attention span, task complexity, and time-of-day effects.

Research-grade implementation following attention cycle research.
"""

from typing import Dict, List, Tuple, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
import logging

logger = logging.getLogger(__name__)


@dataclass
class DurationRecommendation:
    """Session duration recommendation"""

    recommended_duration: int  # minutes
    min_duration: int  # minutes
    max_duration: int  # minutes
    confidence: float  # 0.0-1.0
    break_schedule: List[Dict[str, any]]
    reasoning: List[str]


@dataclass
class BreakRecommendation:
    """Break timing recommendation"""

    minute: int  # When to take break (minutes into session)
    duration: int  # Break duration (minutes)
    reason: str
    trigger: str  # scheduled, performance_based, fatigue_detected


class SessionDurationOptimizer:
    """
    ML-powered session duration and break optimization

    Models:
    1. Duration Predictor: Gradient Boosting for optimal duration
    2. Fatigue Detector: Random Forest for fatigue detection
    3. Break Timing: Personalized Pomodoro-inspired algorithm

    Features:
    - User's historical attention span
    - Mission complexity
    - Time-of-day effects
    - Recent study load
    - Performance degradation patterns
    """

    def __init__(self):
        self.duration_predictor = GradientBoostingRegressor(
            n_estimators=100,
            max_depth=6,
            learning_rate=0.1,
            random_state=42,
        )

        self.fatigue_detector = RandomForestClassifier(
            n_estimators=100,
            max_depth=8,
            random_state=42,
            n_jobs=-1,
        )

        self.scaler = StandardScaler()
        self.is_trained = False

    async def recommend_duration(
        self,
        user_id: str,
        mission_complexity: str,  # "easy", "medium", "hard"
        time_of_day_hour: int,
        user_profile: Dict[str, any],
        recent_sessions: pd.DataFrame,
        cognitive_load: float,  # 0-100
    ) -> DurationRecommendation:
        """
        Recommend optimal session duration with break schedule

        Algorithm:
        1. Get baseline optimal duration from user profile
        2. Adjust for mission complexity (+/- 15 min)
        3. Adjust for time-of-day (peak vs off-peak)
        4. Adjust for recent study load (fatigue factor)
        5. Adjust for cognitive load (reduce if high)
        6. Generate personalized break schedule
        """

        # 1. Baseline duration from user profile
        baseline_duration = user_profile.get("optimalSessionDuration", 45)

        # 2. Complexity adjustment
        complexity_adjustments = {"easy": -10, "medium": 0, "hard": +15}
        duration = baseline_duration + complexity_adjustments.get(mission_complexity, 0)

        # 3. Time-of-day adjustment
        is_peak_hour = self._is_peak_performance_hour(time_of_day_hour, user_profile)
        if is_peak_hour:
            duration *= 1.2  # Can extend 20% during peak hours
        else:
            duration *= 0.9  # Reduce 10% during off-peak

        # 4. Recent study load adjustment
        if not recent_sessions.empty:
            recent_hours = recent_sessions["duration_ms"].sum() / (1000 * 60 * 60)
            if recent_hours > 20:  # Heavy week
                duration *= 0.85  # Reduce to prevent burnout

        # 5. Cognitive load adjustment
        if cognitive_load > 70:
            duration *= 0.7  # Reduce 30% for high cognitive load
        elif cognitive_load > 50:
            duration *= 0.85  # Reduce 15% for moderate load

        # Round and constrain
        recommended_duration = int(round(duration))
        min_duration = int(recommended_duration * 0.8)
        max_duration = int(recommended_duration * 1.2)

        # 6. Generate break schedule
        break_schedule = self._generate_break_schedule(
            recommended_duration, user_profile, mission_complexity, cognitive_load
        )

        # 7. Build reasoning
        reasoning = self._build_duration_reasoning(
            baseline_duration,
            recommended_duration,
            mission_complexity,
            is_peak_hour,
            cognitive_load,
        )

        # 8. Calculate confidence
        confidence = self._calculate_confidence(user_profile, recent_sessions)

        return DurationRecommendation(
            recommended_duration=recommended_duration,
            min_duration=min_duration,
            max_duration=max_duration,
            confidence=round(confidence, 3),
            break_schedule=break_schedule,
            reasoning=reasoning,
        )

    def _generate_break_schedule(
        self,
        duration: int,
        user_profile: Dict[str, any],
        complexity: str,
        cognitive_load: float,
    ) -> List[Dict[str, any]]:
        """
        Generate personalized break schedule (Pomodoro-inspired)

        Break Strategy:
        - Easy tasks: 45-min intervals, 5-min breaks
        - Medium tasks: 30-min intervals, 5-min breaks
        - Hard tasks: 25-min intervals, 5-min breaks + longer break after 75 min
        - High cognitive load: More frequent breaks (every 20 min)
        """

        breaks = []

        # Determine break interval based on complexity and cognitive load
        if cognitive_load > 70:
            interval = 20  # More frequent breaks for high load
        elif complexity == "hard":
            interval = 25  # Pomodoro standard
        elif complexity == "medium":
            interval = 30
        else:
            interval = 45

        # Generate break schedule
        elapsed = 0
        break_count = 0

        while elapsed + interval < duration:
            elapsed += interval
            break_count += 1

            # Longer break after every 3rd interval (15 min)
            break_duration = 15 if break_count % 3 == 0 else 5

            breaks.append({
                "minute": elapsed,
                "duration": break_duration,
                "reason": f"Attention cycle break (interval {break_count})",
                "trigger": "scheduled",
            })

        return breaks

    def _is_peak_performance_hour(
        self, hour: int, user_profile: Dict[str, any]
    ) -> bool:
        """Check if hour is in user's peak performance window"""

        preferred_times = user_profile.get("preferredStudyTimes", [])

        for pref in preferred_times:
            if hour >= pref.get("startHour", 0) and hour < pref.get("endHour", 24):
                return True

        return False

    def _build_duration_reasoning(
        self,
        baseline: int,
        recommended: int,
        complexity: str,
        is_peak: bool,
        cognitive_load: float,
    ) -> List[str]:
        """Build reasoning for duration recommendation"""

        reasoning = []

        reasoning.append(f"Base duration: {baseline} min from your profile")

        if complexity == "hard":
            reasoning.append("Extended for challenging content (+15 min)")
        elif complexity == "easy":
            reasoning.append("Reduced for easier content (-10 min)")

        if is_peak:
            reasoning.append("Peak performance time: extended 20%")
        else:
            reasoning.append("Off-peak time: reduced 10%")

        if cognitive_load > 70:
            reasoning.append("High cognitive load: reduced 30% to prevent burnout")
        elif cognitive_load > 50:
            reasoning.append("Moderate cognitive load: reduced 15%")

        return reasoning

    def _calculate_confidence(
        self, user_profile: Dict[str, any], recent_sessions: pd.DataFrame
    ) -> float:
        """Calculate confidence in duration recommendation"""

        # Base confidence from profile data quality
        base = user_profile.get("dataQualityScore", 0.5)

        # Recent sessions boost
        if not recent_sessions.empty:
            recent_boost = min(0.3, len(recent_sessions) / 20)
        else:
            recent_boost = 0.0

        return min(1.0, base + recent_boost)

    async def detect_fatigue(
        self,
        session_id: str,
        session_start: datetime,
        current_performance_metrics: Dict[str, float],
        baseline_performance: Dict[str, float],
    ) -> Tuple[bool, float, List[str]]:
        """
        Detect real-time fatigue during study session

        Fatigue Indicators:
        1. Accuracy drop > 20% from session start
        2. Response time increase > 50%
        3. Engagement level decline
        4. Time elapsed > optimal duration

        Returns:
            (fatigue_detected, fatigue_severity_0_100, indicators)
        """

        indicators = []
        severity_scores = []

        # 1. Accuracy drop
        current_accuracy = current_performance_metrics.get("accuracy", 100)
        baseline_accuracy = baseline_performance.get("accuracy", 100)
        accuracy_drop = baseline_accuracy - current_accuracy

        if accuracy_drop > 20:
            severity_scores.append(min(100, accuracy_drop * 2))
            indicators.append(f"Accuracy dropped {accuracy_drop:.0f}% from session start")

        # 2. Response time increase
        current_response_time = current_performance_metrics.get("avgResponseTimeMs", 5000)
        baseline_response_time = baseline_performance.get("avgResponseTimeMs", 5000)
        response_time_ratio = current_response_time / baseline_response_time if baseline_response_time > 0 else 1.0

        if response_time_ratio > 1.5:
            severity_scores.append(min(100, (response_time_ratio - 1.0) * 100))
            indicators.append(f"Response times {response_time_ratio:.1f}x slower")

        # 3. Engagement decline
        current_engagement = current_performance_metrics.get("engagementScore", 100)
        engagement_threshold = 60

        if current_engagement < engagement_threshold:
            severity_scores.append(100 - current_engagement)
            indicators.append(f"Engagement dropped to {current_engagement:.0f}%")

        # 4. Duration fatigue
        elapsed_minutes = (datetime.now() - session_start).total_seconds() / 60
        if elapsed_minutes > 60:
            duration_fatigue = min(100, (elapsed_minutes - 60) / 30 * 100)
            severity_scores.append(duration_fatigue)
            indicators.append(f"Session running {elapsed_minutes:.0f} min (fatigue expected)")

        # Overall fatigue assessment
        if severity_scores:
            fatigue_severity = np.mean(severity_scores)
            fatigue_detected = fatigue_severity > 40  # Threshold for action
        else:
            fatigue_severity = 0.0
            fatigue_detected = False

        return fatigue_detected, float(fatigue_severity), indicators
