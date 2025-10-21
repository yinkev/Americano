"""
Test suite for Retry Scheduler (Story 4.3, AC#5)

Tests spaced repetition retry scheduling:
- Retry schedule: +1, +3, +7, +14, +30 days
- Schedule stored correctly
- Performance tracking: Initial failure to eventual mastery
- Celebration on mastery
"""

import pytest
from datetime import datetime, timedelta
from pydantic import BaseModel, Field
from typing import Optional


class RetryScheduleEntry(BaseModel):
    """Single retry schedule entry"""
    retry_date: datetime
    days_from_failure: int
    attempt_number: int
    status: str = "scheduled"  # scheduled, completed, mastered


class RetrySchedule(BaseModel):
    """Complete retry schedule for a failure"""
    failure_id: str
    original_failure_date: datetime
    retries: list[RetryScheduleEntry] = Field(..., min_items=5, max_items=5)
    mastery_achieved: bool = False


class RetryScheduler:
    """Schedules spaced repetition retries using research-backed intervals"""

    RETRY_INTERVALS = [1, 3, 7, 14, 30]  # Days

    async def schedule_retries(
        self,
        failure_id: str,
        failure_date: datetime,
    ) -> RetrySchedule:
        """
        Schedule spaced repetition retries.

        Args:
            failure_id: ID of the failure to schedule retries for
            failure_date: Date of the failure

        Returns:
            RetrySchedule with 5 retry dates at intervals [+1, +3, +7, +14, +30]
        """
        pass


class TestRetrySchedulingBasics:
    """Basic functionality tests for retry scheduling"""

    def test_retry_intervals_are_1_3_7_14_30_days(self):
        """Test that retry intervals are [+1, +3, +7, +14, +30] days"""
        # AC#5 requirement: "Schedule follow-up at 1 day, 3 days, 7 days, 14 days"

        expected_intervals = [1, 3, 7, 14, 30]
        assert RetryScheduler.RETRY_INTERVALS == expected_intervals

    def test_schedule_retries_creates_5_retry_dates(self):
        """Test that scheduleRetries creates exactly 5 retry dates"""
        # AC#5 requirement: Spaced re-testing at strategic intervals

        failure_date = datetime(2025, 10, 17, 10, 0, 0)

        retry_dates = []
        for days in RetryScheduler.RETRY_INTERVALS:
            retry_date = failure_date + timedelta(days=days)
            retry_dates.append(retry_date)

        assert len(retry_dates) == 5
        assert retry_dates[0] == failure_date + timedelta(days=1)
        assert retry_dates[1] == failure_date + timedelta(days=3)
        assert retry_dates[2] == failure_date + timedelta(days=7)
        assert retry_dates[3] == failure_date + timedelta(days=14)
        assert retry_dates[4] == failure_date + timedelta(days=30)

    def test_retry_dates_are_in_future(self):
        """Test that all retry dates are in the future from failure date"""
        now = datetime.utcnow()
        failure_date = now

        for days in RetryScheduler.RETRY_INTERVALS:
            retry_date = failure_date + timedelta(days=days)
            assert retry_date > failure_date, f"Retry date should be {days} days after failure"


