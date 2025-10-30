/**
 * React Component Smoke Test
 *
 * Verifies React Testing Library setup and component rendering
 */

import { render, screen } from '../test-utils'
import '@testing-library/jest-dom'

// Simple test component
function TestComponent({ message }: { message: string }) {
  return (
    <div>
      <h1>Test Component</h1>
      <p>{message}</p>
      <button type="button">Click me</button>
    </div>
  )
}

describe('React Testing Library Smoke Test', () => {
  it('should render a component', () => {
    render(<TestComponent message="Hello, World!" />)

    expect(screen.getByText('Test Component')).toBeInTheDocument()
    expect(screen.getByText('Hello, World!')).toBeInTheDocument()
  })

  it('should support role queries', () => {
    render(<TestComponent message="Test" />)

    const heading = screen.getByRole('heading', { name: 'Test Component' })
    expect(heading).toBeInTheDocument()

    const button = screen.getByRole('button', { name: 'Click me' })
    expect(button).toBeInTheDocument()
  })

  it('should support jest-dom matchers', () => {
    render(<TestComponent message="Visible text" />)

    const paragraph = screen.getByText('Visible text')
    expect(paragraph).toBeVisible()
    expect(paragraph).toBeInTheDocument()
  })

  it('should handle component updates', () => {
    const { rerender } = render(<TestComponent message="First message" />)
    expect(screen.getByText('First message')).toBeInTheDocument()

    rerender(<TestComponent message="Second message" />)
    expect(screen.getByText('Second message')).toBeInTheDocument()
    expect(screen.queryByText('First message')).not.toBeInTheDocument()
  })

  it('should support async queries', async () => {
    function AsyncComponent() {
      return <div>Async content loaded</div>
    }

    render(<AsyncComponent />)

    const content = await screen.findByText('Async content loaded')
    expect(content).toBeInTheDocument()
  })
})

describe('Component Accessibility Testing', () => {
  it('should verify accessible elements', () => {
    render(
      <div>
        <label htmlFor="test-input">Test Label</label>
        <input id="test-input" type="text" placeholder="Enter text" />
      </div>,
    )

    const input = screen.getByLabelText('Test Label')
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('type', 'text')
  })
})
