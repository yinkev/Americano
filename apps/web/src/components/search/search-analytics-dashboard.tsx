/**
 * SearchAnalyticsDashboard
 * Story 3.1 Task 6.3: Analytics dashboard showing popular searches, zero-result queries
 *
 * Displays comprehensive search analytics including:
 * - Popular searches (most frequent queries)
 * - Zero-result queries (searches with no results)
 * - Click-through rate (CTR) metrics
 * - Search performance metrics
 *
 * @module SearchAnalyticsDashboard
 */

'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { AlertCircle, Search, TrendingUp, Clock, BarChart3 } from 'lucide-react'

interface SearchAnalytics {
  popularSearches: Array<{ query: string; count: number; avgResults: number }>
  zeroResultQueries: Array<{ query: string; count: number; lastSearched: string }>
  ctrAnalytics: {
    overallCTR: number
    byPosition: Array<{ position: number; ctr: number; clicks: number }>
    totalSearches: number
    totalClicks: number
  }
  performanceMetrics: {
    avgResponseTimeMs: number
    avgResultsPerQuery: number
    totalSearches: number
    p95ResponseTimeMs: number | null
  }
  timeWindowDays: number
  generatedAt: string
}

interface SearchAnalyticsDashboardProps {
  timeWindowDays?: number
  className?: string
}

/**
 * SearchAnalyticsDashboard Component
 * Fetches and displays comprehensive search analytics
 */
export function SearchAnalyticsDashboard({
  timeWindowDays = 30,
  className,
}: SearchAnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<SearchAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAnalytics()
  }, [timeWindowDays])

  async function fetchAnalytics() {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(
        `/api/search/analytics?timeWindowDays=${timeWindowDays}`
      )

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
          <p className="text-lg font-medium text-gray-900">
            Failed to load analytics
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {error || 'An unknown error occurred'}
          </p>
          <button
            onClick={fetchAnalytics}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </CardContent>
      </Card>
    )
  }

  const {
    popularSearches,
    zeroResultQueries,
    ctrAnalytics,
    performanceMetrics,
  } = analytics

  return (
    <div className={className}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Search Analytics</h2>
        <p className="text-sm text-gray-500 mt-1">
          Last {timeWindowDays} days • Updated {new Date(analytics.generatedAt).toLocaleString()}
        </p>
      </div>

      {/* Performance Metrics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Searches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {performanceMetrics.totalSearches.toLocaleString()}
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
              {Math.round(performanceMetrics.avgResponseTimeMs)}
              <span className="text-lg text-gray-500 ml-1">ms</span>
            </div>
            {performanceMetrics.p95ResponseTimeMs && (
              <p className="text-xs text-gray-500 mt-1">
                P95: {Math.round(performanceMetrics.p95ResponseTimeMs)}ms
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Search className="h-4 w-4" />
              Avg Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {performanceMetrics.avgResultsPerQuery.toFixed(1)}
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
              {(ctrAnalytics.overallCTR * 100).toFixed(1)}
              <span className="text-lg text-gray-500 ml-1">%</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {ctrAnalytics.totalClicks} clicks / {ctrAnalytics.totalSearches} searches
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Popular Searches and Zero-Result Queries */}
      <div className="grid gap-6 md:grid-cols-2 mb-6">
        {/* Popular Searches */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Popular Searches
            </CardTitle>
            <CardDescription>
              Most frequently searched queries
            </CardDescription>
          </CardHeader>
          <CardContent>
            {popularSearches.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">
                No search data available
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Query</TableHead>
                    <TableHead className="text-right">Count</TableHead>
                    <TableHead className="text-right">Avg Results</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {popularSearches.map((search, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {search.query}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">{search.count}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm text-gray-500">
                        {search.avgResults.toFixed(1)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Zero-Result Queries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Zero-Result Queries
            </CardTitle>
            <CardDescription>
              Searches that returned no results
            </CardDescription>
          </CardHeader>
          <CardContent>
            {zeroResultQueries.length === 0 ? (
              <p className="text-sm text-green-600 text-center py-8">
                ✓ All searches returned results!
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Query</TableHead>
                    <TableHead className="text-right">Count</TableHead>
                    <TableHead className="text-right">Last Searched</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {zeroResultQueries.map((query, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {query.query}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="destructive">{query.count}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-xs text-gray-500">
                        {new Date(query.lastSearched).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* CTR by Position */}
      <Card>
        <CardHeader>
          <CardTitle>Click-Through Rate by Position</CardTitle>
          <CardDescription>
            How often users click on results at each position
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ctrAnalytics.byPosition.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              No click data available
            </p>
          ) : (
            <div className="space-y-3">
              {ctrAnalytics.byPosition.slice(0, 10).map((pos) => (
                <div key={pos.position} className="flex items-center gap-4">
                  <div className="w-20 text-sm font-medium text-gray-500">
                    Position {pos.position + 1}
                  </div>
                  <div className="flex-1">
                    <div className="h-8 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full flex items-center justify-end pr-3"
                        style={{ width: `${Math.min(pos.ctr * 100, 100)}%` }}
                      >
                        {pos.ctr > 0.05 && (
                          <span className="text-xs font-medium text-white">
                            {(pos.ctr * 100).toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="w-24 text-right text-sm text-gray-500">
                    {pos.clicks} clicks
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
