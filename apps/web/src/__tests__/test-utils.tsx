import { type RenderOptions, render } from '@testing-library/react'
import type React from 'react'
import type { ReactElement } from 'react'

/**
 * Custom render function that wraps components with common providers
 * This can be extended to include theme providers, query clients, etc.
 */

interface AllTheProvidersProps {
  children: React.ReactNode
}

const AllTheProviders = ({ children }: AllTheProvidersProps) => {
  // Add any providers here (Theme, Query Client, etc.)
  return <>{children}</>
}

const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
  render(ui, { wrapper: AllTheProviders, ...options })

// Re-export everything from React Testing Library
export * from '@testing-library/react'

// Override render method with custom render
export { customRender as render }

/**
 * Mock Next.js API Request/Response objects for testing
 */
export function createMockRequest(options: {
  method?: string
  body?: unknown
  headers?: Record<string, string>
  url?: string
}) {
  const { method = 'GET', body, headers = {}, url = '/' } = options

  return {
    method,
    body,
    headers: new Headers(headers),
    url,
    json: async () => body,
  } as unknown as Request
}

export function createMockResponse() {
  const response = {
    status: 200,
    headers: new Headers(),
    json: jest.fn(),
    text: jest.fn(),
  }
  return response
}

/**
 * Wait for async operations to complete
 */
export const waitForAsync = () => new Promise((resolve) => setTimeout(resolve, 0))

/**
 * Utility to suppress console errors in specific tests
 */
export function suppressConsoleError(callback: () => void) {
  const originalError = console.error
  console.error = jest.fn()
  callback()
  console.error = originalError
}
