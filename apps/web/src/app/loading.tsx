export default function Loading() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <div className="w-full max-w-6xl space-y-6">
        {/* Skeleton Header */}
        <div className="rounded-2xl bg-white/80 backdrop-blur-md border border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] p-6">
          <div className="space-y-4">
            {/* Title skeleton */}
            <div className="h-8 w-64 bg-[oklch(0.97_0_0)] rounded-lg animate-pulse" />
            {/* Subtitle skeleton */}
            <div className="h-4 w-96 bg-[oklch(0.97_0_0)] rounded-lg animate-pulse" />
          </div>
        </div>

        {/* Skeleton Cards Grid - 3 cols desktop, 2 tablet, 1 mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl bg-white/80 backdrop-blur-md border border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] p-6"
            >
              <div className="space-y-4">
                {/* Card title */}
                <div className="h-6 w-3/4 bg-[oklch(0.97_0_0)] rounded-lg animate-pulse" />
                {/* Card content lines */}
                <div className="space-y-2">
                  <div className="h-4 w-full bg-[oklch(0.97_0_0)] rounded-lg animate-pulse" />
                  <div className="h-4 w-5/6 bg-[oklch(0.97_0_0)] rounded-lg animate-pulse" />
                  <div className="h-4 w-4/6 bg-[oklch(0.97_0_0)] rounded-lg animate-pulse" />
                </div>
                {/* Card footer */}
                <div className="flex gap-2 pt-4">
                  <div className="h-10 w-24 bg-[oklch(0.97_0_0)] rounded-lg animate-pulse" />
                  <div className="h-10 w-24 bg-[oklch(0.97_0_0)] rounded-lg animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Loading indicator text */}
        <div className="flex justify-center pt-4">
          <p className="text-sm text-[oklch(0.556_0_0)] font-medium">Loading...</p>
        </div>
      </div>
    </div>
  )
}
