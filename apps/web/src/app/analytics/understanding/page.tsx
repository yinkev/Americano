import { UnderstandingDashboard } from '@/components/analytics/UnderstandingDashboard';

/**
 * Story 4.6: Understanding Analytics Page
 *
 * Top-level page component that renders the UnderstandingDashboard.
 * This page is accessible at /analytics/understanding route.
 */
export default function UnderstandingAnalyticsPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <UnderstandingDashboard />
    </main>
  );
}
