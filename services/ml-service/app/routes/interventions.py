"""Routes for intervention recommendations."""

from __future__ import annotations

from fastapi import APIRouter, Query

from ..schemas import InterventionsResponse
from .mock_data import DEFAULT_USER_ID, build_interventions_response

router = APIRouter()


@router.get("/interventions", response_model=InterventionsResponse)
async def get_interventions(
    userId: str = Query(default=DEFAULT_USER_ID, description="User identifier"),
) -> InterventionsResponse:
    """Return mock interventions for the user."""

    return build_interventions_response(userId)

