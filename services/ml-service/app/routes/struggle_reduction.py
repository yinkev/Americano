"""Routes exposing struggle reduction analytics."""

from __future__ import annotations

from fastapi import APIRouter, Query

from ..schemas import StruggleReductionResponse
from .mock_data import DEFAULT_USER_ID, build_struggle_reduction_response

router = APIRouter()


@router.get("/struggle-reduction", response_model=StruggleReductionResponse)
async def get_struggle_reduction(
    userId: str = Query(default=DEFAULT_USER_ID, description="User identifier"),
    period: str = Query(default="month", description="Aggregation period"),
) -> StruggleReductionResponse:
    """Return mock struggle reduction analytics for the requested user."""

    return build_struggle_reduction_response(userId, period)

