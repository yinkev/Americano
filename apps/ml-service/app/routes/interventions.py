"""
Intervention Endpoints

FastAPI routes for intervention recommendations.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from prisma import Prisma
from typing import List
import logging
from datetime import datetime

from app.models.interventions import (
    InterventionResponse,
    InterventionApplyRequest,
    InterventionApplyResponse
)
from app.services.database import get_db
from prisma.enums import InterventionStatus

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/", response_model=List[InterventionResponse])
async def get_interventions(
    user_id: str,
    db: Prisma = Depends(get_db)
):
    """
    GET /interventions

    Get active intervention recommendations for user.
    """
    try:
        interventions = await db.interventionrecommendation.find_many(
            where={
                "userId": user_id,
                "status": {"in": [InterventionStatus.PENDING, InterventionStatus.APPLIED]}
            },
            order={"priority": "desc"}
        )

        return [InterventionResponse.model_validate(intervention) for intervention in interventions]

    except Exception as e:
        logger.error(f"Intervention query failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{intervention_id}/apply", response_model=InterventionApplyResponse)
async def apply_intervention(
    intervention_id: str,
    request: InterventionApplyRequest,
    db: Prisma = Depends(get_db)
):
    """
    POST /interventions/{id}/apply

    Apply intervention recommendation to mission.
    """
    try:
        # Get intervention
        intervention = await db.interventionrecommendation.find_unique(
            where={"id": intervention_id}
        )
        if not intervention:
            raise HTTPException(status_code=404, detail="Intervention not found")

        # Get or find mission
        mission_id = request.mission_id
        if not mission_id:
            # Find next pending mission
            next_mission = await db.mission.find_first(
                where={
                    "userId": intervention.userId,
                    "status": "PENDING",
                    "date": {"gte": datetime.utcnow()}
                },
                order={"date": "asc"}
            )
            if not next_mission:
                raise HTTPException(status_code=404, detail="No pending missions found")
            mission_id = next_mission.id

        # Update intervention
        await db.interventionrecommendation.update(
            where={"id": intervention_id},
            data={
                "status": InterventionStatus.APPLIED,
                "appliedAt": datetime.utcnow(),
                "appliedToMissionId": mission_id
            }
        )

        return InterventionApplyResponse(
            success=True,
            intervention_id=intervention_id,
            mission_id=mission_id,
            message=f"Intervention '{intervention.interventionType}' applied successfully to mission"
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Intervention application failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
