/**
 * Integration Tests: POST /api/personalization/apply
 * Story 5.5: Personalization Engine
 *
 * Tests personalization config application for different contexts
 */

import type { PrismaClient } from '@/generated/prisma'

// Mock dependencies - factory creates mock without hoisting issues
jest.mock('@/lib/db', () => {
  const { mockDeep } = require('jest-mock-extended')
  return {
    // @ts-expect-error - mockDeep is untyped at runtime
    prisma: mockDeep<PrismaClient>(),
  }
})

import { NextRequest } from 'next/server'
import type { DeepMockProxy } from 'jest-mock-extended'
// Import after jest.mock to avoid module resolution issues
import { POST } from '@/app/api/personalization/apply/route'
import { prisma } from '@/lib/db'

// Get the mocked prisma instance
const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>

const mockUser = {
  id: 'test-user-id',
  email: 'kevy@americano.dev',
}

const mockPreferences = {
  id: 'pref-1',
  userId: 'test-user-id',
  personalizationLevel: 'MEDIUM',
  missionPersonalizationEnabled: true,
  contentPersonalizationEnabled: true,
  assessmentPersonalizationEnabled: true,
  sessionPersonalizationEnabled: true,
  autoAdaptEnabled: true,
  disabledFeatures: [],
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockLearningProfile = {
  userId: 'test-user-id',
  learningStyleProfile: {
    visual: 0.3,
    auditory: 0.25,
    reading: 0.25,
    kinesthetic: 0.2,
  },
  dataQualityScore: 0.75,
  lastAnalyzedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('POST /api/personalization/apply', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Context Validation', () => {
    it('should reject requests without context', async () => {
      const request = new NextRequest('http://localhost:3000/api/personalization/apply', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid context')
    })

    it('should reject invalid context values', async () => {
      const request = new NextRequest('http://localhost:3000/api/personalization/apply', {
        method: 'POST',
        body: JSON.stringify({ context: 'INVALID' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('should accept valid context values', async () => {
      const validContexts = ['MISSION', 'CONTENT', 'ASSESSMENT', 'SESSION']

      for (const context of validContexts) {
        prismaMock.user.findFirst.mockResolvedValue(mockUser as any)
        prismaMock.personalizationPreferences.findUnique.mockResolvedValue(mockPreferences as any)
        prismaMock.userLearningProfile.findUnique.mockResolvedValue(mockLearningProfile as any)
        prismaMock.personalizationConfig.findFirst.mockResolvedValue(null)
        prismaMock.personalizationConfig.create.mockResolvedValue({} as any)

        const request = new NextRequest('http://localhost:3000/api/personalization/apply', {
          method: 'POST',
          body: JSON.stringify({ context }),
        })

        const response = await POST(request)
        expect(response.status).toBe(200)
      }
    })
  })

  describe('User Authentication', () => {
    it('should return 404 for non-existent user', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/personalization/apply', {
        method: 'POST',
        body: JSON.stringify({ context: 'MISSION' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toContain('not found')
    })
  })

  describe('Personalization Enablement Check', () => {
    it('should return default config when personalization is disabled for context', async () => {
      prismaMock.user.findFirst.mockResolvedValue(mockUser as any)
      prismaMock.personalizationPreferences.findUnique.mockResolvedValue({
        ...mockPreferences,
        missionPersonalizationEnabled: false,
      } as any)

      const request = new NextRequest('http://localhost:3000/api/personalization/apply', {
        method: 'POST',
        body: JSON.stringify({ context: 'MISSION' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.personalizationApplied).toBe(false)
      expect(data.data.message).toContain('disabled')
    })
  })

  describe('Data Quality Checks', () => {
    it('should return default config for insufficient data quality (< 0.6)', async () => {
      prismaMock.user.findFirst.mockResolvedValue(mockUser as any)
      prismaMock.personalizationPreferences.findUnique.mockResolvedValue(mockPreferences as any)
      prismaMock.userLearningProfile.findUnique.mockResolvedValue({
        ...mockLearningProfile,
        dataQualityScore: 0.4,
      } as any)

      const request = new NextRequest('http://localhost:3000/api/personalization/apply', {
        method: 'POST',
        body: JSON.stringify({ context: 'MISSION' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.personalizationApplied).toBe(false)
      expect(data.data.message).toContain('Insufficient data')
    })

    it('should return default config when profile does not exist', async () => {
      prismaMock.user.findFirst.mockResolvedValue(mockUser as any)
      prismaMock.personalizationPreferences.findUnique.mockResolvedValue(mockPreferences as any)
      prismaMock.userLearningProfile.findUnique.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/personalization/apply', {
        method: 'POST',
        body: JSON.stringify({ context: 'MISSION' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.personalizationApplied).toBe(false)
      expect(data.data.dataQualityScore).toBe(0)
    })

    it('should apply confidence threshold based on personalization level', async () => {
      prismaMock.user.findFirst.mockResolvedValue(mockUser as any)
      prismaMock.personalizationPreferences.findUnique.mockResolvedValue({
        ...mockPreferences,
        personalizationLevel: 'LOW', // Requires 0.85 data quality
      } as any)
      prismaMock.userLearningProfile.findUnique.mockResolvedValue({
        ...mockLearningProfile,
        dataQualityScore: 0.75, // Below LOW threshold
      } as any)

      const request = new NextRequest('http://localhost:3000/api/personalization/apply', {
        method: 'POST',
        body: JSON.stringify({ context: 'MISSION' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.personalizationApplied).toBe(false)
      expect(data.data.message).toContain('below threshold')
    })

    it('should apply personalization when data quality meets threshold', async () => {
      prismaMock.user.findFirst.mockResolvedValue(mockUser as any)
      prismaMock.personalizationPreferences.findUnique.mockResolvedValue(mockPreferences as any)
      prismaMock.userLearningProfile.findUnique.mockResolvedValue(mockLearningProfile as any)
      prismaMock.personalizationConfig.findFirst.mockResolvedValue(null)
      prismaMock.personalizationConfig.create.mockResolvedValue({} as any)

      const request = new NextRequest('http://localhost:3000/api/personalization/apply', {
        method: 'POST',
        body: JSON.stringify({ context: 'MISSION' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.personalizationApplied).toBe(true)
    })
  })

  describe('Personalization Config Generation', () => {
    beforeEach(() => {
      prismaMock.user.findFirst.mockResolvedValue(mockUser as any)
      prismaMock.personalizationPreferences.findUnique.mockResolvedValue(mockPreferences as any)
      prismaMock.userLearningProfile.findUnique.mockResolvedValue(mockLearningProfile as any)
    })

    it('should create new config when none exists', async () => {
      prismaMock.personalizationConfig.findFirst.mockResolvedValue(null)
      prismaMock.personalizationConfig.create.mockResolvedValue({} as any)

      const request = new NextRequest('http://localhost:3000/api/personalization/apply', {
        method: 'POST',
        body: JSON.stringify({ context: 'MISSION' }),
      })

      await POST(request)

      expect(prismaMock.personalizationConfig.create).toHaveBeenCalled()
    })

    it('should update existing config when one exists', async () => {
      const existingConfig = {
        id: 'config-1',
        userId: 'test-user-id',
        preferencesId: 'pref-1',
        context: 'MISSION',
        isActive: true,
      }
      prismaMock.personalizationConfig.findFirst.mockResolvedValue(existingConfig as any)
      prismaMock.personalizationConfig.update.mockResolvedValue({} as any)

      const request = new NextRequest('http://localhost:3000/api/personalization/apply', {
        method: 'POST',
        body: JSON.stringify({ context: 'MISSION' }),
      })

      await POST(request)

      expect(prismaMock.personalizationConfig.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: existingConfig.id },
        }),
      )
    })

    it('should generate context-specific config for MISSION', async () => {
      prismaMock.personalizationConfig.findFirst.mockResolvedValue(null)
      prismaMock.personalizationConfig.create.mockResolvedValue({} as any)

      const request = new NextRequest('http://localhost:3000/api/personalization/apply', {
        method: 'POST',
        body: JSON.stringify({ context: 'MISSION' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.data.config.strategy).toBe('pattern-based')
      expect(data.data.config.parameters).toBeDefined()
    })

    it('should generate context-specific config for CONTENT', async () => {
      prismaMock.personalizationConfig.findFirst.mockResolvedValue(null)
      prismaMock.personalizationConfig.create.mockResolvedValue({} as any)

      const request = new NextRequest('http://localhost:3000/api/personalization/apply', {
        method: 'POST',
        body: JSON.stringify({
          context: 'CONTENT',
          params: { topicId: 'topic-123' },
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.data.config.strategy).toBe('learning-style-adaptive')
      expect(data.data.config.parameters.topicId).toBe('topic-123')
    })

    it('should include confidence score in response', async () => {
      prismaMock.personalizationConfig.findFirst.mockResolvedValue(null)
      prismaMock.personalizationConfig.create.mockResolvedValue({} as any)

      const request = new NextRequest('http://localhost:3000/api/personalization/apply', {
        method: 'POST',
        body: JSON.stringify({ context: 'MISSION' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.data.confidence).toBe(0.75)
    })
  })

  describe('Response Structure', () => {
    it('should return correct response structure when personalization applied', async () => {
      prismaMock.user.findFirst.mockResolvedValue(mockUser as any)
      prismaMock.personalizationPreferences.findUnique.mockResolvedValue(mockPreferences as any)
      prismaMock.userLearningProfile.findUnique.mockResolvedValue(mockLearningProfile as any)
      prismaMock.personalizationConfig.findFirst.mockResolvedValue(null)
      prismaMock.personalizationConfig.create.mockResolvedValue({} as any)

      const request = new NextRequest('http://localhost:3000/api/personalization/apply', {
        method: 'POST',
        body: JSON.stringify({ context: 'MISSION' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data).toHaveProperty('success', true)
      expect(data).toHaveProperty('data')
      expect(data.data).toHaveProperty('personalizationApplied')
      expect(data.data).toHaveProperty('context')
      expect(data.data).toHaveProperty('config')
      expect(data.data).toHaveProperty('confidence')
      expect(data.data).toHaveProperty('message')
    })

    it('should return correct response structure when personalization not applied', async () => {
      prismaMock.user.findFirst.mockResolvedValue(mockUser as any)
      prismaMock.personalizationPreferences.findUnique.mockResolvedValue({
        ...mockPreferences,
        missionPersonalizationEnabled: false,
      } as any)

      const request = new NextRequest('http://localhost:3000/api/personalization/apply', {
        method: 'POST',
        body: JSON.stringify({ context: 'MISSION' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.data.personalizationApplied).toBe(false)
      expect(data.data.config.enabled).toBe(false)
      expect(data.data.message).toBeDefined()
    })
  })

  describe('Performance', () => {
    it('should respond within 500ms (P95 target)', async () => {
      prismaMock.user.findFirst.mockResolvedValue(mockUser as any)
      prismaMock.personalizationPreferences.findUnique.mockResolvedValue(mockPreferences as any)
      prismaMock.userLearningProfile.findUnique.mockResolvedValue(mockLearningProfile as any)
      prismaMock.personalizationConfig.findFirst.mockResolvedValue(null)
      prismaMock.personalizationConfig.create.mockResolvedValue({} as any)

      const request = new NextRequest('http://localhost:3000/api/personalization/apply', {
        method: 'POST',
        body: JSON.stringify({ context: 'MISSION' }),
      })

      const startTime = performance.now()
      await POST(request)
      const duration = performance.now() - startTime

      expect(duration).toBeLessThan(500)
    })
  })
})
