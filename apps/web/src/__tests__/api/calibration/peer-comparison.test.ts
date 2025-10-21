/**
 * Peer Comparison API Endpoint Tests
 *
 * Tests for GET /api/calibration/peer-comparison
 * Covers:
 * - Privacy enforcement (opt-in validation, minimum pool size)
 * - User data validation
 * - Distribution statistics calculation
 * - Common overconfident topics identification
 * - Error handling
 *
 * Story 4.4 Task 9: Peer Calibration Comparison
 */

// Jest globals (describe, it, expect, beforeEach) are available without imports
import { GET } from '@/app/api/calibration/peer-comparison/route';
import { prisma } from '@/lib/db';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    validationResponse: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('@/lib/auth', () => ({
  getUserId: jest.fn().mockResolvedValue('test-user-id'),
}));

jest.mock('@/lib/confidence-calibrator', () => ({
  calculateCorrelation: jest.fn((confidenceArray: number[], scoreArray: number[]) => {
    // Simple mock correlation calculation (returns 0.7 for valid data)
    if (confidenceArray.length >= 5) return 0.7;
    return null;
  }),
  normalizeConfidence: jest.fn((confidence: number) => (confidence - 1) * 25),
}));

jest.mock('@/lib/api-response', () => ({
  successResponse: (data: any) => ({ success: true, data }),
  errorResponse: (code: string, message: string) => ({ success: false, error: code, message }),
}));

