'use client'

import * as React from 'react'
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ConflictAnalyticsData {
  // By status
  byStatus: {
    status: string
    count: number
    percentage: number
  }[]

  // By severity
  bySeverity: {
    severity: string
    count: number
  }[]

  // Resolution rate over time
  resolutionTrend: {
    date: string
    resolved: number
    active: number
    rate: number
  }[]

  // Source credibility comparison
  sourceCredibility: {
    sourceName: string
    credibilityScore: number
    conflictCount: number
  }[]

  // Top conflicting concepts
  topConcepts: {
    conceptName: string
    conflictCount: number
    avgSeverity: number
  }[]

  // Summary stats
  summary: {
    totalConflicts: number
    resolvedConflicts: number
    activeConflicts: number
    resolutionRate: number
    avgResolutionTimeHours: number
  }
}

interface ConflictAnalyticsDashboardProps {
  /**
   * Analytics data
   */
  data: ConflictAnalyticsData

  /**
   * Optional className
   */
  className?: string
}

/**
 * ConflictAnalyticsDashboard Component
 *
 * Comprehensive analytics dashboard for conflict tracking:
 * - Total conflicts by status (pie chart)
 * - Conflicts by severity (bar chart)
 * - Resolution rate over time (line chart)
 * - Source credibility comparison (bar chart)
 * - Top conflicting concepts (ranked list)
 *
 * Features:
 * - Multiple Recharts visualizations
 * - Glassmorphism design with OKLCH colors
 * - WCAG 2.1 AA accessible
 * - Responsive layout with tabs
 *
 * @example
 * ```tsx
 * <ConflictAnalyticsDashboard
 *   data={analyticsData}
 * />
 * ```
 */
export function ConflictAnalyticsDashboard({
  data,
  className,
}: ConflictAnalyticsDashboardProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Total Conflicts"
          value={data.summary.totalConflicts}
          icon={<AlertTriangle className="h-5 w-5" />}
          color="oklch(0.65 0.18 240)"
        />
        <SummaryCard
          title="Resolved"
          value={data.summary.resolvedConflicts}
          icon={<CheckCircle2 className="h-5 w-5" />}
          color="oklch(0.60 0.15 145)"
        />
        <SummaryCard
          title="Resolution Rate"
          value={`${data.summary.resolutionRate.toFixed(1)}%`}
          icon={<TrendingUp className="h-5 w-5" />}
          color="oklch(0.70 0.15 60)"
        />
        <SummaryCard
          title="Avg Resolution Time"
          value={`${data.summary.avgResolutionTimeHours.toFixed(1)}h`}
          icon={<Activity className="h-5 w-5" />}
          color="oklch(0.65 0.18 200)"
        />
      </div>

      {/* Charts Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="min-h-[44px]">
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="trends" className="min-h-[44px]">
            <Activity className="h-4 w-4 mr-2" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="sources" className="min-h-[44px]">
            <PieChartIcon className="h-4 w-4 mr-2" />
            Sources
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Status Distribution Pie Chart */}
            <Card className="p-4 bg-card  border-border">
              <h3 className="text-sm font-semibold mb-4">Conflicts by Status</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.byStatus}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry) => `${entry.status}: ${entry.percentage}%`}
                  >
                    {data.byStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getStatusColor(entry.status)} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            {/* Severity Distribution Bar Chart */}
            <Card className="p-4 bg-card  border-border">
              <h3 className="text-sm font-semibold mb-4">Conflicts by Severity</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.bySeverity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.85 0 0)" />
                  <XAxis
                    dataKey="severity"
                    tick={{ fontSize: 12, fill: 'oklch(0.556 0 0)' }}
                    stroke="oklch(0.75 0 0)"
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: 'oklch(0.556 0 0)' }}
                    stroke="oklch(0.75 0 0)"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {data.bySeverity.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getSeverityColor(entry.severity)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4 mt-4">
          {/* Resolution Rate Over Time */}
          <Card className="p-4 bg-card  border-border">
            <h3 className="text-sm font-semibold mb-4">Resolution Rate Over Time</h3>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={data.resolutionTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.85 0 0)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: 'oklch(0.556 0 0)' }}
                  stroke="oklch(0.75 0 0)"
                />
                <YAxis
                  tick={{ fontSize: 12, fill: 'oklch(0.556 0 0)' }}
                  stroke="oklch(0.75 0 0)"
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="resolved"
                  stroke="oklch(0.60 0.15 145)"
                  strokeWidth={2}
                  dot={{ fill: 'oklch(0.60 0.15 145)', r: 4 }}
                  name="Resolved"
                />
                <Line
                  type="monotone"
                  dataKey="active"
                  stroke="oklch(0.65 0.18 240)"
                  strokeWidth={2}
                  dot={{ fill: 'oklch(0.65 0.18 240)', r: 4 }}
                  name="Active"
                />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="oklch(0.70 0.15 60)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: 'oklch(0.70 0.15 60)', r: 4 }}
                  name="Resolution Rate (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Top Conflicting Concepts */}
          <Card className="p-4 bg-card  border-border">
            <h3 className="text-sm font-semibold mb-4">Top Conflicting Concepts</h3>
            <div className="space-y-3">
              {data.topConcepts.slice(0, 10).map((concept, index) => (
                <ConceptRow key={concept.conceptName} concept={concept} rank={index + 1} />
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Sources Tab */}
        <TabsContent value="sources" className="space-y-4 mt-4">
          {/* Source Credibility Comparison */}
          <Card className="p-4 bg-card  border-border">
            <h3 className="text-sm font-semibold mb-4">Source Credibility Comparison</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={data.sourceCredibility} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.85 0 0)" />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{ fontSize: 12, fill: 'oklch(0.556 0 0)' }}
                  stroke="oklch(0.75 0 0)"
                />
                <YAxis
                  type="category"
                  dataKey="sourceName"
                  tick={{ fontSize: 12, fill: 'oklch(0.556 0 0)' }}
                  stroke="oklch(0.75 0 0)"
                  width={150}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="credibilityScore" fill="oklch(0.65 0.18 240)" radius={[0, 4, 4, 0]}>
                  {data.sourceCredibility.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={getCredibilityColor(entry.credibilityScore)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div className="mt-4 flex items-center justify-center gap-6 text-xs">
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded"
                  style={{ backgroundColor: 'oklch(0.60 0.15 145)' }}
                />
                <span>High (90-100)</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded"
                  style={{ backgroundColor: 'oklch(0.65 0.18 240)' }}
                />
                <span>Medium (70-89)</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded"
                  style={{ backgroundColor: 'oklch(0.70 0.15 60)' }}
                />
                <span>Low (&lt;70)</span>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

/**
 * SummaryCard Component
 */
function SummaryCard({
  title,
  value,
  icon,
  color,
}: {
  title: string
  value: string | number
  icon: React.ReactNode
  color: string
}) {
  return (
    <Card className="p-4 bg-card  border-border">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-muted-foreground">{title}</p>
        <div style={{ color }}>{icon}</div>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </Card>
  )
}

/**
 * ConceptRow Component
 */
function ConceptRow({
  concept,
  rank,
}: {
  concept: {
    conceptName: string
    conflictCount: number
    avgSeverity: number
  }
  rank: number
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border bg-background p-3">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Badge
          variant="outline"
          className="shrink-0"
          style={{
            borderColor: getRankColor(rank),
            color: getRankColor(rank),
          }}
        >
          #{rank}
        </Badge>
        <span className="font-medium text-sm truncate">{concept.conceptName}</span>
      </div>
      <div className="flex items-center gap-4 shrink-0">
        <div className="text-right">
          <p className="text-sm font-semibold">{concept.conflictCount}</p>
          <p className="text-xs text-muted-foreground">conflicts</p>
        </div>
        <Badge
          variant="outline"
          className="text-xs"
          style={{
            borderColor: getSeverityColorByValue(concept.avgSeverity),
            color: getSeverityColorByValue(concept.avgSeverity),
          }}
        >
          {getSeverityLabel(concept.avgSeverity)}
        </Badge>
      </div>
    </div>
  )
}

/**
 * Custom Tooltip for Recharts
 */
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null

  return (
    <div className="rounded-lg border bg-card  p-3 shadow-none">
      {label && <p className="text-sm font-semibold mb-1">{label}</p>}
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded"
            style={{ backgroundColor: entry.color || entry.fill }}
          />
          <p className="text-sm">
            <span className="text-muted-foreground">{entry.name}:</span>{' '}
            <span className="font-semibold">{entry.value}</span>
          </p>
        </div>
      ))}
    </div>
  )
}

