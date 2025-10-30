/**
 * Peer Comparison Panel Component Tests
 *
 * Tests for PeerComparisonPanel UI component.
 * Covers:
 * - Rendering states (loading, error, not enabled, success)
 * - Box plot visualization
 * - Percentile display and interpretation
 * - Common overconfident topics display
 * - Privacy notice
 * - User interactions (opt-in button)
 *
 * Story 4.4 Task 9: Peer Calibration Comparison
 */

// Jest globals (describe, it, expect, beforeEach, afterEach) are available without imports
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PeerComparisonPanel } from '@/components/study/PeerComparisonPanel'

// Mock fetch
global.fetch = jest.fn()

describe('PeerComparisonPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  const mockSuccessResponse = {
    success: true,
    data: {
      userCorrelation: 0.75,
      userPercentile: 75,
      peerDistribution: {
        correlations: [0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9],
        quartiles: [0.4, 0.6, 0.8],
        median: 0.6,
        mean: 0.6,
        poolSize: 25,
      },
      commonOverconfidentTopics: [
        { topic: 'Cardiology', prevalence: 0.6, avgDelta: 20 },
        { topic: 'Pharmacology', prevalence: 0.55, avgDelta: 18 },
      ],
      peerAvgCorrelation: 0.6,
    },
  }

  describe('Loading state', () => {
    it('should display loading indicator while fetching data', () => {
      ;(fetch as jest.Mock).mockImplementation(
        () => new Promise(() => {}), // Never resolves
      )

      render(<PeerComparisonPanel />)

      expect(screen.getByText(/loading peer comparison/i)).toBeInTheDocument()
    })

    it('should show pulse animation during loading', () => {
      ;(fetch as jest.Mock).mockImplementation(
        () => new Promise(() => {}), // Never resolves
      )

      render(<PeerComparisonPanel />)

      const loadingElement = screen.getByText(/loading peer comparison/i)
      expect(loadingElement).toHaveClass('animate-pulse')
    })
  })

  describe('Not enabled state', () => {
    it('should display opt-in message when peer comparison not enabled', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({
          success: false,
          error: 'PEER_COMPARISON_NOT_ENABLED',
          message: 'Please enable peer comparison in settings',
        }),
      } as Response)

      render(<PeerComparisonPanel />)

      await waitFor(() => {
        expect(screen.getByText(/peer comparison not enabled/i)).toBeInTheDocument()
      })

      expect(
        screen.getByText(/enable peer comparison to see how your calibration/i),
      ).toBeInTheDocument()
    })

    it('should display enable button when not enabled', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({
          success: false,
          error: 'PEER_COMPARISON_NOT_ENABLED',
          message: 'Please enable peer comparison in settings',
        }),
      } as Response)

      render(<PeerComparisonPanel />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /enable in settings/i })).toBeInTheDocument()
      })
    })

    it('should navigate to settings when enable button clicked', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({
          success: false,
          error: 'PEER_COMPARISON_NOT_ENABLED',
          message: 'Please enable peer comparison in settings',
        }),
      } as Response)

      // Mock window.location.href
      const originalLocation = window.location
      delete (window as any).location
      window.location = { href: '' } as any

      render(<PeerComparisonPanel />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /enable in settings/i })).toBeInTheDocument()
      })

      const enableButton = screen.getByRole('button', { name: /enable in settings/i })
      await userEvent.click(enableButton)

      expect(window.location.href).toBe('/settings/privacy')

      // Restore original location
      ;(window as any).location = originalLocation
    })
  })

  describe('Error state', () => {
    it('should display error message when insufficient peer data', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({
          success: false,
          error: 'INSUFFICIENT_PEER_POOL',
          message: 'Insufficient peer data for comparison - need 20+ participants',
        }),
      } as Response)

      render(<PeerComparisonPanel />)

      await waitFor(() => {
        expect(screen.getByText(/insufficient peer data for comparison/i)).toBeInTheDocument()
      })

      expect(screen.getByText(/more students need to opt-in/i)).toBeInTheDocument()
    })

    it('should display generic error message for other errors', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({
          success: false,
          error: 'INTERNAL_ERROR',
          message: 'Something went wrong',
        }),
      } as Response)

      render(<PeerComparisonPanel />)

      await waitFor(() => {
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
      })
    })

    it('should handle fetch errors gracefully', async () => {
      ;(fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

      render(<PeerComparisonPanel />)

      await waitFor(() => {
        expect(screen.getByText(/failed to load peer comparison data/i)).toBeInTheDocument()
      })
    })
  })

  describe('Success state', () => {
    beforeEach(() => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockSuccessResponse,
      } as Response)
    })

    it('should display peer comparison title', async () => {
      render(<PeerComparisonPanel />)

      await waitFor(() => {
        expect(screen.getByText(/peer calibration comparison/i)).toBeInTheDocument()
      })
    })

    it('should display user percentile', async () => {
      render(<PeerComparisonPanel />)

      await waitFor(() => {
        expect(screen.getByText(/75th percentile/i)).toBeInTheDocument()
      })
    })

    it('should display pool size', async () => {
      render(<PeerComparisonPanel />)

      await waitFor(() => {
        expect(screen.getByText(/25 students/i)).toBeInTheDocument()
      })
    })

    it('should display percentile interpretation', async () => {
      render(<PeerComparisonPanel />)

      await waitFor(() => {
        expect(
          screen.getByText(/very good! you calibrate better than most peers/i),
        ).toBeInTheDocument()
      })
    })

    it('should display calibration accuracy distribution heading', async () => {
      render(<PeerComparisonPanel />)

      await waitFor(() => {
        expect(screen.getByText(/calibration accuracy distribution/i)).toBeInTheDocument()
      })
    })

    it('should display user correlation coefficient', async () => {
      render(<PeerComparisonPanel />)

      await waitFor(() => {
        expect(screen.getByText(/you \(0\.75\)/i)).toBeInTheDocument()
      })
    })

    it('should display distribution statistics', async () => {
      render(<PeerComparisonPanel />)

      await waitFor(() => {
        expect(screen.getByText(/25th percentile/i)).toBeInTheDocument()
        expect(screen.getByText(/median/i)).toBeInTheDocument()
        expect(screen.getByText(/75th percentile/i)).toBeInTheDocument()
      })

      // Check values
      const values = screen.getAllByText(/0\.\d+/)
      expect(values.length).toBeGreaterThan(0)
    })
  })

  describe('Common overconfident topics', () => {
    beforeEach(() => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockSuccessResponse,
      } as Response)
    })

    it('should display common overconfidence areas heading', async () => {
      render(<PeerComparisonPanel />)

      await waitFor(() => {
        expect(screen.getByText(/common overconfidence areas/i)).toBeInTheDocument()
      })
    })

    it('should display overconfident topics', async () => {
      render(<PeerComparisonPanel />)

      await waitFor(() => {
        expect(screen.getByText(/cardiology/i)).toBeInTheDocument()
        expect(screen.getByText(/pharmacology/i)).toBeInTheDocument()
      })
    })

    it('should display topic prevalence percentage', async () => {
      render(<PeerComparisonPanel />)

      await waitFor(() => {
        expect(screen.getByText(/60% of peers/i)).toBeInTheDocument()
        expect(screen.getByText(/55% of peers/i)).toBeInTheDocument()
      })
    })

    it('should display average overconfidence delta', async () => {
      render(<PeerComparisonPanel />)

      await waitFor(() => {
        expect(screen.getByText(/average overconfidence: \+20 points/i)).toBeInTheDocument()
        expect(screen.getByText(/average overconfidence: \+18 points/i)).toBeInTheDocument()
      })
    })

    it('should limit display to top 5 topics', async () => {
      const manyTopicsResponse = {
        ...mockSuccessResponse,
        data: {
          ...mockSuccessResponse.data,
          commonOverconfidentTopics: Array.from({ length: 10 }, (_, i) => ({
            topic: `Topic ${i + 1}`,
            prevalence: 0.6 - i * 0.05,
            avgDelta: 20 - i,
          })),
        },
      }

      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => manyTopicsResponse,
      } as Response)

      render(<PeerComparisonPanel />)

      await waitFor(() => {
        expect(screen.getByText(/topic 1/i)).toBeInTheDocument()
        expect(screen.getByText(/topic 5/i)).toBeInTheDocument()
      })

      // Topic 6 and beyond should not be visible
      expect(screen.queryByText(/topic 6/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/topic 10/i)).not.toBeInTheDocument()
    })

    it('should not display section when no common topics', async () => {
      const noTopicsResponse = {
        ...mockSuccessResponse,
        data: {
          ...mockSuccessResponse.data,
          commonOverconfidentTopics: [],
        },
      }

      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => noTopicsResponse,
      } as Response)

      render(<PeerComparisonPanel />)

      await waitFor(() => {
        expect(screen.getByText(/peer calibration comparison/i)).toBeInTheDocument()
      })

      expect(screen.queryByText(/common overconfidence areas/i)).not.toBeInTheDocument()
    })
  })

  describe('Privacy notice', () => {
    beforeEach(() => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockSuccessResponse,
      } as Response)
    })

    it('should display privacy notice', async () => {
      render(<PeerComparisonPanel />)

      await waitFor(() => {
        expect(screen.getByText(/all peer data is anonymized and aggregated/i)).toBeInTheDocument()
      })
    })

    it('should mention opt-out option in privacy notice', async () => {
      render(<PeerComparisonPanel />)

      await waitFor(() => {
        expect(screen.getByText(/you can opt-out anytime in settings/i)).toBeInTheDocument()
      })
    })

    it('should emphasize no individual data visibility', async () => {
      render(<PeerComparisonPanel />)

      await waitFor(() => {
        expect(screen.getByText(/no individual student data is visible/i)).toBeInTheDocument()
      })
    })
  })

  describe('Percentile interpretation', () => {
    const testPercentiles = [
      { percentile: 95, expected: 'Excellent! Your calibration accuracy is in the top 10%' },
      { percentile: 80, expected: 'Very Good! You calibrate better than most peers' },
      { percentile: 65, expected: 'Good! Your calibration is above average' },
      { percentile: 50, expected: 'Average calibration accuracy' },
      { percentile: 30, expected: 'Below average - consider reflection on confidence assessment' },
      { percentile: 10, expected: 'Needs improvement - focus on metacognitive awareness' },
    ]

    testPercentiles.forEach(({ percentile, expected }) => {
      it(`should display correct interpretation for ${percentile}th percentile`, async () => {
        const customResponse = {
          ...mockSuccessResponse,
          data: {
            ...mockSuccessResponse.data,
            userPercentile: percentile,
          },
        }

        ;(fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: async () => customResponse,
        } as Response)

        render(<PeerComparisonPanel />)

        await waitFor(() => {
          expect(screen.getByText(new RegExp(expected, 'i'))).toBeInTheDocument()
        })
      })
    })
  })

  describe('Responsive and accessibility', () => {
    beforeEach(() => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockSuccessResponse,
      } as Response)
    })

    it('should apply glassmorphism styling', async () => {
      const { container } = render(<PeerComparisonPanel />)

      await waitFor(() => {
        expect(screen.getByText(/peer calibration comparison/i)).toBeInTheDocument()
      })

      const panel = container.firstChild as HTMLElement
      expect(panel).toHaveClass('backdrop-blur-xl')
      expect(panel).toHaveClass('bg-white/95')
    })

    it('should have proper semantic structure', async () => {
      render(<PeerComparisonPanel />)

      await waitFor(() => {
        expect(screen.getByText(/peer calibration comparison/i)).toBeInTheDocument()
      })

      // Should have heading
      const heading = screen.getByText(/peer calibration comparison/i)
      expect(heading.tagName).toBe('H3')
    })

    it('should handle custom className prop', () => {
      render(<PeerComparisonPanel className="custom-class" />)

      const panel = screen.getByText(/loading peer comparison/i).closest('div')
      expect(panel).toHaveClass('custom-class')
    })
  })

  describe('API integration', () => {
    it('should include userId in request when provided', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockSuccessResponse,
      } as Response)

      render(<PeerComparisonPanel userId="custom-user-id" />)

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(expect.stringContaining('userId=custom-user-id'))
      })
    })

    it('should include courseId in request when provided', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockSuccessResponse,
      } as Response)

      render(<PeerComparisonPanel courseId="course-123" />)

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(expect.stringContaining('courseId=course-123'))
      })
    })

    it('should include both userId and courseId when provided', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockSuccessResponse,
      } as Response)

      render(<PeerComparisonPanel userId="user-123" courseId="course-456" />)

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringMatching(
            /userId=user-123.*courseId=course-456|courseId=course-456.*userId=user-123/,
          ),
        )
      })
    })
  })
})
