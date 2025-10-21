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

// Note: @/lib/db is mocked per-test to allow test-specific mock configurations
// Global mock conflicts with jest-mock-extended factories used in individual tests

// Mock PerformanceCalculator
jest.mock('@/lib/performance-calculator', () => ({
  PerformanceCalculator: {
    calculateRetentionScore: jest.fn(),
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
