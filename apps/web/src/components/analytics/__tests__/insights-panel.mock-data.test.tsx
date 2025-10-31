import { render, screen } from '@testing-library/react'
import { InsightsPanel } from '../insights-panel'
import { getMockDailyInsight } from '@/lib/mocks/analytics'

const mockUseDailyInsight = jest.fn()

jest.mock('@/lib/api/hooks', () => ({
  useDailyInsight: (userId: string | null) => mockUseDailyInsight(userId),
}))

describe('InsightsPanel mock indicator', () => {
  const baseResult = {
    isLoading: false,
    isRefetching: false,
    error: null,
    refetch: jest.fn(),
  }

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('renders the mock data badge when the insight source is mock', () => {
    const { payload } = getMockDailyInsight('demo-user')
    mockUseDailyInsight.mockReturnValue({
      ...baseResult,
      data: { ...payload, source: 'mock' },
    })

    render(<InsightsPanel />)

    expect(screen.getByText(/Mock data/i)).toBeInTheDocument()
  })

  it('hides the mock data badge when the insight source is api', () => {
    const { payload } = getMockDailyInsight('demo-user')
    mockUseDailyInsight.mockReturnValue({
      ...baseResult,
      data: { ...payload, source: 'api' },
    })

    render(<InsightsPanel />)

    expect(screen.queryByText(/Mock data/i)).not.toBeInTheDocument()
  })
})
