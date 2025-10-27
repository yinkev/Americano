"""
Test enum synchronization with Prisma schema.

ADR-006: Research Analytics Infrastructure
"""

import pytest

from app.schemas.enums import EventType, CompletionQuality, EngagementLevel


class TestEnumSynchronization:
    """Verify enums match Prisma schema definitions."""

    def test_event_type_values(self):
        """Test EventType enum has all expected values from Prisma schema."""
        expected_values = {
            "MISSION_STARTED",
            "MISSION_COMPLETED",
            "CARD_REVIEWED",
            "VALIDATION_COMPLETED",
            "SESSION_STARTED",
            "SESSION_ENDED",
            "LECTURE_UPLOADED",
            "SEARCH_PERFORMED",
            "GRAPH_VIEWED",
            "RECOMMENDATION_VIEWED",
            "RECOMMENDATION_CLICKED",
            "RECOMMENDATION_DISMISSED",
            "RECOMMENDATION_RATED",
        }

        actual_values = set(EventType.values())
        assert actual_values == expected_values, (
            f"EventType enum mismatch. "
            f"Missing: {expected_values - actual_values}, "
            f"Extra: {actual_values - expected_values}"
        )

    def test_completion_quality_values(self):
        """Test CompletionQuality enum has all expected values."""
        expected_values = {"RUSHED", "NORMAL", "THOROUGH"}

        actual_values = set(CompletionQuality.values())
        assert actual_values == expected_values

    def test_engagement_level_values(self):
        """Test EngagementLevel enum has all expected values."""
        expected_values = {"LOW", "MEDIUM", "HIGH"}

        actual_values = set(EngagementLevel.values())
        assert actual_values == expected_values

    def test_enum_values_method_returns_list(self):
        """Test that .values() returns a list (required by Pandera)."""
        assert isinstance(EventType.values(), list)
        assert isinstance(CompletionQuality.values(), list)
        assert isinstance(EngagementLevel.values(), list)

    def test_enum_members_are_strings(self):
        """Test that enum members are strings (required by Prisma)."""
        for event_type in EventType:
            assert isinstance(event_type.value, str)

        for quality in CompletionQuality:
            assert isinstance(quality.value, str)

        for level in EngagementLevel:
            assert isinstance(level.value, str)
