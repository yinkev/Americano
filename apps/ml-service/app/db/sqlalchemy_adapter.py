from __future__ import annotations

from datetime import datetime
from typing import Iterable, List, Optional

from sqlalchemy import String, Float, DateTime, Boolean, select
from sqlalchemy.orm import Mapped, mapped_column, Session
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy import create_engine

from app.db.base import Base
from app.utils.config import settings
from app.models.predictions import PredictionDetail, PredictionStatus


def _make_engine():
    url = settings.DATABASE_URL
    # Accept psycopg3 or default postgres URL
    if url.startswith("postgresql://") or url.startswith("postgres://"):
        # Prefer psycopg v3 driver
        url = url.replace("postgresql://", "postgresql+psycopg://").replace("postgres://", "postgresql+psycopg://")
    return create_engine(url, pool_pre_ping=True)


engine = _make_engine()


class StrugglePrediction(Base):
    __tablename__ = "struggle_predictions"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    userId: Mapped[str] = mapped_column(String, index=True)
    learningObjectiveId: Mapped[Optional[str]] = mapped_column(String, index=True)
    topicId: Mapped[Optional[str]] = mapped_column(String, index=True)
    predictedStruggleProbability: Mapped[float] = mapped_column(Float)
    predictionConfidence: Mapped[float] = mapped_column(Float)
    predictionStatus: Mapped[str] = mapped_column(String, index=True)
    featureVector: Mapped[Optional[dict]] = mapped_column(JSONB)
    predictionDate: Mapped[datetime] = mapped_column(DateTime)
    actualOutcome: Mapped[Optional[bool]] = mapped_column(Boolean)


class PredictionReadRepository:
    """Read-only repository for predictions using SQLAlchemy."""

    def __init__(self, session: Session):
        self.session = session

    def list_predictions(
        self,
        *,
        user_id: str,
        status: Optional[PredictionStatus] = None,
        min_probability: float = 0.5,
    ) -> List[PredictionDetail]:
        stmt = (
            select(StrugglePrediction)
            .where(StrugglePrediction.userId == user_id)
            .where(StrugglePrediction.predictedStruggleProbability >= float(min_probability))
            .order_by(StrugglePrediction.predictionDate.asc())
        )
        if status is not None:
            stmt = stmt.where(StrugglePrediction.predictionStatus == status.value)

        rows = self.session.execute(stmt).scalars().all()

        out: List[PredictionDetail] = []
        for r in rows:
            risk = (
                "HIGH" if r.predictedStruggleProbability >= 0.7
                else "MEDIUM" if r.predictedStruggleProbability >= 0.4
                else "LOW"
            )
            detail = PredictionDetail(
                id=r.id,
                user_id=r.userId,
                learning_objective_id=r.learningObjectiveId,
                topic_id=r.topicId,
                prediction_date=r.predictionDate,
                predicted_struggle_probability=r.predictedStruggleProbability,
                prediction_confidence=r.predictionConfidence,
                prediction_status=PredictionStatus(r.predictionStatus),
                feature_vector=r.featureVector or {},
                risk_level=risk,
                reasoning="",
            )
            out.append(detail)
        return out


def get_sqlalchemy_session() -> Session:
    return Session(engine)


class InterventionRecommendation(Base):
    __tablename__ = "intervention_recommendations"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    userId: Mapped[str] = mapped_column(String, index=True)
    predictionId: Mapped[Optional[str]] = mapped_column(String, index=True)
    interventionType: Mapped[str] = mapped_column(String)
    description: Mapped[str] = mapped_column(String)
    reasoning: Mapped[str] = mapped_column(String)
    priority: Mapped[int] = mapped_column()
    status: Mapped[str] = mapped_column(String, index=True)
    relatedObjectiveId: Mapped[Optional[str]] = mapped_column(String)
    appliedToMissionId: Mapped[Optional[str]] = mapped_column(String)
    appliedAt: Mapped[Optional[datetime]] = mapped_column(DateTime)
    createdAt: Mapped[datetime] = mapped_column(DateTime)


class InterventionRepository:
    def __init__(self, session: Session):
        self.session = session

    def list_active(self, user_id: str):
        stmt = select(InterventionRecommendation).where(
            InterventionRecommendation.userId == user_id,
            InterventionRecommendation.status.in_(["PENDING", "IN_PROGRESS"]),
        ).order_by(InterventionRecommendation.priority.desc())
        return self.session.execute(stmt).scalars().all()

    def apply(self, intervention_id: str, mission_id: str):
        now = datetime.utcnow()
        rec = self.session.get(InterventionRecommendation, intervention_id)
        if not rec:
            return None
        rec.status = "IN_PROGRESS"
        rec.appliedAt = now
        rec.appliedToMissionId = mission_id
        self.session.add(rec)
        self.session.commit()
        self.session.refresh(rec)
        return rec
