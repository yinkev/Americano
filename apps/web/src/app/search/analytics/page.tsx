/**
 * Search Analytics Page
 * Story 3.1 Task 6.3: Analytics dashboard page
 *
 * Displays the search analytics dashboard with comprehensive metrics
 */

import { SearchAnalyticsDashboard } from '@/components/search/search-analytics-dashboard'

export default function SearchAnalyticsPage() {
  return (
    <main className="container mx-auto py-8 px-4">
      <SearchAnalyticsDashboard timeWindowDays={30} />
    </main>
  )
}

export const metadata = {
  title: 'Search Analytics | Americano',
  description: 'Comprehensive search analytics including popular searches, CTR metrics, and performance data',
}
