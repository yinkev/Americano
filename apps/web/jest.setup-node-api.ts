/**
 * Jest Setup: Node API Tests (no jsdom-specific imports)
 */

// Mock Prisma enums
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(),
  MissionStatus: {
    COMPLETED: 'COMPLETED',
    SKIPPED: 'SKIPPED',
    IN_PROGRESS: 'IN_PROGRESS',
  },
  AnalyticsPeriod: {
    DAILY: 'DAILY',
    WEEKLY: 'WEEKLY',
    MONTHLY: 'MONTHLY',
    ALL_TIME: 'ALL_TIME',
  },
  Prisma: {
    ModelName: {},
  },
}))

// Mock generated Prisma types
jest.mock('@/generated/prisma', () => ({
  ObjectiveComplexity: {
    BASIC: 'BASIC',
    INTERMEDIATE: 'INTERMEDIATE',
    ADVANCED: 'ADVANCED',
  },
}))

// Suppress console errors in tests (optional)
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
}
