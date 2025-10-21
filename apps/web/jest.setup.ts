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
  (global as any).fetch = jest.fn(() =>
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
  (global as any).crypto = {
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

<<<<<<< HEAD
// Note: @/lib/db is mocked per-test to allow test-specific mock configurations
// Global mock conflicts with jest-mock-extended factories used in individual tests

// Mock PerformanceCalculator
jest.mock('@/lib/performance-calculator', () => ({
  PerformanceCalculator: {
    calculateRetentionScore: jest.fn(),
=======
// Mock Prisma Client
jest.mock('@/lib/db', () => ({
  prisma: {
    mission: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
    missionFeedback: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      aggregate: jest.fn(),
    },
    missionAnalytics: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    },
    missionReview: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    userPreferences: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    // Clinical scenario models (Story 4.2)
    clinicalScenario: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    scenarioResponse: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
    clinicalReasoningMetric: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
    validationPrompt: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    validationResponse: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      aggregate: jest.fn(),
      count: jest.fn(),
    },
    calibrationMetric: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    },
    learningObjective: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback({
      mission: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      clinicalScenario: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      scenarioResponse: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    })),
>>>>>>> origin/main
  },
}))

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
}))

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

// Setup will be imported by individual test files to avoid ESM issues
// DO NOT import MSW setup here - it causes Jest/ESM conflicts

// Suppress console errors in tests (optional)
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
}
