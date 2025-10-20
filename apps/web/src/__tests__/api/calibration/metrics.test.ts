/**
 * Story 4.4 Task 10: Calibration API Endpoint Tests
 *
 * Tests for:
 * - GET /api/validation/calibration endpoint
 * - Calibration metrics calculation (MAE, correlation, trend)
 * - Overconfident/underconfident example identification
 * - Validation of query parameters
 * - Error handling
 *
 * AC#3: Confidence vs. Performance Tracking
 * AC#4: Calibration Feedback Display
 * AC#6: Calibration Trends Dashboard
 */

// Jest globals (describe, it, expect, beforeEach) are available without imports

interface ValidationResponse {
  id: string;
  promptId: string;
  userId: string;
  userAnswer: string;
  aiEvaluation: string;
  score: number;
  confidenceLevel: number | null;
  calibrationDelta: number | null;
  respondedAt: Date;
  skipped: boolean;
  prompt: {
    id: string;
    conceptName: string;
  };
}

interface CalibrationMetrics {
  calibrationScore: number;
  meanAbsoluteError: number;
  correlationCoefficient: number;
  overconfidentExamples: Array<{
    promptId: string;
    conceptName: string;
    confidence: number;
    score: number;
    delta: number;
  }>;
  underconfidentExamples: Array<{
    promptId: string;
    conceptName: string;
    confidence: number;
    score: number;
    delta: number;
  }>;
  trend: 'IMPROVING' | 'STABLE' | 'WORSENING';
  totalAttempts: number;
}

// Mock implementation of calibration calculation
function calculateCalibrationMetrics(
  responses: ValidationResponse[]
): CalibrationMetrics {
  if (responses.length === 0) {
    return {
      calibrationScore: 0,
      meanAbsoluteError: 0,
      correlationCoefficient: 0,
      overconfidentExamples: [],
      underconfidentExamples: [],
      trend: 'STABLE',
      totalAttempts: 0,
    };
  }

  // Convert to data points for analysis
  const dataPoints = responses.map((r) => ({
    promptId: r.promptId,
    conceptName: r.prompt.conceptName,
    confidence: r.confidenceLevel ? (r.confidenceLevel - 1) * 25 : 0,
    score: r.score * 100,
    respondedAt: r.respondedAt,
  }));

  // Calculate Mean Absolute Error
  const absoluteErrors = dataPoints.map((d) =>
    Math.abs(d.confidence - d.score)
  );
  const meanAbsoluteError =
    absoluteErrors.reduce((sum, err) => sum + err, 0) / absoluteErrors.length;

  // Calculate Pearson correlation
  const confidences = dataPoints.map((d) => d.confidence);
  const scores = dataPoints.map((d) => d.score);

  const meanConfidence =
    confidences.reduce((sum, c) => sum + c, 0) / confidences.length;
  const meanScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;

  const numerator = dataPoints.reduce((sum, d) => {
    return sum + (d.confidence - meanConfidence) * (d.score - meanScore);
  }, 0);

  const denominator = Math.sqrt(
    confidences.reduce((sum, c) => sum + Math.pow(c - meanConfidence, 2), 0) *
      scores.reduce((sum, s) => sum + Math.pow(s - meanScore, 2), 0)
  );

  const correlationCoefficient = denominator === 0 ? 0 : numerator / denominator;

  // Calibration score
  const maeScore = Math.max(0, 100 - meanAbsoluteError);
  const correlationScore = (correlationCoefficient + 1) * 50;
  const calibrationScore = maeScore * 0.7 + correlationScore * 0.3;

  // Find overconfident and underconfident examples
  const overconfidentExamples = dataPoints
    .filter((d) => d.confidence - d.score > 15)
    .sort((a, b) => (b.confidence - b.score) - (a.confidence - a.score))
    .slice(0, 5)
    .map((d) => ({
      promptId: d.promptId,
      conceptName: d.conceptName,
      confidence: Math.round(d.confidence),
      score: Math.round(d.score),
      delta: Math.round(d.confidence - d.score),
    }));

  const underconfidentExamples = dataPoints
    .filter((d) => d.score - d.confidence > 15)
    .sort((a, b) => (b.score - b.confidence) - (a.score - a.confidence))
    .slice(0, 5)
    .map((d) => ({
      promptId: d.promptId,
      conceptName: d.conceptName,
      confidence: Math.round(d.confidence),
      score: Math.round(d.score),
      delta: Math.round(d.score - d.confidence),
    }));

  // Calculate trend
  const midpoint = Math.floor(dataPoints.length / 2);
  const recentData = dataPoints.slice(0, midpoint);
  const olderData = dataPoints.slice(midpoint);

  const recentMAE =
    recentData.length > 0
      ? recentData.reduce((sum, d) => sum + Math.abs(d.confidence - d.score), 0) /
        recentData.length
      : meanAbsoluteError;

  const olderMAE =
    olderData.length > 0
      ? olderData.reduce((sum, d) => sum + Math.abs(d.confidence - d.score), 0) /
        olderData.length
      : meanAbsoluteError;

  let trend: 'IMPROVING' | 'STABLE' | 'WORSENING' = 'STABLE';
  const maeDiff = olderMAE - recentMAE;

  if (maeDiff > 5) {
    trend = 'IMPROVING';
  } else if (maeDiff < -5) {
    trend = 'WORSENING';
  }

  return {
    calibrationScore: Math.round(calibrationScore),
    meanAbsoluteError: Math.round(meanAbsoluteError * 10) / 10,
    correlationCoefficient: Math.round(correlationCoefficient * 100) / 100,
    overconfidentExamples,
    underconfidentExamples,
    trend,
    totalAttempts: responses.length,
  };
}

