"""
FastAPI routes for challenge generation and failure pattern detection (Story 4.3).

Includes:
- Task 4: Corrective Feedback Engine endpoints
- Task 5: Retry Scheduler endpoints
- Task 6: Failure Pattern Detection endpoints
"""

from fastapi import APIRouter, HTTPException, status
from typing import List
import logging

from .models import (
    PatternDetectionRequest,
    PatternDetectionResponse,
    ControlledFailureRecord,
    FeedbackRequest,
    FeedbackResponse,
    RetryScheduleRequest,
    RetryScheduleResponse,
)
from .corrective_feedback_engine import CorrectiveFeedbackEngine
from .retry_scheduler import RetryScheduler
from .failure_pattern_detector import FailurePatternDetector


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/challenge", tags=["challenge"])

# Initialize engines
feedback_engine = CorrectiveFeedbackEngine()
retry_scheduler = RetryScheduler()


# ============================================================================
# Task 4: Corrective Feedback Engine Endpoints
# ============================================================================

@router.post(
    "/feedback",
    response_model=FeedbackResponse,
    summary="Generate corrective feedback for failed challenge",
    description="""
    Generates detailed corrective feedback using ChatMock (GPT-5) via instructor.

    Implements Story 4.3 Task 4 (AC#3, #4):
    - Explains why user's answer was wrong (misconception)
    - Clarifies correct concept with clinical context
    - Provides real-world patient scenario
    - Creates memorable anchor (mnemonic, visual analogy, patient story)

    Feedback Rubric:
    1. misconception_explained: Clear explanation of the error
    2. correct_concept: Correct understanding with clinical reasoning
    3. clinical_context: Patient scenario demonstrating the concept
    4. memory_anchor: Memorable mnemonic/analogy/story for retention

    The response includes fields for emotion tagging and personal notes,
    which are captured in the UI after feedback is shown.
    """
)
async def generate_feedback(
    request: FeedbackRequest
) -> FeedbackResponse:
    """
    Generate corrective feedback for an incorrect answer.

    Args:
        request: FeedbackRequest with challenge context and answers

    Returns:
        FeedbackResponse with structured feedback

    Raises:
        HTTPException: 500 if feedback generation fails
    """
    try:
        logger.info(f"Generating feedback for challenge {request.challenge_id}")

        # Generate feedback using instructor for structured outputs
        response = await feedback_engine.generate_feedback(request)

        logger.info(
            f"Generated {response.feedback.memory_anchor_type} feedback "
            f"for challenge {request.challenge_id}"
        )

        return response

    except Exception as e:
        logger.error(f"Feedback generation failed for challenge {request.challenge_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate corrective feedback: {str(e)}"
        )


# ============================================================================
# Task 5: Retry Scheduler Endpoints
# ============================================================================

@router.post(
    "/schedule-retries",
    response_model=RetryScheduleResponse,
    summary="Schedule spaced repetition retries for failed challenge",
    description="""
    Generates retry schedule using spaced repetition intervals: [+1, +3, +7, +14, +30 days].

    Implements Story 4.3 Task 5 (AC#5):
    - Calculates 5 retry dates from failure date
    - Uses evidence-based spaced repetition intervals
    - Returns variation strategy to prevent memorization
    - Includes reasoning for transparency

    Spaced Repetition Schedule:
    - Day 1: Initial re-test (did corrective feedback stick?)
    - Day 3: Short-term consolidation
    - Day 7: Medium-term retention
    - Day 14: Long-term encoding
    - Day 30: Mastery verification

    Each retry uses varied question format to test understanding, not memorization.
    """
)
async def schedule_retries(
    request: RetryScheduleRequest
) -> RetryScheduleResponse:
    """
    Generate retry schedule for a failed challenge.

    Args:
        request: RetryScheduleRequest with failure context

    Returns:
        RetryScheduleResponse with retry dates and strategy

    Raises:
        HTTPException: 400 if request is invalid, 500 if scheduling fails
    """
    try:
        logger.info(f"Scheduling retries for failure {request.failure_id}")

        # Generate retry schedule
        response = retry_scheduler.schedule_retries(request)

        logger.info(
            f"Scheduled {len(response.retry_dates)} retries for failure {request.failure_id}. "
            f"Next retry: {response.retry_dates[0]}"
        )

        return response

    except ValueError as e:
        logger.error(f"Invalid retry schedule request for {request.failure_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid request: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Retry scheduling failed for {request.failure_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to schedule retries: {str(e)}"
        )


# ============================================================================
# Task 6: Failure Pattern Detection Endpoints
# ============================================================================

