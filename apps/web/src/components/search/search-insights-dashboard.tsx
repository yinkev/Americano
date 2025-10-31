/**
 * Search Insights Dashboard Component
 *
 * Enhanced analytics dashboard with actionable insights
 * - Search pattern analysis
 * - Popular searches with trends
 * - Query refinement suggestions
 * - Search effectiveness metrics
 * - Time-based analytics
 */

'use client'

import {
  TrendingUp,
  TrendingDown,
  Search,
  Target,
  Clock,
  Users,
  Zap,
  AlertCircle,
} from 'lucide-react'
import * as React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer } from '@/components/ui/chart-container'
import { InsightCard, type InsightPriority } from '@/components/ui/insight-card'
import { MetricCard } from '@/components/ui/metric-card'
import { Separator } from '@/components/ui/separator'
import { TrendIndicator } from '@/components/ui/trend-indicator'

export interface SearchInsight {
  priority: InsightPriority
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export interface SearchPattern {
  query: string
  count: number
  trend: number
  avgResultCount: number
  avgResponseTime: number
  lastSearched: string
}

export interface QuerySuggestion {
  originalQuery: string
  suggestedQuery: string
  reason: string
  expectedImprovement: string
}

export interface SearchInsightsDashboardProps {
  timeWindowDays?: number
  onQueryClick?: (query: string) => void
}

export function SearchInsightsDashboard({
  timeWindowDays = 30,
  onQueryClick,
}: SearchInsightsDashboardProps) {
  const [loading, setLoading] = React.useState(true)
  const [insights, setInsights] = React.useState<SearchInsight[]>([])
  const [patterns, setPatterns] = React.useState<SearchPattern[]>([])
  const [suggestions, setSuggestions] = React.useState<QuerySuggestion[]>([])

  React.useEffect(() => {
    // Simulate data loading - replace with actual API call
    const timer = setTimeout(() => {
      setInsights([
        {
          priority: 'success',
          title: 'High Search Success Rate',
          description: '87% of searches return 5+ relevant results',
          action: {
            label: 'View Details',
            onClick: () => console.log('View details'),
          },
        },
        {
          priority: 'warning',
          title: 'Low Result Queries Detected',
          description: '12 queries returned fewer than 3 results this week',
          action: {
            label: 'Optimize Content',
            onClick: () => console.log('Optimize'),
          },
        },
        {
          priority: 'info',
          title: 'Search Pattern Identified',
          description: 'Users frequently search for anatomy after pathology topics',
        },
      ])

      setPatterns([
        {
          query: 'cardiac physiology',
          count: 156,
          trend: 23,
          avgResultCount: 12,
          avgResponseTime: 340,
          lastSearched: '2 hours ago',
        },
        {
          query: 'immune system',
          count: 142,
          trend: -8,
          avgResultCount: 18,
          avgResponseTime: 290,
          lastSearched: '1 day ago',
        },
        {
          query: 'pharmacokinetics',
          count: 128,
          trend: 15,
          avgResultCount: 9,
          avgResponseTime: 410,
          lastSearched: '3 hours ago',
        },
      ])

      setSuggestions([
        {
          originalQuery: 'heart function',
          suggestedQuery: 'cardiac physiology AND contractility',
          reason: 'More specific terminology',
          expectedImprovement: '+40% relevant results',
        },
        {
          originalQuery: 'drug metabolism',
          suggestedQuery: 'pharmacokinetics OR drug clearance',
          reason: 'Include related concepts',
          expectedImprovement: '+25% coverage',
        },
      ])

      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [timeWindowDays])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold tracking-tight">Search Analytics</h1>
        <p className="text-muted-foreground mt-2">
          Insights and patterns from search activity over the last {timeWindowDays} days
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Searches"
          value="2,847"
          change={12.5}
          trend="up"
          icon={<Search className="h-4 w-4" />}
          loading={loading}
        />
        <MetricCard
          title="Unique Queries"
          value="1,234"
          change={-3.2}
          trend="down"
          icon={<Target className="h-4 w-4" />}
          loading={loading}
        />
        <MetricCard
          title="Avg Response Time"
          value="324ms"
          change={-8.1}
          trend="down"
          icon={<Zap className="h-4 w-4" />}
          loading={loading}
          subtitle="Faster is better"
        />
        <MetricCard
          title="Success Rate"
          value="87%"
          change={5.3}
          trend="up"
          icon={<Users className="h-4 w-4" />}
          loading={loading}
        />
      </div>

      {/* Insights */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Key Insights</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {insights.map((insight, index) => (
            <InsightCard
              key={index}
              priority={insight.priority}
              title={insight.title}
              description={insight.description}
              actions={insight.action ? [insight.action] : undefined}
            />
          ))}
        </div>
      </div>

      {/* Popular Search Patterns */}
      <Card>
        <CardHeader>
          <CardTitle>Popular Search Patterns</CardTitle>
          <CardDescription>
            Most frequently searched queries and their trends
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {patterns.map((pattern, index) => (
                <div key={index}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <button
                        onClick={() => onQueryClick?.(pattern.query)}
                        className="text-sm font-medium hover:text-primary transition-colors text-left"
                      >
                        {pattern.query}
                      </button>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Search className="h-3 w-3" />
                          <span>{pattern.count} searches</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          <span>{pattern.avgResultCount} avg results</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{pattern.avgResponseTime}ms</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>Last: {pattern.lastSearched}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendIndicator
                        value={pattern.trend}
                        showValue
                        size="sm"
                      />
                    </div>
                  </div>
                  {index < patterns.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Query Refinement Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Query Refinement Suggestions
          </CardTitle>
          <CardDescription>
            AI-powered suggestions to improve search effectiveness
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : suggestions.length > 0 ? (
            <div className="space-y-4">
              {suggestions.map((suggestion, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Original Query</div>
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {suggestion.originalQuery}
                        </code>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Suggested Query</div>
                        <code className="text-sm bg-primary/10 px-2 py-1 rounded font-medium">
                          {suggestion.suggestedQuery}
                        </code>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <div>
                          <span className="text-muted-foreground">Reason: </span>
                          <span>{suggestion.reason}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {suggestion.expectedImprovement}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onQueryClick?.(suggestion.suggestedQuery)}
                    >
                      Try It
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No suggestions available at this time</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search Effectiveness Over Time */}
      <ChartContainer
        title="Search Effectiveness Over Time"
        description="Success rate and average results per query"
        height={300}
        loading={loading}
        exportable
        expandable
      >
        <div className="flex items-center justify-center h-full text-muted-foreground">
          Chart visualization would go here
        </div>
      </ChartContainer>
    </div>
  )
}
