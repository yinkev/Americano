import { PrismaClient } from '@/generated/prisma'
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended'

// Create a deep mock of PrismaClient
export const prismaMock = mockDeep<PrismaClient>() as unknown as DeepMockProxy<PrismaClient>

// Reset mock before each test
beforeEach(() => {
  mockReset(prismaMock)
})

// Export mock as default
export default prismaMock
