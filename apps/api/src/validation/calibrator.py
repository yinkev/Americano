"""
Confidence Calibration Engine for Understanding Validation.

Analyzes alignment between user confidence and actual comprehension performance,
tracking historical trends to improve metacognitive awareness.
"""

from typing import Literal
from pydantic import BaseModel, Field


class CalibrationAnalysis(BaseModel):
    """
    Calibration analysis result.

    Tracks the relationship between user confidence and actual performance,
    providing insights into overconfidence, underconfidence, or calibration.
    """

    delta: float = Field(
        ...,
        description="Calibration delta: (confidence_normalized - score). "
                    "Positive = overconfident, Negative = underconfident, ~0 = calibrated"
    )

    classification: Literal["Overconfident", "Underconfident", "Calibrated"] = Field(
        ...,
        description="Calibration classification based on delta threshold (±15 points)"
    )

    note: str = Field(
        ...,
        description="User-friendly calibration insight message"
    )

    historical_avg_delta: float | None = Field(
        default=None,
        description="Rolling average of historical calibration deltas (if available)"
    )

    trend: Literal["IMPROVING", "STABLE", "WORSENING"] | None = Field(
        default=None,
        description="Calibration trend based on recent vs. older historical performance"
    )


class ConfidenceCalibrator:
    """
    Analyzes confidence calibration and tracks historical trends.

    Helps users develop metacognitive awareness by comparing self-assessed
    confidence with actual comprehension performance over time.
    """

    def calculate_calibration(
        self,
        confidence_level: int,
        score: int,
        historical_deltas: list[float] | None = None
    ) -> CalibrationAnalysis:
        """
        Calculate calibration metrics for a single validation attempt.

        Args:
            confidence_level: User's confidence (1-5 scale where 1=Very Uncertain, 5=Very Confident)
            score: AI evaluation score (0-100 scale)
            historical_deltas: Previous calibration deltas for trend analysis (optional)

        Returns:
            CalibrationAnalysis with delta, classification, note, and optional trend

        Examples:
            >>> calibrator = ConfidenceCalibrator()

            # Overconfident case
            >>> result = calibrator.calculate_calibration(confidence_level=5, score=40)
            >>> result.classification
            'Overconfident'
            >>> result.delta
            60.0

            # Calibrated case
            >>> result = calibrator.calculate_calibration(confidence_level=3, score=55)
            >>> result.classification
            'Calibrated'
            >>> result.delta
            -5.0

            # With historical trend
            >>> result = calibrator.calculate_calibration(
            ...     confidence_level=3,
            ...     score=50,
            ...     historical_deltas=[30, 25, 20, 15, 10]
            ... )
            >>> result.trend
            'IMPROVING'
        """
        # Task 9.2: Calculate calibration delta
        # Normalize confidence from 1-5 scale to 0-100 scale
        # 1 → 0, 2 → 25, 3 → 50, 4 → 75, 5 → 100
        confidence_normalized = (confidence_level - 1) * 25

        # Delta = how much confidence exceeds actual performance
        # Positive delta = overconfident (felt better than they performed)
        # Negative delta = underconfident (felt worse than they performed)
        delta = confidence_normalized - score

        # Task 9.3: Classify calibration
        # Note: Story spec says 1.5 but examples use 15 (assuming 15 on 0-100 scale)
        CALIBRATION_THRESHOLD = 15

        if delta > CALIBRATION_THRESHOLD:
            classification = "Overconfident"
            # Task 9.4: Generate calibration note
            note = "You felt more confident than your explanation showed - beware overconfidence!"
        elif delta < -CALIBRATION_THRESHOLD:
            classification = "Underconfident"
            note = "Your understanding is stronger than you think - trust yourself!"
        else:
            classification = "Calibrated"
            note = "Your confidence matches your comprehension - well calibrated!"

        # Task 9.5: Track historical calibration (rolling average)
        historical_avg_delta = None
        trend = None

        if historical_deltas and len(historical_deltas) >= 3:
            # Calculate overall average
            historical_avg_delta = sum(historical_deltas) / len(historical_deltas)

            # Task 9.6: Calculate trend (improving = delta moving toward 0)
            # Compare recent attempts vs. older attempts
            # Recent = last 3 attempts, Older = everything before that
            recent_deltas = historical_deltas[-3:]
            recent_avg = sum(recent_deltas) / len(recent_deltas)

            if len(historical_deltas) > 3:
                older_deltas = historical_deltas[:-3]
                older_avg = sum(older_deltas) / len(older_deltas)
            else:
                # Not enough history for trend comparison
                older_avg = recent_avg

            # Improvement means absolute delta is decreasing (moving toward 0)
            # Calculate how much the absolute delta changed
            improvement = abs(older_avg) - abs(recent_avg)

            # Define threshold for trend classification (5 points)
            TREND_THRESHOLD = 5

            if improvement > TREND_THRESHOLD:
                trend = "IMPROVING"
            elif improvement < -TREND_THRESHOLD:
                trend = "WORSENING"
            else:
                trend = "STABLE"

        return CalibrationAnalysis(
            delta=delta,
            classification=classification,
            note=note,
            historical_avg_delta=historical_avg_delta,
            trend=trend
        )