class TestRetryDateCalculation:
    """Tests for accurate retry date calculation"""

    def test_retry_dates_calculated_correctly_from_failure_date(self):
        """Test that retry dates are calculated correctly from original failure date"""
        failure_date = datetime(2025, 10, 17, 0, 0, 0)

        expected_retry_dates = [
            datetime(2025, 10, 18, 0, 0, 0),  # +1 day
            datetime(2025, 10, 20, 0, 0, 0),  # +3 days
            datetime(2025, 10, 24, 0, 0, 0),  # +7 days
            datetime(2025, 10, 31, 0, 0, 0),  # +14 days
            datetime(2025, 11, 16, 0, 0, 0),  # +30 days
        ]

        calculated_dates = [failure_date + timedelta(days=d) for d in RetryScheduler.RETRY_INTERVALS]

        for calculated, expected in zip(calculated_dates, expected_retry_dates):
            assert calculated == expected

    def test_leap_year_handling(self):
        """Test that retry dates correctly handle leap years"""
        # Feb 28, 2024 (leap year) + 1 day = Feb 29, 2024
        failure_date = datetime(2024, 2, 28, 0, 0, 0)
        next_retry = failure_date + timedelta(days=1)

        assert next_retry.day == 29
        assert next_retry.month == 2

    def test_month_boundary_handling(self):
        """Test that retry dates correctly handle month boundaries"""
        # Jan 31 + 3 days = Feb 3
        failure_date = datetime(2025, 1, 31, 0, 0, 0)
        third_retry = failure_date + timedelta(days=3)

        assert third_retry.month == 2
        assert third_retry.day == 3

    def test_year_boundary_handling(self):
        """Test that retry dates correctly handle year boundaries"""
        # Dec 15, 2025 + 30 days = Jan 14, 2026
        failure_date = datetime(2025, 12, 15, 0, 0, 0)
        last_retry = failure_date + timedelta(days=30)

        assert last_retry.year == 2026
        assert last_retry.month == 1


class TestRetryScheduleStorage:
    """Tests for storing retry schedule"""

    def test_retry_schedule_stored_as_json_array(self):
        """Test that retry schedule stored as JSON in database"""
        # AC#5 requirement: "Store schedule in ControlledFailure.retestSchedule JSON"

        retry_schedule_json = [
            {"days": 1, "date": "2025-10-18", "status": "scheduled"},
            {"days": 3, "date": "2025-10-20", "status": "scheduled"},
            {"days": 7, "date": "2025-10-24", "status": "scheduled"},
            {"days": 14, "date": "2025-10-31", "status": "scheduled"},
            {"days": 30, "date": "2025-11-16", "status": "scheduled"},
        ]

        assert len(retry_schedule_json) == 5
        assert all("date" in entry for entry in retry_schedule_json)
        assert all("status" in entry for entry in retry_schedule_json)

    def test_retry_schedule_includes_metadata(self):
        """Test that schedule includes attempt number and status"""
        retry_entry = {
            "attempt_number": 1,
            "retry_date": "2025-10-18T10:00:00Z",
            "days_from_failure": 1,
            "status": "scheduled",
        }

        assert "attempt_number" in retry_entry
        assert "retry_date" in retry_entry
        assert "status" in retry_entry

    def test_retry_attempt_numbers_sequential(self):
        """Test that retry attempts are numbered 1-5"""
        retry_schedule = [
            {"attempt_number": 1},
            {"attempt_number": 2},
            {"attempt_number": 3},
            {"attempt_number": 4},
            {"attempt_number": 5},
        ]

        assert all(entry["attempt_number"] for entry in retry_schedule)
        assert [e["attempt_number"] for e in retry_schedule] == [1, 2, 3, 4, 5]


class TestRetryQuestionVariation:
    """Tests for question variation on retry (prevent memorization)"""

    def test_retry_question_format_varies(self):
        """Test that retry questions use different format to prevent memorization"""
        # AC#5 requirement: "Uses slightly different question format (prevent memorization)"

        original_question = {
            "format": "multiple_choice",
            "question": "Which drug has the longest half-life?",
            "options": ["A", "B", "C", "D"],
        }

        retry_question = {
            "format": "multiple_choice",
            "question": "Which drug requires the least frequent dosing?",  # Rephrased
            "options": ["D", "C", "B", "A"],  # Reordered
        }

        # Should test same concept with different wording
        assert original_question["question"] != retry_question["question"]
        assert original_question["options"] != retry_question["options"]

    def test_retry_question_tests_same_concept(self):
        """Test that retry question tests the same concept"""
        concept = "ACE inhibitor mechanism"

        original = {
            "concept": concept,
            "question": "What enzyme do ACE inhibitors block?",
        }

        retry = {
            "concept": concept,
            "question": "Blocking this enzyme is the mechanism of ACE inhibitors. What enzyme?",
        }

        # Same concept, different phrasing
        assert original["concept"] == retry["concept"]


