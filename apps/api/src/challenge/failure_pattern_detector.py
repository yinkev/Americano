"""
Failure Pattern Detector for Story 4.3 Task 6.

Analyzes user's failed attempts to identify systematic patterns and misconceptions.
Uses frequency analysis (MVP) to group failures by category, topic, and error type.
"""

from collections import Counter, defaultdict
from datetime import datetime, timedelta
from typing import List, Dict
import logging

from .models import FailurePattern, ControlledFailureRecord


logger = logging.getLogger(__name__)


class FailurePatternDetector:
    """
    Detects failure patterns from user's validation responses.

    Implements AC#6: Performance Pattern Analysis
    - Groups failed concepts by category (course, topic, boardExamTag)
    - Detects systematic errors (frequency analysis)
    - Generates remediation recommendations
    - Stores patterns in FailurePattern model (via API endpoint)

    Algorithm (MVP - Frequency Analysis):
    1. Fetch all failed validation attempts (score < 60%) for user
    2. Group failures by: category, topic tags, board exam tags
    3. Identify patterns with frequency >= threshold (default: 3)
    4. Generate remediation text using ChatMock (future) or templates (MVP)
    5. Return top patterns ranked by frequency
    """

    def __init__(self, min_frequency: int = 3):
        """
        Initialize detector with minimum frequency threshold.

        Args:
            min_frequency: Minimum number of failures to consider a pattern (default: 3)
        """
        self.min_frequency = min_frequency

    async def detect_patterns(
        self,
        user_id: str,
        failures: List[ControlledFailureRecord],
        lookback_days: int = 30
    ) -> List[FailurePattern]:
        """
        Detect failure patterns for a user from their failed attempts.

        Args:
            user_id: User ID to analyze
            failures: List of failed validation attempts
            lookback_days: Only consider failures within this window (default: 30)

        Returns:
            List of detected patterns, ranked by frequency (most common first)

        Algorithm:
            1. Filter failures within lookback window
            2. Group by category (course)
            3. Group by topic tags
            4. Group by board exam tags
            5. Identify systematic error patterns
            6. Generate remediation recommendations
            7. Rank by frequency and return top patterns
        """
        logger.info(f"Detecting patterns for user {user_id} from {len(failures)} failures")

        # Filter recent failures
        cutoff_date = datetime.utcnow() - timedelta(days=lookback_days)
        recent_failures = [
            f for f in failures
            if f.responded_at >= cutoff_date and (not f.is_correct or f.score < 0.6)
        ]

        if len(recent_failures) < self.min_frequency:
            logger.info(f"Insufficient failures ({len(recent_failures)}) for pattern detection")
            return []

        logger.info(f"Analyzing {len(recent_failures)} recent failures")

        patterns: List[FailurePattern] = []

        # 1. Detect category-based patterns (by course)
        category_patterns = self._detect_category_patterns(user_id, recent_failures)
        patterns.extend(category_patterns)

        # 2. Detect topic-based patterns
        topic_patterns = self._detect_topic_patterns(user_id, recent_failures)
        patterns.extend(topic_patterns)

        # 3. Detect board exam tag patterns
        board_exam_patterns = self._detect_board_exam_patterns(user_id, recent_failures)
        patterns.extend(board_exam_patterns)

        # 4. Detect systematic error patterns (concept-level)
        systematic_patterns = self._detect_systematic_errors(user_id, recent_failures)
        patterns.extend(systematic_patterns)

        # Sort by frequency (most common first) and return top patterns
        patterns.sort(key=lambda p: p.frequency, reverse=True)

        logger.info(f"Detected {len(patterns)} patterns for user {user_id}")
        return patterns[:10]  # Return top 10 patterns

    def _detect_category_patterns(
        self,
        user_id: str,
        failures: List[ControlledFailureRecord]
    ) -> List[FailurePattern]:
        """
        Group failures by course/category and identify patterns.

        Args:
            user_id: User ID
            failures: Failed attempts

        Returns:
            List of category-based failure patterns
        """
        # Group by course
        course_failures: Dict[str, List[ControlledFailureRecord]] = defaultdict(list)
        for failure in failures:
            if failure.course_name:
                course_failures[failure.course_name].append(failure)

        patterns: List[FailurePattern] = []
        for course_name, course_fails in course_failures.items():
            if len(course_fails) >= self.min_frequency:
                affected_objectives = list(set(f.objective_id for f in course_fails))
                patterns.append(FailurePattern(
                    user_id=user_id,
                    pattern_type="category",
                    pattern_description=f"Struggles with {course_name}",
                    affected_objectives=affected_objectives,
                    frequency=len(course_fails),
                    remediation=self._generate_category_remediation(course_name, len(course_fails))
                ))

        return patterns

    def _detect_topic_patterns(
        self,
        user_id: str,
        failures: List[ControlledFailureRecord]
    ) -> List[FailurePattern]:
        """
        Group failures by topic tags and identify patterns.

        Args:
            user_id: User ID
            failures: Failed attempts

        Returns:
            List of topic-based failure patterns
        """
        # Flatten all topic tags
        all_topics: List[str] = []
        topic_to_objectives: Dict[str, List[str]] = defaultdict(list)

        for failure in failures:
            for topic in failure.topic_tags:
                all_topics.append(topic)
                topic_to_objectives[topic].append(failure.objective_id)

        # Count topic frequencies
        topic_counts = Counter(all_topics)

        patterns: List[FailurePattern] = []
        for topic, count in topic_counts.items():
            if count >= self.min_frequency:
                affected_objectives = list(set(topic_to_objectives[topic]))
                patterns.append(FailurePattern(
                    user_id=user_id,
                    pattern_type="topic",
                    pattern_description=f"Struggles with topic: {topic}",
                    affected_objectives=affected_objectives,
                    frequency=count,
                    remediation=self._generate_topic_remediation(topic, count)
                ))

        return patterns

    def _detect_board_exam_patterns(
        self,
        user_id: str,
        failures: List[ControlledFailureRecord]
    ) -> List[FailurePattern]:
        """
        Group failures by board exam tags and identify patterns.

        Args:
            user_id: User ID
            failures: Failed attempts

        Returns:
            List of board exam tag-based failure patterns
        """
        # Flatten all board exam tags
        all_tags: List[str] = []
        tag_to_objectives: Dict[str, List[str]] = defaultdict(list)

        for failure in failures:
            for tag in failure.board_exam_tags:
                all_tags.append(tag)
                tag_to_objectives[tag].append(failure.objective_id)

        # Count tag frequencies
        tag_counts = Counter(all_tags)

        patterns: List[FailurePattern] = []
        for tag, count in tag_counts.items():
            if count >= self.min_frequency:
                affected_objectives = list(set(tag_to_objectives[tag]))
                patterns.append(FailurePattern(
                    user_id=user_id,
                    pattern_type="board_exam_tag",
                    pattern_description=f"Struggles with board exam concept: {tag}",
                    affected_objectives=affected_objectives,
                    frequency=count,
                    remediation=self._generate_board_exam_remediation(tag, count)
                ))

        return patterns

    def _detect_systematic_errors(
        self,
        user_id: str,
        failures: List[ControlledFailureRecord]
    ) -> List[FailurePattern]:
        """
        Detect systematic errors (concept-level confusions).

        For MVP, identifies concepts failed multiple times.
        Future: Use NLP to detect semantic patterns (e.g., "always confuses X vs Y").

        Args:
            user_id: User ID
            failures: Failed attempts

        Returns:
            List of systematic error patterns
        """
        # Group by concept name
        concept_failures: Dict[str, List[ControlledFailureRecord]] = defaultdict(list)
        for failure in failures:
            if failure.concept_name:
                concept_failures[failure.concept_name].append(failure)

        patterns: List[FailurePattern] = []
        for concept_name, concept_fails in concept_failures.items():
            if len(concept_fails) >= self.min_frequency:
                affected_objectives = list(set(f.objective_id for f in concept_fails))

                # Calculate average confidence vs score gap (overconfidence indicator)
                confidence_gaps = [
                    (f.confidence_level * 20 - f.score * 100)  # Normalize to same scale
                    for f in concept_fails
                    if f.confidence_level is not None
                ]
                avg_gap = sum(confidence_gaps) / len(confidence_gaps) if confidence_gaps else 0

                # Determine error type
                if avg_gap > 15:
                    error_description = f"Overconfident on {concept_name} (thinks they know but scores low)"
                else:
                    error_description = f"Systematic misconception: {concept_name}"

                patterns.append(FailurePattern(
                    user_id=user_id,
                    pattern_type="systematic_error",
                    pattern_description=error_description,
                    affected_objectives=affected_objectives,
                    frequency=len(concept_fails),
                    remediation=self._generate_systematic_error_remediation(
                        concept_name,
                        len(concept_fails),
                        avg_gap > 15
                    )
                ))

        return patterns

    def _generate_category_remediation(self, course_name: str, frequency: int) -> str:
        """
        Generate remediation recommendations for category-based patterns.

        Args:
            course_name: Name of the course
            frequency: Number of failures

        Returns:
            Remediation recommendation text
        """
        severity = "critical" if frequency >= 10 else "moderate" if frequency >= 5 else "developing"

        remediations = {
            "critical": f"🔴 High priority: Review {course_name} fundamentals. Consider scheduling extra study time or seeking tutoring. Create concept maps to visualize relationships.",
            "moderate": f"🟡 Moderate concern: Review {course_name} lecture notes and practice problems. Focus on understanding core concepts before memorization.",
            "developing": f"🟢 Emerging pattern: Review {course_name} material. Practice active recall and teach concepts to reinforce understanding."
        }

        return remediations[severity]

    def _generate_topic_remediation(self, topic: str, frequency: int) -> str:
        """
        Generate remediation recommendations for topic-based patterns.

        Args:
            topic: Topic tag
            frequency: Number of failures

        Returns:
            Remediation recommendation text
        """
        return (
            f"Review {topic} using spaced repetition. "
            f"Create flashcards focusing on distinctions and relationships. "
            f"Practice with clinical vignettes if available. "
            f"Failed {frequency} times - consider this a priority area."
        )

    def _generate_board_exam_remediation(self, tag: str, frequency: int) -> str:
        """
        Generate remediation recommendations for board exam tag patterns.

        Args:
            tag: Board exam tag
            frequency: Number of failures

        Returns:
            Remediation recommendation text
        """
        return (
            f"High-yield board exam concept: {tag}. "
            f"Review question banks (UWorld, Amboss) for this topic. "
            f"Watch topic-specific videos (Pathoma, Boards & Beyond). "
            f"Failed {frequency} times - prioritize this for exam prep."
        )

    def _generate_systematic_error_remediation(
        self,
        concept_name: str,
        frequency: int,
        is_overconfidence: bool
    ) -> str:
        """
        Generate remediation recommendations for systematic errors.

        Args:
            concept_name: Concept with systematic errors
            frequency: Number of failures
            is_overconfidence: Whether this is an overconfidence pattern

        Returns:
            Remediation recommendation text
        """
        if is_overconfidence:
            return (
                f"⚠️ Overconfidence detected on {concept_name}. "
                f"You think you understand this better than performance shows. "
                f"Slow down and review the nuances. Create comparison charts. "
                f"Practice with challenging questions, not just basic recall."
            )
        else:
            return (
                f"Systematic misconception with {concept_name}. "
                f"Review the fundamental mechanism/definition. "
                f"Use analogies or mnemonics to anchor correct understanding. "
                f"Practice explaining this concept in your own words. "
                f"Failed {frequency} times - break the pattern with deep review."
            )
