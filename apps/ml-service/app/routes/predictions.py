"""
Prediction Endpoints

FastAPI routes for struggle prediction analysis.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from prisma import Prisma
from typing import Optional
import logging

from app.models.predictions import PredictionRequest, PredictionResponse, PredictionDetail, AlertResponse
from app.models.feedback import FeedbackRequest, FeedbackResponse
from app.services.database import get_db
from app.services.detection_engine import StruggleDetectionEngine
from prisma.enums import PredictionStatus

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/generate", response_model=PredictionResponse, status_code=status.HTTP_201_CREATED)
async def generate_predictions(
    request: PredictionRequest,
    db: Prisma = Depends(get_db)
):
    """
    POST /predictions/generate

    Triggers prediction analysis for upcoming objectives.
    """
    try:
        engine = StruggleDetectionEngine(db)

        # Run predictions
        predictions = await engine.run_predictions(request.user_id, request.days_ahead)

        # Generate alerts
        alerts = await engine.generate_alerts(request.user_id)

        # Convert to response models
        prediction_details = []
        for pred in predictions:
            detail = PredictionDetail(
                id=pred.id,
                user_id=pred.userId,
                learning_objective_id=pred.learningObjectiveId,
                topic_id=pred.topicId,
                prediction_date=pred.predictionDate,
                predicted_struggle_probability=pred.predictedStruggleProbability,
                prediction_confidence=pred.predictionConfidence,
                prediction_status=pred.predictionStatus,
                feature_vector=pred.featureVector if isinstance(pred.featureVector, dict) else {},
                risk_level="HIGH" if pred.predictedStruggleProbability >= 0.7 else "MEDIUM" if pred.predictedStruggleProbability >= 0.4 else "LOW",
                reasoning=f"Prediction based on {len(pred.featureVector.keys()) if isinstance(pred.featureVector, dict) else 0} features"
            )
            prediction_details.append(detail)

        # Count by risk level
        high = sum(1 for p in prediction_details if p.risk_level == "HIGH")
        medium = sum(1 for p in prediction_details if p.risk_level == "MEDIUM")
        low = sum(1 for p in prediction_details if p.risk_level == "LOW")

        return PredictionResponse(
            predictions=prediction_details,
            alerts=[AlertResponse(**a) for a in alerts] if alerts else None,
            total_count=len(prediction_details),
            high_risk_count=high,
            medium_risk_count=medium,
            low_risk_count=low
        )

    except Exception as e:
        logger.error(f"Prediction generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=PredictionResponse)
async def get_predictions(
    user_id: str,
    status: Optional[PredictionStatus] = None,
    min_probability: float = 0.5,
    db: Prisma = Depends(get_db)
):
    """
    GET /predictions

    Query stored predictions for a user.
    """
    try:
        where = {
            "userId": user_id,
            "predictedStruggleProbability": {"gte": min_probability}
        }
        if status:
            where["predictionStatus"] = status

        predictions = await db.struggleprediction.find_many(
            where=where,
            include={
                "learningObjective": {"include": {"lecture": {"include": {"course": True}}}},
                "indicators": True
            },
            order={"predictionDate": "asc"}
        )

        prediction_details = [
            PredictionDetail(
                id=pred.id,
                user_id=pred.userId,
                learning_objective_id=pred.learningObjectiveId,
                topic_id=pred.topicId,
                prediction_date=pred.predictionDate,
                predicted_struggle_probability=pred.predictedStruggleProbability,
                prediction_confidence=pred.predictionConfidence,
                prediction_status=pred.predictionStatus,
                feature_vector=pred.featureVector if isinstance(pred.featureVector, dict) else {},
                risk_level="HIGH" if pred.predictedStruggleProbability >= 0.7 else "MEDIUM" if pred.predictedStruggleProbability >= 0.4 else "LOW",
                reasoning="",
                objective_name=pred.learningObjective.objective if pred.learningObjective else None,
                course_name=pred.learningObjective.lecture.course.name if pred.learningObjective and pred.learningObjective.lecture else None
            )
            for pred in predictions
        ]

        high = sum(1 for p in prediction_details if p.risk_level == "HIGH")
        medium = sum(1 for p in prediction_details if p.risk_level == "MEDIUM")
        low = sum(1 for p in prediction_details if p.risk_level == "LOW")

        return PredictionResponse(
            predictions=prediction_details,
            total_count=len(prediction_details),
            high_risk_count=high,
            medium_risk_count=medium,
            low_risk_count=low
        )

    except Exception as e:
        logger.error(f"Prediction query failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{prediction_id}/feedback", response_model=FeedbackResponse)
async def submit_feedback(
    prediction_id: str,
    request: FeedbackRequest,
    db: Prisma = Depends(get_db)
):
    """
    POST /predictions/{id}/feedback

    Record user feedback on prediction accuracy.
    """
    try:
        # Verify prediction exists
        prediction = await db.struggleprediction.find_unique(where={"id": prediction_id})
        if not prediction:
            raise HTTPException(status_code=404, detail="Prediction not found")

        # Create feedback record
        feedback = await db.predictionfeedback.create(
            data={
                "predictionId": prediction_id,
                "userId": prediction.userId,
                "feedbackType": request.feedback_type,
                "actualStruggle": request.actual_struggle,
                "comments": request.comments
            }
        )

        # Update prediction status
        new_status = PredictionStatus.CONFIRMED if request.actual_struggle else PredictionStatus.FALSE_POSITIVE
        await db.struggleprediction.update(
            where={"id": prediction_id},
            data={
                "predictionStatus": new_status,
                "actualOutcome": request.actual_struggle,
                "outcomeRecordedAt": feedback.submittedAt
            }
        )

        return FeedbackResponse(
            feedback_recorded=True,
            prediction_id=prediction_id,
            feedback_id=feedback.id,
            message="Feedback recorded successfully. Thank you for helping improve our predictions!"
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Feedback submission failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