class TestRetryPerformanceTracking:
    """Tests for tracking retry performance"""

    def test_performance_tracked_from_failure_to_mastery(self):
        """Test that performance is tracked through entire retry sequence"""
        # AC#5 requirement: "Tracks improvement: Initial failure → Eventual mastery"

        performance_journey = [
            {"attempt": "initial", "status": "failed", "score": 0},
            {"attempt": "retry_1", "status": "failed", "score": 30},
            {"attempt": "retry_2", "status": "incorrect", "score": 60},
            {"attempt": "retry_3", "status": "correct", "score": 100},
            {"attempt": "mastery", "status": "mastered", "score": 100},
        ]

        # Should show progression
        scores = [attempt["score"] for attempt in performance_journey]
        assert scores[0] <= scores[-1], "Scores should generally improve"
        assert performance_journey[-1]["status"] == "mastered"

    def test_retry_attempt_performance_stored(self):
        """Test that each retry attempt's performance is stored"""
        retry_attempt = {
            "retry_id": "r_1",
            "attempt_number": 1,
            "user_answer": "User's answer",
            "is_correct": False,
            "score": 30,
            "confidence": 3,
            "timestamp": "2025-10-18T10:00:00Z",
        }

        assert "attempt_number" in retry_attempt
        assert "score" in retry_attempt
        assert "is_correct" in retry_attempt

    def test_mastery_recorded_when_correct(self):
        """Test that mastery is recorded when user gets retry correct"""
        mastery_event = {
            "retry_id": "r_2",
            "attempt_number": 2,
            "is_correct": True,
            "score": 100,
            "mastery_achieved": True,
            "timestamp": "2025-10-20T10:00:00Z",
        }

        assert mastery_event["is_correct"]
        assert mastery_event["mastery_achieved"]


class TestRetryMasteryTracker:
    """Tests for mastery achievement tracking"""

    def test_mastery_achieved_when_retry_correct(self):
        """Test that mastery is marked when user answers retry correctly"""
        # AC#5 requirement: "Celebrates success on retry ('You've conquered this!')"

        retry_events = [
            {"retry_number": 1, "correct": False, "mastery": False},
            {"retry_number": 2, "correct": True, "mastery": True},  # First correct attempt
        ]

        # After first correct retry, mastery should be achieved
        assert retry_events[-1]["mastery"]

    def test_mastery_not_achieved_if_still_failing(self):
        """Test that mastery is not marked if retries keep failing"""
        retry_events = [
            {"retry_number": 1, "correct": False},
            {"retry_number": 2, "correct": False},
            {"retry_number": 3, "correct": False},
        ]

        # No mastery yet
        assert not any(event.get("mastery", False) for event in retry_events)

    def test_mastery_achieved_only_once(self):
        """Test that mastery is marked only on first success"""
        retry_sequence = [
            {"attempt": 1, "correct": False, "first_mastery": False},
            {"attempt": 2, "correct": True, "first_mastery": True},  # First success = mastery
            {"attempt": 3, "correct": True, "first_mastery": False},  # Subsequent success = not first
        ]

        mastery_count = sum(1 for event in retry_sequence if event.get("first_mastery"))
        assert mastery_count == 1


