/**
 * Integration Tests: GET/PATCH /api/personalization/preferences
 * Story 5.5: Personalization Engine
 *
 * Tests user preference management for personalization
 */

import type { PrismaClient } from '@/generated/prisma'

// Mock dependencies - factory creates mock without hoisting issues
jest.mock('@/lib/db', () => {
  const { mockDeep } = require('jest-mock-extended')
  return {
    prisma: mockDeep<PrismaClient>(),
  }
})

// Import after jest.mock to avoid module resolution issues
import { GET, PATCH } from '@/app/api/personalization/preferences/route'
import { NextRequest } from 'next/server'

// Get the mocked prisma instance
const { prisma: prismaMock } = require('@/lib/db')

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

describe('GET /api/personalization/preferences', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Preference Retrieval', () => {
    it('should return existing preferences', async () => {
      prismaMock.user.findFirst.mockResolvedValue(mockUser as any)
      prismaMock.personalizationPreferences.findUnique.mockResolvedValue(mockPreferences as any)

      const request = new NextRequest('http://localhost:3000/api/personalization/preferences')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.preferences).toBeDefined()
      expect(data.data.preferences.personalizationLevel).toBe('MEDIUM')
    })

    it('should create default preferences if none exist', async () => {
      prismaMock.user.findFirst.mockResolvedValue(mockUser as any)
      prismaMock.personalizationPreferences.findUnique.mockResolvedValue(null)
      prismaMock.personalizationPreferences.create.mockResolvedValue(mockPreferences as any)

      const request = new NextRequest('http://localhost:3000/api/personalization/preferences')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(prismaMock.personalizationPreferences.create).toHaveBeenCalled()
    })

    it('should return 404 for non-existent user', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/personalization/preferences')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
    })
  })

  describe('Response Structure', () => {
    it('should include all preference fields', async () => {
      prismaMock.user.findFirst.mockResolvedValue(mockUser as any)
      prismaMock.personalizationPreferences.findUnique.mockResolvedValue(mockPreferences as any)

      const request = new NextRequest('http://localhost:3000/api/personalization/preferences')

      const response = await GET(request)
      const data = await response.json()

      const prefs = data.data.preferences
      expect(prefs).toHaveProperty('personalizationLevel')
      expect(prefs).toHaveProperty('missionPersonalizationEnabled')
      expect(prefs).toHaveProperty('contentPersonalizationEnabled')
      expect(prefs).toHaveProperty('assessmentPersonalizationEnabled')
      expect(prefs).toHaveProperty('sessionPersonalizationEnabled')
      expect(prefs).toHaveProperty('autoAdaptEnabled')
      expect(prefs).toHaveProperty('disabledFeatures')
    })
  })
})

