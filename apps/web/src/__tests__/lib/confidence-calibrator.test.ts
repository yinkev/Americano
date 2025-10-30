/**
 * Story 4.4 Task 3: Confidence Calibrator Tests
 *
 * Tests for calibration calculation logic:
 * - Confidence normalization (1-5 scale to 0-100)
 * - Calibration delta calculation
 * - Category classification (OVERCONFIDENT/UNDERCONFIDENT/CALIBRATED)
 * - Correlation coefficient calculation (Pearson's r)
 * - Feedback message generation
 * - Edge cases and error handling
 *
 * AC#3: Confidence vs. Performance Tracking
 */

import { describe, expect, it } from '@jest/globals'
import {
  CalibrationCategory,
  calculateCalibration,
  calculateCorrelation,
  interpretCorrelation,
  normalizeConfidence,
} from '@/lib/confidence-calibrator'

/**
 * Test wrapper class for correlation interpretation
 * (wraps the standalone functions for easier testing)
 */
class ConfidenceCalibrator {
  /**
   * Use actual implementation from lib
   */
  calculateCalibration(confidence: number, score: number) {
    return calculateCalibration(confidence, score)
  }

  /**
   * Use actual implementation from lib
   */
  calculateCorrelation(confidenceArray: number[], scoreArray: number[]): number | null {
    return calculateCorrelation(confidenceArray, scoreArray)
  }

  /**
   * Interpret correlation coefficient using actual implementation
   */
  interpretCorrelation(r: number): string {
    return interpretCorrelation(r)
  }
}

