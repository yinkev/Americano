"""Routes for retrieving stored predictions."""

from __future__ import annotations

from fastapi import APIRouter, Query

from ..schemas import PredictionStatus, PredictionsResponse
from .mock_data import DEFAULT_MIN_PROBABILITY, DEFAULT_STATUS, DEFAULT_USER_ID, build_predictions_response

router = APIRouter()


@router.get("/predictions", response_model=PredictionsResponse)
async def get_predictions(
    userId: str = Query(default=DEFAULT_USER_ID, description="User identifier"),
    status: PredictionStatus = Query(
        default=PredictionStatus[DEFAULT_STATUS], description="Prediction status filter"
    ),
    minProbability: float = Query(
        default=DEFAULT_MIN_PROBABILITY,
        ge=0,
        le=1,
        description="Minimum struggle probability",
    ),
) -> PredictionsResponse:
    """Return mock predictions while the real model is under construction."""

    return build_predictions_response(userId, status.value, minProbability)

