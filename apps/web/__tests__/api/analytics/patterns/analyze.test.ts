/**
 * Integration Tests: POST /api/analytics/patterns/analyze
 * Story 5.1: Learning Pattern Recognition and Analysis
 *
 * Tests behavioral pattern analysis API endpoint
 */

import type { PrismaClient } from '@/generated/prisma'
import {
  mockPatternAnalysisResult,
  mockInsufficientDataResult,
} from '@/__tests__/fixtures/patterns'

// Mock dependencies - factory creates mock without hoisting issues
jest.mock('@/lib/db', () => {
  const { mockDeep } = require('jest-mock-extended')
  return {
    prisma: mockDeep<PrismaClient>(),
  }
})

jest.mock('@/subsystems/behavioral-analytics/behavioral-pattern-engine', () => ({
  BehavioralPatternEngine: {
    runFullAnalysis: jest.fn(),
  },
}))

// Import after jest.mock to avoid module resolution issues
import { POST } from '@/app/api/analytics/patterns/analyze/route'
import { NextRequest } from 'next/server'
import { BehavioralPatternEngine } from '@/subsystems/behavioral-analytics/behavioral-pattern-engine'
import { prisma as prismaMock } from '@/lib/db'

describe('POST /api/analytics/patterns/analyze', () => {
  const validUserId = 'test-user-id'
  const mockUser = {
    id: validUserId,
    email: 'test@example.com',
    name: 'Test User',
    behavioralAnalysisEnabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Request Validation', () => {
    it('should reject requests without userId', async () => {
      const request = new NextRequest('http://localhost:3000/api/analytics/patterns/analyze', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500) // Zod validation throws
      expect(data.success).toBe(false)
    })

    it('should reject requests with invalid userId format', async () => {
      const request = new NextRequest('http://localhost:3000/api/analytics/patterns/analyze', {
        method: 'POST',
        body: JSON.stringify({ userId: '' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
    })

    it('should accept valid request with userId', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser)
      ;(BehavioralPatternEngine.runFullAnalysis as jest.Mock).mockResolvedValue(
        mockPatternAnalysisResult,
      )

      const request = new NextRequest('http://localhost:3000/api/analytics/patterns/analyze', {
        method: 'POST',
        body: JSON.stringify({ userId: validUserId }),
      })

      const response = await POST(request)
      expect(response.status).toBe(200)
    })

    it('should accept optional forceReanalysis parameter', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser)
      ;(BehavioralPatternEngine.runFullAnalysis as jest.Mock).mockResolvedValue(
        mockPatternAnalysisResult,
      )

      const request = new NextRequest('http://localhost:3000/api/analytics/patterns/analyze', {
        method: 'POST',
        body: JSON.stringify({
          userId: validUserId,
          forceReanalysis: true,
        }),
      })

      const response = await POST(request)
      expect(response.status).toBe(200)

      expect(BehavioralPatternEngine.runFullAnalysis).toHaveBeenCalledWith(validUserId)
    })
  })

  describe('User Validation', () => {
    it('should return 404 for non-existent user', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/analytics/patterns/analyze', {
        method: 'POST',
        body: JSON.stringify({ userId: 'non-existent-user' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toContain('not found')
    })

    it('should return 403 if behavioral analysis is disabled', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        ...mockUser,
        behavioralAnalysisEnabled: false,
      })

      const request = new NextRequest('http://localhost:3000/api/analytics/patterns/analyze', {
        method: 'POST',
        body: JSON.stringify({ userId: validUserId }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error).toContain('disabled')
    })
  })

  describe('Pattern Analysis Execution', () => {
    beforeEach(() => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser)
    })

    it('should successfully analyze patterns with sufficient data', async () => {
      ;(BehavioralPatternEngine.runFullAnalysis as jest.Mock).mockResolvedValue(
        mockPatternAnalysisResult,
      )

      const request = new NextRequest('http://localhost:3000/api/analytics/patterns/analyze', {
        method: 'POST',
        body: JSON.stringify({ userId: validUserId }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('patterns')
      expect(data.data).toHaveProperty('insights')
      expect(data.data).toHaveProperty('profile')
      expect(data.data.patterns).toHaveLength(3)
      expect(data.data.insights).toHaveLength(2)
    })

    it('should return friendly message for insufficient data', async () => {
      ;(BehavioralPatternEngine.runFullAnalysis as jest.Mock).mockResolvedValue(
        mockInsufficientDataResult,
      )

      const request = new NextRequest('http://localhost:3000/api/analytics/patterns/analyze', {
        method: 'POST',
        body: JSON.stringify({ userId: validUserId }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.insufficientData).toBe(true)
      expect(data.data.dataRequirements).toBeDefined()
      expect(data.data.message).toContain('weeks')
    })

    it('should call BehavioralPatternEngine with correct userId', async () => {
      ;(BehavioralPatternEngine.runFullAnalysis as jest.Mock).mockResolvedValue(
        mockPatternAnalysisResult,
      )

      const request = new NextRequest('http://localhost:3000/api/analytics/patterns/analyze', {
        method: 'POST',
        body: JSON.stringify({ userId: validUserId }),
      })

      await POST(request)

      expect(BehavioralPatternEngine.runFullAnalysis).toHaveBeenCalledWith(validUserId)
      expect(BehavioralPatternEngine.runFullAnalysis).toHaveBeenCalledTimes(1)
    })
  })

  describe('Response Structure Validation', () => {
    beforeEach(() => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser)
    })

    it('should return correct response structure for successful analysis', async () => {
      ;(BehavioralPatternEngine.runFullAnalysis as jest.Mock).mockResolvedValue(
        mockPatternAnalysisResult,
      )

      const request = new NextRequest('http://localhost:3000/api/analytics/patterns/analyze', {
        method: 'POST',
        body: JSON.stringify({ userId: validUserId }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data).toHaveProperty('success', true)
      expect(data).toHaveProperty('data')
      expect(data.data).toHaveProperty('patterns')
      expect(data.data).toHaveProperty('insights')
      expect(data.data).toHaveProperty('profile')
    })

    it('should return correct response structure for insufficient data', async () => {
      ;(BehavioralPatternEngine.runFullAnalysis as jest.Mock).mockResolvedValue(
        mockInsufficientDataResult,
      )

      const request = new NextRequest('http://localhost:3000/api/analytics/patterns/analyze', {
        method: 'POST',
        body: JSON.stringify({ userId: validUserId }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data).toHaveProperty('success', true)
      expect(data.data).toHaveProperty('insufficientData', true)
      expect(data.data).toHaveProperty('dataRequirements')
      expect(data.data).toHaveProperty('message')
    })

    it('should return error response structure for failures', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/analytics/patterns/analyze', {
        method: 'POST',
        body: JSON.stringify({ userId: 'invalid' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data).toHaveProperty('success', false)
      expect(data).toHaveProperty('error')
      expect(typeof data.error).toBe('string')
    })
  })

  describe('Performance', () => {
    beforeEach(() => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser)
      ;(BehavioralPatternEngine.runFullAnalysis as jest.Mock).mockResolvedValue(
        mockPatternAnalysisResult,
      )
    })

    it('should respond within 500ms (P95 target)', async () => {
      const request = new NextRequest('http://localhost:3000/api/analytics/patterns/analyze', {
        method: 'POST',
        body: JSON.stringify({ userId: validUserId }),
      })

      const startTime = performance.now()
      await POST(request)
      const duration = performance.now() - startTime

      expect(duration).toBeLessThan(500)
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser)
    })

    it('should handle analysis engine errors gracefully', async () => {
      ;(BehavioralPatternEngine.runFullAnalysis as jest.Mock).mockRejectedValue(
        new Error('Analysis failed'),
      )

      const request = new NextRequest('http://localhost:3000/api/analytics/patterns/analyze', {
        method: 'POST',
        body: JSON.stringify({ userId: validUserId }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBeDefined()
    })

    it('should handle database errors gracefully', async () => {
      prismaMock.user.findUnique.mockRejectedValue(new Error('Database connection failed'))

      const request = new NextRequest('http://localhost:3000/api/analytics/patterns/analyze', {
        method: 'POST',
        body: JSON.stringify({ userId: validUserId }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
    })
  })
})
