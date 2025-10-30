import '@testing-library/jest-dom'

// Polyfill Web APIs needed by next/server in jsdom environment
const { TextEncoder, TextDecoder } = require('util')
const { ReadableStream } = require('web-streams-polyfill/ponyfill')

Object.assign(global, {
  TextEncoder,
  TextDecoder,
  ReadableStream,
})

// Mock fetch if not available
if (typeof (global as any).fetch === 'undefined') {
  ;(global as any).fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(''),
      blob: () => Promise.resolve(new Blob()),
    }),
  )
}

// Mock crypto for next/server
if (typeof (global as any).crypto === 'undefined') {
  ;(global as any).crypto = {
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256)
      }
      return arr
    },
  }
}

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Note: '@/lib/db' is NOT globally mocked; use per-test mocks to avoid hoisting/order issues.
jest.mock('@/lib/performance-calculator', () => ({
  PerformanceCalculator: {
    calculateRetentionScore: jest.fn(),
    calculateAttentionScore: jest.fn(),
    calculateMasteryScore: jest.fn(),
  },
}))

// Mock Prisma Client and enums with a constructable client that exposes model methods used by tests
jest.mock('@prisma/client', () => {
  class PrismaClient {
    studySession = {
      findMany: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    }
    review = {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    }
    behavioralGoal = {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    }
    userLearningProfile = {
      findUnique: jest.fn(),
      update: jest.fn(),
    }
    insightNotification = {
      create: jest.fn(),
    }
    achievement = {
      create: jest.fn(),
    }
    behavioralPattern = {
      findMany: jest.fn(),
      create: jest.fn(),
    }
  }

  return {
    PrismaClient,
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
    // Clinical scenario enums (Story 4.2)
    ScenarioType: {
      DIAGNOSIS: 'DIAGNOSIS',
      MANAGEMENT: 'MANAGEMENT',
      DIFFERENTIAL: 'DIFFERENTIAL',
      COMPLICATIONS: 'COMPLICATIONS',
    },
    PromptType: {
      EXPLAIN_TO_PATIENT: 'EXPLAIN_TO_PATIENT',
      CLINICAL_REASONING: 'CLINICAL_REASONING',
      CONTROLLED_FAILURE: 'CONTROLLED_FAILURE',
    },
    ObjectiveComplexity: {
      BASIC: 'BASIC',
      INTERMEDIATE: 'INTERMEDIATE',
      ADVANCED: 'ADVANCED',
    },
    MasteryLevel: {
      NOT_STARTED: 'NOT_STARTED',
      BEGINNER: 'BEGINNER',
      INTERMEDIATE: 'INTERMEDIATE',
      ADVANCED: 'ADVANCED',
      MASTERED: 'MASTERED',
    },
    Prisma: {
      ModelName: {},
    },
  }
})

// Mock generated Prisma types
jest.mock('@/generated/prisma', () => ({
  ObjectiveComplexity: {
    BASIC: 'BASIC',
    INTERMEDIATE: 'INTERMEDIATE',
    ADVANCED: 'ADVANCED',
  },
}))

// Mock Web APIs
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
  takeRecords: jest.fn(),
}))

// Ensure '@/lib/db' is mocked before modules under test import it
// Provides a constructable prisma-like shape with jest.fn methods that tests can control
jest.mock('@/lib/db', () => {
  const studySession = {
    findMany: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
  }
  const review = {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
  }
  const behavioralGoal = {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  }
  const userLearningProfile = {
    findUnique: jest.fn(),
    update: jest.fn(),
  }
  const insightNotification = {
    create: jest.fn(),
  }
  const achievement = {
    create: jest.fn(),
  }
  const behavioralPattern = {
    findMany: jest.fn(),
    create: jest.fn(),
  }

  return {
    prisma: {
      studySession,
      review,
      behavioralGoal,
      userLearningProfile,
      insightNotification,
      achievement,
      behavioralPattern,
    },
  }
})

// Setup will be imported by individual test files to avoid ESM issues
// DO NOT import MSW setup here - it causes Jest/ESM conflicts

// Suppress console errors in tests (optional)
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
}
