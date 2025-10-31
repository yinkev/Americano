/**
 * InsightsPanel Component
 * Story 2.6 Task 11.3
 *
 * Displays the highest-priority daily insight returned by the analytics API
 * and surfaces whether the data was provided by the live service or mocked.
 */

'use client'

import {
  AlertCircle,
  Clock,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useDailyInsight } from '@/lib/api/hooks'
import { getDataSource } from '@/lib/api/hooks/analytics.shared'

const DEMO_USER_ID = 'user-kevy'

const CATEGORY_META: Record<
  string,
  {
    label: string
    tone: string
    Icon: typeof Sparkles
  }
> = {
  weakness: {
    label: 'Focus Area',
    tone: 'oklch(0.65 0.12 25)',
    Icon: TrendingDown,
  },
  dangerous_gap: {
    label: 'Dangerous Gap',
    tone: 'oklch(0.6 0.16 15)',
    Icon: AlertCircle,
  },
  bottleneck: {
    label: 'Bottleneck',
    tone: 'oklch(0.6 0.1 40)',
    Icon: AlertCircle,
  },
  opportunity: {
    label: 'Opportunity',
    tone: 'oklch(0.7 0.12 140)',
    Icon: TrendingUp,
  },
  optimization: {
    label: 'Optimization',
    tone: 'oklch(0.68 0.1 110)',
    Icon: Target,
  },
}

export function InsightsPanel() {
  const {
    data: insight,
    isLoading,
    isRefetching,
    error,
    refetch,
  } = useDailyInsight(DEMO_USER_ID)

  const source = getDataSource(insight)

  const category = useMemo(() => {
    if (!insight || typeof insight.insight_category !== 'string') {
      return {
        label: 'Insight',
        tone: 'oklch(0.68 0.09 230)',
        Icon: Sparkles,
      }
    }
    const key = insight.insight_category.toLowerCase()
    return CATEGORY_META[key] ?? {
      label: insight.insight_category.replaceAll('_', ' '),
      tone: 'oklch(0.68 0.09 230)',
      Icon: Sparkles,
    }
  }, [insight])

  if (isLoading) {
    return (
      <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)]">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3" />
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-2/3" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)]">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-destructive/10 p-2">
              <AlertCircle className="size-5 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-lg font-heading">Mission Insights</CardTitle>
              <p className="text-xs text-muted-foreground">Unable to load insight data</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : 'An unexpected error occurred.'}
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!insight) {
    return (
      <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)]">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-[oklch(0.7_0.15_230)]/10 p-2">
              <Sparkles className="size-5 text-[oklch(0.7_0.15_230)]" />
            </div>
            <div>
              <CardTitle className="text-lg font-heading">Mission Insights</CardTitle>
              <p className="text-xs text-muted-foreground">No daily insight available yet</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center">
            Complete more missions to unlock personalized recommendations.
          </p>
        </CardContent>
      </Card>
    )
  }

  const generatedAt = insight.generated_at ? new Date(insight.generated_at) : undefined
  const actionItems = Array.isArray(insight.action_items)
    ? Array.from(insight.action_items)
    : []
  const InsightIcon = category.Icon

  return (
    <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)]">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-[oklch(0.7_0.15_230)]/10 p-2">
              <Sparkles className="size-5 text-[oklch(0.7_0.15_230)]" />
            </div>
            <div>
              <CardTitle className="text-lg font-heading">Today&apos;s Mission Insight</CardTitle>
              <p className="text-xs text-muted-foreground">
                {generatedAt
                  ? `Generated at ${generatedAt.toLocaleTimeString()}`
                  : 'Fresh insight ready'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {source === 'mock' && (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                Mock data
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void refetch()}
              disabled={isRefetching}
              className="text-[oklch(0.7_0.15_230)] hover:text-[oklch(0.65_0.15_230)]"
            >
              {isRefetching ? 'Refreshing…' : 'Refresh'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex flex-col gap-5">
          <div className="flex items-start gap-4">
            <div
              className="rounded-xl p-3"
              style={{ backgroundColor: `${category.tone}/0.12`, color: category.tone }}
            >
              <InsightIcon className="size-6" aria-hidden="true" />
            </div>
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="secondary"
                  className="text-xs"
                  style={{
                    backgroundColor: `${category.tone}/0.12`,
                    color: category.tone,
                  }}
                >
                  {category.label}
                </Badge>
                <Badge variant="outline" className="text-xs font-medium">
                  {insight.priority_objective_name}
                </Badge>
              </div>
              <div>
                <h3 className="font-heading text-base">{insight.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="size-4" aria-hidden="true" />
                  <span>{insight.estimated_time_minutes} minutes suggested</span>
                </div>
              </div>
            </div>
          </div>

          {actionItems.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Action Plan
              </p>
              <ul className="space-y-2">
                {actionItems.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-foreground">
                    <span className="mt-[6px] size-1.5 rounded-full bg-[oklch(0.7_0.15_230)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