@router.post(
    "/detect-patterns",
    response_model=PatternDetectionResponse,
    summary="Detect failure patterns for a user",
    description="""
    Analyzes user's failed validation attempts to identify systematic patterns.

    Implements Story 4.3 Task 6 (AC#6):
    - Groups failed concepts by category (course, topic, boardExamTag)
    - Detects systematic errors (frequency analysis)
    - Generates remediation recommendations
    - Returns top patterns ranked by frequency

    Algorithm (MVP - Frequency Analysis):
    1. Fetch all failed validation attempts (score < 60%) for user
    2. Group failures by: category, topic tags, board exam tags
    3. Identify patterns with frequency >= threshold (default: 3)
    4. Generate remediation text using templates
    5. Return top 10 patterns ranked by frequency
    """
)
async def detect_patterns(
    request: PatternDetectionRequest
) -> PatternDetectionResponse:
    """
    Detect failure patterns for a user.

    This endpoint would typically:
    1. Query database for user's failed ValidationResponse records
    2. Transform into ControlledFailureRecord format
    3. Run pattern detection algorithm
    4. Store detected patterns in FailurePattern model (database)
    5. Return patterns for "Common Pitfalls" dashboard

    For now, this is a standalone implementation that takes failures as input.
    Integration with Prisma/database would be added via TypeScript API proxy.

    Args:
        request: PatternDetectionRequest with user_id and optional min_frequency

    Returns:
        PatternDetectionResponse with detected patterns

    Raises:
        HTTPException: 500 if pattern detection fails
    """
    try:
        logger.info(f"Detecting patterns for user {request.user_id}")

        # In production, this would query the database via Prisma
        # For now, this demonstrates the algorithm with mock data
        # The TypeScript API proxy will handle database queries

        # Initialize detector
        detector = FailurePatternDetector(min_frequency=request.min_frequency)

        # Mock data for demonstration (in production, fetch from database)
        # This would be replaced with actual database query in TypeScript proxy
        failures: List[ControlledFailureRecord] = []

        # Note: In production workflow:
        # 1. TypeScript API route receives request
        # 2. TypeScript queries Prisma for ValidationResponse records
        # 3. TypeScript transforms to ControlledFailureRecord format
        # 4. TypeScript calls this Python endpoint with failures data
        # 5. Python runs pattern detection algorithm
        # 6. TypeScript stores patterns in database
        # 7. TypeScript returns patterns to client

        # For testing/demo, we'll return empty patterns with proper structure
        logger.warning(
            "No failures provided - in production, fetch from database. "
            "Returning empty pattern list."
        )

        patterns = await detector.detect_patterns(
            user_id=request.user_id,
            failures=failures,
            lookback_days=30
        )

        response = PatternDetectionResponse(
            patterns=patterns,
            total_patterns=len(patterns)
        )

        logger.info(f"Detected {len(patterns)} patterns for user {request.user_id}")
        return response

    except Exception as e:
        logger.error(f"Pattern detection failed for user {request.user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Pattern detection failed: {str(e)}"
        )


@router.post(
    "/detect-patterns-with-data",
    response_model=PatternDetectionResponse,
    summary="Detect patterns with provided failure data",
    description="""
    Testing endpoint that accepts failure data directly.

    This is useful for:
    - Testing the pattern detection algorithm
    - Integration testing from TypeScript
    - Demonstration purposes

    In production, use /detect-patterns which fetches from database.
    """
)
async def detect_patterns_with_data(
    user_id: str,
    failures: List[ControlledFailureRecord],
    min_frequency: int = 3,
    lookback_days: int = 30
) -> PatternDetectionResponse:
    """
    Detect patterns with provided failure data (for testing).

    Args:
        user_id: User ID to analyze
        failures: List of failure records
        min_frequency: Minimum frequency threshold (default: 3)
        lookback_days: Only consider failures within this window (default: 30)

    Returns:
        PatternDetectionResponse with detected patterns

    Raises:
        HTTPException: 500 if pattern detection fails
    """
    try:
        logger.info(f"Detecting patterns for user {user_id} with {len(failures)} failures")

        detector = FailurePatternDetector(min_frequency=min_frequency)

        patterns = await detector.detect_patterns(
            user_id=user_id,
            failures=failures,
            lookback_days=lookback_days
        )

        response = PatternDetectionResponse(
            patterns=patterns,
            total_patterns=len(patterns)
        )

        logger.info(f"Detected {len(patterns)} patterns for user {user_id}")
        return response

    except Exception as e:
        logger.error(f"Pattern detection failed for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Pattern detection failed: {str(e)}"
        )
