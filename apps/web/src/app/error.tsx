'use client'

import { AlertCircle, RefreshCw } from 'lucide-react'
import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to console (in production, send to error reporting service)
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Glassmorphism Card with OKLCH colors - NO gradients */}
        <div className="rounded-2xl bg-white/80 backdrop-blur-md border border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] p-8">
          {/* Error Icon */}
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-[oklch(0.7_0.15_15)] p-4">
              <AlertCircle className="size-12 text-white" />
            </div>
          </div>

          {/* Error Content */}
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-heading font-bold text-[oklch(0.145_0_0)]">
              Something went wrong
            </h1>

            <p className="text-base text-[oklch(0.556_0_0)] leading-relaxed">
              We encountered an unexpected error. This has been logged and we'll look into it.
            </p>

            {/* Error message (only in development) */}
            {process.env.NODE_ENV === 'development' && error.message && (
              <div className="mt-4 p-4 rounded-lg bg-[oklch(0.97_0_0)] border border-[oklch(0.922_0_0)]">
                <p className="text-sm font-mono text-[oklch(0.7_0.15_15)] break-words">
                  {error.message}
                </p>
              </div>
            )}

            {/* Retry Button with min 44px touch target */}
            <button
              onClick={() => reset()}
              className="mt-6 inline-flex items-center justify-center gap-2 min-h-[44px] min-w-[120px] px-6 py-3
                         rounded-lg bg-[oklch(0.7_0.15_230)] text-white font-medium
                         shadow-md hover:shadow-lg hover:bg-[oklch(0.65_0.15_230)]
                         transition-all duration-200 hover:scale-[1.02]
                         focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[oklch(0.7_0.15_230)]"
              type="button"
            >
              <RefreshCw className="size-4" />
              Try again
            </button>

            {/* Back to Dashboard Link */}
            <div className="mt-4">
              <a
                href="/"
                className="text-sm text-[oklch(0.7_0.15_230)] hover:text-[oklch(0.65_0.15_230)]
                           hover:underline transition-colors duration-200
                           focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[oklch(0.7_0.15_230)]"
              >
                Return to Dashboard
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
