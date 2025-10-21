"""
Adaptive Question Selector - Story 4.5

Selects next question based on IRT metrics and adaptive difficulty adjustment.
Implements question bank management with cooldown and efficiency optimization.
"""

from typing import List, Optional, Tuple
import logging
from datetime import datetime, timedelta

from .models import QuestionData, ResponseRecord
from .irt_engine import IRTEngine

logger = logging.getLogger(__name__)


class QuestionSelector:
    """
    Manages adaptive question selection and difficulty adjustment.

    Uses IRT engine to determine optimal difficulty and selects questions
    from available pool with cooldown management.
    """

    def __init__(
        self,
        irt_engine: Optional[IRTEngine] = None,
        cooldown_days: int = 14,
        max_difficulty_adjustments: int = 3,
    ):
        """
        Initialize question selector.

        Args:
            irt_engine: IRT engine instance (creates default if None)
            cooldown_days: Days before question can be repeated
            max_difficulty_adjustments: Max difficulty changes per session
        """
        self.irt_engine = irt_engine or IRTEngine()
        self.cooldown_days = cooldown_days
        self.max_difficulty_adjustments = max_difficulty_adjustments

    def adjust_difficulty(
        self,
        current_difficulty: int,
        score: float,
        adjustment_count: int,
    ) -> Tuple[int, str]:
        """
        Adjust difficulty based on response score.

        Rules (from story context):
        - Score > 85%: Increase difficulty by 15 points
        - Score 60-85%: Maintain ± 5 points variation
        - Score < 60%: Decrease difficulty by 15 points
        - Max 3 adjustments per session

        Args:
            current_difficulty: Current difficulty (0-100)
            score: Last response score (0-100)
            adjustment_count: Number of adjustments made so far

        Returns:
            Tuple of (new_difficulty, adjustment_reason)
        """
        if adjustment_count >= self.max_difficulty_adjustments:
            logger.info(
                f"Max adjustments ({self.max_difficulty_adjustments}) reached, "
                f"maintaining difficulty {current_difficulty}"
            )
            return current_difficulty, "Maximum adjustments reached"

        if score > 85:
            new_difficulty = min(100, current_difficulty + 15)
            reason = "Score > 85% - increasing difficulty by 15 points"
        elif score < 60:
            new_difficulty = max(0, current_difficulty - 15)
            reason = "Score < 60% - decreasing difficulty by 15 points"
        else:
            # Maintain ± 5 points variation
            import random
            variation = random.randint(-5, 5)
            new_difficulty = max(0, min(100, current_difficulty + variation))
            reason = f"Score 60-85% - maintaining difficulty with ±5 variation ({variation:+d})"

        logger.info(
            f"Difficulty adjustment: {current_difficulty} → {new_difficulty} ({reason})"
        )
        return new_difficulty, reason

    def calculate_initial_difficulty(
        self,
        recent_scores: List[float],
        calibration_accuracy: Optional[float] = None,
    ) -> int:
        """
        Calculate initial difficulty from user history.

        From story context (AC#1):
        - Analyze last 10 assessments
        - Calculate baseline difficulty score (0-100)
        - Consider confidence calibration accuracy
        - Start at baseline ± 10 points

        Args:
            recent_scores: List of recent assessment scores (last 10)
            calibration_accuracy: Calibration accuracy from Story 4.4 (optional)

        Returns:
            Initial difficulty (0-100)
        """
        if not recent_scores:
            logger.info("No history found, defaulting to difficulty 50")
            return 50

        # Calculate weighted average (recent scores weighted higher)
        weights = [i + 1 for i in range(len(recent_scores))]  # 1, 2, 3, ..., 10
        weighted_avg = sum(s * w for s, w in zip(recent_scores, weights)) / sum(weights)

        # Adjust for calibration if available
        if calibration_accuracy is not None:
            # Good calibration (>0.8) → slightly increase difficulty
            # Poor calibration (<0.5) → slightly decrease difficulty
            calibration_adjustment = (calibration_accuracy - 0.65) * 10
            weighted_avg += calibration_adjustment

        # Add ± 10 point variation
        import random
        initial_difficulty = int(max(0, min(100, weighted_avg + random.randint(-10, 10))))

        logger.info(
            f"Initial difficulty calculated: {initial_difficulty} "
            f"(avg={weighted_avg:.1f}, calibration={calibration_accuracy})"
        )
        return initial_difficulty

    def select_question(
        self,
        target_difficulty: int,
        available_questions: List[QuestionData],
        recently_answered_ids: List[str],
        theta: Optional[float] = None,
    ) -> Optional[QuestionData]:
        """
        Select optimal question from available pool.

        Selection criteria:
        1. Not in recently answered list (cooldown)
        2. Difficulty closest to target
        3. If IRT theta available, use maximum information principle

        Args:
            target_difficulty: Target difficulty (0-100)
            available_questions: Pool of available questions
            recently_answered_ids: IDs of recently answered questions
            theta: IRT theta estimate (optional, for information maximization)

        Returns:
            Selected question or None if no suitable question found
        """
        # Filter out recently answered questions
        available = [
            q for q in available_questions
            if q.question_id not in recently_answered_ids
        ]

        if not available:
            logger.warning("No available questions after cooldown filter")
            return None

        if theta is not None:
            # Use IRT information function to select question
            # Convert target_difficulty (0-100) to IRT scale (-3 to +3)
            target_difficulty_irt = (target_difficulty - 50) / 20  # Normalize to ~-2.5 to +2.5

            # Calculate information for each question
            question_info = [
                (
                    q,
                    self.irt_engine.information_function(
                        theta,
                        (q.difficulty - 50) / 20,  # Normalize difficulty
                        q.discrimination,
                    ),
                )
                for q in available
            ]

            # Select question with maximum information
            selected_question, max_info = max(question_info, key=lambda x: x[1])
            logger.info(
                f"Selected question {selected_question.question_id} with "
                f"information={max_info:.3f} at theta={theta:.2f}"
            )
            return selected_question
        else:
            # Fallback: Select question closest to target difficulty
            selected_question = min(
                available,
                key=lambda q: abs(q.difficulty - target_difficulty)
            )
            logger.info(
                f"Selected question {selected_question.question_id} with "
                f"difficulty={selected_question.difficulty} (target={target_difficulty})"
            )
            return selected_question

    def calculate_efficiency_metrics(
        self,
        questions_asked: int,
        baseline_questions: int = 15,
    ) -> dict:
        """
        Calculate assessment efficiency metrics.

        From story context (AC#7):
        - Target: 3-5 questions vs 15+ baseline
        - Calculate time saved percentage
        - Efficiency score (0-100)

        Args:
            questions_asked: Number of questions asked in adaptive assessment
            baseline_questions: Baseline questions without adaptive (default 15)

        Returns:
            Dictionary with efficiency metrics
        """
        if questions_asked == 0:
            return {
                "questions_asked": 0,
                "baseline_questions": baseline_questions,
                "time_saved_percent": 0.0,
                "efficiency_score": 0.0,
            }

        # Calculate efficiency
        questions_saved = max(0, baseline_questions - questions_asked)
        time_saved_percent = (questions_saved / baseline_questions) * 100

        # Efficiency score: higher is better, penalize if more than baseline
        if questions_asked <= baseline_questions:
            efficiency_score = min(100, (questions_saved / baseline_questions) * 100 + 20)
        else:
            efficiency_score = max(0, 50 - (questions_asked - baseline_questions) * 5)

        logger.info(
            f"Efficiency: {questions_asked} questions asked, "
            f"{questions_saved} saved, {time_saved_percent:.1f}% time saved"
        )

        return {
            "questions_asked": questions_asked,
            "baseline_questions": baseline_questions,
            "time_saved_percent": round(time_saved_percent, 1),
            "efficiency_score": round(efficiency_score, 1),
        }

    def should_generate_follow_up(
        self,
        score: float,
        current_follow_up_count: int,
        max_follow_ups: int = 2,
    ) -> Tuple[bool, Optional[str]]:
        """
        Determine if follow-up question should be generated.

        From story context (AC#3):
        - Score < 60%: Generate prerequisite follow-up
        - Score > 85%: Generate advanced follow-up
        - Max 2 follow-ups per original question

        Args:
            score: Last response score (0-100)
            current_follow_up_count: Number of follow-ups already asked
            max_follow_ups: Maximum follow-ups allowed

        Returns:
            Tuple of (should_generate, follow_up_type)
            follow_up_type: "prerequisite", "advanced", or None
        """
        if current_follow_up_count >= max_follow_ups:
            logger.info(f"Max follow-ups ({max_follow_ups}) reached")
            return False, None

        if score < 60:
            logger.info(f"Score {score:.1f}% < 60%, generating prerequisite follow-up")
            return True, "prerequisite"
        elif score > 85:
            logger.info(f"Score {score:.1f}% > 85%, generating advanced follow-up")
            return True, "advanced"
        else:
            return False, None

    def filter_by_cooldown(
        self,
        questions: List[dict],
        current_time: Optional[datetime] = None,
    ) -> List[dict]:
        """
        Filter questions by cooldown period.

        From story context (AC#5):
        - Minimum 2-week cooldown before repeating

        Args:
            questions: List of question dicts with last_used_at field
            current_time: Current time (defaults to now)

        Returns:
            Filtered list of questions outside cooldown period
        """
        if current_time is None:
            current_time = datetime.utcnow()

        cooldown_threshold = current_time - timedelta(days=self.cooldown_days)

        available = [
            q for q in questions
            if q.get("last_used_at") is None
            or q["last_used_at"] < cooldown_threshold
        ]

        logger.info(
            f"Cooldown filter: {len(available)}/{len(questions)} questions available "
            f"(threshold={cooldown_threshold.isoformat()})"
        )

        return available
