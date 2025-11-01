import React from 'react'
import { fireEvent, render, screen } from '@/__tests__/test-utils'
import BehavioralInsightsDashboard from '@/app/analytics/behavioral-insights/page'
import LearningPatternsPage from '@/app/analytics/learning-patterns/page'

const capturedProps: Record<string, any> = {}

jest.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get: () => ({ children, ...props }: any) => <div {...props}>{children}</div>,
    },
  ),
}))

const mockUseCurrentUser = jest.fn()

jest.mock('@/hooks/use-current-user', () => ({
  useCurrentUser: () => mockUseCurrentUser(),
}))

const mockUsePatterns = jest.fn()
const mockUseLongitudinal = jest.fn()
const mockUsePeerBenchmark = jest.fn()
const mockUsePredictions = jest.fn()

jest.mock('@/lib/api/hooks/analytics', () => {
  const actual = jest.requireActual('@/lib/api/hooks/analytics')
  return {
    ...actual,
    usePatterns: (...args: any[]) => mockUsePatterns(...args),
    useLongitudinal: (...args: any[]) => mockUseLongitudinal(...args),
    usePeerBenchmark: (...args: any[]) => mockUsePeerBenchmark(...args),
    usePredictions: (...args: any[]) => mockUsePredictions(...args),
  }
})

const mockUseAnalyticsStore = jest.fn((selector: any) =>
  selector({ timeRange: '30d' }),
)

jest.mock('@/stores/analytics', () => ({
  useAnalyticsStore: (selector: any) => mockUseAnalyticsStore(selector),
}))

jest.mock('@/features/analytics/components/behavioral-insights', () => ({
  BehavioralGoalsSection: (props: any) => {
    capturedProps.BehavioralGoalsSection = props
    return <div data-testid="behavioral-goals-section" />
  },
  LearningArticleReader: (props: any) => {
    capturedProps.LearningArticleReader = props
    return <div data-testid="learning-article-reader" />
  },
  LearningPatternsGrid: () => <div data-testid="learning-patterns-grid" />,
  PatternEvolutionTimeline: () => <div data-testid="pattern-evolution" />,
  PerformanceCorrelationChart: (props: any) => {
    capturedProps.PerformanceCorrelationChart = props
    return <div data-testid="performance-correlation" />
  },
  RecommendationsPanel: (props: any) => {
    capturedProps.RecommendationsPanel = props
    return <div data-testid="recommendations-panel" />
  },
}))

describe('Behavioral analytics dashboards respect the current user context', () => {
  beforeEach(() => {
    mockUsePatterns.mockReturnValue({ data: undefined, isLoading: false, error: null })
    mockUseLongitudinal.mockReturnValue({ data: undefined, isLoading: false, error: null })
    mockUsePeerBenchmark.mockReturnValue({ data: undefined, isLoading: false, error: null })
    mockUsePredictions.mockReturnValue({ data: undefined, isLoading: false, error: null })
    mockUseAnalyticsStore.mockImplementation((selector: any) => selector({ timeRange: '30d' }))
  })

  afterEach(() => {
    jest.clearAllMocks()
    for (const key of Object.keys(capturedProps)) {
      delete capturedProps[key]
    }
  })

  it('threads the resolved user id through behavioral insights data dependencies', () => {
    mockUseCurrentUser.mockReturnValue({
      data: { id: 'user-123', email: 'user@example.com' },
      isLoading: false,
      error: null,
    })

    render(<BehavioralInsightsDashboard />)

    const userArgs = mockUsePatterns.mock.calls.map((call) => call[0])
    expect(userArgs).toContain('user-123')
    const longitudinalArgs = mockUseLongitudinal.mock.calls.map((call) => call[0])
    expect(longitudinalArgs).toContain('user-123')
    const benchmarkArgs = mockUsePeerBenchmark.mock.calls.map((call) => call[0])
    expect(benchmarkArgs).toContain('user-123')

    fireEvent.click(screen.getByRole('tab', { name: /performance/i }))
    fireEvent.click(screen.getByRole('tab', { name: /learn/i }))

    expect(capturedProps.PerformanceCorrelationChart?.userId).toBe('user-123')
    expect(capturedProps.BehavioralGoalsSection?.userId).toBe('user-123')
    expect(capturedProps.RecommendationsPanel?.userId).toBe('user-123')
    expect(capturedProps.LearningArticleReader?.userId).toBe('user-123')
  })

  it('disables analytics queries until a user id is available', () => {
    mockUseCurrentUser.mockReturnValue({ data: undefined, isLoading: true, error: null })

    render(<BehavioralInsightsDashboard />)

    expect(mockUsePatterns.mock.calls.every((call) => call[0] === null)).toBe(true)
    expect(mockUseLongitudinal.mock.calls.every((call) => call[0] === null)).toBe(true)
    expect(mockUsePeerBenchmark.mock.calls.every((call) => call[0] === null)).toBe(true)

    fireEvent.click(screen.getByRole('tab', { name: /performance/i }))
    fireEvent.click(screen.getByRole('tab', { name: /learn/i }))

    expect(capturedProps.PerformanceCorrelationChart?.userId).toBeNull()
    expect(capturedProps.BehavioralGoalsSection?.userId).toBeNull()
    expect(capturedProps.RecommendationsPanel?.userId).toBeNull()
    expect(capturedProps.LearningArticleReader?.userId).toBeNull()
  })
})

describe('Learning patterns dashboard requests user scoped analytics', () => {
  beforeEach(() => {
    mockUsePatterns.mockReturnValue({ data: undefined, isLoading: false, error: null })
    mockUsePredictions.mockReturnValue({ data: undefined, isLoading: false, error: null })
    mockUseAnalyticsStore.mockImplementation((selector: any) => selector({ timeRange: '30d' }))
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('passes the current user id to learning analytics hooks', () => {
    mockUseCurrentUser.mockReturnValue({
      data: { id: 'user-abc', email: 'abc@example.com' },
      isLoading: false,
      error: null,
    })

    render(<LearningPatternsPage />)

    const patternArgs = mockUsePatterns.mock.calls.map((call) => call[0])
    expect(patternArgs).toContain('user-abc')
    const predictionArgs = mockUsePredictions.mock.calls.map((call) => call[0])
    expect(predictionArgs).toContain('user-abc')
  })

  it('gates learning analytics hooks when no user is resolved', () => {
    mockUseCurrentUser.mockReturnValue({ data: undefined, isLoading: true, error: null })

    render(<LearningPatternsPage />)

    expect(mockUsePatterns.mock.calls.every((call) => call[0] === null)).toBe(true)
    expect(mockUsePredictions.mock.calls.every((call) => call[0] === null)).toBe(true)
  })
})