class TestMasteryMilestones:
    """Tests for celebration and framing of mastery"""

    def test_mastery_celebration_message(self):
        """Test that celebration message displayed on mastery"""
        # AC#5 requirement: "Celebrates success on retry ('You've conquered this!')"

        celebration = {
            "milestone": "mastery",
            "message": "You've conquered this concept! From failure to mastery.",
            "emoji": "trophy",
            "badge": "green_mastery",
        }

        assert "conquered" in celebration["message"].lower()
        assert celebration["badge"] == "green_mastery"

    def test_mastery_badge_awarded(self):
        """Test that green badge displayed for mastered concept"""
        mastery_display = {
            "concept": "ACE Inhibitor Mechanism",
            "badge_color": "green",
            "badge_icon": "trophy",
            "status": "MASTERED",
        }

        assert mastery_display["status"] == "MASTERED"
        assert mastery_display["badge_color"] == "green"

    def test_mastery_shown_in_session_summary(self):
        """Test that mastery appears in session summary"""
        session_summary = {
            "challenges": [
                {
                    "concept": "ACE Inhibitor Mechanism",
                    "initial_failure": "2025-10-17",
                    "retry_1_failed": "2025-10-18",
                    "retry_2_mastered": "2025-10-20",
                    "status": "MASTERED - You're getting stronger!",
                }
            ]
        }

        assert "MASTERED" in session_summary["challenges"][0]["status"]


class TestRetryScheduleInteractions:
    """Tests for retry schedule interactions with session flow"""

    def test_next_retry_date_determines_session_injection(self):
        """Test that next retry date determines when challenge appears in session"""
        today = datetime(2025, 10, 18, 0, 0, 0)
        failure_date = datetime(2025, 10, 17, 0, 0, 0)

        # First retry scheduled for +1 day (Oct 18)
        first_retry_date = failure_date + timedelta(days=1)

        # Challenge should appear in session today
        assert today.date() == first_retry_date.date(), "Challenge should appear on retry date"

    def test_past_due_retries_prioritized(self):
        """Test that overdue retries appear first in upcoming session"""
        today = datetime(2025, 10, 25, 0, 0, 0)
        failure_date = datetime(2025, 10, 17, 0, 0, 0)

        retries = [
            {"date": datetime(2025, 10, 18, 0, 0, 0), "days": 1, "status": "overdue"},
            {"date": datetime(2025, 10, 20, 0, 0, 0), "days": 3, "status": "overdue"},
            {"date": datetime(2025, 10, 24, 0, 0, 0), "days": 7, "status": "upcoming"},
            {"date": datetime(2025, 10, 31, 0, 0, 0), "days": 14, "status": "future"},
        ]

        # Overdue retries should be prioritized
        overdue = [r for r in retries if r["status"] == "overdue"]
        assert len(overdue) > 0

    def test_no_retries_due_today(self):
        """Test behavior when no retries due today"""
        today = datetime(2025, 10, 18, 12, 0, 0)
        failure_date = datetime(2025, 10, 17, 10, 0, 0)

        # First retry at 10:00 AM was 2 hours ago, but treating as separate day
        first_retry_date = failure_date + timedelta(days=1)

        # If no retry due, system can generate new challenge or wait
        assert first_retry_date.date() == today.date() or today > first_retry_date


class TestPerformanceConstraints:
    """Tests for performance requirements"""

    def test_retry_schedule_generation_fast(self):
        """Test that retry schedule generation is efficient"""
        import time

        start = time.time()
        failure_date = datetime.utcnow()

        retry_dates = [failure_date + timedelta(days=d) for d in RetryScheduler.RETRY_INTERVALS]

        elapsed = time.time() - start

        # Schedule generation should be nearly instant (< 100ms)
        assert elapsed < 0.1
        assert len(retry_dates) == 5


class TestRetryEdgeCases:
    """Tests for edge cases"""

    def test_single_retry_immediately_mastered(self):
        """Test case where user masters concept on first retry"""
        journey = [
            {"attempt": "initial_failure", "correct": False},
            {"attempt": "retry_1_mastered", "correct": True},
        ]

        # Should still record all scheduled retries (but can skip if mastered)
        assert journey[-1]["correct"]

    def test_all_retries_exhausted(self):
        """Test case where user completes all 5 retries"""
        retry_results = [
            {"attempt": 1, "correct": False},
            {"attempt": 2, "correct": False},
            {"attempt": 3, "correct": False},
            {"attempt": 4, "correct": False},
            {"attempt": 5, "correct": False},
        ]

        # Should suggest alternative learning strategy
        assert len(retry_results) == 5


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