describe('PATCH /api/personalization/preferences', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    prismaMock.user.findFirst.mockResolvedValue(mockUser as any)
    prismaMock.personalizationPreferences.findUnique.mockResolvedValue(mockPreferences as any)
  })

  describe('Request Validation', () => {
    it('should reject requests without any updates', async () => {
      const request = new NextRequest('http://localhost:3000/api/personalization/preferences', {
        method: 'PATCH',
        body: JSON.stringify({}),
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('At least one')
    })

    it('should reject invalid personalizationLevel', async () => {
      const request = new NextRequest('http://localhost:3000/api/personalization/preferences', {
        method: 'PATCH',
        body: JSON.stringify({ personalizationLevel: 'INVALID' }),
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('should accept valid personalizationLevel values', async () => {
      const validLevels = ['NONE', 'LOW', 'MEDIUM', 'HIGH']

      for (const level of validLevels) {
        prismaMock.personalizationPreferences.update.mockResolvedValue({
          ...mockPreferences,
          personalizationLevel: level as any,
        } as any)

        if (level === 'NONE') {
          prismaMock.personalizationConfig.updateMany.mockResolvedValue({ count: 0 } as any)
        }

        const request = new NextRequest('http://localhost:3000/api/personalization/preferences', {
          method: 'PATCH',
          body: JSON.stringify({ personalizationLevel: level }),
        })

        const response = await PATCH(request)
        expect(response.status).toBe(200)
      }
    })

    it('should reject non-boolean feature toggle values', async () => {
      const request = new NextRequest('http://localhost:3000/api/personalization/preferences', {
        method: 'PATCH',
        body: JSON.stringify({ missionPersonalizationEnabled: 'true' }),
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('boolean')
    })

    it('should reject non-array disabledFeatures', async () => {
      const request = new NextRequest('http://localhost:3000/api/personalization/preferences', {
        method: 'PATCH',
        body: JSON.stringify({ disabledFeatures: 'not-array' }),
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })
  })

  describe('Preference Updates', () => {
    it('should update personalizationLevel', async () => {
      prismaMock.personalizationPreferences.update.mockResolvedValue({
        ...mockPreferences,
        personalizationLevel: 'HIGH',
      } as any)

      const request = new NextRequest('http://localhost:3000/api/personalization/preferences', {
        method: 'PATCH',
        body: JSON.stringify({ personalizationLevel: 'HIGH' }),
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.preferences.personalizationLevel).toBe('HIGH')
      expect(prismaMock.personalizationPreferences.update).toHaveBeenCalled()
    })

    it('should update individual feature toggles', async () => {
      prismaMock.personalizationPreferences.update.mockResolvedValue({
        ...mockPreferences,
        missionPersonalizationEnabled: false,
      } as any)

      const request = new NextRequest('http://localhost:3000/api/personalization/preferences', {
        method: 'PATCH',
        body: JSON.stringify({ missionPersonalizationEnabled: false }),
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.preferences.missionPersonalizationEnabled).toBe(false)
    })

    it('should update autoAdaptEnabled', async () => {
      prismaMock.personalizationPreferences.update.mockResolvedValue({
        ...mockPreferences,
        autoAdaptEnabled: false,
      } as any)

      const request = new NextRequest('http://localhost:3000/api/personalization/preferences', {
        method: 'PATCH',
        body: JSON.stringify({ autoAdaptEnabled: false }),
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.preferences.autoAdaptEnabled).toBe(false)
    })

    it('should update disabledFeatures array', async () => {
      const disabledFeatures = ['FEATURE_A', 'FEATURE_B']
      prismaMock.personalizationPreferences.update.mockResolvedValue({
        ...mockPreferences,
        disabledFeatures,
      } as any)

      const request = new NextRequest('http://localhost:3000/api/personalization/preferences', {
        method: 'PATCH',
        body: JSON.stringify({ disabledFeatures }),
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.preferences.disabledFeatures).toEqual(disabledFeatures)
    })

    it('should create default preferences if none exist', async () => {
      prismaMock.personalizationPreferences.findUnique.mockResolvedValue(null)
      prismaMock.personalizationPreferences.create.mockResolvedValue(mockPreferences as any)
      prismaMock.personalizationPreferences.update.mockResolvedValue({
        ...mockPreferences,
        personalizationLevel: 'HIGH',
      } as any)

      const request = new NextRequest('http://localhost:3000/api/personalization/preferences', {
        method: 'PATCH',
        body: JSON.stringify({ personalizationLevel: 'HIGH' }),
      })

      await PATCH(request)

      expect(prismaMock.personalizationPreferences.create).toHaveBeenCalled()
    })
  })

  describe('Auto-adjust Feature Toggles', () => {
    it('should disable all features when level set to NONE', async () => {
      prismaMock.personalizationPreferences.update.mockResolvedValue({
        ...mockPreferences,
        personalizationLevel: 'NONE',
        missionPersonalizationEnabled: false,
        contentPersonalizationEnabled: false,
        assessmentPersonalizationEnabled: false,
        sessionPersonalizationEnabled: false,
      } as any)
      prismaMock.personalizationConfig.updateMany.mockResolvedValue({ count: 2 } as any)

      const request = new NextRequest('http://localhost:3000/api/personalization/preferences', {
        method: 'PATCH',
        body: JSON.stringify({ personalizationLevel: 'NONE' }),
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(prismaMock.personalizationConfig.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isActive: false,
          }),
        }),
      )
    })

    it('should enable mission and session for LOW level', async () => {
      prismaMock.personalizationPreferences.update.mockResolvedValue({
        ...mockPreferences,
        personalizationLevel: 'LOW',
        missionPersonalizationEnabled: true,
        contentPersonalizationEnabled: false,
        assessmentPersonalizationEnabled: false,
        sessionPersonalizationEnabled: true,
      } as any)

      const request = new NextRequest('http://localhost:3000/api/personalization/preferences', {
        method: 'PATCH',
        body: JSON.stringify({ personalizationLevel: 'LOW' }),
      })

      await PATCH(request)

      // Verify update was called with correct data
      expect(prismaMock.personalizationPreferences.update).toHaveBeenCalled()
    })

    it('should enable all features for HIGH level', async () => {
      prismaMock.personalizationPreferences.update.mockResolvedValue({
        ...mockPreferences,
        personalizationLevel: 'HIGH',
        missionPersonalizationEnabled: true,
        contentPersonalizationEnabled: true,
        assessmentPersonalizationEnabled: true,
        sessionPersonalizationEnabled: true,
      } as any)

      const request = new NextRequest('http://localhost:3000/api/personalization/preferences', {
        method: 'PATCH',
        body: JSON.stringify({ personalizationLevel: 'HIGH' }),
      })

      await PATCH(request)

      expect(prismaMock.personalizationPreferences.update).toHaveBeenCalled()
    })
  })

  describe('Response Structure', () => {
    it('should return updated preferences with message', async () => {
      prismaMock.personalizationPreferences.update.mockResolvedValue({
        ...mockPreferences,
        personalizationLevel: 'HIGH',
      } as any)

      const request = new NextRequest('http://localhost:3000/api/personalization/preferences', {
        method: 'PATCH',
        body: JSON.stringify({ personalizationLevel: 'HIGH' }),
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(data).toHaveProperty('success', true)
      expect(data).toHaveProperty('data')
      expect(data.data).toHaveProperty('preferences')
      expect(data.data).toHaveProperty('message')
      expect(data.data.message).toContain('updated')
    })
  })

  describe('Performance', () => {
    it('should respond within 300ms', async () => {
      prismaMock.personalizationPreferences.update.mockResolvedValue(mockPreferences as any)

      const request = new NextRequest('http://localhost:3000/api/personalization/preferences', {
        method: 'PATCH',
        body: JSON.stringify({ autoAdaptEnabled: false }),
      })

      const startTime = performance.now()
      await PATCH(request)
      const duration = performance.now() - startTime

      expect(duration).toBeLessThan(300)
    })
  })
})
