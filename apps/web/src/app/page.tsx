import { MissionCard } from '@/components/dashboard/mission-card'
import { MissionPreview } from '@/components/dashboard/mission-preview'
import { ProgressSummary } from '@/components/dashboard/progress-summary'
import { UpcomingReviews } from '@/components/dashboard/upcoming-reviews'
import { QuickActions } from '@/components/dashboard/quick-actions'

export default function Dashboard() {
  return (
    <div className="flex-1 overflow-y-auto">
      {/* Page Container - responsive padding */}
      <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-7xl">
        {/* Welcome Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-[oklch(0.145_0_0)] mb-2">
            Welcome back, Student!
          </h1>
          <p className="text-base text-[oklch(0.556_0_0)]">
            You're doing great. Let's continue your learning journey.
          </p>
        </div>

        {/* Dashboard Grid - Responsive: 1 col mobile, 2 col tablet, 3 col desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Mission Card - Full width on mobile, spans 2 cols on desktop */}
          <div className="lg:col-span-2">
            <MissionCard />
          </div>

          {/* Right Column - Progress Summary & Mission Preview */}
          <div className="space-y-4 md:space-y-6">
            <ProgressSummary />
            <MissionPreview />
          </div>

          {/* Upcoming Reviews - Left column on desktop */}
          <div className="lg:col-span-2">
            <UpcomingReviews />
          </div>

          {/* Quick Actions - Right column on desktop */}
          <div>
            <QuickActions />
          </div>
        </div>

        {/* Accessibility: Hidden heading for screen readers */}
        <h2 className="sr-only">Dashboard Overview</h2>
      </div>
    </div>
  )
}