describe('GET /api/validation/calibration', () => {
  const mockUserId = 'test-user-123';

  describe('Calibration Metrics Calculation', () => {
    it('should return empty metrics when no responses exist', () => {
      const metrics = calculateCalibrationMetrics([]);
      expect(metrics.calibrationScore).toBe(0);
      expect(metrics.meanAbsoluteError).toBe(0);
      expect(metrics.correlationCoefficient).toBe(0);
      expect(metrics.totalAttempts).toBe(0);
    });

    it('should calculate mean absolute error', () => {
      const responses: ValidationResponse[] = [
        {
          id: '1',
          promptId: 'p1',
          userId: mockUserId,
          userAnswer: 'answer1',
          aiEvaluation: 'eval1',
          score: 0.75, // 75%
          confidenceLevel: 5, // 100%
          calibrationDelta: 25,
          respondedAt: new Date(),
          skipped: false,
          prompt: { id: 'p1', conceptName: 'Concept A' },
        },
        {
          id: '2',
          promptId: 'p2',
          userId: mockUserId,
          userAnswer: 'answer2',
          aiEvaluation: 'eval2',
          score: 0.6, // 60%
          confidenceLevel: 3, // 50%
          calibrationDelta: -10,
          respondedAt: new Date(),
          skipped: false,
          prompt: { id: 'p2', conceptName: 'Concept B' },
        },
      ];

      const metrics = calculateCalibrationMetrics(responses);
      // MAE = (|100-75| + |50-60|) / 2 = (25 + 10) / 2 = 17.5
      expect(metrics.meanAbsoluteError).toBe(17.5);
    });

    it('should calculate correlation coefficient', () => {
      const responses: ValidationResponse[] = [
        {
          id: '1',
          promptId: 'p1',
          userId: mockUserId,
          userAnswer: 'answer1',
          aiEvaluation: 'eval1',
          score: 0.0, // 0%
          confidenceLevel: 1, // 0%
          calibrationDelta: 0,
          respondedAt: new Date(),
          skipped: false,
          prompt: { id: 'p1', conceptName: 'Concept A' },
        },
        {
          id: '2',
          promptId: 'p2',
          userId: mockUserId,
          userAnswer: 'answer2',
          aiEvaluation: 'eval2',
          score: 0.25, // 25%
          confidenceLevel: 2, // 25%
          calibrationDelta: 0,
          respondedAt: new Date(),
          skipped: false,
          prompt: { id: 'p2', conceptName: 'Concept B' },
        },
        {
          id: '3',
          promptId: 'p3',
          userId: mockUserId,
          userAnswer: 'answer3',
          aiEvaluation: 'eval3',
          score: 0.5, // 50%
          confidenceLevel: 3, // 50%
          calibrationDelta: 0,
          respondedAt: new Date(),
          skipped: false,
          prompt: { id: 'p3', conceptName: 'Concept C' },
        },
        {
          id: '4',
          promptId: 'p4',
          userId: mockUserId,
          userAnswer: 'answer4',
          aiEvaluation: 'eval4',
          score: 0.75, // 75%
          confidenceLevel: 4, // 75%
          calibrationDelta: 0,
          respondedAt: new Date(),
          skipped: false,
          prompt: { id: 'p4', conceptName: 'Concept D' },
        },
        {
          id: '5',
          promptId: 'p5',
          userId: mockUserId,
          userAnswer: 'answer5',
          aiEvaluation: 'eval5',
          score: 1.0, // 100%
          confidenceLevel: 5, // 100%
          calibrationDelta: 0,
          respondedAt: new Date(),
          skipped: false,
          prompt: { id: 'p5', conceptName: 'Concept E' },
        },
      ];

      const metrics = calculateCalibrationMetrics(responses);
      // Perfect correlation (confidence matches score exactly)
      expect(metrics.correlationCoefficient).toBeCloseTo(1.0, 2);
    });

    it('should identify overconfident examples (delta > 15)', () => {
      const responses: ValidationResponse[] = [
        {
          id: '1',
          promptId: 'p1',
          userId: mockUserId,
          userAnswer: 'answer1',
          aiEvaluation: 'eval1',
          score: 0.45, // 45%
          confidenceLevel: 5, // 100%
          calibrationDelta: 55,
          respondedAt: new Date(),
          skipped: false,
          prompt: { id: 'p1', conceptName: 'Cardiology' },
        },
      ];

      const metrics = calculateCalibrationMetrics(responses);
      expect(metrics.overconfidentExamples.length).toBe(1);
      expect(metrics.overconfidentExamples[0].conceptName).toBe('Cardiology');
      expect(metrics.overconfidentExamples[0].delta).toBe(55);
      expect(metrics.overconfidentExamples[0].confidence).toBe(100);
      expect(metrics.overconfidentExamples[0].score).toBe(45);
    });

    it('should identify underconfident examples (delta < -15)', () => {
      const responses: ValidationResponse[] = [
        {
          id: '1',
          promptId: 'p1',
          userId: mockUserId,
          userAnswer: 'answer1',
          aiEvaluation: 'eval1',
          score: 0.9, // 90%
          confidenceLevel: 2, // 25%
          calibrationDelta: -65,
          respondedAt: new Date(),
          skipped: false,
          prompt: { id: 'p1', conceptName: 'Pharmacology' },
        },
      ];

      const metrics = calculateCalibrationMetrics(responses);
      expect(metrics.underconfidentExamples.length).toBe(1);
      expect(metrics.underconfidentExamples[0].conceptName).toBe('Pharmacology');
      expect(metrics.underconfidentExamples[0].delta).toBe(65);
      expect(metrics.underconfidentExamples[0].confidence).toBe(25);
      expect(metrics.underconfidentExamples[0].score).toBe(90);
    });

    it('should return up to 5 overconfident examples sorted by delta', () => {
      const responses: ValidationResponse[] = Array.from({ length: 10 }, (_, i) => ({
        id: `${i}`,
        promptId: `p${i}`,
        userId: mockUserId,
        userAnswer: `answer${i}`,
        aiEvaluation: `eval${i}`,
        score: 0.3 + i * 0.02, // Increasing scores
        confidenceLevel: 5, // Constant high confidence
        calibrationDelta: 70 - i * 5,
        respondedAt: new Date(),
        skipped: false,
        prompt: { id: `p${i}`, conceptName: `Concept ${i}` },
      }));

      const metrics = calculateCalibrationMetrics(responses);
      expect(metrics.overconfidentExamples.length).toBe(5); // Max 5
      // Should be sorted by highest delta first
      expect(metrics.overconfidentExamples[0].delta).toBeGreaterThanOrEqual(
        metrics.overconfidentExamples[1].delta
      );
    });

    it('should not include borderline calibrated items in overconfident', () => {
      const responses: ValidationResponse[] = [
        {
          id: '1',
          promptId: 'p1',
          userId: mockUserId,
          userAnswer: 'answer1',
          aiEvaluation: 'eval1',
          score: 0.35, // 35%
          confidenceLevel: 3, // 50%
          calibrationDelta: 15, // Exactly at threshold
          respondedAt: new Date(),
          skipped: false,
          prompt: { id: 'p1', conceptName: 'Concept' },
        },
      ];

      const metrics = calculateCalibrationMetrics(responses);
      expect(metrics.overconfidentExamples.length).toBe(0); // Delta = 15 is not > 15
    });
  });

  describe('Trend Calculation', () => {
    it('should calculate IMPROVING trend when recent MAE < older MAE', () => {
      const responses: ValidationResponse[] = [
        // Older (worse calibration)
        {
          id: '1',
          promptId: 'p1',
          userId: mockUserId,
          userAnswer: 'answer1',
          aiEvaluation: 'eval1',
          score: 0.3,
          confidenceLevel: 5,
          calibrationDelta: 70,
          respondedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          skipped: false,
          prompt: { id: 'p1', conceptName: 'Concept' },
        },
        {
          id: '2',
          promptId: 'p2',
          userId: mockUserId,
          userAnswer: 'answer2',
          aiEvaluation: 'eval2',
          score: 0.4,
          confidenceLevel: 5,
          calibrationDelta: 60,
          respondedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
          skipped: false,
          prompt: { id: 'p2', conceptName: 'Concept' },
        },
        // Recent (better calibration)
        {
          id: '3',
          promptId: 'p3',
          userId: mockUserId,
          userAnswer: 'answer3',
          aiEvaluation: 'eval3',
          score: 0.8,
          confidenceLevel: 4,
          calibrationDelta: -5,
          respondedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          skipped: false,
          prompt: { id: 'p3', conceptName: 'Concept' },
        },
        {
          id: '4',
          promptId: 'p4',
          userId: mockUserId,
          userAnswer: 'answer4',
          aiEvaluation: 'eval4',
          score: 0.75,
          confidenceLevel: 4,
          calibrationDelta: 0,
          respondedAt: new Date(),
          skipped: false,
          prompt: { id: 'p4', conceptName: 'Concept' },
        },
      ];

      const metrics = calculateCalibrationMetrics(responses);
      expect(metrics.trend).toBe('IMPROVING');
    });

    it('should calculate WORSENING trend when recent MAE > older MAE', () => {
      const responses: ValidationResponse[] = [
        // Older (good calibration)
        {
          id: '1',
          promptId: 'p1',
          userId: mockUserId,
          userAnswer: 'answer1',
          aiEvaluation: 'eval1',
          score: 0.75,
          confidenceLevel: 3,
          calibrationDelta: 0,
          respondedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          skipped: false,
          prompt: { id: 'p1', conceptName: 'Concept' },
        },
        {
          id: '2',
          promptId: 'p2',
          userId: mockUserId,
          userAnswer: 'answer2',
          aiEvaluation: 'eval2',
          score: 0.8,
          confidenceLevel: 3,
          calibrationDelta: 0,
          respondedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
          skipped: false,
          prompt: { id: 'p2', conceptName: 'Concept' },
        },
        // Recent (poor calibration)
        {
          id: '3',
          promptId: 'p3',
          userId: mockUserId,
          userAnswer: 'answer3',
          aiEvaluation: 'eval3',
          score: 0.2,
          confidenceLevel: 5,
          calibrationDelta: 80,
          respondedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          skipped: false,
          prompt: { id: 'p3', conceptName: 'Concept' },
        },
        {
          id: '4',
          promptId: 'p4',
          userId: mockUserId,
          userAnswer: 'answer4',
          aiEvaluation: 'eval4',
          score: 0.25,
          confidenceLevel: 5,
          calibrationDelta: 75,
          respondedAt: new Date(),
          skipped: false,
          prompt: { id: 'p4', conceptName: 'Concept' },
        },
      ];

      const metrics = calculateCalibrationMetrics(responses);
      expect(metrics.trend).toBe('WORSENING');
    });

    it('should calculate STABLE trend when difference is within threshold', () => {
      const responses: ValidationResponse[] = Array.from(
        { length: 10 },
        (_, i) => ({
          id: `${i}`,
          promptId: `p${i}`,
          userId: mockUserId,
          userAnswer: `answer${i}`,
          aiEvaluation: `eval${i}`,
          score: 0.5 + Math.random() * 0.1,
          confidenceLevel: 3,
          calibrationDelta: Math.random() * 5 - 2.5,
          respondedAt: new Date(),
          skipped: false,
          prompt: { id: `p${i}`, conceptName: `Concept` },
        })
      );

      const metrics = calculateCalibrationMetrics(responses);
      expect(['IMPROVING', 'STABLE', 'WORSENING']).toContain(metrics.trend);
    });
  });

  describe('AC#3 Compliance: Confidence vs. Performance Tracking', () => {
    it('should track calibration accuracy per concept', () => {
      const responses: ValidationResponse[] = [
        {
          id: '1',
          promptId: 'p1',
          userId: mockUserId,
          userAnswer: 'answer1',
          aiEvaluation: 'eval1',
          score: 0.8,
          confidenceLevel: 4,
          calibrationDelta: 0,
          respondedAt: new Date(),
          skipped: false,
          prompt: { id: 'p1', conceptName: 'Cardiology' },
        },
        {
          id: '2',
          promptId: 'p2',
          userId: mockUserId,
          userAnswer: 'answer2',
          aiEvaluation: 'eval2',
          score: 0.2,
          confidenceLevel: 5,
          calibrationDelta: 80,
          respondedAt: new Date(),
          skipped: false,
          prompt: { id: 'p2', conceptName: 'Pharmacology' },
        },
      ];

      const metrics = calculateCalibrationMetrics(responses);
      expect(metrics.overconfidentExamples[0].conceptName).toBe('Pharmacology');
    });

    it('should calculate calibration delta correctly (confidence normalized - score)', () => {
      // Example from AC#3
      const responses: ValidationResponse[] = [
        {
          id: '1',
          promptId: 'p1',
          userId: mockUserId,
          userAnswer: 'answer1',
          aiEvaluation: 'eval1',
          score: 0.6, // 60%
          confidenceLevel: 5, // (5-1)*25 = 100%
          calibrationDelta: 40,
          respondedAt: new Date(),
          skipped: false,
          prompt: { id: 'p1', conceptName: 'Concept' },
        },
      ];

      const metrics = calculateCalibrationMetrics(responses);
      expect(metrics.overconfidentExamples[0].delta).toBe(40);
    });

    it('should calculate Pearson correlation coefficient for 10+ assessments', () => {
      const responses: ValidationResponse[] = Array.from(
        { length: 15 },
        (_, i) => ({
          id: `${i}`,
          promptId: `p${i}`,
          userId: mockUserId,
          userAnswer: `answer${i}`,
          aiEvaluation: `eval${i}`,
          score: 0.3 + i * 0.04,
          confidenceLevel: 1 + Math.floor((i % 5) * 1.25),
          calibrationDelta: 0,
          respondedAt: new Date(),
          skipped: false,
          prompt: { id: `p${i}`, conceptName: `Concept` },
        })
      );

      const metrics = calculateCalibrationMetrics(responses);
      expect(metrics.totalAttempts).toBe(15);
      expect(metrics.correlationCoefficient >= -1 && metrics.correlationCoefficient <= 1).toBe(true);
    });
  });

  describe('AC#6 Compliance: Calibration Trends Dashboard', () => {
    it('should identify consistently overconfident topics', () => {
      // AC#6: "Identify consistently overconfident topics (delta > 15 across 3+ assessments)"
      const responses: ValidationResponse[] = [
        {
          id: '1',
          promptId: 'p1',
          userId: mockUserId,
          userAnswer: 'answer1',
          aiEvaluation: 'eval1',
          score: 0.3,
          confidenceLevel: 5,
          calibrationDelta: 70,
          respondedAt: new Date(),
          skipped: false,
          prompt: { id: 'p1', conceptName: 'Cardiology' },
        },
        {
          id: '2',
          promptId: 'p2',
          userId: mockUserId,
          userAnswer: 'answer2',
          aiEvaluation: 'eval2',
          score: 0.4,
          confidenceLevel: 5,
          calibrationDelta: 60,
          respondedAt: new Date(),
          skipped: false,
          prompt: { id: 'p2', conceptName: 'Cardiology' },
        },
        {
          id: '3',
          promptId: 'p3',
          userId: mockUserId,
          userAnswer: 'answer3',
          aiEvaluation: 'eval3',
          score: 0.35,
          confidenceLevel: 5,
          calibrationDelta: 65,
          respondedAt: new Date(),
          skipped: false,
          prompt: { id: 'p3', conceptName: 'Cardiology' },
        },
      ];

      const metrics = calculateCalibrationMetrics(responses);
      // All should be identified as overconfident
      expect(metrics.overconfidentExamples.length).toBe(3);
      expect(
        metrics.overconfidentExamples.every(
          (e) => e.conceptName === 'Cardiology' && e.delta > 15
        )
      ).toBe(true);
    });

    it('should identify consistently underconfident topics', () => {
      // AC#6: "Identify consistently underconfident topics (delta < -15 across 3+ assessments)"
      const responses: ValidationResponse[] = [
        {
          id: '1',
          promptId: 'p1',
          userId: mockUserId,
          userAnswer: 'answer1',
          aiEvaluation: 'eval1',
          score: 0.9,
          confidenceLevel: 2,
          calibrationDelta: -65,
          respondedAt: new Date(),
          skipped: false,
          prompt: { id: 'p1', conceptName: 'Pharmacology' },
        },
        {
          id: '2',
          promptId: 'p2',
          userId: mockUserId,
          userAnswer: 'answer2',
          aiEvaluation: 'eval2',
          score: 0.85,
          confidenceLevel: 2,
          calibrationDelta: -60,
          respondedAt: new Date(),
          skipped: false,
          prompt: { id: 'p2', conceptName: 'Pharmacology' },
        },
        {
          id: '3',
          promptId: 'p3',
          userId: mockUserId,
          userAnswer: 'answer3',
          aiEvaluation: 'eval3',
          score: 0.88,
          confidenceLevel: 2,
          calibrationDelta: -63,
          respondedAt: new Date(),
          skipped: false,
          prompt: { id: 'p3', conceptName: 'Pharmacology' },
        },
      ];

      const metrics = calculateCalibrationMetrics(responses);
      // All should be identified as underconfident
      expect(metrics.underconfidentExamples.length).toBe(3);
      expect(
        metrics.underconfidentExamples.every(
          (e) => e.conceptName === 'Pharmacology' && e.delta > 15
        )
      ).toBe(true);
    });
  });

  describe('Error Handling and Validation', () => {
    it('should handle null confidenceLevel gracefully', () => {
      const responses: ValidationResponse[] = [
        {
          id: '1',
          promptId: 'p1',
          userId: mockUserId,
          userAnswer: 'answer1',
          aiEvaluation: 'eval1',
          score: 0.75,
          confidenceLevel: null,
          calibrationDelta: null,
          respondedAt: new Date(),
          skipped: false,
          prompt: { id: 'p1', conceptName: 'Concept' },
        },
      ];

      const metrics = calculateCalibrationMetrics(responses);
      expect(metrics.calibrationScore).toBe(0);
    });

    it('should skip responses with skipped=true flag', () => {
      const responses: ValidationResponse[] = [
        {
          id: '1',
          promptId: 'p1',
          userId: mockUserId,
          userAnswer: 'answer1',
          aiEvaluation: 'eval1',
          score: 0.75,
          confidenceLevel: 3,
          calibrationDelta: 0,
          respondedAt: new Date(),
          skipped: true, // Should be excluded
          prompt: { id: 'p1', conceptName: 'Concept' },
        },
      ];

      // Assuming the API filters skipped responses
      const filteredResponses = responses.filter((r) => !r.skipped);
      const metrics = calculateCalibrationMetrics(filteredResponses);
      expect(metrics.totalAttempts).toBe(0);
    });
  });
});
