// apps/web/src/app/page.tsx
import { WhatsNextCard } from '@/components/dashboard/whats-next-card';
import { KnowledgeMap } from '@/components/dashboard/knowledge-map';
import { AchievementsCarousel } from '@/components/dashboard/achievements-carousel';
import { ChallengeWeakSpot } from '@/components/dashboard/challenge-weak-spot';
import { QuickLinks } from '@/components/dashboard/quick-links';

export default function Dashboard() {
  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      {/* Page Container - responsive padding */}
      <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-7xl">

        {/* Welcome Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-[oklch(0.145_0_0)] mb-2">
            Hello, Student!
          </h1>
          <p className="text-base text-[oklch(0.556_0_0)]">
            Your personalized learning journey awaits.
          </p>
        </div>

        {/* New Dashboard Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <WhatsNextCard />
          </div>
          <div className="space-y-6">
            <KnowledgeMap />
            <ChallengeWeakSpot />
            <QuickLinks />
          </div>
          <div className="lg:col-span-3">
            <AchievementsCarousel />
          </div>
        </div>
      </div>
    </div>
  );
}