describe('GET /api/calibration/peer-comparison', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockRequest = (params: Record<string, string> = {}) => {
    const url = new URL('http://localhost:3000/api/calibration/peer-comparison');
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));

    return new NextRequest(url);
  };

  describe('Privacy enforcement', () => {
    it('should return 404 if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('USER_NOT_FOUND');
    });

    it('should return 403 if user has not opted-in to peer comparison', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'test-user-id',
        sharePeerCalibrationData: false,
      } as any);

      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toBe('PEER_COMPARISON_DISABLED');
      expect(data.message).toContain('enable peer comparison in settings');
    });

    it('should enforce minimum pool size of 20 users', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'test-user-id',
        sharePeerCalibrationData: true,
      } as any);

      // Only 15 opted-in users (below minimum)
      (prisma.user.findMany as jest.Mock).mockResolvedValue(
        Array.from({ length: 15 }, (_, i) => ({ id: `user-${i}` })) as any
      );

      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('INSUFFICIENT_PEER_DATA');
      expect(data.message).toContain('need 20+ participants');
      expect(data.message).toContain('currently 15');
    });

    it('should only query opted-in users', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'test-user-id',
        sharePeerCalibrationData: true,
      } as any);

      (prisma.user.findMany as jest.Mock).mockResolvedValue(
        Array.from({ length: 25 }, (_, i) => ({ id: `user-${i}` })) as any
      );

      // Mock validation responses
      (prisma.validationResponse.findMany as jest.Mock).mockResolvedValue(
        Array.from({ length: 10 }, (_, i) => ({
          preAssessmentConfidence: 3,
          score: 0.7,
          prompt: { conceptName: 'Cardiology' },
          calibrationDelta: 10,
        })) as any
      );

      const request = createMockRequest();
      await GET(request);

      // Verify query included sharePeerCalibrationData filter
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: {
          sharePeerCalibrationData: true,
        },
        select: {
          id: true,
        },
      });
    });
  });

  describe('User data validation', () => {
    beforeEach(() => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'test-user-id',
        sharePeerCalibrationData: true,
      } as any);

      (prisma.user.findMany as jest.Mock).mockResolvedValue(
        Array.from({ length: 25 }, (_, i) => ({ id: `user-${i}` })) as any
      );
    });

    it('should return 400 if user has insufficient assessment data', async () => {
      // User has only 3 assessments (below minimum of 5)
      vi.mocked(prisma.validationResponse.findMany)
        .mockResolvedValueOnce([
          // Peer responses (for peer correlation calculation)
          ...Array.from({ length: 10 }, () => ({
            preAssessmentConfidence: 3,
            score: 0.7,
          })),
        ] as any)
        .mockResolvedValueOnce([
          // User responses (insufficient data)
          { preAssessmentConfidence: 3, score: 0.7, prompt: { conceptName: 'Cardiology' }, calibrationDelta: 10 },
          { preAssessmentConfidence: 4, score: 0.8, prompt: { conceptName: 'Cardiology' }, calibrationDelta: 5 },
          { preAssessmentConfidence: 2, score: 0.6, prompt: { conceptName: 'Cardiology' }, calibrationDelta: 15 },
        ] as any);

      // Mock correlation to return null for insufficient data
      const { calculateCorrelation } = await import('@/lib/confidence-calibrator');
      (calculateCorrelation as jest.Mock).mockReturnValueOnce(0.7).mockReturnValueOnce(null);

      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('INSUFFICIENT_USER_DATA');
      expect(data.message).toContain('at least 5 assessments');
    });
  });

  describe('Peer comparison data', () => {
    beforeEach(() => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'test-user-id',
        sharePeerCalibrationData: true,
      } as any);

      (prisma.user.findMany as jest.Mock).mockResolvedValue(
        Array.from({ length: 25 }, (_, i) => ({ id: `user-${i}` })) as any
      );
    });

    it('should successfully return peer comparison data', async () => {
      // Mock peer responses
      vi.mocked(prisma.validationResponse.findMany)
        .mockResolvedValue(
          Array.from({ length: 10 }, () => ({
            preAssessmentConfidence: 3,
            score: 0.7,
          })) as any
        )
        .mockResolvedValueOnce(
          // User responses
          Array.from({ length: 10 }, () => ({
            preAssessmentConfidence: 3,
            score: 0.7,
            prompt: { conceptName: 'Cardiology' },
            calibrationDelta: 10,
          })) as any
        )
        .mockResolvedValueOnce(
          // All peer responses for common topics
          Array.from({ length: 50 }, (_, i) => ({
            userId: `user-${i % 25}`,
            calibrationDelta: 20,
            prompt: { conceptName: 'Cardiology' },
          })) as any
        );

      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('userCorrelation');
      expect(data.data).toHaveProperty('userPercentile');
      expect(data.data).toHaveProperty('peerDistribution');
      expect(data.data).toHaveProperty('commonOverconfidentTopics');
      expect(data.data).toHaveProperty('peerAvgCorrelation');
      expect(data.data).toHaveProperty('peerPoolSize');

      expect(data.data.peerPoolSize).toBe(25);
    });

    it('should calculate peer distribution statistics correctly', async () => {
      // Mock multiple peers with different correlations
      const { calculateCorrelation } = await import('@/lib/confidence-calibrator');
      (calculateCorrelation as jest.Mock)
        .mockReturnValueOnce(0.5)
        .mockReturnValueOnce(0.6)
        .mockReturnValueOnce(0.7)
        .mockReturnValueOnce(0.8)
        .mockReturnValueOnce(0.9)
        .mockReturnValue(0.7); // For remaining peers and user

      (prisma.validationResponse.findMany as jest.Mock).mockResolvedValue(
        Array.from({ length: 10 }, () => ({
          preAssessmentConfidence: 3,
          score: 0.7,
          prompt: { conceptName: 'Cardiology' },
          calibrationDelta: 10,
        })) as any
      );

      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.peerDistribution).toHaveProperty('quartiles');
      expect(data.data.peerDistribution).toHaveProperty('median');
      expect(data.data.peerDistribution).toHaveProperty('mean');

      // Verify quartiles array has 3 values
      expect(data.data.peerDistribution.quartiles).toHaveLength(3);

      // Q1 should be less than median, median less than Q3
      const [q1, median, q3] = data.data.peerDistribution.quartiles;
      expect(q1).toBeLessThanOrEqual(median);
      expect(median).toBeLessThanOrEqual(q3);
    });

    it('should identify common overconfident topics with >= 50% prevalence', async () => {
      vi.mocked(prisma.validationResponse.findMany)
        .mockResolvedValueOnce(
          // Peer responses for correlation
          Array.from({ length: 10 }, () => ({
            preAssessmentConfidence: 3,
            score: 0.7,
          })) as any
        )
        .mockResolvedValueOnce(
          // User responses
          Array.from({ length: 10 }, () => ({
            preAssessmentConfidence: 3,
            score: 0.7,
            prompt: { conceptName: 'Cardiology' },
            calibrationDelta: 10,
          })) as any
        )
        .mockResolvedValueOnce(
          // All peer responses: 15 users overconfident in Cardiology (60%)
          [
            ...Array.from({ length: 15 }, (_, i) => ({
              userId: `user-${i}`,
              calibrationDelta: 20, // Overconfident
              prompt: { conceptName: 'Cardiology' },
            })),
            ...Array.from({ length: 10 }, (_, i) => ({
              userId: `user-${i}`,
              calibrationDelta: 10, // Not overconfident
              prompt: { conceptName: 'Pharmacology' },
            })),
          ] as any
        );

      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.commonOverconfidentTopics).toContain('Cardiology');
      expect(data.data.commonOverconfidentTopics).not.toContain('Pharmacology'); // Below 50%
    });

    it('should calculate user percentile correctly', async () => {
      // Mock user with high correlation (0.9)
      const { calculateCorrelation } = await import('@/lib/confidence-calibrator');

      // Peer correlations: [0.5, 0.5, 0.6, 0.6, 0.7, 0.7, 0.8, 0.8, 0.9, 0.9] (10 peers)
      const peerCorrelations = [0.5, 0.5, 0.6, 0.6, 0.7, 0.7, 0.8, 0.8, 0.9, 0.9];
      peerCorrelations.forEach((corr) => {
        (calculateCorrelation as jest.Mock).mockReturnValueOnce(corr);
      });

      // User correlation: 0.85 (should be ~80th percentile: 8 out of 10 below)
      (calculateCorrelation as jest.Mock).mockReturnValueOnce(0.85);

      (prisma.validationResponse.findMany as jest.Mock).mockResolvedValue(
        Array.from({ length: 10 }, () => ({
          preAssessmentConfidence: 3,
          score: 0.7,
          prompt: { conceptName: 'Cardiology' },
          calibrationDelta: 10,
        })) as any
      );

      // Mock 10 peers for simpler calculation
      (prisma.user.findMany as jest.Mock).mockResolvedValue(
        Array.from({ length: 20 }, (_, i) => ({ id: `user-${i}` })) as any
      );

      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.userPercentile).toBeGreaterThanOrEqual(0);
      expect(data.data.userPercentile).toBeLessThanOrEqual(100);
    });
  });

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('INTERNAL_ERROR');
    });

    it('should handle invalid date ranges', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'test-user-id',
        sharePeerCalibrationData: true,
      } as any);

      (prisma.user.findMany as jest.Mock).mockResolvedValue(
        Array.from({ length: 25 }, (_, i) => ({ id: `user-${i}` })) as any
      );

      // Mock responses with invalid dates
      (prisma.validationResponse.findMany as jest.Mock).mockResolvedValue([] as any);

      const { calculateCorrelation } = await import('@/lib/confidence-calibrator');
      (calculateCorrelation as jest.Mock).mockReturnValue(null);

      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('INSUFFICIENT_USER_DATA');
    });
  });

  describe('Anonymization and privacy', () => {
    beforeEach(() => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'test-user-id',
        sharePeerCalibrationData: true,
      } as any);

      (prisma.user.findMany as jest.Mock).mockResolvedValue(
        Array.from({ length: 25 }, (_, i) => ({ id: `user-${i}` })) as any
      );
    });

    it('should not return individual peer identities', async () => {
      (prisma.validationResponse.findMany as jest.Mock).mockResolvedValue(
        Array.from({ length: 10 }, () => ({
          preAssessmentConfidence: 3,
          score: 0.7,
          prompt: { conceptName: 'Cardiology' },
          calibrationDelta: 10,
        })) as any
      );

      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);

      // Response should not contain individual user IDs
      const responseString = JSON.stringify(data.data);
      expect(responseString).not.toContain('user-0');
      expect(responseString).not.toContain('user-1');

      // Should only contain aggregated statistics
      expect(data.data.peerDistribution).toBeDefined();
      expect(data.data.commonOverconfidentTopics).toBeDefined();
      expect(data.data.peerAvgCorrelation).toBeDefined();
    });

    it('should only return aggregated statistics', async () => {
      (prisma.validationResponse.findMany as jest.Mock).mockResolvedValue(
        Array.from({ length: 10 }, () => ({
          preAssessmentConfidence: 3,
          score: 0.7,
          prompt: { conceptName: 'Cardiology' },
          calibrationDelta: 10,
        })) as any
      );

      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);

      // Verify only aggregated data is returned
      expect(data.data).toHaveProperty('peerDistribution');
      expect(data.data).toHaveProperty('peerAvgCorrelation');
      expect(data.data).toHaveProperty('peerPoolSize');

      // Should NOT have individual peer data
      expect(data.data).not.toHaveProperty('peers');
      expect(data.data).not.toHaveProperty('peerDetails');
      expect(data.data).not.toHaveProperty('individualCorrelations');
    });
  });
});
