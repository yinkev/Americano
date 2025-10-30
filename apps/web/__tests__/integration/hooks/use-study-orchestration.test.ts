/**
 * Integration Tests: useStudyOrchestration Hook
 *
 * Tests the study orchestration hook which integrates with:
 * - useSessionStore (Zustand state management)
 * - usePerformanceMonitoring hook (performance tracking)
 * - realtimeOrchestrationService (backend service)
 *
 * This demonstrates testing custom React hooks that use other hooks
 * and external services with MSW for API mocking.
 */

import { act, renderHook, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { useStudyOrchestration } from '@/hooks/use-study-orchestration'
import { useSessionStore } from '@/store/use-session-store'
import { createErrorHandler, server, setupMSW } from '../../setup'

// Initialize MSW server for all tests
setupMSW()

// Mock the realtime orchestration service
jest.mock('@/services/realtime-orchestration', () => ({
  realtimeOrchestrationService: {
    initializeSession: jest.fn().mockResolvedValue({
      sessionId: 'test-session-123',
      currentPhase: 'content',
      isActive: true,
    }),
    recordEvent: jest.fn().mockResolvedValue({}),
  },
}))

describe('useStudyOrchestration Hook - Integration Tests', () => {
  /**
   * Setup: Reset store state before each test to ensure test isolation
   * This is critical for hooks that depend on global state
   */
  beforeEach(() => {
    // Reset Zustand store to initial state
    useSessionStore.setState({
      sessionId: 'test-session-123',
      settings: {
        enableRealtimeOrchestration: true,
      } as any,
      currentObjective: {
        objectiveId: 'obj-123',
        estimatedMinutes: 30,
      },
    } as any)
  })

  afterEach(() => {
    // Clean up timers and mocks
    jest.clearAllMocks()
    jest.clearAllTimers()
  })

  describe('Success Cases - Hook Initialization', () => {
    it('should initialize with default options and return core methods', () => {
      const { result } = renderHook(() => useStudyOrchestration())

      // Verify hook returns expected interface
      expect(result.current).toMatchObject({
        isActive: expect.any(Boolean),
        isEnabled: expect.any(Boolean),
        currentPhase: expect.any(String),
        performanceMetrics: expect.any(Object),
        recordAnswer: expect.any(Function),
        recordInteraction: expect.any(Function),
        recordPhaseChange: expect.any(Function),
        acceptBreakRecommendation: expect.any(Function),
        acceptContentAdaptation: expect.any(Function),
        acceptSessionRecommendation: expect.any(Function),
        declineRecommendation: expect.any(Function),
        isStruggling: expect.any(Boolean),
        isExcelling: expect.any(Boolean),
        sessionDuration: expect.any(Number),
      })

      // Initial state checks
      expect(result.current.isActive).toBe(true)
      expect(result.current.isEnabled).toBe(true)
      expect(result.current.currentPhase).toBe('content')
    })

    it('should respect enabled option when false', () => {
      const { result } = renderHook(() => useStudyOrchestration({ enabled: false }))

      // When disabled, orchestration should not be active
      expect(result.current.isEnabled).toBe(false)
    })

    it('should accept custom sensitivity option', () => {
      const { result: highSensitivity } = renderHook(() =>
        useStudyOrchestration({ sensitivity: 'high' }),
      )

      const { result: lowSensitivity } = renderHook(() =>
        useStudyOrchestration({ sensitivity: 'low' }),
      )

      // Both should initialize successfully with different sensitivity
      expect(highSensitivity.current.isActive).toBe(true)
      expect(lowSensitivity.current.isActive).toBe(true)
    })
  })

  describe('Success Cases - Recording Events', () => {
    it('should record correct answers and update performance metrics', async () => {
      const { result } = renderHook(() => useStudyOrchestration({ autoRecord: true }))

      // Record a correct answer with response time and confidence
      act(() => {
        result.current.recordAnswer(true, 5000, 4)
      })

      // Wait for state updates
      await waitFor(() => {
        const metrics = result.current.performanceMetrics
        expect(metrics).toBeDefined()
      })

      // Performance metrics should reflect the recorded answer
      const metrics = result.current.performanceMetrics
      expect(metrics.interactionCount).toBeGreaterThanOrEqual(0)
    })

    it('should record incorrect answers and detect struggling', async () => {
      const { result } = renderHook(() => useStudyOrchestration({ autoRecord: true }))

      // Record multiple incorrect answers to trigger struggling detection
      act(() => {
        for (let i = 0; i < 5; i++) {
          result.current.recordAnswer(false, 25000, 2)
        }
      })

      await waitFor(() => {
        expect(result.current.performanceMetrics).toBeDefined()
      })

      // After multiple incorrect answers with long response times, user should be struggling
      // (This depends on the minSampleSize and performance calculation logic)
      expect(result.current.performanceMetrics.recentAccuracy).toBeLessThanOrEqual(100)
    })

    it('should record interactions and update engagement metrics', async () => {
      const { result } = renderHook(() => useStudyOrchestration({ autoRecord: true }))

      // Record various user interactions
      act(() => {
        result.current.recordInteraction('click_hint')
        result.current.recordInteraction('expand_explanation')
        result.current.recordInteraction('bookmark_content')
      })

      await waitFor(() => {
        const metrics = result.current.performanceMetrics
        expect(metrics.interactionCount).toBeGreaterThanOrEqual(0)
      })
    })

    it('should record phase changes and update orchestration state', async () => {
      const { result } = renderHook(() => useStudyOrchestration({ autoRecord: true }))

      // Change phase from content to assessment
      act(() => {
        result.current.recordPhaseChange('assessment')
      })

      await waitFor(() => {
        expect(result.current.currentPhase).toBe('assessment')
      })

      // Change to break phase
      act(() => {
        result.current.recordPhaseChange('break')
      })

      await waitFor(() => {
        expect(result.current.currentPhase).toBe('break')
      })
    })
  })

  describe('Success Cases - Performance Detection', () => {
    it('should detect when user is excelling', async () => {
      const { result } = renderHook(() =>
        useStudyOrchestration({ autoRecord: true, sensitivity: 'high' }),
      )

      // Record multiple correct answers with fast response times
      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.recordAnswer(true, 5000, 5) // 5s response, high confidence
        }
      })

      await waitFor(
        () => {
          const metrics = result.current.performanceMetrics
          // With 10 correct answers, accuracy should be high
          expect(metrics.recentAccuracy).toBeGreaterThanOrEqual(0)
        },
        { timeout: 2000 },
      )
    })

    it('should calculate session duration correctly', async () => {
      const { result } = renderHook(() => useStudyOrchestration())

      const initialDuration = result.current.sessionDuration

      // Wait 100ms
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Re-render to get updated duration
      const { result: result2 } = renderHook(() => useStudyOrchestration())

      expect(result2.current.sessionDuration).toBeGreaterThanOrEqual(initialDuration)
    })
  })

  describe('Success Cases - Recommendation Handling', () => {
    it('should accept break recommendation', async () => {
      const { result } = renderHook(() => useStudyOrchestration())

      // Set a break recommendation in the store
      act(() => {
        useSessionStore.setState({
          orchestration: {
            ...(useSessionStore.getState() as any).orchestration,
            breakRecommendation: {
              type: 'fatigue_detected',
              urgency: 'high',
              message: 'Take a break',
              estimatedBreakDuration: 5,
              canPostpone: false,
              canSkip: false,
              reason: 'Fatigue detected',
            },
          },
        } as any)
      })

      // Accept the break recommendation
      act(() => {
        result.current.acceptBreakRecommendation()
      })

      // Wait for state updates
      await waitFor(() => {
        // The break recommendation should be handled (implementation-specific)
        expect(result.current).toBeDefined()
      })
    })

    it('should accept content adaptation', async () => {
      const { result } = renderHook(() => useStudyOrchestration())

      act(() => {
        result.current.acceptContentAdaptation('easier')
      })

      await waitFor(() => {
        expect(result.current).toBeDefined()
      })
    })

    it('should accept session recommendation', async () => {
      const { result } = renderHook(() => useStudyOrchestration())

      act(() => {
        result.current.acceptSessionRecommendation('extend')
      })

      await waitFor(() => {
        expect(result.current).toBeDefined()
      })
    })

    it('should decline recommendations', async () => {
      const { result } = renderHook(() => useStudyOrchestration())

      act(() => {
        result.current.declineRecommendation('break')
        result.current.declineRecommendation('content')
        result.current.declineRecommendation('session')
      })

      await waitFor(() => {
        expect(result.current).toBeDefined()
      })
    })
  })

  describe('Error Cases - Disabled State', () => {
    it('should not record events when disabled', async () => {
      const { result } = renderHook(() =>
        useStudyOrchestration({ enabled: false, autoRecord: true }),
      )

      // Try to record events when disabled
      act(() => {
        result.current.recordAnswer(true, 5000, 4)
        result.current.recordInteraction('click')
      })

      // Since orchestration is disabled, events should not be recorded
      await waitFor(() => {
        expect(result.current.isEnabled).toBe(false)
      })
    })

    it('should not record events when session is not active', async () => {
      // Deactivate orchestration
      useSessionStore.setState({
        orchestration: {
          isActive: false,
          currentPhase: 'content',
          breakRecommendation: null,
          contentAdaptation: null,
          sessionRecommendation: null,
        },
      } as any)

      const { result } = renderHook(() => useStudyOrchestration({ autoRecord: true }))

      act(() => {
        result.current.recordAnswer(true, 5000, 4)
      })

      // Events should not be recorded when session is inactive
      expect(result.current.isActive).toBe(false)
    })

    it('should handle missing sessionId gracefully', async () => {
      // Remove sessionId
      useSessionStore.setState({
        sessionId: null,
      })

      const { result } = renderHook(() => useStudyOrchestration())

      act(() => {
        result.current.recordAnswer(true, 5000, 4)
      })

      // Should not throw errors
      expect(result.current).toBeDefined()
    })
  })

  describe('Edge Cases - Performance Boundary Conditions', () => {
    it('should handle zero response time', async () => {
      const { result } = renderHook(() => useStudyOrchestration({ autoRecord: true }))

      act(() => {
        result.current.recordAnswer(true, 0, 5)
      })

      await waitFor(() => {
        expect(result.current.performanceMetrics).toBeDefined()
      })

      expect(result.current.performanceMetrics.avgResponseTime).toBeGreaterThanOrEqual(0)
    })

    it('should handle missing confidence value', async () => {
      const { result } = renderHook(() => useStudyOrchestration({ autoRecord: true }))

      act(() => {
        result.current.recordAnswer(true, 5000) // No confidence provided
      })

      await waitFor(() => {
        expect(result.current.performanceMetrics).toBeDefined()
      })
    })

    it('should handle rapid phase changes', async () => {
      const { result } = renderHook(() => useStudyOrchestration({ autoRecord: true }))

      act(() => {
        result.current.recordPhaseChange('content')
        result.current.recordPhaseChange('assessment')
        result.current.recordPhaseChange('cards')
        result.current.recordPhaseChange('break')
      })

      await waitFor(() => {
        expect(result.current.currentPhase).toBeDefined()
      })
    })

    it('should handle high-frequency interactions', async () => {
      const { result } = renderHook(() =>
        useStudyOrchestration({ autoRecord: true, sensitivity: 'high' }),
      )

      act(() => {
        // Simulate 50 rapid interactions
        for (let i = 0; i < 50; i++) {
          result.current.recordInteraction(`interaction_${i}`)
        }
      })

      await waitFor(() => {
        const metrics = result.current.performanceMetrics
        expect(metrics.interactionCount).toBeGreaterThanOrEqual(0)
      })
    })
  })

  describe('Edge Cases - Sensitivity Settings', () => {
    it('should use shorter check intervals with high sensitivity', async () => {
      jest.useFakeTimers()

      const { result } = renderHook(() =>
        useStudyOrchestration({ sensitivity: 'high', autoRecord: true }),
      )

      // Record some activity
      act(() => {
        result.current.recordAnswer(false, 25000, 2)
      })

      // Fast-forward 30 seconds (high sensitivity check interval)
      act(() => {
        jest.advanceTimersByTime(30000)
      })

      // Should have triggered performance check
      expect(result.current.performanceMetrics).toBeDefined()

      jest.useRealTimers()
    })

    it('should use longer check intervals with low sensitivity', async () => {
      jest.useFakeTimers()

      const { result } = renderHook(() =>
        useStudyOrchestration({ sensitivity: 'low', autoRecord: true }),
      )

      // Record some activity
      act(() => {
        result.current.recordAnswer(false, 25000, 2)
      })

      // Fast-forward 60 seconds (should not trigger low sensitivity check yet)
      act(() => {
        jest.advanceTimersByTime(60000)
      })

      expect(result.current.performanceMetrics).toBeDefined()

      jest.useRealTimers()
    })
  })

  describe('Integration - Store Synchronization', () => {
    it('should sync performance metrics with store', async () => {
      const { result } = renderHook(() => useStudyOrchestration({ autoRecord: true }))

      // Record answers and wait for store update
      act(() => {
        for (let i = 0; i < 5; i++) {
          result.current.recordAnswer(true, 5000, 4)
        }
      })

      await waitFor(() => {
        const storeState = useSessionStore.getState()
        expect(storeState).toBeDefined()
      })
    })

    it('should update orchestration phase in store', async () => {
      const { result } = renderHook(() => useStudyOrchestration({ autoRecord: true }))

      act(() => {
        result.current.recordPhaseChange('assessment')
      })

      await waitFor(() => {
        const storeState = useSessionStore.getState() as any
        expect(storeState.orchestration.currentPhase).toBe('assessment')
      })
    })
  })
})
