/**
 * Unit Tests: POST /api/analytics/behavioral-insights/goals
 *
 * Story 5.6 Task 7 - API Testing
 */

import { NextRequest } from 'next/server'
import { GoalManager } from '@/subsystems/behavioral-analytics/goal-manager'
import { POST } from '../goals/route'

// Mock dependencies
jest.mock('@/subsystems/behavioral-analytics/goal-manager')

describe('POST /api/analytics/behavioral-insights/goals', () => {
  const mockUserId = 'test-user-123'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should create a new goal with valid input', async () => {
    const mockGoal = {
      id: 'goal-1',
      userId: mockUserId,
      goalType: 'STUDY_TIME_CONSISTENCY',
      title: 'Study during peak hours consistently',
      description: 'Build a habit of studying during optimal time windows',
      targetMetric: 'peakHourSessionsPerWeek',
      currentValue: 2,
      targetValue: 5,
      deadline: new Date('2025-12-01'),
      status: 'ACTIVE',
      createdAt: new Date(),
    }

    ;(GoalManager.createGoal as jest.Mock).mockResolvedValue(mockGoal)

    const requestBody = {
      userId: mockUserId,
      goalType: 'STUDY_TIME_CONSISTENCY',
      targetMetric: 'peakHourSessionsPerWeek',
      targetValue: 5,
      deadline: new Date('2025-12-01').toISOString(),
    }

    const request = new NextRequest('http://localhost/api/analytics/behavioral-insights/goals', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.data.goal.id).toBe('goal-1')
    expect(GoalManager.createGoal).toHaveBeenCalledWith(
      mockUserId,
      expect.objectContaining({
        goalType: 'STUDY_TIME_CONSISTENCY',
        targetMetric: 'peakHourSessionsPerWeek',
        targetValue: 5,
      }),
    )
  })

  it('should return 400 for deadline in the past', async () => {
    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 1)

    const requestBody = {
      userId: mockUserId,
      goalType: 'STUDY_TIME_CONSISTENCY',
      targetMetric: 'peakHourSessionsPerWeek',
      targetValue: 5,
      deadline: pastDate.toISOString(),
    }

    const request = new NextRequest('http://localhost/api/analytics/behavioral-insights/goals', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    })

    const response = await POST(request)

    expect(response.status).toBe(400)
  })

  it('should return 400 for deadline > 90 days from now', async () => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 100)

    const requestBody = {
      userId: mockUserId,
      goalType: 'STUDY_TIME_CONSISTENCY',
      targetMetric: 'peakHourSessionsPerWeek',
      targetValue: 5,
      deadline: futureDate.toISOString(),
    }

    const request = new NextRequest('http://localhost/api/analytics/behavioral-insights/goals', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    })

    const response = await POST(request)

    expect(response.status).toBe(400)
  })

  it('should return 400 when target value <= current value', async () => {
    ;(GoalManager.createGoal as jest.Mock).mockRejectedValue(
      new Error('Target value (3) must be greater than current value (5).'),
    )

    const requestBody = {
      userId: mockUserId,
      goalType: 'STUDY_TIME_CONSISTENCY',
      targetMetric: 'peakHourSessionsPerWeek',
      targetValue: 3,
      deadline: new Date('2025-12-01').toISOString(),
    }

    const request = new NextRequest('http://localhost/api/analytics/behavioral-insights/goals', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    })

    const response = await POST(request)

    expect(response.status).toBe(400)
  })

  it('should accept custom title and description', async () => {
    const mockGoal = {
      id: 'goal-2',
      userId: mockUserId,
      goalType: 'CUSTOM',
      title: 'My Custom Goal',
      description: 'My custom description',
      targetMetric: 'custom',
      currentValue: 0,
      targetValue: 100,
      deadline: new Date('2025-12-01'),
      status: 'ACTIVE',
      createdAt: new Date(),
    }

    ;(GoalManager.createGoal as jest.Mock).mockResolvedValue(mockGoal)

    const requestBody = {
      userId: mockUserId,
      goalType: 'CUSTOM',
      title: 'My Custom Goal',
      description: 'My custom description',
      targetMetric: 'custom',
      targetValue: 100,
      deadline: new Date('2025-12-01').toISOString(),
    }

    const request = new NextRequest('http://localhost/api/analytics/behavioral-insights/goals', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.data.goal.title).toBe('My Custom Goal')
    expect(GoalManager.createGoal).toHaveBeenCalledWith(
      mockUserId,
      expect.objectContaining({
        title: 'My Custom Goal',
        description: 'My custom description',
      }),
    )
  })
})
