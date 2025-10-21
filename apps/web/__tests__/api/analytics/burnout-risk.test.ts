/**
 * Integration Tests: GET /api/analytics/burnout-risk
 * Story 5.4: Cognitive Health Monitoring
 *
 * Tests burnout risk assessment endpoint with MBI-based algorithm
 */

import { GET } from '@/app/api/analytics/burnout-risk/route'
import { NextRequest } from 'next/server'
import { mockBurnoutAssessment } from '@/__tests__/fixtures/cognitive-health'

// Mock subsystem
const mockBurnoutPreventionEngine = {
  assessBurnoutRisk: jest.fn(),
}

jest.mock('@/subsystems/behavioral-analytics/burnout-prevention-engine', () => ({
  burnoutPreventionEngine: mockBurnoutPreventionEngine,
}))

describe('GET /api/analytics/burnout-risk', () => {
  const validUserId = 'test-user-id'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Query Parameter Validation', () => {
    it('should reject requests without userId', async () => {
      const request = new NextRequest('http://localhost:3000/api/analytics/burnout-risk')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('userId')
    })

    it('should accept valid userId parameter', async () => {
      mockBurnoutPreventionEngine.assessBurnoutRisk.mockResolvedValue(mockBurnoutAssessment)

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/burnout-risk?userId=${validUserId}`,
      )

      const response = await GET(request)
      expect(response.status).toBe(200)
    })
  })

  describe('Burnout Risk Assessment', () => {
    it('should return comprehensive burnout assessment', async () => {
      mockBurnoutPreventionEngine.assessBurnoutRisk.mockResolvedValue(mockBurnoutAssessment)

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/burnout-risk?userId=${validUserId}`,
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('riskScore')
      expect(data.data).toHaveProperty('riskLevel')
      expect(data.data).toHaveProperty('contributingFactors')
      expect(data.data).toHaveProperty('warningSignals')
      expect(data.data).toHaveProperty('recommendations')
      expect(data.data).toHaveProperty('assessmentDate')
      expect(data.data).toHaveProperty('confidence')
    })

    it('should return valid risk score (0-100)', async () => {
      mockBurnoutPreventionEngine.assessBurnoutRisk.mockResolvedValue(mockBurnoutAssessment)

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/burnout-risk?userId=${validUserId}`,
      )

      const response = await GET(request)
      const data = await response.json()

      expect(data.data.riskScore).toBeGreaterThanOrEqual(0)
      expect(data.data.riskScore).toBeLessThanOrEqual(100)
    })

    it('should return valid risk level', async () => {
      mockBurnoutPreventionEngine.assessBurnoutRisk.mockResolvedValue(mockBurnoutAssessment)

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/burnout-risk?userId=${validUserId}`,
      )

      const response = await GET(request)
      const data = await response.json()

      const validLevels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
      expect(validLevels).toContain(data.data.riskLevel)
    })

    it('should include contributing factors with correct structure', async () => {
      mockBurnoutPreventionEngine.assessBurnoutRisk.mockResolvedValue(mockBurnoutAssessment)

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/burnout-risk?userId=${validUserId}`,
      )

      const response = await GET(request)
      const data = await response.json()

      expect(Array.isArray(data.data.contributingFactors)).toBe(true)
      if (data.data.contributingFactors.length > 0) {
        const factor = data.data.contributingFactors[0]
        expect(factor).toHaveProperty('factor')
        expect(factor).toHaveProperty('score')
        expect(factor).toHaveProperty('percentage')
        expect(factor).toHaveProperty('severity')
      }
    })

    it('should include warning signals with correct structure', async () => {
      mockBurnoutPreventionEngine.assessBurnoutRisk.mockResolvedValue(mockBurnoutAssessment)

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/burnout-risk?userId=${validUserId}`,
      )

      const response = await GET(request)
      const data = await response.json()

      expect(Array.isArray(data.data.warningSignals)).toBe(true)
      if (data.data.warningSignals.length > 0) {
        const signal = data.data.warningSignals[0]
        expect(signal).toHaveProperty('type')
        expect(signal).toHaveProperty('detected')
        expect(signal).toHaveProperty('severity')
        expect(signal).toHaveProperty('description')
      }
    })

    it('should include actionable recommendations', async () => {
      mockBurnoutPreventionEngine.assessBurnoutRisk.mockResolvedValue(mockBurnoutAssessment)

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/burnout-risk?userId=${validUserId}`,
      )

      const response = await GET(request)
      const data = await response.json()

      expect(Array.isArray(data.data.recommendations)).toBe(true)
      expect(data.data.recommendations.length).toBeGreaterThan(0)
      expect(typeof data.data.recommendations[0]).toBe('string')
    })

    it('should include confidence score (0.0-1.0)', async () => {
      mockBurnoutPreventionEngine.assessBurnoutRisk.mockResolvedValue(mockBurnoutAssessment)

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/burnout-risk?userId=${validUserId}`,
      )

      const response = await GET(request)
      const data = await response.json()

      expect(data.data.confidence).toBeGreaterThanOrEqual(0)
      expect(data.data.confidence).toBeLessThanOrEqual(1)
    })
  })

  describe('Algorithm Metadata', () => {
    it('should include algorithm metadata in response', async () => {
      mockBurnoutPreventionEngine.assessBurnoutRisk.mockResolvedValue(mockBurnoutAssessment)

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/burnout-risk?userId=${validUserId}`,
      )

      const response = await GET(request)
      const data = await response.json()

      expect(data.data.metadata).toBeDefined()
      expect(data.data.metadata.analysisWindow).toBe('14 days')
      expect(data.data.metadata.algorithm).toContain('MBI')
      expect(data.data.metadata.weights).toBeDefined()
    })

    it('should include 6-factor weights matching MBI model', async () => {
      mockBurnoutPreventionEngine.assessBurnoutRisk.mockResolvedValue(mockBurnoutAssessment)

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/burnout-risk?userId=${validUserId}`,
      )

      const response = await GET(request)
      const data = await response.json()

      const weights = data.data.metadata.weights
      expect(weights).toHaveProperty('studyIntensity')
      expect(weights).toHaveProperty('performanceDecline')
      expect(weights).toHaveProperty('chronicCognitiveLoad')
      expect(weights).toHaveProperty('scheduleIrregularity')
      expect(weights).toHaveProperty('engagementDecay')
      expect(weights).toHaveProperty('recoveryDeficit')

      // Weights should sum to 1.0
      const sum = Object.values(weights).reduce((a: number, b: any) => a + Number(b), 0)
      expect(sum).toBeCloseTo(1.0, 2)
    })
  })

  describe('Performance', () => {
    it('should respond within 500ms (P95 target)', async () => {
      mockBurnoutPreventionEngine.assessBurnoutRisk.mockResolvedValue(mockBurnoutAssessment)

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/burnout-risk?userId=${validUserId}`,
      )

      const startTime = performance.now()
      await GET(request)
      const duration = performance.now() - startTime

      expect(duration).toBeLessThan(500)
    })

    it('should include execution time in metadata', async () => {
      mockBurnoutPreventionEngine.assessBurnoutRisk.mockResolvedValue(mockBurnoutAssessment)

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/burnout-risk?userId=${validUserId}`,
      )

      const response = await GET(request)
      const data = await response.json()

      expect(data.data.metadata.executionTimeMs).toBeDefined()
      expect(typeof data.data.metadata.executionTimeMs).toBe('number')
    })

    it('should include execution time in response headers', async () => {
      mockBurnoutPreventionEngine.assessBurnoutRisk.mockResolvedValue(mockBurnoutAssessment)

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/burnout-risk?userId=${validUserId}`,
      )

      const response = await GET(request)

      expect(response.headers.get('X-Assessment-Time')).toBeDefined()
    })
  })

  describe('Error Handling', () => {
    it('should return 404 for non-existent user', async () => {
      mockBurnoutPreventionEngine.assessBurnoutRisk.mockRejectedValue(new Error('User not found'))

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/burnout-risk?userId=non-existent`,
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toContain('not found')
    })

    it('should return 404 for insufficient data', async () => {
      mockBurnoutPreventionEngine.assessBurnoutRisk.mockRejectedValue(
        new Error('User not found or insufficient data'),
      )

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/burnout-risk?userId=${validUserId}`,
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
    })

    it('should handle assessment engine errors gracefully', async () => {
      mockBurnoutPreventionEngine.assessBurnoutRisk.mockRejectedValue(new Error('Assessment failed'))

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/burnout-risk?userId=${validUserId}`,
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBeDefined()
    })
  })

  describe('Response Headers', () => {
    it('should include cache control headers', async () => {
      mockBurnoutPreventionEngine.assessBurnoutRisk.mockResolvedValue(mockBurnoutAssessment)

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/burnout-risk?userId=${validUserId}`,
      )

      const response = await GET(request)

      expect(response.headers.get('Cache-Control')).toContain('no-cache')
    })
  })

  describe('Call to BurnoutPreventionEngine', () => {
    it('should call engine with correct userId', async () => {
      mockBurnoutPreventionEngine.assessBurnoutRisk.mockResolvedValue(mockBurnoutAssessment)

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/burnout-risk?userId=${validUserId}`,
      )

      await GET(request)

      expect(mockBurnoutPreventionEngine.assessBurnoutRisk).toHaveBeenCalledWith(validUserId)
      expect(mockBurnoutPreventionEngine.assessBurnoutRisk).toHaveBeenCalledTimes(1)
    })
  })
})
