"""Routes exposing model performance metrics."""

from __future__ import annotations

from fastapi import APIRouter, Query

from ..schemas import ModelPerformanceResponse
from .mock_data import DEFAULT_USER_ID, build_model_performance_response

router = APIRouter()


@router.get("/model-performance", response_model=ModelPerformanceResponse)
async def get_model_performance(
    userId: str = Query(default=DEFAULT_USER_ID, description="User identifier"),
) -> ModelPerformanceResponse:
    """Return mock model performance metrics for the requested user."""

    return build_model_performance_response(userId)

