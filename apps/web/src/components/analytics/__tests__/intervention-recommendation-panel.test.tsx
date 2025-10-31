import { render, screen } from '@testing-library/react'
import { InterventionRecommendationPanel } from '../intervention-recommendation-panel'

describe('InterventionRecommendationPanel', () => {
  it('renders mock interventions and shows the mock data indicator', () => {
    render(<InterventionRecommendationPanel />)

    expect(screen.getByText('Recommended Actions')).toBeInTheDocument()
    expect(screen.getByTestId('mock-data-badge')).toHaveTextContent(/Mock data/i)
    expect(screen.getByText('Review Action Potential Basics')).toBeInTheDocument()
    expect(screen.getByText('Increase Physiology Review Frequency')).toBeInTheDocument()
  })
})
