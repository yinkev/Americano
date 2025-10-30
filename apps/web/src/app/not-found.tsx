import { FileQuestion, Home } from 'lucide-react'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Glassmorphism Card with OKLCH colors - NO gradients */}
        <div className="rounded-2xl bg-white/80 backdrop-blur-md border border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] p-8">
          {/* 404 Icon */}
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-[oklch(0.7_0.15_230)]/10 p-4">
              <FileQuestion className="size-16 text-[oklch(0.7_0.15_230)]" />
            </div>
          </div>

          {/* 404 Content */}
          <div className="text-center space-y-4">
            <h1 className="text-6xl font-heading font-bold text-[oklch(0.145_0_0)]">404</h1>

            <h2 className="text-2xl font-heading font-semibold text-[oklch(0.145_0_0)]">
              Page Not Found
            </h2>

            <p className="text-base text-[oklch(0.556_0_0)] leading-relaxed">
              The page you're looking for doesn't exist or has been moved. Let's get you back on
              track.
            </p>

            {/* Back to Dashboard Button with min 44px touch target */}
            <div className="mt-6">
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 min-h-[44px] min-w-[160px] px-6 py-3
                           rounded-lg bg-[oklch(0.7_0.15_230)] text-white font-medium
                           shadow-md hover:shadow-lg hover:bg-[oklch(0.65_0.15_230)]
                           transition-all duration-200 hover:scale-[1.02]
                           focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[oklch(0.7_0.15_230)]"
              >
                <Home className="size-4" />
                Return to Dashboard
              </Link>
            </div>

            {/* Helpful Links */}
            <div className="mt-8 pt-6 border-t border-[oklch(0.922_0_0)]">
              <p className="text-sm text-[oklch(0.556_0_0)] mb-3">You might be looking for:</p>
              <div className="flex flex-col gap-2">
                <Link
                  href="/library"
                  className="text-sm text-[oklch(0.7_0.15_230)] hover:text-[oklch(0.65_0.15_230)]
                             hover:underline transition-colors duration-200
                             focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[oklch(0.7_0.15_230)]
                             rounded px-1 py-0.5"
                >
                  Library
                </Link>
                <Link
                  href="/study"
                  className="text-sm text-[oklch(0.7_0.15_230)] hover:text-[oklch(0.65_0.15_230)]
                             hover:underline transition-colors duration-200
                             focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[oklch(0.7_0.15_230)]
                             rounded px-1 py-0.5"
                >
                  Study Session
                </Link>
                <Link
                  href="/progress"
                  className="text-sm text-[oklch(0.7_0.15_230)] hover:text-[oklch(0.65_0.15_230)]
                             hover:underline transition-colors duration-200
                             focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[oklch(0.7_0.15_230)]
                             rounded px-1 py-0.5"
                >
                  Progress
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
