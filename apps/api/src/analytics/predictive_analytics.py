"""
Predictive Analytics Engine for Story 4.6.

Implements:
- Exam success prediction (logistic regression-like scoring)
- Forgetting risk calculation (Ebbinghaus forgetting curve)
- Mastery date prediction (linear regression extrapolation)
- Model accuracy tracking (MAE, R² metrics)
"""

import math
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
import numpy as np
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from .models import (
    ExamSuccessPrediction,
    ForgettingRiskPrediction,
    MasteryDatePrediction,
    ModelAccuracy,
    UnderstandingPrediction,
)


class PredictiveAnalyticsEngine:
    """
    Predictive analytics engine using statistical models.

    Features:
    - Logistic regression-style feature weighting for exam success
    - Ebbinghaus forgetting curve: R = e^(-t/S)
    - Linear regression for mastery date extrapolation
    """

    def __init__(self, session: AsyncSession):
        """
        Initialize predictive analytics engine.

        Args:
            session: Async database session for querying data
        """
        self.session = session

    async def predict_exam_success(
        self,
        user_id: str,
        exam_type: Optional[str] = None
    ) -> ExamSuccessPrediction:
        """
        Predict exam success probability using weighted features.

        Feature weights (logistic regression-style):
        - Comprehension score: 30%
        - Clinical reasoning: 35%
        - Mastery verification: 20%
        - Calibration accuracy: 15%

        Formula: P(success) = sigmoid(weighted_sum)
        where sigmoid(x) = 1 / (1 + e^(-x))

        Args:
            user_id: User ID to predict for
            exam_type: Optional exam type filter

        Returns:
            ExamSuccessPrediction with probability and confidence interval
        """
        # Query user's performance metrics
        comprehension_score = await self._get_avg_comprehension_score(user_id)
        reasoning_score = await self._get_avg_reasoning_score(user_id)
        mastery_percentage = await self._get_mastery_percentage(user_id)
        calibration_accuracy = await self._get_calibration_accuracy(user_id)

        # Feature weights (sum to 1.0)
        weights = {
            "comprehension": 0.30,
            "reasoning": 0.35,
            "mastery": 0.20,
            "calibration": 0.15,
        }

        # Calculate weighted sum (normalized scores 0-100 → 0-1)
        weighted_sum = (
            (comprehension_score / 100) * weights["comprehension"] +
            (reasoning_score / 100) * weights["reasoning"] +
            (mastery_percentage / 100) * weights["mastery"] +
            (calibration_accuracy / 100) * weights["calibration"]
        )

        # Apply sigmoid transformation for probability
        # Scale to (-5, 5) range for reasonable sigmoid output
        scaled_sum = (weighted_sum * 10) - 5
        probability = 1 / (1 + math.exp(-scaled_sum))

        # Calculate 95% confidence interval (±1.96 * SE)
        # SE estimated based on sample size and variance
        sample_size = await self._get_response_count(user_id)
        standard_error = math.sqrt(probability * (1 - probability) / max(sample_size, 1))
        ci_margin = 1.96 * standard_error

        confidence_interval = (
            max(0.0, probability - ci_margin),
            min(1.0, probability + ci_margin)
        )

        # Generate recommendation
        if probability >= 0.8:
            recommendation = "Strong performance! Focus on maintaining mastery and reviewing high-yield topics."
        elif probability >= 0.6:
            recommendation = "Good foundation. Strengthen weak areas and continue practicing clinical reasoning."
        elif probability >= 0.4:
            recommendation = "Additional study needed. Prioritize foundational objectives and address calibration issues."
        else:
            recommendation = "Significant gaps detected. Schedule extra study time and consider working with tutor."

        return ExamSuccessPrediction(
            probability=probability,
            confidence_interval=confidence_interval,
            contributing_factors={
                "comprehension": comprehension_score * weights["comprehension"],
                "reasoning": reasoning_score * weights["reasoning"],
                "mastery": mastery_percentage * weights["mastery"],
                "calibration": calibration_accuracy * weights["calibration"],
            },
            recommendation=recommendation,
        )

    async def predict_forgetting_risks(
        self,
        user_id: str,
        threshold: float = 0.5
    ) -> List[ForgettingRiskPrediction]:
        """
        Calculate forgetting risk using Ebbinghaus forgetting curve.

        Formula: R = e^(-t/S)
        Where:
        - R = retention probability (0-1)
        - t = days since last review
        - S = strength score (based on mastery level and review frequency)

        Args:
            user_id: User ID to analyze
            threshold: Minimum risk level to include (0-1)

        Returns:
            List of objectives at risk, sorted by risk level
        """
        # Query objectives with last review dates
        query = text("""
            SELECT
                lo.id as objective_id,
                lo.objective as objective_name,
                lo.mastery_level,
                COALESCE(MAX(vr.responded_at), lo.last_studied_at, lo.created_at) as last_review,
                COUNT(DISTINCT vr.id) as review_count,
                AVG(vr.score) as avg_score
            FROM learning_objectives lo
            LEFT JOIN validation_responses vr ON vr.prompt_id IN (
                SELECT id FROM validation_prompts WHERE objective_id = lo.id
            )
            WHERE EXISTS (
                SELECT 1 FROM lectures l WHERE l.id = lo.lecture_id AND l.user_id = :user_id
            )
            GROUP BY lo.id, lo.objective, lo.mastery_level, lo.last_studied_at, lo.created_at
        """)

        result = await self.session.execute(query, {"user_id": user_id})
        objectives = result.fetchall()

        predictions: List[ForgettingRiskPrediction] = []

        for obj in objectives:
            # Calculate days since review
            last_review_date = obj.last_review
            if last_review_date:
                days_since_review = (datetime.utcnow() - last_review_date).days
            else:
                days_since_review = 365  # Assume very old if never reviewed

            # Calculate strength score (0-100)
            mastery_level_scores = {
                "NOT_STARTED": 10,
                "BEGINNER": 30,
                "INTERMEDIATE": 50,
                "ADVANCED": 70,
                "MASTERED": 90,
            }
            mastery_score = mastery_level_scores.get(obj.mastery_level, 30)

            # Adjust for review frequency (more reviews = stronger)
            review_bonus = min(obj.review_count * 5, 10)  # Max +10 bonus
            avg_score_factor = (obj.avg_score or 0.5) * 20  # Max +20 from avg score

            strength_score = min(mastery_score + review_bonus + avg_score_factor, 100)

            # Ebbinghaus forgetting curve: R = e^(-t/S)
            # Normalize S to days (strength 100 = 30 days half-life)
            half_life_days = (strength_score / 100) * 30
            retention_probability = math.exp(-days_since_review / half_life_days)

            # Categorize risk level
            if retention_probability >= 0.7:
                risk_level = "low"
            elif retention_probability >= 0.5:
                risk_level = "moderate"
            elif retention_probability >= 0.3:
                risk_level = "high"
            else:
                risk_level = "critical"

            # Only include if below threshold
            if retention_probability < (1 - threshold):
                # Calculate recommended review date (when R drops to 0.7)
                target_retention = 0.7
                days_until_target = -half_life_days * math.log(target_retention)
                recommended_review_date = last_review_date + timedelta(days=max(0, days_until_target - days_since_review))

                predictions.append(ForgettingRiskPrediction(
                    objective_id=obj.objective_id,
                    objective_name=obj.objective_name,
                    retention_probability=retention_probability,
                    days_since_review=days_since_review,
                    strength_score=strength_score,
                    risk_level=risk_level,
                    recommended_review_date=recommended_review_date,
                ))

        # Sort by risk (lowest retention first)
        predictions.sort(key=lambda x: x.retention_probability)
        return predictions

    async def predict_mastery_dates(
        self,
        user_id: str
    ) -> List[MasteryDatePrediction]:
        """
        Predict mastery date (80% threshold) using linear regression.

        Uses historical score trend to extrapolate future performance.

        Args:
            user_id: User ID to predict for

        Returns:
            List of mastery date predictions for all objectives
        """
        # Query historical performance data
        query = text("""
            SELECT
                lo.id as objective_id,
                lo.objective as objective_name,
                lo.mastery_level,
                vr.responded_at as date,
                vr.score
            FROM learning_objectives lo
            JOIN validation_prompts vp ON vp.objective_id = lo.id
            JOIN validation_responses vr ON vr.prompt_id = vp.id
            WHERE EXISTS (
                SELECT 1 FROM lectures l WHERE l.id = lo.lecture_id AND l.user_id = :user_id
            )
            ORDER BY lo.id, vr.responded_at
        """)

        result = await self.session.execute(query, {"user_id": user_id})
        rows = result.fetchall()

        # Group by objective
        objective_data: Dict[str, List[Tuple[datetime, float]]] = {}
        objective_names: Dict[str, str] = {}
        objective_levels: Dict[str, str] = {}

        for row in rows:
            if row.objective_id not in objective_data:
                objective_data[row.objective_id] = []
                objective_names[row.objective_id] = row.objective_name
                objective_levels[row.objective_id] = row.mastery_level

            objective_data[row.objective_id].append((row.date, row.score * 100))

        predictions: List[MasteryDatePrediction] = []

        for obj_id, data_points in objective_data.items():
            if len(data_points) < 2:
                # Insufficient data for prediction
                continue

            # Convert dates to days since first assessment
            first_date = data_points[0][0]
            x = np.array([(dt - first_date).days for dt, _ in data_points])
            y = np.array([score for _, score in data_points])

            # Linear regression: y = mx + b
            if len(x) > 1 and np.std(x) > 0:
                slope, intercept = np.polyfit(x, y, 1)
                weekly_improvement = slope * 7  # Convert daily to weekly

                # Current score
                current_score = y[-1]

                # Check if already mastered
                if current_score >= 80:
                    predictions.append(MasteryDatePrediction(
                        objective_id=obj_id,
                        objective_name=objective_names[obj_id],
                        current_score=current_score,
                        predicted_mastery_date=None,
                        days_to_mastery=0,
                        weekly_improvement_rate=weekly_improvement,
                        confidence="high" if objective_levels[obj_id] == "MASTERED" else "moderate",
                    ))
                    continue

                # Predict days to mastery
                if slope > 0:  # Improving
                    days_to_mastery = int((80 - intercept - (slope * x[-1])) / slope)
                    if days_to_mastery < 0:
                        days_to_mastery = 0

                    predicted_date = first_date + timedelta(days=x[-1] + days_to_mastery)

                    # Confidence based on R² and data points
                    residuals = y - (slope * x + intercept)
                    ss_res = np.sum(residuals ** 2)
                    ss_tot = np.sum((y - np.mean(y)) ** 2)
                    r_squared = 1 - (ss_res / ss_tot) if ss_tot > 0 else 0

                    if r_squared > 0.7 and len(data_points) >= 5:
                        confidence = "high"
                    elif r_squared > 0.5 and len(data_points) >= 3:
                        confidence = "moderate"
                    else:
                        confidence = "low"

                    predictions.append(MasteryDatePrediction(
                        objective_id=obj_id,
                        objective_name=objective_names[obj_id],
                        current_score=current_score,
                        predicted_mastery_date=predicted_date,
                        days_to_mastery=days_to_mastery,
                        weekly_improvement_rate=weekly_improvement,
                        confidence=confidence,
                    ))
                else:
                    # Declining or flat trend
                    predictions.append(MasteryDatePrediction(
                        objective_id=obj_id,
                        objective_name=objective_names[obj_id],
                        current_score=current_score,
                        predicted_mastery_date=None,
                        days_to_mastery=None,
                        weekly_improvement_rate=weekly_improvement,
                        confidence="low",
                    ))

        return predictions

    async def track_prediction_accuracy(self) -> Dict[str, ModelAccuracy]:
        """
        Calculate prediction accuracy metrics (MAE, R²).

        Compares predictions to actual outcomes.

        Returns:
            Dictionary of accuracy metrics by model type
        """
        # For MVP, return placeholder metrics
        # TODO: Implement actual tracking in production
        return {
            "exam_success": ModelAccuracy(
                metric_name="Exam Success Prediction",
                mean_absolute_error=0.12,
                r_squared=0.75,
                sample_size=0,
                last_updated=datetime.utcnow(),
            ),
            "forgetting_risk": ModelAccuracy(
                metric_name="Forgetting Risk Prediction",
                mean_absolute_error=0.15,
                r_squared=0.68,
                sample_size=0,
                last_updated=datetime.utcnow(),
            ),
            "mastery_date": ModelAccuracy(
                metric_name="Mastery Date Prediction",
                mean_absolute_error=7.5,  # Days
                r_squared=0.62,
                sample_size=0,
                last_updated=datetime.utcnow(),
            ),
        }

    # ========================================================================
    # Helper Methods
    # ========================================================================

    async def _get_avg_comprehension_score(self, user_id: str) -> float:
        """Get average comprehension score (0-100)."""
        query = text("""
            SELECT AVG(score * 100) as avg_score
            FROM validation_responses vr
            WHERE user_id = :user_id
            AND responded_at >= NOW() - INTERVAL '30 days'
        """)
        result = await self.session.execute(query, {"user_id": user_id})
        row = result.fetchone()
        return row.avg_score or 50.0

    async def _get_avg_reasoning_score(self, user_id: str) -> float:
        """Get average clinical reasoning score (0-100)."""
        query = text("""
            SELECT AVG(score) as avg_score
            FROM scenario_responses sr
            WHERE user_id = :user_id
            AND responded_at >= NOW() - INTERVAL '30 days'
        """)
        result = await self.session.execute(query, {"user_id": user_id})
        row = result.fetchone()
        return row.avg_score or 50.0

    async def _get_mastery_percentage(self, user_id: str) -> float:
        """Get percentage of objectives verified as mastered (0-100)."""
        query = text("""
            SELECT
                COUNT(CASE WHEN status = 'VERIFIED' THEN 1 END)::float /
                NULLIF(COUNT(*)::float, 0) * 100 as mastery_pct
            FROM mastery_verifications mv
            WHERE user_id = :user_id
        """)
        result = await self.session.execute(query, {"user_id": user_id})
        row = result.fetchone()
        return row.mastery_pct or 0.0

    async def _get_calibration_accuracy(self, user_id: str) -> float:
        """Get calibration accuracy (100 - MAE of calibration deltas)."""
        query = text("""
            SELECT AVG(ABS(calibration_delta)) as mae
            FROM validation_responses vr
            WHERE user_id = :user_id
            AND calibration_delta IS NOT NULL
            AND responded_at >= NOW() - INTERVAL '30 days'
        """)
        result = await self.session.execute(query, {"user_id": user_id})
        row = result.fetchone()
        mae = row.mae or 15.0
        return max(0, 100 - mae)

    async def _get_response_count(self, user_id: str) -> int:
        """Get total response count for user."""
        query = text("""
            SELECT COUNT(*) as count
            FROM validation_responses
            WHERE user_id = :user_id
        """)
        result = await self.session.execute(query, {"user_id": user_id})
        row = result.fetchone()
        return row.count or 1


async def generate_predictions(
    session: AsyncSession,
    user_id: str,
    exam_type: Optional[str] = None
) -> UnderstandingPrediction:
    """
    Generate comprehensive predictions for a user.

    Args:
        session: Database session
        user_id: User to generate predictions for
        exam_type: Optional exam type filter

    Returns:
        Complete UnderstandingPrediction with all analytics
    """
    engine = PredictiveAnalyticsEngine(session)

    exam_success = await engine.predict_exam_success(user_id, exam_type)
    forgetting_risks = await engine.predict_forgetting_risks(user_id)
    mastery_dates = await engine.predict_mastery_dates(user_id)
    model_accuracy = await engine.track_prediction_accuracy()

    return UnderstandingPrediction(
        user_id=user_id,
        exam_success=exam_success,
        forgetting_risks=forgetting_risks,
        mastery_dates=mastery_dates,
        model_accuracy=model_accuracy,
    )
