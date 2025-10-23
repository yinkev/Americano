"""
Calibration constants and helpers (Epic 4.4) - Python SSOT
Keep aligned with TS module: apps/web/src/lib/constants/calibration.ts
References:
- Story 4.4 thresholds and formulas: docs/stories/story-4.4.md
- Debt hardening plan: docs/deployments/epic4-debt-hardening.md
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


# Confidence 5‑point scale (1..5)
CONFIDENCE_SCALE_MIN: int = 1
CONFIDENCE_SCALE_MAX: int = 5


def normalize_confidence(level: int) -> int:
    """
    Map 1..5 → 0..100 as specified in Story 4.4:
    (confidence - 1) * 25
    """
    if level < CONFIDENCE_SCALE_MIN or level > CONFIDENCE_SCALE_MAX:
        raise ValueError(
            f"Confidence level must be between {CONFIDENCE_SCALE_MIN} and {CONFIDENCE_SCALE_MAX}. Got: {level}"
        )
    return (level - 1) * 25


# Delta threshold (+/‑) for categorization
CALIBRATION_DELTA_THRESHOLD: int = 15


class CalibrationCategory(str, Enum):
    OVERCONFIDENT = "OVERCONFIDENT"
    UNDERCONFIDENT = "UNDERCONFIDENT"
    CALIBRATED = "CALIBRATED"


def get_calibration_category(delta: float) -> CalibrationCategory:
    """
    Determine calibration category from delta.
    """
    if delta > CALIBRATION_DELTA_THRESHOLD:
        return CalibrationCategory.OVERCONFIDENT
    if delta < -CALIBRATION_DELTA_THRESHOLD:
        return CalibrationCategory.UNDERCONFIDENT
    return CalibrationCategory.CALIBRATED


@dataclass(frozen=True)
class CalibrationResult:
    confidence_normalized: int  # 0..100
    delta: float
    category: CalibrationCategory


def compute_calibration(score_0_to_100: float, confidence_level_1_to_5: int) -> CalibrationResult:
    """
    Compute normalized confidence (0..100), delta, and category
    given raw score 0..100 and confidence 1..5.
    """
    if score_0_to_100 < 0 or score_0_to_100 > 100:
        raise ValueError(f"Score must be in 0..100. Got: {score_0_to_100}")
    confidence_normalized = normalize_confidence(confidence_level_1_to_5)
    delta = confidence_normalized - score_0_to_100
    category = get_calibration_category(delta)
    return CalibrationResult(confidence_normalized=confidence_normalized, delta=delta, category=category)


# Default feedback copy (colors use OKLCH per design system; consumer can ignore)
CALIBRATION_FEEDBACK = {
    CalibrationCategory.OVERCONFIDENT: {
        "title": "Overconfidence Detected",
        "color_oklch": "oklch(0.65 0.20 25)",  # Red
        "suggestion": "Review areas where certainty exceeded accuracy before marking complete.",
        "make_message": lambda delta, confidence, score: (
            f"You felt {confidence}% confident but scored {score}%. "
            f"Your confidence exceeded accuracy by {round(delta)} points."
        ),
    },
    CalibrationCategory.UNDERCONFIDENT: {
        "title": "Underconfidence Pattern",
        "color_oklch": "oklch(0.60 0.18 230)",  # Blue
        "suggestion": "Acknowledge strong performance—consider trusting your answers more.",
        "make_message": lambda _delta, confidence, score: (
            f"You felt {confidence}% confident but scored {score}%. "
            "You are stronger than you think—trust your understanding."
        ),
    },
    CalibrationCategory.CALIBRATED: {
        "title": "Well Calibrated",
        "color_oklch": "oklch(0.7 0.15 145)",  # Green
        "suggestion": "Maintain this metacognitive awareness.",
        "make_message": lambda _delta, confidence, score: (
            f"Your {confidence}% confidence matches your {score}% score. Nicely calibrated."
        ),
    },
}


# Trend classification (toward/away from zero absolute delta)
CALIBRATION_TREND_TOLERANCE: int = 5  # points


class CalibrationTrend(str, Enum):
    IMPROVING = "IMPROVING"
    STABLE = "STABLE"
    WORSENING = "WORSENING"


def classify_calibration_trend(previous_abs_delta: float, recent_abs_delta: float) -> CalibrationTrend:
    """
    Compare rolling-average abs(delta). Positive change toward 0 is improving.
    """
    change = previous_abs_delta - recent_abs_delta  # positive = moving toward 0
    if change > CALIBRATION_TREND_TOLERANCE:
        return CalibrationTrend.IMPROVING
    if change < -CALIBRATION_TREND_TOLERANCE:
        return CalibrationTrend.WORSENING
    return CalibrationTrend.STABLE


# Export a single constants map for quick inspection/telemetry
CALIBRATION_CONSTANTS = {
    "CONFIDENCE_SCALE_MIN": CONFIDENCE_SCALE_MIN,
    "CONFIDENCE_SCALE_MAX": CONFIDENCE_SCALE_MAX,
    "CALIBRATION_DELTA_THRESHOLD": CALIBRATION_DELTA_THRESHOLD,
    "CALIBRATION_TREND_TOLERANCE": CALIBRATION_TREND_TOLERANCE,
}