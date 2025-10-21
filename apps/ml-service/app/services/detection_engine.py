"""
Struggle Detection Engine (Python Port)

Ported from TypeScript version at apps/web/src/subsystems/behavioral-analytics/struggle-detection-engine.ts
Implements async prediction workflow integrated with Prisma Python client.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from prisma import Prisma
from prisma.models import (
    StrugglePrediction,
    StruggleIndicator,
    InterventionRecommendation,
    LearningObjective,
    Mission
)
from prisma.enums import (
    PredictionStatus,
    IndicatorType,
    Severity,
    InterventionType,
    InterventionStatus,
    MasteryLevel,
    ReviewRating
)
import logging

from app.services.struggle_feature_extractor import StruggleFeatureExtractor, FeatureVector
from app.services.struggle_prediction_model import StrugglePredictionModel, PredictionResult

logger = logging.getLogger(__name__)


class StruggleDetectionEngine:
    """
    Orchestrates the complete prediction workflow.

    Workflow:
    1. Identify upcoming learning objectives (7-14 days)
    2. Extract feature vectors via StruggleFeatureExtractor
    3. Run predictions via StrugglePredictionModel
    4. Detect struggle indicators in real-time
    5. Generate intervention recommendations
    """

    def __init__(self, db: Prisma):
        """Initialize with Prisma client."""
        self.db = db
        self.feature_extractor = StruggleFeatureExtractor(db, cache_enabled=True)
        self.prediction_model = StrugglePredictionModel()

    async def run_predictions(self, user_id: str, days_ahead: int = 14) -> List[StrugglePrediction]:
        """
        Run predictions for all upcoming objectives.

        Args:
            user_id: User identifier
            days_ahead: Number of days to predict ahead (7-14)

        Returns:
            List of StrugglePrediction records
        """
        logger.info(f"Running predictions for user {user_id}, {days_ahead} days ahead")

        # Get upcoming missions
        end_date = datetime.utcnow() + timedelta(days=days_ahead)
        upcoming_missions = await self.db.mission.find_many(
            where={
                "userId": user_id,
                "date": {"gte": datetime.utcnow(), "lte": end_date},
                "status": {"not": "COMPLETED"}
            }
        )

        # Extract objective IDs from missions
        objective_ids = []
        for mission in upcoming_missions:
            objectives = mission.objectives if isinstance(mission.objectives, list) else []
            objective_ids.extend([obj.get("objectiveId") for obj in objectives if obj.get("objectiveId")])

        # Get unscheduled objectives
        unscheduled = await self.db.learningobjective.find_many(
            where={
                "lecture": {"userId": user_id},
                "masteryLevel": {"not": MasteryLevel.MASTERED},
                "id": {"notIn": objective_ids}
            },
            order={"weaknessScore": "desc"},
            take=10
        )
        objective_ids.extend([obj.id for obj in unscheduled])

        # Remove duplicates
        unique_objective_ids = list(set(objective_ids))

        # Run predictions
        predictions = []
        for objective_id in unique_objective_ids:
            try:
                prediction = await self._predict_for_objective(user_id, objective_id)
                if prediction and prediction.predictedStruggleProbability > 0.5:
                    predictions.append(prediction)
            except Exception as e:
                logger.error(f"Failed to predict for objective {objective_id}: {e}")

        logger.info(f"Generated {len(predictions)} predictions with probability >0.5")
        return predictions

    async def detect_upcoming_struggles(
        self,
        user_id: str,
        days_ahead: int = 7
    ) -> List[StrugglePrediction]:
        """
        Detect upcoming struggles in next N days.

        Args:
            user_id: User identifier
            days_ahead: Days ahead to check

        Returns:
            List of high-risk predictions
        """
        end_date = datetime.utcnow() + timedelta(days=days_ahead)

        return await self.db.struggleprediction.find_many(
            where={
                "userId": user_id,
                "predictionDate": {"gte": datetime.utcnow(), "lte": end_date},
                "predictionStatus": PredictionStatus.PENDING,
                "predictedStruggleProbability": {"gte": 0.5}
            },
            include={
                "learningObjective": {
                    "include": {
                        "lecture": {"include": {"course": True}}
                    }
                },
                "indicators": True,
                "interventions": True
            },
            order=[
                {"predictedStruggleProbability": "desc"},
                {"predictionDate": "asc"}
            ]
        )

    async def analyze_current_struggles(self, user_id: str) -> List[StruggleIndicator]:
        """
        Analyze current struggles in active session (real-time detection).

        Args:
            user_id: User identifier

        Returns:
            List of detected struggle indicators
        """
        # Get active session
        active_session = await self.db.studysession.find_first(
            where={"userId": user_id, "completedAt": None},
            order={"startedAt": "desc"}
        )

        if not active_session:
            return []

        # Get recent reviews
        two_hours_ago = datetime.utcnow() - timedelta(hours=2)
        recent_reviews = await self.db.review.find_many(
            where={
                "sessionId": active_session.id,
                "reviewedAt": {"gte": two_hours_ago}
            },
            include={"card": {"include": {"objective": True}}},
            order={"reviewedAt": "desc"}
        )

        if len(recent_reviews) < 5:
            return []

        indicators = []

        # Detect multiple AGAIN ratings
        again_count = sum(1 for r in recent_reviews if r.rating == ReviewRating.AGAIN)
        lapse_rate = again_count / len(recent_reviews)

        if lapse_rate > 0.3 and recent_reviews[0].card.objective:
            indicator = await self.db.struggleindicator.create(
                data={
                    "userId": user_id,
                    "learningObjectiveId": recent_reviews[0].card.objective.id,
                    "indicatorType": IndicatorType.LOW_RETENTION,
                    "severity": Severity.HIGH if lapse_rate > 0.5 else Severity.MEDIUM,
                    "context": {
                        "lapseRate": lapse_rate,
                        "recentReviewCount": len(recent_reviews),
                        "againCount": again_count,
                        "sessionId": active_session.id
                    }
                }
            )
            indicators.append(indicator)

        return indicators

    async def generate_alerts(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Generate user-facing alerts for high-priority predictions.

        Args:
            user_id: User identifier

        Returns:
            List of alert dictionaries
        """
        three_days_ahead = datetime.utcnow() + timedelta(days=3)

        predictions = await self.db.struggleprediction.find_many(
            where={
                "userId": user_id,
                "predictionStatus": PredictionStatus.PENDING,
                "predictedStruggleProbability": {"gte": 0.7},
                "predictionDate": {"gte": datetime.utcnow(), "lte": three_days_ahead}
            },
            include={
                "learningObjective": {"include": {"lecture": {"include": {"course": True}}}},
                "indicators": True
            }
        )

        alerts = []
        for pred in predictions:
            severity = self._calculate_alert_severity(pred.indicators)
            if severity == Severity.LOW:
                continue

            alert = {
                "id": f"alert-{pred.id}",
                "type": "PROACTIVE_WARNING",
                "title": f"Potential struggle with {pred.learningObjective.lecture.course.name if pred.learningObjective else 'upcoming topic'}",
                "message": self._generate_alert_message(pred),
                "severity": severity.value,
                "predictionId": pred.id,
                "priority": self._calculate_priority(pred),
                "createdAt": pred.predictionDate
            }
            alerts.append(alert)

        # Sort by priority and limit to top 3
        return sorted(alerts, key=lambda x: x["priority"], reverse=True)[:3]

    # ==================== HELPER METHODS ====================

    async def _predict_for_objective(
        self,
        user_id: str,
        objective_id: str
    ) -> Optional[StrugglePrediction]:
        """Predict struggle for a specific objective."""
        try:
            # Extract features
            features = await self.feature_extractor.extract_features_for_objective(
                user_id, objective_id
            )

            # Run prediction
            result: PredictionResult = self.prediction_model.predict(features)

            # Get objective details
            objective = await self.db.learningobjective.find_unique(
                where={"id": objective_id},
                include={"lecture": {"include": {"course": True}}}
            )

            if not objective:
                return None

            # Create prediction record
            prediction = await self.db.struggleprediction.create(
                data={
                    "userId": user_id,
                    "learningObjectiveId": objective_id,
                    "topicId": objective.lecture.courseId,
                    "predictedStruggleProbability": result.probability,
                    "predictionConfidence": result.confidence,
                    "featureVector": features.to_dict(),
                    "predictionStatus": PredictionStatus.PENDING
                }
            )

            return prediction

        except Exception as e:
            logger.error(f"Prediction failed for objective {objective_id}: {e}")
            return None

    def _calculate_alert_severity(self, indicators: List[Any]) -> Severity:
        """Calculate overall severity from indicators."""
        if not indicators:
            return Severity.LOW

        high_count = sum(1 for i in indicators if i.severity == Severity.HIGH)
        medium_count = sum(1 for i in indicators if i.severity == Severity.MEDIUM)

        if high_count >= 2 or (high_count >= 1 and medium_count >= 2):
            return Severity.HIGH
        if high_count >= 1 or medium_count >= 2:
            return Severity.MEDIUM
        return Severity.LOW

    def _calculate_priority(self, prediction: Any) -> float:
        """Calculate alert priority (0-100)."""
        urgency = 0.8  # Simplified for MVP
        priority = (
            urgency * 0.4 +
            prediction.predictionConfidence * 0.3 +
            (1.0 if self._calculate_alert_severity(prediction.indicators) == Severity.HIGH else 0.7) * 0.2 +
            0.5 * 0.1
        ) * 100
        return priority

    def _generate_alert_message(self, prediction: Any) -> str:
        """Generate user-friendly alert message."""
        probability = int(prediction.predictedStruggleProbability * 100)
        objective_name = prediction.learningObjective.objective if prediction.learningObjective else "this topic"

        return f"You have a {probability}% chance of struggling with \"{objective_name}\". We have strategies to help you succeed."
