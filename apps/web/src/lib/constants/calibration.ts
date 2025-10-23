// Centralized calibration constants and helpers (Epic 4.4)
// Source of Truth for web (TypeScript). Keep in sync with apps/api/src/validation/constants.py
// References: Story 4.4 ACs and formulas in docs: 
// - story-4.4.md (Confidence Calibration): thresholds, normalization, messaging
// - epic4-debt-hardening.md: SSOT guidance

/**
 * Confidence scale used across the app (pre/post assessment).
 * Story 4.4 specifies a 5-point scale: 1 (Very Uncertain) → 5 (Very Confident)
 */
export const CONFIDENCE_SCALE_MIN = 1;
export const CONFIDENCE_SCALE_MAX = 5;

/**
 * Normalization maps 1..5 → 0..100 as specified in Story 4.4:
 * (confidence - 1) * 25
 */
export function normalizeConfidence(level: number): number {
  if (level < CONFIDENCE_SCALE_MIN || level > CONFIDENCE_SCALE_MAX) {
    throw new RangeError(
      `Confidence level must be between ${CONFIDENCE_SCALE_MIN} and ${CONFIDENCE_SCALE_MAX}. Got: ${level}`
    );
  }
  return (level - 1) * 25;
}

/**
 * Delta threshold for calibration categorization:
 * - Overconfident if delta > +15
 * - Underconfident if delta < -15
 * - Calibrated otherwise
 */
export const CALIBRATION_DELTA_THRESHOLD = 15;

/**
 * Labels to render for the 5-point confidence slider.
 * Keep in sync with UI components.
 */
export const CONFIDENCE_LABELS: Record<number, string> = {
  1: 'Very Uncertain',
  2: 'Uncertain',
  3: 'Neutral',
  4: 'Confident',
  5: 'Very Confident',
};

/**
 * Calibration categories.
 */
export enum CalibrationCategory {
  OVERCONFIDENT = 'OVERCONFIDENT',
  UNDERCONFIDENT = 'UNDERCONFIDENT',
  CALIBRATED = 'CALIBRATED',
}

/**
 * Compute calibration delta and category given raw score (0..100) and 1..5 confidence.
 * Returns normalized confidence (0..100), delta, and category.
 */
export function computeCalibration(
  score0to100: number,
  confidenceLevel1to5: number
): {
  confidenceNormalized: number;
  delta: number;
  category: CalibrationCategory;
} {
  if (score0to100 < 0 || score0to100 > 100) {
    throw new RangeError(`Score must be in 0..100. Got: ${score0to100}`);
  }
  const confidenceNormalized = normalizeConfidence(confidenceLevel1to5);
  const delta = confidenceNormalized - score0to100;
  const category = getCalibrationCategory(delta);
  return { confidenceNormalized, delta, category };
}

/**
 * Determine calibration category from delta.
 */
export function getCalibrationCategory(delta: number): CalibrationCategory {
  if (delta > CALIBRATION_DELTA_THRESHOLD) {
    return CalibrationCategory.OVERCONFIDENT;
  }
  if (delta < -CALIBRATION_DELTA_THRESHOLD) {
    return CalibrationCategory.UNDERCONFIDENT;
  }
  return CalibrationCategory.CALIBRATED;
}

/**
 * Default feedback copy for each category.
 * UI can override or localize these messages.
 */
export const CALIBRATION_FEEDBACK = {
  [CalibrationCategory.OVERCONFIDENT]: {
    title: 'Overconfidence Detected',
    colorOklch: 'oklch(0.65 0.20 25)', // Red
    suggestion: 'Review areas where certainty exceeded accuracy before marking complete.',
    makeMessage: (delta: number, confidence: number, score: number) =>
      `You felt ${confidence}% confident but scored ${score}%. Your confidence exceeded accuracy by ${Math.round(
        delta
      )} points.`,
  },
  [CalibrationCategory.UNDERCONFIDENT]: {
    title: 'Underconfidence Pattern',
    colorOklch: 'oklch(0.60 0.18 230)', // Blue
    suggestion: 'Acknowledge strong performance—consider trusting your answers more.',
    makeMessage: (delta: number, confidence: number, score: number) =>
      `You felt ${confidence}% confident but scored ${score}%. You are stronger than you think—trust your understanding.`,
  },
  [CalibrationCategory.CALIBRATED]: {
    title: 'Well Calibrated',
    colorOklch: 'oklch(0.7 0.15 145)', // Green
    suggestion: 'Maintain this metacognitive awareness.',
    makeMessage: (_delta: number, confidence: number, score: number) =>
      `Your ${confidence}% confidence matches your ${score}% score. Nicely calibrated.`,
  },
};

/**
 * Convenience to produce a full feedback object for rendering.
 */
export function buildCalibrationFeedback(params: {
  score0to100: number;
  confidenceLevel1to5: number;
}): {
  category: CalibrationCategory;
  confidenceNormalized: number;
  delta: number;
  title: string;
  colorOklch: string;
  suggestion: string;
  message: string;
} {
  const { score0to100, confidenceLevel1to5 } = params;
  const { confidenceNormalized, delta, category } = computeCalibration(
    score0to100,
    confidenceLevel1to5
  );
  const copy = CALIBRATION_FEEDBACK[category];
  return {
    category,
    confidenceNormalized,
    delta,
    title: copy.title,
    colorOklch: copy.colorOklch,
    suggestion: copy.suggestion,
    message: copy.makeMessage(
      delta,
      Math.round(confidenceNormalized),
      Math.round(score0to100)
    ),
  };
}

/**
 * Rolling trend classification thresholds. Keep aligned with analytics.
 * A small tolerance avoids flip-flopping near zero.
 */
export const CALIBRATION_TREND_TOLERANCE = 5; // points toward 0 delta = improving

export enum CalibrationTrend {
  IMPROVING = 'IMPROVING',
  STABLE = 'STABLE',
  WORSENING = 'WORSENING',
}

/**
 * Classify trend from historical rolling-average deltas.
 * Negative abs(delta) moving toward 0 is IMPROVING; away from 0 is WORSENING.
 */
export function classifyCalibrationTrend(params: {
  previousAbsDelta: number;
  recentAbsDelta: number;
}): CalibrationTrend {
  const { previousAbsDelta, recentAbsDelta } = params;
  const change = previousAbsDelta - recentAbsDelta; // positive = moving toward 0
  if (change > CALIBRATION_TREND_TOLERANCE) return CalibrationTrend.IMPROVING;
  if (change < -CALIBRATION_TREND_TOLERANCE) return CalibrationTrend.WORSENING;
  return CalibrationTrend.STABLE;
}

/**
 * Export a single map with all tunables for quick inspection or telemetry.
 */
export const CALIBRATION_CONSTANTS = {
  CONFIDENCE_SCALE_MIN,
  CONFIDENCE_SCALE_MAX,
  CALIBRATION_DELTA_THRESHOLD,
  CALIBRATION_TREND_TOLERANCE,
};

/**
 * Usage:
 * - Import buildCalibrationFeedback() for UI panels to render consistent copy/colors.
 * - Import computeCalibration()/getCalibrationCategory() for API logic and storage.
 * - Do NOT hardcode thresholds in components or services—import from this module.
 */