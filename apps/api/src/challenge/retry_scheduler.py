"""
RetryScheduler for Story 4.3 Task 5.

Generates spaced repetition retry schedules using the intervals:
[+1 day, +3 days, +7 days, +14 days, +30 days]

Implements evidence-based spaced repetition for memory consolidation.
"""

from datetime import datetime, date, timedelta
from typing import List

from .models import RetryScheduleRequest, RetryScheduleResponse


class RetryScheduler:
    """
    Generates retry schedules for failed challenges using spaced repetition.

    Intervals based on cognitive psychology research:
    - Day 1: Initial re-test (did corrective feedback stick?)
    - Day 3: Short-term consolidation
    - Day 7: Medium-term retention
    - Day 14: Long-term encoding
    - Day 30: Mastery verification

    Reference: "Make It Stick" (Brown, Roediger, McDaniel) - desirable difficulty
    """

    # Spaced repetition intervals (days from failure)
    RETRY_INTERVALS = [1, 3, 7, 14, 30]

    def __init__(self):
        """Initialize the retry scheduler."""
        pass

    def schedule_retries(self, request: RetryScheduleRequest) -> RetryScheduleResponse:
        """
        Generate retry schedule for a failed challenge.

        Calculates 5 retry dates based on spaced repetition intervals.
        Each retry will use varied question format to test understanding,
        not memorization.

        Args:
            request: RetryScheduleRequest with failure context

        Returns:
            RetryScheduleResponse with retry dates and strategy
        """
        failure_date = request.failed_at.date() if isinstance(request.failed_at, datetime) else request.failed_at

        # Calculate retry dates
        retry_dates = self._calculate_retry_dates(failure_date)

        # Build response with reasoning
        return RetryScheduleResponse(
            failure_id=request.failure_id,
            retry_dates=retry_dates,
            retry_intervals_days=self.RETRY_INTERVALS,
            reasoning=self._get_reasoning(),
            variation_strategy=self._get_variation_strategy()
        )

    def _calculate_retry_dates(self, failure_date: date) -> List[date]:
        """
        Calculate retry dates from failure date using spaced intervals.

        Args:
            failure_date: Date when the failure occurred

        Returns:
            List of 5 retry dates [+1d, +3d, +7d, +14d, +30d]
        """
        retry_dates = []
        for interval in self.RETRY_INTERVALS:
            retry_date = failure_date + timedelta(days=interval)
            retry_dates.append(retry_date)

        return retry_dates

    def _get_reasoning(self) -> str:
        """
        Get explanation of the spaced repetition schedule.

        Returns:
            Human-readable reasoning for the schedule
        """
        return (
            "Spaced repetition schedule optimizes long-term memory consolidation. "
            "The short initial interval (1 day) tests if the corrective feedback stuck. "
            "Expanding intervals (3, 7, 14, 30 days) strengthen memory retrieval pathways "
            "and promote durable learning. Each successful retry makes the next interval more "
            "effective for long-term retention."
        )

    def _get_variation_strategy(self) -> str:
        """
        Get explanation of how retry questions will vary.

        Returns:
            Description of variation strategy to prevent memorization
        """
        return (
            "Each retry uses slightly different question formats to test understanding, "
            "not memorization of specific wording. Variations include: (1) different clinical "
            "scenarios applying the same concept, (2) varied distractor options testing the same "
            "misconception, (3) reversed question format (e.g., 'Which is FALSE?' vs 'Which is TRUE?'), "
            "(4) different patient demographics or presentations. This ensures mastery of the underlying "
            "concept, not pattern recognition."
        )

    def get_next_due_retry(
        self,
        failure_date: datetime,
        completed_retry_count: int
    ) -> date | None:
        """
        Get the next retry date based on how many retries have been completed.

        Args:
            failure_date: When the original failure occurred
            completed_retry_count: How many retries have been completed (0-4)

        Returns:
            Next retry date, or None if all retries completed
        """
        if completed_retry_count >= len(self.RETRY_INTERVALS):
            return None  # All retries completed - mastery achieved!

        failure_date_obj = failure_date.date() if isinstance(failure_date, datetime) else failure_date
        next_interval = self.RETRY_INTERVALS[completed_retry_count]
        next_retry = failure_date_obj + timedelta(days=next_interval)

        return next_retry

    def check_if_retry_due(
        self,
        retry_schedule: List[date],
        completed_retry_count: int,
        current_date: date | None = None
    ) -> bool:
        """
        Check if the next retry is due based on current date.

        Args:
            retry_schedule: List of scheduled retry dates
            completed_retry_count: How many retries completed so far
            current_date: Current date (defaults to today)

        Returns:
            True if next retry is due, False otherwise
        """
        if current_date is None:
            current_date = date.today()

        if completed_retry_count >= len(retry_schedule):
            return False  # All retries completed

        next_retry_date = retry_schedule[completed_retry_count]
        return current_date >= next_retry_date

    def get_retry_progress(
        self,
        retry_schedule: List[date],
        completed_retry_count: int
    ) -> dict:
        """
        Get progress information for retry schedule.

        Args:
            retry_schedule: List of scheduled retry dates
            completed_retry_count: How many retries completed

        Returns:
            Dictionary with progress information
        """
        total_retries = len(retry_schedule)
        completed = completed_retry_count
        remaining = total_retries - completed

        if remaining == 0:
            status = "MASTERED"
            next_retry = None
        elif completed == 0:
            status = "INITIAL_FAILURE"
            next_retry = retry_schedule[0]
        else:
            status = "IN_PROGRESS"
            next_retry = retry_schedule[completed] if completed < total_retries else None

        return {
            "status": status,
            "completed_retries": completed,
            "total_retries": total_retries,
            "remaining_retries": remaining,
            "next_retry_date": next_retry.isoformat() if next_retry else None,
            "progress_percentage": round((completed / total_retries) * 100, 1)
        }
