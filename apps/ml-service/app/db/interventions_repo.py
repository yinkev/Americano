from __future__ import annotations

from typing import Any, Dict, List, Optional
from sqlalchemy import text
from sqlalchemy.orm import Session


INTERVENTION_COLS = (
    '"id","userId","predictionId","interventionType","description",'
    '"reasoning","priority","status","relatedObjectiveId",'
    '"appliedToMissionId","appliedAt","createdAt"'
)


class InterventionsRepo:
    def __init__(self, session: Session) -> None:
        self.s = session

    def list_active(self, *, user_id: str) -> List[Dict[str, Any]]:
        sql = (
            f'SELECT {INTERVENTION_COLS} FROM "intervention_recommendations" '
            'WHERE "userId"=:uid AND "status" IN (\'PENDING\',\'IN_PROGRESS\') '
            'ORDER BY "priority" DESC'
        )
        rows = self.s.execute(text(sql), {"uid": user_id}).mappings().all()
        return [dict(r) for r in rows]

    def apply(self, *, intervention_id: str, mission_id: str) -> Optional[Dict[str, Any]]:
        sql = (
            'UPDATE "intervention_recommendations" '
            'SET "status"=\'IN_PROGRESS\', "appliedAt"=NOW(), "appliedToMissionId"=:mid '
            'WHERE "id"=:iid '
            f'RETURNING {INTERVENTION_COLS}'
        )
        row = self.s.execute(text(sql), {"iid": intervention_id, "mid": mission_id}).mappings().first()
        if row is None:
            return None
        self.s.commit()
        return dict(row)

