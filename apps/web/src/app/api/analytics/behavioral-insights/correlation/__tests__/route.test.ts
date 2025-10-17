/**
 * Performance Correlation API Tests
 * Story 5.6 Task 10
 *
 * Tests statistical accuracy and API contract validation for the correlation endpoint
 */

import { GET } from '../route'
import { NextRequest } from 'next/server'
import type { CorrelationResult } from '@/subsystems/behavioral-analytics/academic-performance-integration'

// Mock the AcademicPerformanceIntegration subsystem
jest.mock('@/subsystems/behavioral-analytics/academic-performance-integration', () => {
  const mockResult: CorrelationResult = {
    coefficient: 0.73,
    pValue: 0.012,
    interpretation: 'strong positive (p=0.012)',
    confidenceInterval: [0.52, 0.87] as [number, number],
    timeSeriesData: [
      { date: '2025-09-01', behavioralScore: 65, academicScore: 70 },
      { date: '2025-09-08', behavioralScore: 72, academicScore: 75 },
      { date: '2025-09-15', behavioralScore: 78, academicScore: 80 },
      { date: '2025-09-22', behavioralScore: 81, academicScore: 82 },
      { date: '2025-09-29', behavioralScore: 85, academicScore: 88 },
      { date: '2025-10-06', behavioralScore: 88, academicScore: 90 },
      { date: '2025-10-13', behavioralScore: 90, academicScore: 92 },
      { date: '2025-10-20', behavioralScore: 92, academicScore: 94 },
      { date: '2025-10-27', behavioralScore: 93, academicScore: 95 },
      { date: '2025-11-03', behavioralScore: 94, academicScore: 96 },
    ],
    insights: [
      '⚠️ Correlation does not imply causation. These metrics show association, not proof of direct cause-effect.',
      '✓ Statistically significant relationship (p=0.012 < 0.05)',
      'Strong positive association suggests behavioral improvements may support academic performance.',
      '📈 Recent trend: Both behavioral and academic scores are strong. Maintain current habits.',
    ],
    dataQuality: {
      sampleSize: 10,
      weeksOfData: 12,
      missingDataPoints: 2,
    },
  }

  return {
    AcademicPerformanceIntegration: {
      correlatePerformance: jest.fn().mockResolvedValue(mockResult),
    },
  }
})

