"""Routes for capturing prediction feedback."""

from __future__ import annotations

from fastapi import APIRouter

from ..schemas import PredictionFeedbackRequest, PredictionFeedbackResponse
from .mock_data import build_prediction_feedback_response

router = APIRouter()


@router.post("/predictions/{prediction_id}/feedback", response_model=PredictionFeedbackResponse)
async def submit_prediction_feedback(
    prediction_id: str, payload: PredictionFeedbackRequest
) -> PredictionFeedbackResponse:
    """Record feedback for a prediction using mock data."""

    return build_prediction_feedback_response(prediction_id)

