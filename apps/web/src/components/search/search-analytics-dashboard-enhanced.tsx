/**
 * SearchAnalyticsDashboardEnhanced
 * Story 3.6 Task 5.4: Analytics dashboard with Recharts visualizations
 *
 * Displays comprehensive search analytics with interactive charts:
 * - Bar chart: Top 20 search queries
 * - Line chart: Search volume over time
 * - Pie chart: Search by content type
 * - Table: Gap analysis (missing content areas)
 * - Period selector (7d/30d/90d)
 *
 * @module SearchAnalyticsDashboardEnhanced
 */

'use client'

import { AlertCircle, BarChart3, Clock, Download, Search, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// OKLCH colors for charts (no gradients per design system)
const CHART_COLORS = [
  'oklch(0.65 0.15 250)', // Blue
  'oklch(0.60 0.15 150)', // Green
  'oklch(0.70 0.15 50)', // Yellow
  'oklch(0.65 0.15 0)', // Red
  'oklch(0.60 0.15 290)', // Purple
  'oklch(0.65 0.15 180)', // Cyan
]

interface PieLabelRenderProps {
  name?: string | number
  percent?: number
  value?: number
  cx?: number
  cy?: number
  midAngle?: number
  innerRadius?: number
  outerRadius?: number
  fill?: string
  dataKey?: string
  payload?: {
    name?: string
    value?: number
    [key: string]: unknown
  }
  [key: string]: unknown
}

const renderContentTypeLabel = ({ name, percent }: PieLabelRenderProps): string => {
  if (typeof name !== 'string' || percent == null) {
    return ''
  }

  const normalizedPercent = typeof percent === 'number' ? percent : Number(percent) || 0

  return `${name}: ${(normalizedPercent * 100).toFixed(1)}%`
}

interface SearchAnalytics {
  summary: {
    totalSearches: number
    avgResponseTimeMs: number
    overallCTR: number
    contentGapsCount: number
  }
  volumeOverTime: Array<{ date: string; count: number; avgResponseTimeMs: number }>
  topQueries: Array<{ query: string; count: number; avgResults: number }>
  contentTypeDistribution: Array<{
    contentType: string
    count: number
    percentage: number
  }>
  contentGaps: Array<{
    query: string
    searchFrequency: number
    avgResultCount: number
    priorityScore: number
    lastSearched: string
  }>
  topQueriesByCTR: Array<{
    query: string
    searches: number
    clicks: number
    ctr: number
    avgPosition: number
  }>
  period: string
  generatedAt: string
}

interface SearchAnalyticsDashboardEnhancedProps {
  className?: string
}

/**
 * SearchAnalyticsDashboardEnhanced Component
 * Fetches and displays comprehensive search analytics with Recharts
 */
export function SearchAnalyticsDashboardEnhanced({
  className,
}: SearchAnalyticsDashboardEnhancedProps) {
  const [analytics, setAnalytics] = useState<SearchAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d')

  useEffect(() => {
    fetchAnalytics()
  }, [period])

  async function fetchAnalytics() {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/analytics/search?period=${period}`)

      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch analytics')
      }

      setAnalytics(result.data)
    } catch (err) {
      console.error('Error fetching search analytics:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleExport(format: 'json' | 'csv') {
    try {
      if (!analytics) return

      const response = await fetch(`/api/analytics/search/export?format=${format}&period=${period}`)

      if (!response.ok) {
        throw new Error('Failed to export analytics')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `search-analytics-${period}-${new Date().toISOString()}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Error exporting analytics:', err)
      alert('Failed to export analytics. Please try again.')
    }
  }

  if (isLoading) {
    return (
      <div className={className}>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-4 w-32 bg-gray-200 rounded" />
                <div className="h-3 w-48 bg-gray-100 rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-24 bg-gray-50 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error || !analytics) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <p className="text-lg font-medium text-gray-900">Failed to load analytics</p>
          <p className="text-sm text-gray-500 mt-2">{error || 'An unknown error occurred'}</p>
          <Button onClick={fetchAnalytics} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  const { summary, volumeOverTime, topQueries, contentTypeDistribution, contentGaps } = analytics

  // Prepare data for charts
  const topQueriesData = topQueries.slice(0, 20).map((q) => ({
    name: q.query.length > 30 ? q.query.substring(0, 30) + '...' : q.query,
    fullName: q.query,
    count: q.count,
    avgResults: q.avgResults,
  }))

  const pieChartData = contentTypeDistribution.map((item, index) => ({
    name: item.contentType,
    value: item.count,
    percentage: item.percentage,
    fill: CHART_COLORS[index % CHART_COLORS.length],
  }))

  return (
    <div className={className}>
      {/* Header with Period Selector */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Search Analytics</h2>
          <p className="text-sm text-gray-500 mt-1">
            Updated {new Date(analytics.generatedAt).toLocaleString()}
          </p>
        </div>
        <div className="flex gap-2">
          {/* Period Selector */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            {(['7d', '30d', '90d'] as const).map((p) => (
              <Button
                key={p}
                onClick={() => setPeriod(p)}
                variant={period === p ? 'default' : 'ghost'}
                size="sm"
                className="px-4"
              >
                {p}
              </Button>
            ))}
          </div>
          {/* Export Buttons */}
          <Button
            onClick={() => handleExport('json')}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            JSON
          </Button>
          <Button onClick={() => handleExport('csv')} variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Searches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {summary.totalSearches.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Avg Response Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {Math.round(summary.avgResponseTimeMs)}
              <span className="text-lg text-gray-500 ml-1">ms</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Click-Through Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {(summary.overallCTR * 100).toFixed(1)}
              <span className="text-lg text-gray-500 ml-1">%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Content Gaps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{summary.contentGapsCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1: Search Volume Over Time */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search Volume Over Time</CardTitle>
          <CardDescription>Daily search activity for the last {period}</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={volumeOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.01 250)" />
              <XAxis
                dataKey="date"
                stroke="oklch(0.5 0.05 250)"
                tick={{ fill: 'oklch(0.5 0.05 250)' }}
              />
              <YAxis stroke="oklch(0.5 0.05 250)" tick={{ fill: 'oklch(0.5 0.05 250)' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'oklch(1 0 0)',
                  border: '1px solid oklch(0.9 0.01 250)',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="count"
                stroke="oklch(0.65 0.15 250)"
                strokeWidth={2}
                name="Searches"
                dot={{ fill: 'oklch(0.65 0.15 250)' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Charts Row 2: Top Queries Bar Chart and Content Type Pie Chart */}
      <div className="grid gap-6 md:grid-cols-2 mb-6">
        {/* Top 20 Search Queries - Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Top 20 Search Queries
            </CardTitle>
            <CardDescription>Most frequently searched queries</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={topQueriesData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.01 250)" />
                <XAxis
                  type="number"
                  stroke="oklch(0.5 0.05 250)"
                  tick={{ fill: 'oklch(0.5 0.05 250)' }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="oklch(0.5 0.05 250)"
                  tick={{ fill: 'oklch(0.5 0.05 250)', fontSize: 12 }}
                  width={150}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'oklch(1 0 0)',
                    border: '1px solid oklch(0.9 0.01 250)',
                    borderRadius: '8px',
                  }}
                  content={({ active, payload }: { active?: boolean; payload?: any[] }) => {
                    if (active && payload && payload[0]) {
                      const data = payload[0].payload
                      return (
                        <div className="bg-white p-3 border rounded-lg shadow-lg">
                          <p className="font-medium text-sm mb-1">{data.fullName}</p>
                          <p className="text-sm text-gray-600">
                            Count: <span className="font-semibold">{data.count}</span>
                          </p>
                          <p className="text-sm text-gray-600">
                            Avg Results:{' '}
                            <span className="font-semibold">{data.avgResults.toFixed(1)}</span>
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar dataKey="count" fill="oklch(0.65 0.15 250)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Search by Content Type - Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Search by Content Type</CardTitle>
            <CardDescription>Distribution of clicked content types</CardDescription>
          </CardHeader>
          <CardContent>
            {pieChartData.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-20">
                No content type data available
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={renderContentTypeLabel}
                    outerRadius={120}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'oklch(1 0 0)',
                      border: '1px solid oklch(0.9 0.01 250)',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Gap Analysis Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Content Gap Analysis
          </CardTitle>
          <CardDescription>
            High-frequency searches with low content matches (missing content areas)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {contentGaps.length === 0 ? (
            <p className="text-sm text-green-600 text-center py-8">
              ✓ No content gaps detected! All searches have sufficient results.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Query</TableHead>
                  <TableHead className="text-right">Search Frequency</TableHead>
                  <TableHead className="text-right">Avg Results</TableHead>
                  <TableHead className="text-right">Priority Score</TableHead>
                  <TableHead className="text-right">Last Searched</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contentGaps.map((gap, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium max-w-[300px]">{gap.query}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">{gap.searchFrequency}</Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm text-gray-500">
                      {gap.avgResultCount.toFixed(1)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={gap.priorityScore >= 2 ? 'destructive' : 'default'}>
                        {gap.priorityScore.toFixed(2)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-xs text-gray-500">
                      {new Date(gap.lastSearched).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