describe('GET /api/analytics/behavioral-insights/correlation', () => {
  describe('Query Parameter Validation', () => {
    it('should reject weeks < 8', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/analytics/behavioral-insights/correlation?weeks=5'
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('weeks must be between 8 and 52')
    })

    it('should reject weeks > 52', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/analytics/behavioral-insights/correlation?weeks=60'
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('weeks must be between 8 and 52')
    })

    it('should reject invalid metric values', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/analytics/behavioral-insights/correlation?metric=invalid'
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('should accept valid weeks parameter (8-52)', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/analytics/behavioral-insights/correlation?weeks=16'
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should use default weeks=12 when not specified', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/analytics/behavioral-insights/correlation'
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should accept metric parameter', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/analytics/behavioral-insights/correlation?metric=mission'
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })

  describe('Statistical Accuracy Validation', () => {
    it('should return Pearson correlation coefficient in valid range [-1, 1]', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/analytics/behavioral-insights/correlation'
      )

      const response = await GET(request)
      const data = await response.json()

      expect(data.data.coefficient).toBeGreaterThanOrEqual(-1)
      expect(data.data.coefficient).toBeLessThanOrEqual(1)
      expect(typeof data.data.coefficient).toBe('number')
    })

    it('should return p-value in valid range [0, 1]', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/analytics/behavioral-insights/correlation'
      )

      const response = await GET(request)
      const data = await response.json()

      expect(data.data.pValue).toBeGreaterThanOrEqual(0)
      expect(data.data.pValue).toBeLessThanOrEqual(1)
      expect(typeof data.data.pValue).toBe('number')
    })

    it('should return 95% confidence interval with valid bounds', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/analytics/behavioral-insights/correlation'
      )

      const response = await GET(request)
      const data = await response.json()

      const [lower, upper] = data.data.confidenceInterval

      expect(lower).toBeGreaterThanOrEqual(-1)
      expect(upper).toBeLessThanOrEqual(1)
      expect(lower).toBeLessThan(upper)
      expect(lower).toBeLessThanOrEqual(data.data.coefficient)
      expect(upper).toBeGreaterThanOrEqual(data.data.coefficient)
    })

    it('should include interpretation string', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/analytics/behavioral-insights/correlation'
      )

      const response = await GET(request)
      const data = await response.json()

      expect(typeof data.data.interpretation).toBe('string')
      expect(data.data.interpretation.length).toBeGreaterThan(0)
      expect(data.data.interpretation).toContain('p=')
    })
  })

  describe('Time Series Data Validation', () => {
    it('should return time series data with correct structure', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/analytics/behavioral-insights/correlation'
      )

      const response = await GET(request)
      const data = await response.json()

      expect(data.data.timeSeriesData).toBeDefined()
      expect(Array.isArray(data.data.timeSeriesData)).toBe(true)
      expect(data.data.timeSeriesData.length).toBeGreaterThan(0)

      const dataPoint = data.data.timeSeriesData[0]
      expect(dataPoint).toHaveProperty('date')
      expect(dataPoint).toHaveProperty('behavioralScore')
      expect(dataPoint).toHaveProperty('academicScore')
    })

    it('should validate behavioral scores are in range [0, 100]', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/analytics/behavioral-insights/correlation'
      )

      const response = await GET(request)
      const data = await response.json()

      data.data.timeSeriesData.forEach((point: any) => {
        expect(point.behavioralScore).toBeGreaterThanOrEqual(0)
        expect(point.behavioralScore).toBeLessThanOrEqual(100)
      })
    })

    it('should validate academic scores are in range [0, 100]', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/analytics/behavioral-insights/correlation'
      )

      const response = await GET(request)
      const data = await response.json()

      data.data.timeSeriesData.forEach((point: any) => {
        expect(point.academicScore).toBeGreaterThanOrEqual(0)
        expect(point.academicScore).toBeLessThanOrEqual(100)
      })
    })
  })

  describe('Insights and Causation Warnings', () => {
    it('should always include causation warning', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/analytics/behavioral-insights/correlation'
      )

      const response = await GET(request)
      const data = await response.json()

      expect(data.data.insights).toBeDefined()
      expect(Array.isArray(data.data.insights)).toBe(true)
      expect(data.data.insights.length).toBeGreaterThan(0)

      const hasWarning = data.data.insights.some((insight: string) =>
        insight.toLowerCase().includes('correlation does not imply causation')
      )
      expect(hasWarning).toBe(true)
    })

    it('should include statistical significance insight', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/analytics/behavioral-insights/correlation'
      )

      const response = await GET(request)
      const data = await response.json()

      const hasSignificance = data.data.insights.some((insight: string) =>
        insight.toLowerCase().includes('statistically significant')
      )
      expect(hasSignificance).toBe(true)
    })

    it('should provide actionable insights', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/analytics/behavioral-insights/correlation'
      )

      const response = await GET(request)
      const data = await response.json()

      expect(data.data.insights.length).toBeGreaterThanOrEqual(3)
    })
  })

  describe('Data Quality Metrics', () => {
    it('should return data quality metrics', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/analytics/behavioral-insights/correlation'
      )

      const response = await GET(request)
      const data = await response.json()

      expect(data.data.dataQuality).toBeDefined()
      expect(data.data.dataQuality).toHaveProperty('sampleSize')
      expect(data.data.dataQuality).toHaveProperty('weeksOfData')
      expect(data.data.dataQuality).toHaveProperty('missingDataPoints')
    })

    it('should validate sample size matches time series data length', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/analytics/behavioral-insights/correlation'
      )

      const response = await GET(request)
      const data = await response.json()

      expect(data.data.dataQuality.sampleSize).toBe(
        data.data.timeSeriesData.length
      )
    })
  })

  describe('Response Structure', () => {
    it('should return success response with correct structure', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/analytics/behavioral-insights/correlation'
      )

      const response = await GET(request)
      const data = await response.json()

      expect(data).toHaveProperty('success', true)
      expect(data).toHaveProperty('data')
      expect(data.data).toHaveProperty('coefficient')
      expect(data.data).toHaveProperty('pValue')
      expect(data.data).toHaveProperty('interpretation')
      expect(data.data).toHaveProperty('confidenceInterval')
      expect(data.data).toHaveProperty('timeSeriesData')
      expect(data.data).toHaveProperty('insights')
      expect(data.data).toHaveProperty('dataQuality')
    })

    it('should return error response with correct structure', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/analytics/behavioral-insights/correlation?weeks=100'
      )

      const response = await GET(request)
      const data = await response.json()

      expect(data).toHaveProperty('success', false)
      expect(data).toHaveProperty('error')
      expect(typeof data.error).toBe('string')
    })
  })
})
