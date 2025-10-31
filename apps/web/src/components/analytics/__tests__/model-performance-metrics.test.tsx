import { render, screen, waitFor } from '@testing-library/react'
import { ModelPerformanceMetrics } from '../model-performance-metrics'

describe('ModelPerformanceMetrics', () => {
  it('renders mock metrics and exposes the mock data badge for admins', async () => {
    render(<ModelPerformanceMetrics isAdmin />)

    await waitFor(() => expect(screen.getByText(/Model Performance Analytics/i)).toBeInTheDocument())

    expect(screen.getByTestId('mock-data-badge')).toHaveTextContent(/Mock data/i)
    expect(screen.getByText('Logistic Regression')).toBeInTheDocument()
    expect(screen.getByText(/90 predictions/i)).toBeInTheDocument()
  })
})
