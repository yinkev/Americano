"""
Intervention Endpoints

FastAPI routes for intervention recommendations.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import Any as Prisma
from typing import List
import logging
from datetime import datetime

from app.models.interventions import (
    InterventionResponse,
    InterventionApplyRequest,
    InterventionApplyResponse,
)
from app.services.database import get_db
try:
    from app.models.interventions import InterventionStatus  # if enum is defined there
except Exception:
    from enum import Enum
    class InterventionStatus(str, Enum):
        PENDING = "PENDING"
        APPLIED = "APPLIED"

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
        from app.utils.config import settings
        if settings.DB_ADAPTER.lower() == "sqlalchemy":
            from app.db.core import session as sa_session
            from app.db.interventions_repo import InterventionsRepo
            with sa_session() as s:
                repo = InterventionsRepo(s)
                rows = repo.list_active(user_id=user_id)
                results: List[InterventionResponse] = []
                for r in rows:
                    results.append(InterventionResponse(
                        id=r["id"],
                        prediction_id=r.get("predictionId") or "",
                        user_id=r["userId"],
                        intervention_type=r["interventionType"],
                        description=r["description"],
                        reasoning=r["reasoning"],
                        priority=r["priority"],
                        status=(InterventionStatus.APPLIED if r["status"] == "IN_PROGRESS" else InterventionStatus.PENDING),
                        applied_at=r.get("appliedAt"),
                        applied_to_mission_id=r.get("appliedToMissionId"),
                        effectiveness=None,
                        created_at=r["createdAt"],
                    ))
                return results
        else:
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
        from app.utils.config import settings
        if settings.DB_ADAPTER.lower() == "sqlalchemy":
            from app.db.core import session as sa_session
            from app.db.interventions_repo import InterventionsRepo
            with sa_session() as s:
                repo = InterventionsRepo(s)
                mission_id = request.mission_id or "ad-hoc"
                rec = repo.apply(intervention_id=intervention_id, mission_id=mission_id)
                if rec is None:
                    raise HTTPException(status_code=404, detail="Intervention not found")
                return InterventionApplyResponse(
                    success=True,
                    intervention_id=intervention_id,
                    mission_id=mission_id,
                    message=f"Intervention '{rec['interventionType']}' applied successfully to mission",
                )
        else:
            # Prisma path
            intervention = await db.interventionrecommendation.find_unique(
                where={"id": intervention_id}
            )
            if not intervention:
                raise HTTPException(status_code=404, detail="Intervention not found")
            mission_id = request.mission_id
            if not mission_id:
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