describe('ConfidenceCalibrator', () => {
  const calibrator = new ConfidenceCalibrator()

  describe('Normalization Formula', () => {
    it('should normalize confidence 1 to 0', () => {
      const result = calibrator.calculateCalibration(1, 0)
      expect(result.confidenceNormalized).toBe(0)
    })

    it('should normalize confidence 2 to 25', () => {
      const result = calibrator.calculateCalibration(2, 25)
      expect(result.confidenceNormalized).toBe(25)
    })

    it('should normalize confidence 3 to 50', () => {
      const result = calibrator.calculateCalibration(3, 50)
      expect(result.confidenceNormalized).toBe(50)
    })

    it('should normalize confidence 4 to 75', () => {
      const result = calibrator.calculateCalibration(4, 75)
      expect(result.confidenceNormalized).toBe(75)
    })

    it('should normalize confidence 5 to 100', () => {
      const result = calibrator.calculateCalibration(5, 100)
      expect(result.confidenceNormalized).toBe(100)
    })

    it('should reject confidence < 1', () => {
      expect(() => calibrator.calculateCalibration(0, 50)).toThrow()
    })

    it('should reject confidence > 5', () => {
      expect(() => calibrator.calculateCalibration(6, 50)).toThrow()
    })

    it('should reject score < 0', () => {
      expect(() => calibrator.calculateCalibration(3, -10)).toThrow()
    })

    it('should reject score > 100', () => {
      expect(() => calibrator.calculateCalibration(3, 150)).toThrow()
    })
  })

  describe('Calibration Delta Calculation', () => {
    it('should calculate delta = confidenceNormalized - score', () => {
      const result = calibrator.calculateCalibration(5, 60)
      expect(result.calibrationDelta).toBe(40) // 100 - 60
    })

    it('should handle negative delta (underconfident)', () => {
      const result = calibrator.calculateCalibration(2, 70)
      expect(result.calibrationDelta).toBe(-45) // 25 - 70
    })

    it('should handle zero delta (perfect calibration)', () => {
      const result = calibrator.calculateCalibration(3, 50)
      expect(result.calibrationDelta).toBe(0) // 50 - 50
    })
  })

  describe('Calibration Category Classification', () => {
    it('should classify as OVERCONFIDENT when delta > 15', () => {
      const result = calibrator.calculateCalibration(5, 60)
      expect(result.category).toBe('OVERCONFIDENT')
      expect(result.calibrationDelta).toBe(40)
    })

    it('should classify as UNDERCONFIDENT when delta < -15', () => {
      const result = calibrator.calculateCalibration(1, 70)
      expect(result.category).toBe('UNDERCONFIDENT')
      expect(result.calibrationDelta).toBe(-70)
    })

    it('should classify as CALIBRATED when -15 <= delta <= 15', () => {
      const result = calibrator.calculateCalibration(3, 50)
      expect(result.category).toBe('CALIBRATED')
      expect(result.calibrationDelta).toBe(0)
    })

    it('should classify as CALIBRATED at delta boundary +15', () => {
      const result = calibrator.calculateCalibration(3, 35)
      expect(result.category).toBe('CALIBRATED')
      expect(result.calibrationDelta).toBe(15)
    })

    it('should classify as CALIBRATED at delta boundary -15', () => {
      const result = calibrator.calculateCalibration(3, 65)
      expect(result.category).toBe('CALIBRATED')
      expect(result.calibrationDelta).toBe(-15)
    })

    it('should classify as OVERCONFIDENT just above +15', () => {
      const result = calibrator.calculateCalibration(3, 34)
      expect(result.category).toBe('OVERCONFIDENT')
      expect(result.calibrationDelta).toBe(16)
    })

    it('should classify as UNDERCONFIDENT just below -15', () => {
      const result = calibrator.calculateCalibration(3, 66)
      expect(result.category).toBe('UNDERCONFIDENT')
      expect(result.calibrationDelta).toBe(-16)
    })
  })

  describe('Feedback Message Generation', () => {
    it('should generate overconfident feedback', () => {
      const result = calibrator.calculateCalibration(5, 45)
      expect(result.feedbackMessage).toContain('You felt 100% confident but scored 45%')
      expect(result.feedbackMessage).toContain('review areas where certainty exceeded accuracy')
    })

    it('should generate underconfident feedback', () => {
      const result = calibrator.calculateCalibration(1, 90)
      expect(result.feedbackMessage).toContain('You felt 0% confident but scored 90%')
      expect(result.feedbackMessage).toContain('trust your understanding more')
    })

    it('should generate calibrated feedback', () => {
      const result = calibrator.calculateCalibration(3, 50)
      expect(result.feedbackMessage).toContain('Your confidence matches your performance')
      expect(result.feedbackMessage).toContain('well calibrated')
    })
  })

  describe('Pearson Correlation Coefficient', () => {
    it('should return null for insufficient data (< 5 points)', () => {
      const confidence = [1, 2, 3, 4]
      const scores = [25, 50, 75, 100]
      expect(calibrator.calculateCorrelation(confidence, scores)).toBeNull()
    })

    it('should calculate perfect positive correlation (r=1)', () => {
      const confidence = [0, 25, 50, 75, 100]
      const scores = [0, 25, 50, 75, 100]
      const r = calibrator.calculateCorrelation(confidence, scores)
      expect(r).toBeCloseTo(1.0, 5)
    })

    it('should calculate perfect negative correlation (r=-1)', () => {
      const confidence = [0, 25, 50, 75, 100]
      const scores = [100, 75, 50, 25, 0]
      const r = calibrator.calculateCorrelation(confidence, scores)
      expect(r).toBeCloseTo(-1.0, 5)
    })

    it('should calculate zero correlation (no variance)', () => {
      const confidence = [50, 50, 50, 50, 50]
      const scores = [0, 25, 50, 75, 100]
      const r = calibrator.calculateCorrelation(confidence, scores)
      expect(r).toBe(0)
    })

    it('should calculate moderate positive correlation', () => {
      const confidence = [20, 30, 40, 50, 60]
      const scores = [30, 40, 50, 60, 70]
      const r = calibrator.calculateCorrelation(confidence, scores)
      expect(r).toBeGreaterThan(0.9) // Should be close to 1
    })

    it('should handle mismatched array lengths', () => {
      const confidence = [1, 2, 3, 4, 5]
      const scores = [25, 50, 75, 100]
      expect(() => calibrator.calculateCorrelation(confidence, scores)).toThrow(
        'Arrays must have equal length',
      )
    })

    it('should calculate correlation with real data: overconfidence pattern', () => {
      // Overconfident pattern: high confidence, lower scores
      const confidence = [75, 80, 70, 85, 75, 80, 78, 82, 76, 81]
      const scores = [45, 40, 50, 35, 48, 38, 42, 36, 46, 39]
      const r = calibrator.calculateCorrelation(confidence, scores)
      expect(r).toBeLessThan(0)
    })

    it('should calculate correlation with 10+ assessments', () => {
      const confidence = [0, 20, 40, 60, 80, 100, 30, 50, 70, 90, 25, 75]
      const scores = [10, 30, 45, 65, 85, 95, 35, 55, 75, 92, 28, 78]
      const r = calibrator.calculateCorrelation(confidence, scores)
      expect(r).toBeGreaterThan(0.85) // Should have strong positive correlation
    })
  })

  describe('Correlation Interpretation', () => {
    it('should interpret strong correlation (r > 0.7)', () => {
      const interpretation = calibrator.interpretCorrelation(0.8)
      expect(interpretation).toContain('Strong calibration accuracy')
    })

    it('should interpret moderate correlation (0.4 - 0.7)', () => {
      const interpretation = calibrator.interpretCorrelation(0.5)
      expect(interpretation).toContain('Moderate calibration accuracy')
    })

    it('should interpret weak correlation (< 0.4)', () => {
      const interpretation = calibrator.interpretCorrelation(0.3)
      expect(interpretation).toContain('Weak calibration accuracy')
      expect(interpretation).toContain('consider reviewing')
    })

    it('should interpret negative correlation', () => {
      const interpretation = calibrator.interpretCorrelation(-0.2)
      expect(interpretation).toContain('Weak calibration accuracy')
    })
  })

  describe('Edge Cases', () => {
    it('should handle all zero scores', () => {
      const confidence = [0, 0, 0, 0, 0]
      const scores = [0, 0, 0, 0, 0]
      const r = calibrator.calculateCorrelation(confidence, scores)
      expect(r).toBe(0) // No variance
    })

    it('should handle single variance in confidence only', () => {
      const confidence = [50, 50, 51, 50, 50]
      const scores = [30, 40, 50, 60, 70]
      const r = calibrator.calculateCorrelation(confidence, scores)
      expect(r).toBeCloseTo(0, 2)
    })

    it('should handle negative confidence values after normalization', () => {
      const result = calibrator.calculateCalibration(1, 100)
      expect(result.calibrationDelta).toBe(-100)
      expect(result.category).toBe('UNDERCONFIDENT')
    })

    it('should handle very high confidence and very low score', () => {
      const result = calibrator.calculateCalibration(5, 0)
      expect(result.calibrationDelta).toBe(100)
      expect(result.category).toBe('OVERCONFIDENT')
    })

    it('should calculate correlation with only 5 data points (minimum)', () => {
      const confidence = [25, 50, 75, 100, 0]
      const scores = [30, 55, 80, 95, 5]
      const r = calibrator.calculateCorrelation(confidence, scores)
      expect(r).not.toBeNull()
      expect(r).toBeGreaterThan(0.9)
    })
  })

  describe('AC#3 Compliance: Confidence vs Performance Tracking', () => {
    it('should track calibration delta with confidence normalized to 0-100 scale', () => {
      // AC#3: "Confidence normalized to 0-100 scale (matches AI score scale)"
      const result = calibrator.calculateCalibration(3, 50)
      expect(result.confidenceNormalized).toBe(50) // 3-1)*25 = 50
      expect(result.calibrationDelta).toBe(0) // 50 - 50
    })

    it('should categorize with exact 15-point thresholds', () => {
      // AC#3: "Categorization: Overconfident (delta > 15), Underconfident (delta < -15), Calibrated (-15 to +15)"
      const overconfident = calibrator.calculateCalibration(5, 60)
      expect(overconfident.category).toBe('OVERCONFIDENT')
      expect(overconfident.calibrationDelta).toBe(40)

      const underconfident = calibrator.calculateCalibration(1, 70)
      expect(underconfident.category).toBe('UNDERCONFIDENT')
      expect(underconfident.calibrationDelta).toBe(-70)

      const calibrated = calibrator.calculateCalibration(3, 50)
      expect(calibrated.category).toBe('CALIBRATED')
      expect(calibrated.calibrationDelta).toBe(0)
    })

    it('should calculate correlation coefficient (Pearson r) for multiple assessments', () => {
      // AC#3: "Calibration correlation coefficient calculated (Pearson's r)"
      const confidences = [25, 50, 75, 50, 75, 100, 50, 75, 25, 50]
      const scores = [30, 55, 80, 60, 85, 95, 45, 70, 35, 60]
      const r = calibrator.calculateCorrelation(confidences, scores)
      expect(r).not.toBeNull()
      expect(r! >= -1 && r! <= 1).toBe(true)
    })
  })
})
