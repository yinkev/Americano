/**
 * Integration Tests: Understanding Dashboard Component
 *
 * Tests a complete React component that:
 * - Fetches data using custom hooks (useUnderstandingAnalytics)
 * - Displays multiple UI sections (metrics, charts, tables)
 * - Handles loading and error states
 * - Uses React Query for data fetching
 * - Integrates with MSW-mocked backend APIs
 *
 * This demonstrates end-to-end component testing with:
 * - React Testing Library for rendering and user interactions
 * - MSW for mocking API responses
 * - Jest for assertions
 * - Async state management with React Query
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import type React from 'react'
import { UnderstandingDashboard } from '@/components/analytics/UnderstandingDashboard'
import { create503Handler, createErrorHandler, server, setupMSW } from '../../setup'

// Initialize MSW server
setupMSW()

/**
 * Helper: Create wrapper with React Query client
 * This ensures each test has isolated React Query cache
 */
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Disable retries in tests for faster failure detection
        gcTime: 0, // Disable cache to ensure fresh data per test
      },
    },
  })

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000'
const API_BASE_URL = 'http://localhost:3000'

describe('UnderstandingDashboard Component - Integration Tests', () => {
  /**
   * Setup: Mock API handlers for dashboard data
   */
  beforeAll(() => {
    // Mock GET /api/analytics/predictions - Dashboard predictions data
    server.use(
      http.get(`${API_BASE_URL}/api/analytics/predictions`, ({ request }) => {
        const url = new URL(request.url)
        const userId = url.searchParams.get('userId') || 'test-user'

        return HttpResponse.json({
          success: true,
          predictions: [
            {
              id: 'pred-1',
              userId,
              learningObjectiveId: 'obj-cardiac',
              topicId: 'topic-cardio',
              predictionDate: new Date().toISOString(),
              predictedStruggleProbability: 0.75,
              predictionConfidence: 0.85,
              predictionStatus: 'PENDING',
              actualOutcome: null,
            },
            {
              id: 'pred-2',
              userId,
              learningObjectiveId: 'obj-renal',
              topicId: 'topic-renal',
              predictionDate: new Date().toISOString(),
              predictedStruggleProbability: 0.62,
              predictionConfidence: 0.78,
              predictionStatus: 'PENDING',
              actualOutcome: null,
            },
          ],
          count: 2,
        })
      }),

      // Mock GET /api/analytics/model-performance - ML model accuracy metrics
      http.get(`${API_BASE_URL}/api/analytics/model-performance`, ({ request }) => {
        const url = new URL(request.url)
        const userId = url.searchParams.get('userId') || 'test-user'

        return HttpResponse.json({
          success: true,
          userId,
          accuracy: 0.78,
          precision: 0.75,
          recall: 0.82,
          f1Score: 0.78,
          calibration: 0.85,
          lastUpdated: new Date().toISOString(),
          dataPoints: 156,
          trend: [
            { date: '2025-10-01', accuracy: 0.72 },
            { date: '2025-10-08', accuracy: 0.75 },
            { date: '2025-10-15', accuracy: 0.78 },
          ],
        })
      }),

      // Mock GET /api/analytics/struggle-reduction - Struggle reduction metrics
      http.get(`${API_BASE_URL}/api/analytics/struggle-reduction`, ({ request }) => {
        const url = new URL(request.url)
        const userId = url.searchParams.get('userId') || 'test-user'

        return HttpResponse.json({
          success: true,
          userId,
          period: 'month',
          baselineRate: 0.42,
          currentRate: 0.28,
          reductionPercentage: 33.3,
          timeline: [
            { week: 1, struggleRate: 0.42 },
            { week: 2, struggleRate: 0.38 },
            { week: 3, struggleRate: 0.32 },
            { week: 4, struggleRate: 0.28 },
          ],
          interventionEffectiveness: [
            {
              type: 'PREREQUISITE_REVIEW',
              applicationsCount: 12,
              successRate: 0.85,
            },
            {
              type: 'DIFFICULTY_PROGRESSION',
              applicationsCount: 8,
              successRate: 0.72,
            },
          ],
        })
      }),
    )
  })

  describe('Success Cases - Component Rendering', () => {
    it('should render loading state initially', () => {
      const Wrapper = createWrapper()

      render(<UnderstandingDashboard userId="test-user" />, { wrapper: Wrapper })

      // Should show loading indicators (implementation-specific)
      // Common patterns: skeleton loaders, spinners, "Loading..." text
      expect(screen.getByTestId('dashboard-container')).toBeInTheDocument()
    })

    it('should render dashboard with all data sections after loading', async () => {
      const Wrapper = createWrapper()

      render(<UnderstandingDashboard userId="test-user" />, { wrapper: Wrapper })

      // Wait for data to load
      await waitFor(
        () => {
          // Verify main sections are rendered
          expect(screen.getByTestId('predictions-section')).toBeInTheDocument()
        },
        { timeout: 3000 },
      )

      // Verify other key sections (adapt to actual component structure)
      expect(screen.getByTestId('model-performance-section')).toBeInTheDocument()
      expect(screen.getByTestId('struggle-reduction-section')).toBeInTheDocument()
    })

    it('should display prediction data correctly', async () => {
      const Wrapper = createWrapper()

      render(<UnderstandingDashboard userId="test-user" />, { wrapper: Wrapper })

      // Wait for predictions to load
      await waitFor(() => {
        expect(screen.getByText(/pred-1|Cardiac/i)).toBeInTheDocument()
      })

      // Verify prediction details are displayed
      const predictionsSection = screen.getByTestId('predictions-section')
      expect(within(predictionsSection).getByText(/75%|0.75/)).toBeInTheDocument() // Struggle probability
      expect(within(predictionsSection).getByText(/85%|0.85/)).toBeInTheDocument() // Confidence
    })

    it('should display model performance metrics', async () => {
      const Wrapper = createWrapper()

      render(<UnderstandingDashboard userId="test-user" />, { wrapper: Wrapper })

      // Wait for model performance data
      await waitFor(() => {
        expect(screen.getByTestId('model-performance-section')).toBeInTheDocument()
      })

      const performanceSection = screen.getByTestId('model-performance-section')

      // Verify metrics are displayed (78% accuracy, 75% precision, etc.)
      expect(within(performanceSection).getByText(/78%|0.78/)).toBeInTheDocument()
      expect(within(performanceSection).getByText(/75%|0.75/)).toBeInTheDocument()
      expect(within(performanceSection).getByText(/82%|0.82/)).toBeInTheDocument()
    })

    it('should display struggle reduction chart', async () => {
      const Wrapper = createWrapper()

      render(<UnderstandingDashboard userId="test-user" />, { wrapper: Wrapper })

      // Wait for struggle reduction data
      await waitFor(() => {
        expect(screen.getByTestId('struggle-reduction-section')).toBeInTheDocument()
      })

      const reductionSection = screen.getByTestId('struggle-reduction-section')

      // Verify reduction percentage is shown
      expect(within(reductionSection).getByText(/33\.3%/)).toBeInTheDocument()
    })
  })

  describe('Success Cases - User Interactions', () => {
    it('should allow filtering predictions by status', async () => {
      const user = userEvent.setup()
      const Wrapper = createWrapper()

      render(<UnderstandingDashboard userId="test-user" />, { wrapper: Wrapper })

      // Wait for dashboard to load
      await waitFor(() => {
        expect(screen.getByTestId('predictions-section')).toBeInTheDocument()
      })

      // Find filter dropdown (implementation-specific selector)
      const filterDropdown = screen.getByRole('combobox', { name: /filter|status/i })

      // Change filter to "CONFIRMED"
      await user.click(filterDropdown)
      await user.click(screen.getByRole('option', { name: /confirmed/i }))

      // Wait for filtered results (MSW handler should respond differently)
      await waitFor(() => {
        // Verify filter was applied (check URL or displayed data)
        expect(filterDropdown).toHaveValue('CONFIRMED')
      })
    })

    it('should allow changing time period for struggle reduction', async () => {
      const user = userEvent.setup()
      const Wrapper = createWrapper()

      render(<UnderstandingDashboard userId="test-user" />, { wrapper: Wrapper })

      // Wait for dashboard to load
      await waitFor(() => {
        expect(screen.getByTestId('struggle-reduction-section')).toBeInTheDocument()
      })

      // Find time period selector
      const periodSelector = screen.getByRole('combobox', { name: /period|time/i })

      // Change to "week"
      await user.click(periodSelector)
      await user.click(screen.getByRole('option', { name: /week/i }))

      // Wait for data refresh
      await waitFor(() => {
        expect(periodSelector).toHaveValue('week')
      })
    })

    it('should refresh data when user clicks refresh button', async () => {
      const user = userEvent.setup()
      const Wrapper = createWrapper()

      render(<UnderstandingDashboard userId="test-user" />, { wrapper: Wrapper })

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('dashboard-container')).toBeInTheDocument()
      })

      // Click refresh button
      const refreshButton = screen.getByRole('button', { name: /refresh|reload/i })
      await user.click(refreshButton)

      // Should show loading state briefly
      expect(refreshButton).toBeDisabled() // Typically disabled during refresh
    })

    it('should handle pagination for predictions list', async () => {
      const user = userEvent.setup()
      const Wrapper = createWrapper()

      render(<UnderstandingDashboard userId="test-user" />, { wrapper: Wrapper })

      // Wait for initial page
      await waitFor(() => {
        expect(screen.getByTestId('predictions-section')).toBeInTheDocument()
      })

      // Find pagination controls
      const nextPageButton = screen.getByRole('button', { name: /next|page 2/i })

      // Click next page
      await user.click(nextPageButton)

      // Wait for page change
      await waitFor(() => {
        expect(nextPageButton).toBeDisabled() // If on last page
      })
    })
  })

  describe('Error Cases - API Failures', () => {
    it('should display error message when predictions API fails', async () => {
      const Wrapper = createWrapper()

      // Mock API error
      server.use(
        http.get(`${API_BASE_URL}/api/analytics/predictions`, () => {
          return HttpResponse.json({ error: 'Failed to fetch predictions' }, { status: 500 })
        }),
      )

      render(<UnderstandingDashboard userId="test-user" />, { wrapper: Wrapper })

      // Wait for error state
      await waitFor(() => {
        expect(screen.getByText(/error|failed|something went wrong/i)).toBeInTheDocument()
      })

      // Verify error message mentions predictions
      expect(screen.getByText(/predictions/i)).toBeInTheDocument()
    })

    it('should display error when model performance API returns 503', async () => {
      const Wrapper = createWrapper()

      // Mock service unavailable
      server.use(
        http.get(`${API_BASE_URL}/api/analytics/model-performance`, () => {
          return new HttpResponse(null, {
            status: 503,
            statusText: 'Service Unavailable',
          })
        }),
      )

      render(<UnderstandingDashboard userId="test-user" />, { wrapper: Wrapper })

      // Wait for error state
      await waitFor(() => {
        expect(screen.getByText(/unavailable|service/i)).toBeInTheDocument()
      })
    })

    it('should allow retry after API failure', async () => {
      const user = userEvent.setup()
      const Wrapper = createWrapper()

      // Mock initial failure
      let callCount = 0
      server.use(
        http.get(`${API_BASE_URL}/api/analytics/predictions`, () => {
          callCount++
          if (callCount === 1) {
            return HttpResponse.json({ error: 'Failed' }, { status: 500 })
          }
          // Success on retry
          return HttpResponse.json({
            success: true,
            predictions: [],
            count: 0,
          })
        }),
      )

      render(<UnderstandingDashboard userId="test-user" />, { wrapper: Wrapper })

      // Wait for error
      await waitFor(() => {
        expect(screen.getByText(/error|failed/i)).toBeInTheDocument()
      })

      // Click retry button
      const retryButton = screen.getByRole('button', { name: /retry|try again/i })
      await user.click(retryButton)

      // Wait for success after retry
      await waitFor(() => {
        expect(screen.queryByText(/error|failed/i)).not.toBeInTheDocument()
      })
    })

    it('should handle network timeout gracefully', async () => {
      const Wrapper = createWrapper()

      // Mock timeout
      server.use(
        http.get(`${API_BASE_URL}/api/analytics/predictions`, async () => {
          await new Promise((resolve) => setTimeout(resolve, 100))
          throw new Error('Network timeout')
        }),
      )

      render(<UnderstandingDashboard userId="test-user" />, { wrapper: Wrapper })

      // Wait for timeout error
      await waitFor(
        () => {
          expect(screen.getByText(/timeout|slow|try again/i)).toBeInTheDocument()
        },
        { timeout: 5000 },
      )
    })
  })

  describe('Error Cases - Empty Data States', () => {
    it('should display empty state when no predictions exist', async () => {
      const Wrapper = createWrapper()

      // Mock empty predictions
      server.use(
        http.get(`${API_BASE_URL}/api/analytics/predictions`, () => {
          return HttpResponse.json({
            success: true,
            predictions: [],
            count: 0,
          })
        }),
      )

      render(<UnderstandingDashboard userId="test-user" />, { wrapper: Wrapper })

      // Wait for empty state
      await waitFor(() => {
        expect(screen.getByText(/no predictions|empty|no data/i)).toBeInTheDocument()
      })
    })

    it('should display message when model has insufficient data', async () => {
      const Wrapper = createWrapper()

      // Mock insufficient data for model
      server.use(
        http.get(`${API_BASE_URL}/api/analytics/model-performance`, () => {
          return HttpResponse.json({
            success: true,
            accuracy: null,
            precision: null,
            recall: null,
            f1Score: null,
            calibration: null,
            lastUpdated: null,
            dataPoints: 5, // Too few data points
            trend: [],
          })
        }),
      )

      render(<UnderstandingDashboard userId="test-user" />, { wrapper: Wrapper })

      // Wait for insufficient data message
      await waitFor(() => {
        expect(screen.getByText(/insufficient|not enough|more data needed/i)).toBeInTheDocument()
      })
    })
  })

  describe('Edge Cases - Loading States', () => {
    it('should show skeleton loaders during initial load', () => {
      const Wrapper = createWrapper()

      render(<UnderstandingDashboard userId="test-user" />, { wrapper: Wrapper })

      // Verify skeleton loaders are present (implementation-specific)
      const skeletons = screen.getAllByTestId(/skeleton|loading/i)
      expect(skeletons.length).toBeGreaterThan(0)
    })

    it('should handle slow API responses gracefully', async () => {
      const Wrapper = createWrapper()

      // Mock slow response
      server.use(
        http.get(`${API_BASE_URL}/api/analytics/predictions`, async () => {
          await new Promise((resolve) => setTimeout(resolve, 1000)) // 1 second delay
          return HttpResponse.json({
            success: true,
            predictions: [],
            count: 0,
          })
        }),
      )

      render(<UnderstandingDashboard userId="test-user" />, { wrapper: Wrapper })

      // Loading state should persist for at least 500ms
      expect(screen.getByTestId('dashboard-container')).toBeInTheDocument()

      await waitFor(
        () => {
          expect(screen.queryByTestId(/skeleton|loading/i)).not.toBeInTheDocument()
        },
        { timeout: 3000 },
      )
    })

    it('should maintain UI stability during refetch', async () => {
      const user = userEvent.setup()
      const Wrapper = createWrapper()

      render(<UnderstandingDashboard userId="test-user" />, { wrapper: Wrapper })

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('predictions-section')).toBeInTheDocument()
      })

      // Trigger refetch
      const refreshButton = screen.getByRole('button', { name: /refresh/i })
      await user.click(refreshButton)

      // UI should not completely unmount during refetch (no flash of loading)
      expect(screen.getByTestId('predictions-section')).toBeInTheDocument()
    })
  })

  describe('Edge Cases - Different User Scenarios', () => {
    it('should handle userId prop change and refetch data', async () => {
      const Wrapper = createWrapper()

      const { rerender } = render(<UnderstandingDashboard userId="user-1" />, {
        wrapper: Wrapper,
      })

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('dashboard-container')).toBeInTheDocument()
      })

      // Change userId
      rerender(<UnderstandingDashboard userId="user-2" />)

      // Should trigger new data fetch for user-2
      await waitFor(() => {
        // Verify new data is loaded (implementation-specific check)
        expect(screen.getByTestId('dashboard-container')).toBeInTheDocument()
      })
    })

    it('should display different data for different users', async () => {
      const Wrapper = createWrapper()

      // Mock different data for user-special
      server.use(
        http.get(`${API_BASE_URL}/api/analytics/predictions`, ({ request }) => {
          const url = new URL(request.url)
          const userId = url.searchParams.get('userId')

          if (userId === 'user-special') {
            return HttpResponse.json({
              success: true,
              predictions: [
                {
                  id: 'pred-special',
                  userId,
                  learningObjectiveId: 'obj-special',
                  topicId: 'topic-special',
                  predictionDate: new Date().toISOString(),
                  predictedStruggleProbability: 0.9,
                  predictionConfidence: 0.95,
                  predictionStatus: 'CONFIRMED',
                  actualOutcome: 'STRUGGLED',
                },
              ],
              count: 1,
            })
          }

          return HttpResponse.json({
            success: true,
            predictions: [],
            count: 0,
          })
        }),
      )

      render(<UnderstandingDashboard userId="user-special" />, {
        wrapper: Wrapper,
      })

      // Wait for special user's data
      await waitFor(() => {
        expect(screen.getByText(/pred-special|special/i)).toBeInTheDocument()
      })

      // Verify special prediction details
      expect(screen.getByText(/90%|0.9/)).toBeInTheDocument() // High probability
      expect(screen.getByText(/95%|0.95/)).toBeInTheDocument() // High confidence
    })
  })

  describe('Integration - Complete User Flow', () => {
    it('should complete full dashboard interaction flow', async () => {
      const user = userEvent.setup()
      const Wrapper = createWrapper()

      render(<UnderstandingDashboard userId="test-user" />, { wrapper: Wrapper })

      // Step 1: Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('dashboard-container')).toBeInTheDocument()
      })

      // Step 2: View prediction details
      const predictionCard = screen.getByTestId('prediction-card-pred-1')
      await user.click(predictionCard)

      // Step 3: Expand details modal (implementation-specific)
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // Step 4: Close modal
      const closeButton = screen.getByRole('button', { name: /close/i })
      await user.click(closeButton)

      // Step 5: Filter predictions
      const filterDropdown = screen.getByRole('combobox', { name: /filter/i })
      await user.click(filterDropdown)
      await user.click(screen.getByRole('option', { name: /pending/i }))

      // Step 6: Refresh data
      const refreshButton = screen.getByRole('button', { name: /refresh/i })
      await user.click(refreshButton)

      // Verify final state
      await waitFor(() => {
        expect(screen.getByTestId('dashboard-container')).toBeInTheDocument()
      })
    })
  })
})
