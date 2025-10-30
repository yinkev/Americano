/**
 * Prisma Mock Utilities
 * Comprehensive mock for Epic 5 API route testing
 */

import { type DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended'
import type { PrismaClient } from '@/generated/prisma'

// Create deep mock of Prisma Client
const prismaMock = mockDeep<PrismaClient>()

// Reset mocks before each test
beforeEach(() => {
  mockReset(prismaMock)
})

// Export type for use in tests
export type MockPrisma = DeepMockProxy<PrismaClient>

// Export the mock
export { prismaMock }
