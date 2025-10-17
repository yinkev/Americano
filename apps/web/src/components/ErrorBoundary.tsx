'use client'

import { AlertTriangle, RefreshCcw } from 'lucide-react'
import { Component, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onReset?: () => void
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: { componentStack?: string }
}

/**
 * ErrorBoundary Component
 *
 * A React class component that catches JavaScript errors anywhere in the child
 * component tree, logs those errors, and displays a fallback UI instead of the
 * component tree that crashed.
 *
 * Features:
 * - Catches rendering errors in child components
 * - Displays user-friendly error messages with glassmorphism styling
 * - Logs errors for debugging (console in development, can be extended to external services)
 * - Provides reset functionality to attempt recovery
 * - Uses OKLCH color space per project design standards
 * - No gradients, only solid colors with opacity
 *
 * Usage:
 * ```tsx
 * <ErrorBoundary fallback={<CustomErrorUI />}>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: { componentStack?: string }) {
    // Log error to console in development
    // In production, this could be extended to log to an external error tracking service
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    // Store error info for potential debugging display
    this.setState({
      errorInfo,
    })

    // TODO: Log to external service in production
    // logErrorToService(error, errorInfo.componentStack)
  }

  handleReset = () => {
    // Call optional reset handler from props
    this.props.onReset?.()

    // Reset error state
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
    })
  }

  render() {
    if (this.state.hasError) {
      // If custom fallback provided, use it
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default fallback UI with glassmorphism styling
      return (
        <div
          className="min-h-[400px] w-full flex items-center justify-center p-6"
          role="alert"
          aria-live="assertive"
        >
          <div className="max-w-md w-full rounded-2xl bg-white/80 backdrop-blur-md border border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] p-8">
            {/* Error Icon */}
            <div className="flex justify-center mb-6">
              <div
                className="rounded-full bg-[oklch(0.577_0.245_27.325)]/10 p-4"
                aria-hidden="true"
              >
                <AlertTriangle className="size-12 text-[oklch(0.577_0.245_27.325)]" />
              </div>
            </div>

            {/* Error Title */}
            <h2 className="text-2xl font-bold text-[oklch(0.145_0_0)] text-center mb-3">
              Something went wrong
            </h2>

            {/* Error Description */}
            <p className="text-[oklch(0.556_0_0)] text-center mb-6">
              We encountered an unexpected error while loading this component. Don't worry, your
              progress has been saved.
            </p>

            {/* Error Details (Development Only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 rounded-xl bg-[oklch(0.577_0.245_27.325)]/5 border border-[oklch(0.577_0.245_27.325)]/20">
                <p className="text-xs font-mono text-[oklch(0.577_0.245_27.325)] mb-2 font-semibold">
                  Error Details (Development Only):
                </p>
                <p className="text-xs font-mono text-[oklch(0.556_0_0)] break-all">
                  {this.state.error.message}
                </p>
                {this.state.error.stack && (
                  <details className="mt-2">
                    <summary className="text-xs font-mono text-[oklch(0.556_0_0)] cursor-pointer hover:text-[oklch(0.145_0_0)]">
                      Stack Trace
                    </summary>
                    <pre className="mt-2 text-xs font-mono text-[oklch(0.556_0_0)] whitespace-pre-wrap overflow-x-auto">
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={this.handleReset}
                className="flex-1 bg-[oklch(0.7_0.15_230)] hover:bg-[oklch(0.65_0.15_230)] text-white"
                aria-label="Try again to recover from error"
              >
                <RefreshCcw className="size-4 mr-2" aria-hidden="true" />
                Try Again
              </Button>
              <Button
                onClick={() => {
                  window.location.href = '/'
                }}
                variant="outline"
                className="flex-1"
                aria-label="Navigate to home page"
              >
                Go to Home
              </Button>
            </div>

            {/* Support Link */}
            <p className="text-xs text-center text-[oklch(0.556_0_0)] mt-6">
              If this problem persists, please{' '}
              <a href="/support" className="text-[oklch(0.7_0.15_230)] hover:underline">
                contact support
              </a>
              .
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
