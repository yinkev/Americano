from __future__ import annotations

from typing import Any, Dict, List, Optional
from sqlalchemy import text
from sqlalchemy.orm import Session


class PredictionsRepo:
    def __init__(self, session: Session) -> None:
        self.s = session

    def list(
        self,
        *,
        user_id: str,
        status: Optional[str] = None,
        min_probability: float = 0.5,
    ) -> List[Dict[str, Any]]:
        sql = (
            'SELECT "id","userId","learningObjectiveId","topicId",'
            '"predictedStruggleProbability","predictionConfidence","predictionStatus",'
            '"featureVector","predictionDate","actualOutcome" '
            'FROM "struggle_predictions" '
            'WHERE "userId"=:uid AND "predictedStruggleProbability">=:min_prob'
        )
        params: Dict[str, Any] = {"uid": user_id, "min_prob": float(min_probability)}
        if status:
            sql += ' AND "predictionStatus"=:status'
            params["status"] = status
        sql += ' ORDER BY "predictionDate" ASC'
        rows = self.s.execute(text(sql), params).mappings().all()
        return [dict(r) for r in rows]

