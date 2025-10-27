"""
Enum definitions synchronized with Prisma schema.

These enums are extracted from prisma/schema.prisma and should be
updated whenever the Prisma schema changes.

IMPORTANT: Manually sync with Prisma schema after enum changes.

ADR-006: Research Analytics Infrastructure
"""

from enum import Enum
from typing import List


class PrismaEnum:
    """Mixin for Prisma enum wrappers."""

    @classmethod
    def values(cls) -> List[str]:
        """Return list of enum values for Pandera validation."""
        return [member.value for member in cls]


class EventType(PrismaEnum, str, Enum):
    """
    Corresponds to Prisma enum EventType.

    ```prisma
    enum EventType {
      MISSION_STARTED
      MISSION_COMPLETED
      CARD_REVIEWED
      VALIDATION_COMPLETED
      SESSION_STARTED
      SESSION_ENDED
      LECTURE_UPLOADED
      SEARCH_PERFORMED
      GRAPH_VIEWED
      RECOMMENDATION_VIEWED
      RECOMMENDATION_CLICKED
      RECOMMENDATION_DISMISSED
      RECOMMENDATION_RATED
    }
    ```
    """

    MISSION_STARTED = "MISSION_STARTED"
    MISSION_COMPLETED = "MISSION_COMPLETED"
    CARD_REVIEWED = "CARD_REVIEWED"
    VALIDATION_COMPLETED = "VALIDATION_COMPLETED"
    SESSION_STARTED = "SESSION_STARTED"
    SESSION_ENDED = "SESSION_ENDED"
    LECTURE_UPLOADED = "LECTURE_UPLOADED"
    SEARCH_PERFORMED = "SEARCH_PERFORMED"
    GRAPH_VIEWED = "GRAPH_VIEWED"
    RECOMMENDATION_VIEWED = "RECOMMENDATION_VIEWED"
    RECOMMENDATION_CLICKED = "RECOMMENDATION_CLICKED"
    RECOMMENDATION_DISMISSED = "RECOMMENDATION_DISMISSED"
    RECOMMENDATION_RATED = "RECOMMENDATION_RATED"


class CompletionQuality(PrismaEnum, str, Enum):
    """
    Corresponds to Prisma enum CompletionQuality.

    ```prisma
    enum CompletionQuality {
      RUSHED
      NORMAL
      THOROUGH
    }
    ```
    """

    RUSHED = "RUSHED"
    NORMAL = "NORMAL"
    THOROUGH = "THOROUGH"


class EngagementLevel(PrismaEnum, str, Enum):
    """
    Corresponds to Prisma enum EngagementLevel.

    ```prisma
    enum EngagementLevel {
      LOW
      MEDIUM
      HIGH
    }
    ```
    """

    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
