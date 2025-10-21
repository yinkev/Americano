import { ConflictAnalyticsDashboard } from '@/components/conflicts/conflict-analytics-dashboard'

/**
 * Conflict Analytics Page
 *
 * Displays comprehensive analytics dashboard for conflict tracking
 * across all sources and concepts.
 *
 * Features:
 * - Overview charts (status distribution, severity breakdown)
 * - Trend analysis (resolution rate over time)
 * - Source credibility comparison
 * - Top conflicting concepts
 */
export default async function ConflictAnalyticsPage() {
  // In production, this would fetch from API
  const analyticsData = {
    byStatus: [
      { status: 'ACTIVE', count: 45, percentage: 37.5 },
      { status: 'UNDER_REVIEW', count: 28, percentage: 23.3 },
      { status: 'RESOLVED', count: 35, percentage: 29.2 },
      { status: 'DISMISSED', count: 12, percentage: 10.0 },
    ],
    bySeverity: [
      { severity: 'LOW', count: 25 },
      { severity: 'MEDIUM', count: 48 },
      { severity: 'HIGH', count: 32 },
      { severity: 'CRITICAL', count: 15 },
    ],
    resolutionTrend: [
      { date: '2025-10-01', resolved: 5, active: 42, rate: 10.6 },
      { date: '2025-10-05', resolved: 12, active: 38, rate: 24.0 },
      { date: '2025-10-10', resolved: 22, active: 32, rate: 40.7 },
      { date: '2025-10-15', resolved: 35, active: 28, rate: 55.6 },
      { date: '2025-10-16', resolved: 35, active: 45, rate: 43.8 },
    ],
    sourceCredibility: [
      { sourceName: 'First Aid 2026', credibilityScore: 95, conflictCount: 12 },
      { sourceName: 'UpToDate', credibilityScore: 92, conflictCount: 8 },
      { sourceName: 'Lecture Notes', credibilityScore: 78, conflictCount: 35 },
      { sourceName: 'Student Notes', credibilityScore: 65, conflictCount: 42 },
      { sourceName: 'Online Forums', credibilityScore: 45, conflictCount: 23 },
    ],
    topConcepts: [
      { conceptName: 'Aspirin Dosing', conflictCount: 18, avgSeverity: 3.2 },
      { conceptName: 'Hypertension Management', conflictCount: 15, avgSeverity: 2.8 },
      { conceptName: 'Diabetes Treatment', conflictCount: 14, avgSeverity: 2.5 },
      { conceptName: 'Antibiotic Selection', conflictCount: 12, avgSeverity: 3.0 },
      { conceptName: 'Heart Failure Protocol', conflictCount: 11, avgSeverity: 2.9 },
      { conceptName: 'Stroke Management', conflictCount: 10, avgSeverity: 3.1 },
      { conceptName: 'COPD Treatment', conflictCount: 9, avgSeverity: 2.3 },
      { conceptName: 'Asthma Guidelines', conflictCount: 8, avgSeverity: 2.1 },
      { conceptName: 'Pain Management', conflictCount: 7, avgSeverity: 2.6 },
      { conceptName: 'Sepsis Protocol', conflictCount: 6, avgSeverity: 3.3 },
    ],
    summary: {
      totalConflicts: 120,
      resolvedConflicts: 35,
      activeConflicts: 45,
      resolutionRate: 29.2,
      avgResolutionTimeHours: 48.5,
    },
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Conflict Analytics</h1>
        <p className="text-muted-foreground">
          Comprehensive insights into content conflicts across all sources
        </p>
      </div>

      <ConflictAnalyticsDashboard data={analyticsData} />
    </div>
  )
}
