"""
Prediction Endpoints

FastAPI routes for struggle prediction analysis.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import Any as Prisma
PrismaError = Exception
from typing import Optional
import logging
import asyncio

from app.models.predictions import PredictionRequest, PredictionResponse, PredictionDetail, AlertResponse, PredictionStatus
from app.models.feedback import FeedbackRequest, FeedbackResponse
from app.services.database import get_db
from app.utils.config import settings
from app.db.core import session as sa_session
from app.db.predictions_repo import PredictionsRepo

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
        async with asyncio.timeout(10):
            # For SQLAlchemy adapter (personal use), return empty set for now
            if settings.DB_ADAPTER.lower() != "prisma":
                return PredictionResponse(
                    predictions=[],
                    alerts=None,
                    total_count=0,
                    high_risk_count=0,
                    medium_risk_count=0,
                    low_risk_count=0,
                )

            # Lazy import only when Prisma is enabled
            from app.services.detection_engine import StruggleDetectionEngine  # type: ignore

            engine = StruggleDetectionEngine(db)
            predictions = await engine.run_predictions(request.user_id, request.days_ahead)
            alerts = await engine.generate_alerts(request.user_id)

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

            high = sum(1 for p in prediction_details if p.risk_level == "HIGH")
            medium = sum(1 for p in prediction_details if p.risk_level == "MEDIUM")
            low = sum(1 for p in prediction_details if p.risk_level == "LOW")

            return PredictionResponse(
                predictions=prediction_details,
                alerts=[AlertResponse(**a) for a in alerts] if alerts else None,
                total_count=len(prediction_details),
                high_risk_count=high,
                medium_risk_count=medium,
                low_risk_count=low,
            )

    except asyncio.TimeoutError:
        logger.error("Prediction generation timeout", exc_info=True)
        raise HTTPException(
            status_code=504,
            detail="Request timeout - prediction generation took too long"
        )
    except PrismaError as e:
        logger.error("Database error in prediction generation", exc_info=True)
        raise HTTPException(
            status_code=503,
            detail="Database service unavailable"
        )
    except ValueError as e:
        logger.warning(f"Invalid data in prediction generation: {e}")
        raise HTTPException(
            status_code=422,
            detail="Invalid data - unable to generate predictions"
        )
    except Exception as e:
        logger.error("Unexpected error in prediction generation", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Internal server error"
        )


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
        async with asyncio.timeout(10):
            if settings.DB_ADAPTER.lower() == "sqlalchemy":
                # SQLAlchemy Core read path
                with sa_session() as s:
                    repo = PredictionsRepo(s)
                    rows = repo.list(user_id=user_id, status=status.value if status else None, min_probability=min_probability)
                prediction_details = []
                for r in rows:
                    risk = "HIGH" if (r.get("predictedStruggleProbability") or 0) >= 0.7 else (
                        "MEDIUM" if (r.get("predictedStruggleProbability") or 0) >= 0.4 else "LOW"
                    )
                    prediction_details.append(
                        PredictionDetail(
                            id=r["id"],
                            user_id=r["userId"],
                            learning_objective_id=r.get("learningObjectiveId"),
                            topic_id=r.get("topicId"),
                            prediction_date=r["predictionDate"],
                            predicted_struggle_probability=r["predictedStruggleProbability"],
                            prediction_confidence=r["predictionConfidence"],
                            prediction_status=PredictionStatus(r["predictionStatus"]),
                            feature_vector=r.get("featureVector") or {},
                            risk_level=risk,
                            reasoning="",
                        )
                    )
            else:
                # Prisma read path (default)
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

    except asyncio.TimeoutError:
        logger.error("Prediction query timeout", exc_info=True)
        raise HTTPException(
            status_code=504,
            detail="Request timeout - query took too long"
        )
    except PrismaError as e:
        logger.error("Database error in prediction query", exc_info=True)
        raise HTTPException(
            status_code=503,
            detail="Database service unavailable"
        )
    except ValueError as e:
        logger.warning(f"Invalid data in prediction query: {e}")
        raise HTTPException(
            status_code=422,
            detail="Invalid data - unable to process query"
        )
    except Exception as e:
        logger.error("Unexpected error in prediction query", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Internal server error"
        )


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
        async with asyncio.timeout(10):
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

    except asyncio.TimeoutError:
        logger.error("Feedback submission timeout", exc_info=True)
        raise HTTPException(
            status_code=504,
            detail="Request timeout - feedback submission took too long"
        )
    except HTTPException:
        raise
    except PrismaError as e:
        logger.error("Database error in feedback submission", exc_info=True)
        raise HTTPException(
            status_code=503,
            detail="Database service unavailable"
        )
    except ValueError as e:
        logger.warning(f"Invalid data in feedback submission: {e}")
        raise HTTPException(
            status_code=422,
            detail="Invalid data - unable to process feedback"
        )
    except Exception as e:
        logger.error("Unexpected error in feedback submission", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Internal server error"
        )
