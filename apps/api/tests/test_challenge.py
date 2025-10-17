"""
Tests for Story 4.3 Tasks 4-5: Corrective Feedback and Retry Scheduling.
"""

from datetime import datetime, date, timedelta
import pytest

from src.challenge.models import FeedbackRequest, RetryScheduleRequest
from src.challenge.retry_scheduler import RetryScheduler


class TestRetryScheduler:
    """Test RetryScheduler class (Task 5)."""

    def test_schedule_retries_returns_correct_intervals(self):
        """Test that retry scheduler returns correct spaced repetition intervals."""
        scheduler = RetryScheduler()
        
        # Create request
        failure_date = datetime(2025, 10, 17, 10, 0, 0)
        request = RetryScheduleRequest(
            failure_id="test_failure_001",
            failed_at=failure_date
        )
        
        # Schedule retries
        response = scheduler.schedule_retries(request)
        
        # Verify response structure
        assert response.failure_id == "test_failure_001"
        assert len(response.retry_dates) == 5
        assert response.retry_intervals_days == [1, 3, 7, 14, 30]
        
        # Verify dates are correct
        expected_dates = [
            date(2025, 10, 18),  # +1 day
            date(2025, 10, 20),  # +3 days
            date(2025, 10, 24),  # +7 days
            date(2025, 10, 31),  # +14 days
            date(2025, 11, 16),  # +30 days
        ]
        
        assert response.retry_dates == expected_dates
        
        # Verify reasoning and strategy are present
        assert len(response.reasoning) > 0
        assert len(response.variation_strategy) > 0
        assert "spaced repetition" in response.reasoning.lower()
        assert "memorization" in response.variation_strategy.lower()

    def test_get_next_due_retry(self):
        """Test getting next due retry date."""
        scheduler = RetryScheduler()
        failure_date = datetime(2025, 10, 17, 10, 0, 0)
        
        # First retry (0 completed)
        next_retry = scheduler.get_next_due_retry(failure_date, 0)
        assert next_retry == date(2025, 10, 18)
        
        # Second retry (1 completed)
        next_retry = scheduler.get_next_due_retry(failure_date, 1)
        assert next_retry == date(2025, 10, 20)
        
        # All retries completed (5 completed)
        next_retry = scheduler.get_next_due_retry(failure_date, 5)
        assert next_retry is None

    def test_check_if_retry_due(self):
        """Test checking if retry is due."""
        scheduler = RetryScheduler()
        
        retry_dates = [
            date(2025, 10, 18),
            date(2025, 10, 20),
            date(2025, 10, 24),
            date(2025, 10, 31),
            date(2025, 11, 16),
        ]
        
        # First retry due on 2025-10-18
        assert scheduler.check_if_retry_due(retry_dates, 0, date(2025, 10, 18)) is True
        assert scheduler.check_if_retry_due(retry_dates, 0, date(2025, 10, 17)) is False
        
        # Second retry due on 2025-10-20 (1 completed)
        assert scheduler.check_if_retry_due(retry_dates, 1, date(2025, 10, 20)) is True
        assert scheduler.check_if_retry_due(retry_dates, 1, date(2025, 10, 19)) is False
        
        # All retries completed
        assert scheduler.check_if_retry_due(retry_dates, 5, date(2025, 11, 20)) is False

    def test_get_retry_progress(self):
        """Test retry progress calculation."""
        scheduler = RetryScheduler()
        
        retry_dates = [
            date(2025, 10, 18),
            date(2025, 10, 20),
            date(2025, 10, 24),
            date(2025, 10, 31),
            date(2025, 11, 16),
        ]
        
        # Initial failure (0 completed)
        progress = scheduler.get_retry_progress(retry_dates, 0)
        assert progress["status"] == "INITIAL_FAILURE"
        assert progress["completed_retries"] == 0
        assert progress["total_retries"] == 5
        assert progress["remaining_retries"] == 5
        assert progress["progress_percentage"] == 0
        assert progress["next_retry_date"] == "2025-10-18"
        
        # In progress (2 completed)
        progress = scheduler.get_retry_progress(retry_dates, 2)
        assert progress["status"] == "IN_PROGRESS"
        assert progress["completed_retries"] == 2
        assert progress["remaining_retries"] == 3
        assert progress["progress_percentage"] == 40
        assert progress["next_retry_date"] == "2025-10-24"
        
        # Mastered (5 completed)
        progress = scheduler.get_retry_progress(retry_dates, 5)
        assert progress["status"] == "MASTERED"
        assert progress["completed_retries"] == 5
        assert progress["remaining_retries"] == 0
        assert progress["progress_percentage"] == 100
        assert progress["next_retry_date"] is None


class TestFeedbackModels:
    """Test Pydantic models for feedback (Task 4)."""

    def test_feedback_request_validation(self):
        """Test FeedbackRequest model validation."""
        # Valid request
        request = FeedbackRequest(
            challenge_id="test_001",
            user_answer="ACE inhibitors block aldosterone",
            correct_answer="ACE inhibitors reduce aldosterone secretion",
            objective_text="Explain ACE inhibitor mechanism",
            misconception_type="partial_understanding"
        )
        
        assert request.challenge_id == "test_001"
        assert request.misconception_type == "partial_understanding"
        
    def test_retry_schedule_request_validation(self):
        """Test RetryScheduleRequest model validation."""
        # Valid request
        request = RetryScheduleRequest(
            failure_id="test_failure_001",
            failed_at=datetime.utcnow()
        )
        
        assert request.failure_id == "test_failure_001"
        assert isinstance(request.failed_at, datetime)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
