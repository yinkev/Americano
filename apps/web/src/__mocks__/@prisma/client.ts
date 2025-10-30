import { type DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended'
import type { PrismaClient } from '@/generated/prisma'

// Create a deep mock of PrismaClient
export const prismaMock = mockDeep<PrismaClient>() as unknown as DeepMockProxy<PrismaClient>

// Reset mock before each test
beforeEach(() => {
  mockReset(prismaMock)
})

// Export mock as default
export default prismaMock