/**
 * Helper Functions
 */

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    ACTIVE: 'oklch(0.65 0.18 240)',
    UNDER_REVIEW: 'oklch(0.70 0.15 60)',
    RESOLVED: 'oklch(0.60 0.15 145)',
    DISMISSED: 'oklch(0.60 0.10 220)',
  }
  return colors[status] || 'oklch(0.65 0.18 240)'
}

function getSeverityColor(severity: string): string {
  const colors: Record<string, string> = {
    LOW: 'oklch(0.75 0.12 85)',
    MEDIUM: 'oklch(0.70 0.15 60)',
    HIGH: 'oklch(0.65 0.18 40)',
    CRITICAL: 'oklch(0.60 0.22 25)',
  }
  return colors[severity] || 'oklch(0.70 0.15 60)'
}

function getCredibilityColor(score: number): string {
  if (score >= 90) return 'oklch(0.60 0.15 145)' // Green
  if (score >= 70) return 'oklch(0.65 0.18 240)' // Blue
  return 'oklch(0.70 0.15 60)' // Yellow
}

function getRankColor(rank: number): string {
  if (rank <= 3) return 'oklch(0.60 0.22 25)' // Top 3: Red/Critical
  if (rank <= 6) return 'oklch(0.65 0.18 40)' // 4-6: Orange/High
  return 'oklch(0.70 0.15 60)' // 7+: Yellow/Medium
}

function getSeverityColorByValue(avgSeverity: number): string {
  if (avgSeverity >= 3) return 'oklch(0.60 0.22 25)' // Critical
  if (avgSeverity >= 2) return 'oklch(0.65 0.18 40)' // High
  if (avgSeverity >= 1) return 'oklch(0.70 0.15 60)' // Medium
  return 'oklch(0.75 0.12 85)' // Low
}

function getSeverityLabel(avgSeverity: number): string {
  if (avgSeverity >= 3) return 'Critical'
  if (avgSeverity >= 2) return 'High'
  if (avgSeverity >= 1) return 'Medium'
  return 'Low'
}
