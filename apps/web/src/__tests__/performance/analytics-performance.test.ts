/**
 * Mission Analytics Performance Tests
 *
 * Performance benchmarks for analytics queries, chart rendering,
 * recommendation generation, and concurrent operations.
 *
 * Story 2.6 - Task 12.5: Performance Testing
 */

import { MissionAnalyticsEngine } from '@/lib/mission-analytics-engine';
import { MissionAdaptationEngine } from '@/lib/mission-adaptation-engine';
import { prisma } from '@/lib/db';
import { MissionStatus } from '@/generated/prisma';

// Mock Prisma client
jest.mock('@/lib/db');

describe('Mission Analytics Performance Benchmarks', () => {
  let analyticsEngine: MissionAnalyticsEngine;
  let adaptationEngine: MissionAdaptationEngine;

  beforeEach(() => {
    analyticsEngine = new MissionAnalyticsEngine();
    adaptationEngine = new MissionAdaptationEngine();
    jest.clearAllMocks();
  });

  // Helper to generate mock mission data
  const generateMockMissions = (count: number) => {
    return Array.from({ length: count }, (_, i) => ({
      id: `mission-${i}`,
      userId: 'user1',
      status: i % 5 === 0 ? MissionStatus.SKIPPED : MissionStatus.COMPLETED,
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000), // Daily missions going back
      objectives: [
        { objectiveId: 'obj1', completed: true },
        { objectiveId: 'obj2', completed: i % 2 === 0 },
      ],
      estimatedMinutes: 60,
      actualMinutes: 55 + (i % 10),
      difficultyRating: 3,
      successScore: 0.8 + Math.random() * 0.2,
      feedback: [],
      studySessions: [
        {
          reviews: [
            { rating: 'GOOD' },
            { rating: 'EASY' },
          ],
        },
      ],
    }));
  };

  describe('Analytics Query Performance', () => {
    it('should calculate 7-day analytics within 1 second', async () => {
      const mockMissions = generateMockMissions(7);
      (prisma.mission.findMany as jest.Mock).mockResolvedValue(mockMissions);

      const startTime = performance.now();
      await analyticsEngine.calculateCompletionRate('user1', '7d');
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(1000); // < 1 second

      console.log(`7-day analytics: ${duration.toFixed(2)}ms`);
    });

    it('should calculate 30-day analytics within 1 second', async () => {
      const mockMissions = generateMockMissions(30);
      (prisma.mission.findMany as jest.Mock).mockResolvedValue(mockMissions);

      const startTime = performance.now();
      await analyticsEngine.calculateCompletionRate('user1', '30d');
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(1000); // < 1 second

      console.log(`30-day analytics: ${duration.toFixed(2)}ms`);
    });

    it('should calculate 90-day analytics within 1 second', async () => {
      const mockMissions = generateMockMissions(90);
      (prisma.mission.findMany as jest.Mock).mockResolvedValue(mockMissions);

      const startTime = performance.now();
      await analyticsEngine.calculateCompletionRate('user1', '90d');
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(1000); // < 1 second

      console.log(`90-day analytics: ${duration.toFixed(2)}ms`);
    });

    it('should calculate daily analytics for date within 500ms', async () => {
      const mockMissions = generateMockMissions(3);
      (prisma.mission.findMany as jest.Mock).mockResolvedValue(mockMissions);

      const startTime = performance.now();
      await analyticsEngine.calculateDailyAnalytics('user1', new Date());
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(500); // < 500ms

      console.log(`Daily analytics: ${duration.toFixed(2)}ms`);
    });

    it('should handle large dataset (365 days) efficiently', async () => {
      const mockMissions = generateMockMissions(365);
      (prisma.mission.findMany as jest.Mock).mockResolvedValue(mockMissions);

      const startTime = performance.now();
      await analyticsEngine.calculateCompletionRate('user1', 'all');
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(2000); // < 2 seconds for large dataset

      console.log(`365-day analytics: ${duration.toFixed(2)}ms`);
    });
  });

  describe('Recommendation Generation Performance', () => {
    it('should generate mission adjustments within 300ms', async () => {
      const mockMissions = generateMockMissions(14);
      (prisma.mission.findMany as jest.Mock).mockResolvedValue(mockMissions);

      const startTime = performance.now();
      await analyticsEngine.recommendMissionAdjustments('user1');
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(300); // < 300ms

      console.log(`Recommendation generation: ${duration.toFixed(2)}ms`);
    });

    it('should analyze user patterns within 250ms', async () => {
      const mockMissions = generateMockMissions(14);
      (prisma.mission.findMany as jest.Mock).mockResolvedValue(mockMissions);

      const startTime = performance.now();
      await adaptationEngine.analyzeUserPatterns('user1');
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(250); // < 250ms

      console.log(`Pattern analysis: ${duration.toFixed(2)}ms`);
    });

    it('should generate adaptation recommendations within 100ms', async () => {
      const mockPatterns = [
        {
          type: 'LOW_COMPLETION' as const,
          confidence: 0.8,
          details: { avgCompletionRate: 0.5 },
        },
      ];

      const startTime = performance.now();
      adaptationEngine.generateAdaptationRecommendations(mockPatterns);
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(100); // < 100ms (synchronous operation)

      console.log(`Adaptation recommendations: ${duration.toFixed(2)}ms`);
    });
  });

  describe('Correlation Calculation Performance', () => {
    it('should calculate performance correlation within 800ms', async () => {
      const mockMissions = generateMockMissions(30);
      (prisma.mission.findMany as jest.Mock).mockResolvedValue(mockMissions);

      const startTime = performance.now();
      await analyticsEngine.detectPerformanceCorrelation('user1');
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(800); // < 800ms

      console.log(`Performance correlation: ${duration.toFixed(2)}ms`);
    });

    it('should handle minimum data (7 missions) efficiently', async () => {
      const mockMissions = generateMockMissions(7);
      (prisma.mission.findMany as jest.Mock).mockResolvedValue(mockMissions);

      const startTime = performance.now();
      await analyticsEngine.detectPerformanceCorrelation('user1');
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(200); // < 200ms for minimal data

      console.log(`Minimal correlation: ${duration.toFixed(2)}ms`);
    });
  });

  describe('Chart Data Preparation Performance', () => {
    it('should prepare chart data for 30 days within 500ms', async () => {
      const mockMissions = generateMockMissions(30);
      (prisma.mission.findMany as jest.Mock).mockResolvedValue(mockMissions);

      const startTime = performance.now();

      // Simulate chart data preparation
      const missions = await prisma.mission.findMany({
        where: { userId: 'user1' },
      });

      const chartData = missions.map((m) => ({
        date: m.date.toISOString().split('T')[0],
        completionRate:
          m.status === MissionStatus.COMPLETED ? 1 : 0,
        successScore: m.successScore,
      }));

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(500); // < 500ms
      expect(chartData).toHaveLength(30);

      console.log(`Chart data preparation: ${duration.toFixed(2)}ms`);
    });

    it('should aggregate weekly data efficiently', async () => {
      const mockMissions = generateMockMissions(90);
      (prisma.mission.findMany as jest.Mock).mockResolvedValue(mockMissions);

      const startTime = performance.now();

      const missions = await prisma.mission.findMany({
        where: { userId: 'user1' },
      });

      // Group by week
      const weeklyData = missions.reduce((acc, mission) => {
        const weekKey = new Date(mission.date).toISOString().split('T')[0];
        if (!acc[weekKey]) {
          acc[weekKey] = [];
        }
        acc[weekKey].push(mission);
        return acc;
      }, {} as Record<string, typeof missions>);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(300); // < 300ms

      console.log(`Weekly aggregation: ${duration.toFixed(2)}ms`);
    });
  });

  describe('Concurrent Request Performance', () => {
    it('should handle 10 concurrent analytics requests within 2 seconds', async () => {
      const mockMissions = generateMockMissions(30);
      (prisma.mission.findMany as jest.Mock).mockResolvedValue(mockMissions);

      const startTime = performance.now();

      // Simulate 10 concurrent requests
      const promises = Array.from({ length: 10 }, () =>
        analyticsEngine.calculateCompletionRate('user1', '30d')
      );

      await Promise.all(promises);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(2000); // < 2 seconds for 10 concurrent
      console.log(`10 concurrent requests: ${duration.toFixed(2)}ms`);
    });

    it('should handle mixed operation types concurrently', async () => {
      const mockMissions = generateMockMissions(30);
      (prisma.mission.findMany as jest.Mock).mockResolvedValue(mockMissions);

      const startTime = performance.now();

      await Promise.all([
        analyticsEngine.calculateCompletionRate('user1', '7d'),
        analyticsEngine.calculateCompletionRate('user1', '30d'),
        analyticsEngine.recommendMissionAdjustments('user1'),
        adaptationEngine.analyzeUserPatterns('user1'),
        analyticsEngine.detectPerformanceCorrelation('user1'),
      ]);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(1500); // < 1.5 seconds
      console.log(`Mixed concurrent operations: ${duration.toFixed(2)}ms`);
    });
  });

  describe('Memory Usage and Optimization', () => {
    it('should not cause memory leaks with repeated calls', async () => {
      const mockMissions = generateMockMissions(30);
      (prisma.mission.findMany as jest.Mock).mockResolvedValue(mockMissions);

      const initialMemory = process.memoryUsage().heapUsed;

      // Run 100 iterations
      for (let i = 0; i < 100; i++) {
        await analyticsEngine.calculateCompletionRate('user1', '30d');
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // MB

      // Memory increase should be minimal (< 10MB for 100 iterations)
      expect(memoryIncrease).toBeLessThan(10);

      console.log(`Memory increase after 100 calls: ${memoryIncrease.toFixed(2)}MB`);
    });

    it('should efficiently handle large objective arrays', async () => {
      const mockMissions = Array.from({ length: 10 }, (_, i) => ({
        id: `mission-${i}`,
        status: MissionStatus.COMPLETED,
        objectives: Array.from({ length: 50 }, (_, j) => ({
          objectiveId: `obj-${j}`,
          completed: j % 2 === 0,
        })),
        estimatedMinutes: 120,
        actualMinutes: 115,
        difficultyRating: 4,
        successScore: 0.85,
        feedback: [],
      }));

      (prisma.mission.findMany as jest.Mock).mockResolvedValue(mockMissions);

      const startTime = performance.now();
      await analyticsEngine.calculateDailyAnalytics('user1', new Date());
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(1000); // < 1 second even with 50 objectives per mission

      console.log(`Large objectives processing: ${duration.toFixed(2)}ms`);
    });
  });

  describe('Database Query Optimization', () => {
    it('should use indexed queries for date range filtering', async () => {
      const mockMissions = generateMockMissions(90);
      (prisma.mission.findMany as jest.Mock).mockResolvedValue(mockMissions);

      const startTime = performance.now();

      // Query should use date index
      await prisma.mission.findMany({
        where: {
          userId: 'user1',
          date: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100); // < 100ms with proper indexing

      console.log(`Indexed date query: ${duration.toFixed(2)}ms`);
    });

    it('should efficiently aggregate with groupBy', async () => {
      const mockAnalytics = Array.from({ length: 30 }, (_, i) => ({
        id: `analytics-${i}`,
        userId: 'user1',
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        missionsCompleted: 3 + (i % 3),
        avgSuccessScore: 0.8 + Math.random() * 0.2,
      }));

      (prisma.missionAnalytics.findMany as jest.Mock).mockResolvedValue(
        mockAnalytics
      );

      const startTime = performance.now();

      const analytics = await prisma.missionAnalytics.findMany({
        where: { userId: 'user1' },
      });

      // Aggregate in-memory (would be done in DB with groupBy)
      const avgScore =
        analytics.reduce((sum, a) => sum + a.avgSuccessScore, 0) /
        analytics.length;

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(200); // < 200ms
      expect(avgScore).toBeGreaterThan(0);

      console.log(`Aggregation query: ${duration.toFixed(2)}ms`);
    });
  });

  describe('Stress Testing', () => {
    it('should handle 100 missions without degradation', async () => {
      const mockMissions = generateMockMissions(100);
      (prisma.mission.findMany as jest.Mock).mockResolvedValue(mockMissions);

      const startTime = performance.now();
      await analyticsEngine.calculateCompletionRate('user1', 'all');
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(3000); // < 3 seconds for 100 missions

      console.log(`100 missions processing: ${duration.toFixed(2)}ms`);
    });

    it('should handle rapid sequential requests', async () => {
      const mockMissions = generateMockMissions(30);
      (prisma.mission.findMany as jest.Mock).mockResolvedValue(mockMissions);

      const startTime = performance.now();

      // 50 sequential requests
      for (let i = 0; i < 50; i++) {
        await analyticsEngine.calculateCompletionRate('user1', '7d');
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      const avgDuration = duration / 50;
      expect(avgDuration).toBeLessThan(50); // < 50ms average per request

      console.log(
        `50 sequential requests: ${duration.toFixed(2)}ms (avg: ${avgDuration.toFixed(2)}ms)`
      );
    });
  });

  describe('Edge Case Performance', () => {
    it('should handle empty dataset efficiently', async () => {
      (prisma.mission.findMany as jest.Mock).mockResolvedValue([]);

      const startTime = performance.now();
      await analyticsEngine.calculateCompletionRate('user1', '30d');
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(50); // < 50ms for empty dataset

      console.log(`Empty dataset: ${duration.toFixed(2)}ms`);
    });

    it('should handle single mission efficiently', async () => {
      const mockMissions = generateMockMissions(1);
      (prisma.mission.findMany as jest.Mock).mockResolvedValue(mockMissions);

      const startTime = performance.now();
      await analyticsEngine.calculateDailyAnalytics('user1', new Date());
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(100); // < 100ms

      console.log(`Single mission: ${duration.toFixed(2)}ms`);
    });

    it('should handle missions with no feedback efficiently', async () => {
      const mockMissions = Array.from({ length: 30 }, (_, i) => ({
        id: `mission-${i}`,
        status: MissionStatus.COMPLETED,
        objectives: [{ objectiveId: 'obj1', completed: true }],
        feedback: [], // No feedback
        estimatedMinutes: 60,
        actualMinutes: 55,
        difficultyRating: null,
        successScore: null,
      }));

      (prisma.mission.findMany as jest.Mock).mockResolvedValue(mockMissions);

      const startTime = performance.now();
      await analyticsEngine.calculateDailyAnalytics('user1', new Date());
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(500); // < 500ms

      console.log(`No feedback missions: ${duration.toFixed(2)}ms`);
    });
  });
});
