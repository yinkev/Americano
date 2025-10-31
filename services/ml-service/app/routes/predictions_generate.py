"""Routes for generating new predictions."""

from __future__ import annotations

from fastapi import APIRouter

from ..schemas import PredictionGenerationRequest, PredictionGenerationResponse
from .mock_data import build_prediction_generation_response

router = APIRouter()


@router.post("/predictions/generate", response_model=PredictionGenerationResponse)
async def generate_predictions(
    payload: PredictionGenerationRequest,
) -> PredictionGenerationResponse:
    """Return mock predictions and alerts for the requested user."""

    return build_prediction_generation_response(payload.userId)

