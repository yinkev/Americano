"""
Data validation schemas using Pandera.

Provides type-safe data validation for ML pipelines and research analytics.

ADR-006: Research Analytics Infrastructure

Usage:
    from app.schemas import BehavioralEventSchema, validate_strict

    df = pd.read_parquet("data/raw/behavioral_events_latest.parquet")
    validated_df = validate_strict(df)
"""

from .behavioral_events import (
    BehavioralEventSchema,
    validate_behavioral_events,
    validate_with_report,
)
from .enums import EventType, CompletionQuality, EngagementLevel

__all__ = [
    # Schemas
    "BehavioralEventSchema",
    # Validators
    "validate_behavioral_events",
    "validate_with_report",
    # Enums
    "EventType",
    "CompletionQuality",
    "EngagementLevel",
]
