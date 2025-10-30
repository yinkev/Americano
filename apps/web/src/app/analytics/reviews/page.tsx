/**
 * Spaced Repetition Review Analytics Dashboard
 * Agent 8: Cognitive Health Suite - Story 5.4 Task 8
 *
 * Premium analytics dashboard for spaced repetition review patterns:
 * - Review performance metrics with recharts visualization
 * - Card performance analysis (retention rates, difficulty progression)
 * - Review history timeline (7-day, 30-day views)
 * - Next review schedule calendar
 * - Optimization suggestions based on forgetting curves
 * - Interactive filters (card type, date range, status)
 * - CSV export functionality
 * - Real-time updates every 30s
 * - Toast notifications for insights
 *
 * Design: Next.js 15 App Router, Client Component with URL sync
 * Mock data: Realistic review metrics for demo
 */

'use client'

import { format, subDays } from 'date-fns'
import { Download, Filter, RefreshCw, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer } from '@/components/ui/chart-container'
import { MetricCard } from '@/components/ui/metric-card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Types
interface ReviewMetrics {
  totalReviews: number
  correctReviews: number
  retention: number
  averageInterval: number
  cardsLearning: number
  cardsMature: number
  nextReviewCount: number
  averageEaseFactor: number
}

interface ReviewHistoryPoint {
  date: string
  reviewed: number
  correct: number
  retention: number
}

interface CardPerformance {
  cardId: string
  front: string
  totalReviews: number
  correctReviews: number
  retention: number
  currentInterval: number
  easeFactor: number
  nextReview: string
  difficulty: 'easy' | 'medium' | 'hard'
}

interface ReviewSchedule {
  date: string
  count: number
  type: 'learning' | 'review' | 'relearning'
}

// Mock data generators
function generateMockMetrics(): ReviewMetrics {
  return {
    totalReviews: 847,
    correctReviews: 721,
    retention: 85.1,
    averageInterval: 12.3,
    cardsLearning: 23,
    cardsMature: 156,
    nextReviewCount: 34,
    averageEaseFactor: 2.4,
  }
}

function generateMockHistory(days: number): ReviewHistoryPoint[] {
  const history: ReviewHistoryPoint[] = []
  for (let i = days - 1; i >= 0; i--) {
    const date = format(subDays(new Date(), i), 'MMM dd')
    const reviewed = Math.floor(Math.random() * 50) + 20
    const correct = Math.floor(reviewed * (0.75 + Math.random() * 0.2))
    history.push({
      date,
      reviewed,
      correct,
      retention: Math.round((correct / reviewed) * 100 * 10) / 10,
    })
  }
  return history
}

function generateMockCardPerformance(): CardPerformance[] {
  const difficulties: Array<'easy' | 'medium' | 'hard'> = ['easy', 'medium', 'hard']
  const cards: CardPerformance[] = []

  const cardFronts = [
    'What is the mechanism of action of ACE inhibitors?',
    'Define: Cardiac output',
    'Explain: Renin-Angiotensin-Aldosterone System',
    'What are the contraindications for beta-blockers?',
    'Describe: Left ventricular hypertrophy',
    'What is the Frank-Starling mechanism?',
    'Define: Ejection fraction',
    'Explain: Myocardial infarction pathophysiology',
  ]

  for (let i = 0; i < 8; i++) {
    const totalReviews = Math.floor(Math.random() * 20) + 5
    const correctReviews = Math.floor(totalReviews * (0.6 + Math.random() * 0.35))
    const retention = Math.round((correctReviews / totalReviews) * 100 * 10) / 10

    cards.push({
      cardId: `card_${i + 1}`,
      front: cardFronts[i],
      totalReviews,
      correctReviews,
      retention,
      currentInterval: Math.floor(Math.random() * 30) + 1,
      easeFactor: Math.round((2.0 + Math.random() * 0.8) * 10) / 10,
      nextReview: format(subDays(new Date(), -Math.floor(Math.random() * 7)), 'yyyy-MM-dd'),
      difficulty: difficulties[Math.floor(Math.random() * 3)],
    })
  }

  return cards.sort((a, b) => b.totalReviews - a.totalReviews)
}

function generateMockSchedule(): ReviewSchedule[] {
  const schedule: ReviewSchedule[] = []
  const types: Array<'learning' | 'review' | 'relearning'> = ['learning', 'review', 'relearning']

  for (let i = 0; i < 14; i++) {
    schedule.push({
      date: format(subDays(new Date(), -i), 'MMM dd'),
      count: Math.floor(Math.random() * 40) + 5,
      type: types[Math.floor(Math.random() * 3)],
    })
  }

  return schedule
}

export default function ReviewAnalyticsPage() {
  const [metrics, setMetrics] = useState<ReviewMetrics | null>(null)
  const [history, setHistory] = useState<ReviewHistoryPoint[]>([])
  const [cardPerformance, setCardPerformance] = useState<CardPerformance[]>([])
  const [schedule, setSchedule] = useState<ReviewSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d'>('7d')
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>(
    'all',
  )
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  // Load data
  const loadData = () => {
    setLoading(true)
    setTimeout(() => {
      setMetrics(generateMockMetrics())
      setHistory(generateMockHistory(timeRange === '7d' ? 7 : 30))
      setCardPerformance(generateMockCardPerformance())
      setSchedule(generateMockSchedule())
      setLastUpdate(new Date())
      setLoading(false)

      // Show insight notification if retention dropped
      const currentRetention = generateMockMetrics().retention
      if (currentRetention < 80) {
        toast.warning('Review retention below target', {
          description: `Current retention: ${currentRetention.toFixed(1)}%. Consider increasing review frequency.`,
        })
      }
    }, 800)
  }

  useEffect(() => {
    loadData()
  }, [timeRange])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadData()
    }, 30000)

    return () => clearInterval(interval)
  }, [timeRange])

  // Export to CSV
  const exportToCSV = () => {
    const csvContent = [
      ['Date', 'Reviewed', 'Correct', 'Retention (%)'],
      ...history.map((row) => [row.date, row.reviewed, row.correct, row.retention]),
    ]
      .map((row) => row.join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `review-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success('CSV exported successfully')
  }

  // Filter card performance
  const filteredCards =
    difficultyFilter === 'all'
      ? cardPerformance
      : cardPerformance.filter((card) => card.difficulty === difficultyFilter)

  if (loading && !metrics) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl py-8">
          <Skeleton className="h-20 w-full mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl py-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1">
              <div
                className="p-3 rounded-xl shrink-0"
                style={{ backgroundColor: 'oklch(0.95 0.12 280 / 0.5)' }}
              >
                <TrendingUp className="size-8" style={{ color: 'oklch(0.65 0.18 280)' }} />
              </div>
              <div className="flex-1">
                <h1 className="text-[28px] md:text-[32px] font-heading font-bold tracking-tight text-foreground mb-2">
                  Review Analytics Dashboard
                </h1>
                <p className="text-[15px] text-muted-foreground max-w-2xl leading-relaxed">
                  Track your spaced repetition performance, optimize review schedules, and identify
                  cards that need attention. Data-driven insights for effective long-term retention.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={exportToCSV}>
                <Download className="size-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="ghost" size="sm" onClick={loadData}>
                <RefreshCw className="size-4" />
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4 mt-6">
            <div className="flex items-center gap-2">
              <Filter className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters:</span>
            </div>

            <Select value={timeRange} onValueChange={(val) => setTimeRange(val as '7d' | '30d')}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={difficultyFilter}
              onValueChange={(val) => setDifficultyFilter(val as typeof difficultyFilter)}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All difficulties</SelectItem>
                <SelectItem value="easy">Easy only</SelectItem>
                <SelectItem value="medium">Medium only</SelectItem>
                <SelectItem value="hard">Hard only</SelectItem>
              </SelectContent>
            </Select>

            <span className="text-xs text-muted-foreground ml-auto">
              Last updated: {format(lastUpdate, 'h:mm:ss a')}
            </span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl py-8">
        {/* Metrics cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Reviews"
            value={metrics?.totalReviews || 0}
            trend="up"
            percentageChange={12.5}
            description={`${metrics?.correctReviews || 0} correct`}
            status="info"
          />
          <MetricCard
            title="Retention Rate"
            value={`${metrics?.retention.toFixed(1)}%`}
            trend={metrics && metrics.retention >= 80 ? 'up' : 'down'}
            percentageChange={3.2}
            description="Target: 80%+"
            status={metrics && metrics.retention >= 80 ? 'success' : 'warning'}
            upIsGood
          />
          <MetricCard
            title="Average Interval"
            value={`${metrics?.averageInterval.toFixed(1)} days`}
            trend="up"
            percentageChange={8.1}
            description="Between reviews"
            status="default"
          />
          <MetricCard
            title="Next Reviews"
            value={metrics?.nextReviewCount || 0}
            description="Due in next 24h"
            status="info"
          />
        </div>

        {/* Charts */}
        <Tabs defaultValue="history" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="history">Review History</TabsTrigger>
            <TabsTrigger value="cards">Card Performance</TabsTrigger>
            <TabsTrigger value="schedule">Review Schedule</TabsTrigger>
          </TabsList>

          {/* Review History Tab */}
          <TabsContent value="history" className="space-y-6">
            <ChartContainer
              title="Review Performance Over Time"
              description="Track daily review count and retention rate"
              height={400}
              variant="elevated"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="date" style={{ fontSize: '12px' }} />
                  <YAxis yAxisId="left" style={{ fontSize: '12px' }} />
                  <YAxis yAxisId="right" orientation="right" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      borderRadius: '8px',
                      border: '1px solid rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Legend />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="reviewed"
                    stroke="oklch(0.65 0.18 280)"
                    fill="oklch(0.65 0.18 280 / 0.2)"
                    name="Reviews"
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="retention"
                    stroke="oklch(0.7 0.15 145)"
                    fill="oklch(0.7 0.15 145 / 0.2)"
                    name="Retention %"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>

            {/* Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Learning Cards</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold" style={{ color: 'oklch(0.65 0.18 280)' }}>
                    {metrics?.cardsLearning}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Currently being learned</p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Mature Cards</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold" style={{ color: 'oklch(0.7 0.15 145)' }}>
                    {metrics?.cardsMature}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Interval 21+ days</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Card Performance Tab */}
          <TabsContent value="cards" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-sm">
              <CardHeader>
                <CardTitle>Card Performance Analysis</CardTitle>
                <CardDescription>
                  {difficultyFilter === 'all'
                    ? 'All cards sorted by review count'
                    : `${difficultyFilter.charAt(0).toUpperCase() + difficultyFilter.slice(1)} difficulty cards`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredCards.map((card) => (
                    <div
                      key={card.cardId}
                      className="p-4 rounded-lg border bg-white/50 hover:bg-white/80 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge
                              variant="outline"
                              className={
                                card.difficulty === 'easy'
                                  ? 'bg-green-500/10 text-green-700 border-green-500/20'
                                  : card.difficulty === 'medium'
                                    ? 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20'
                                    : 'bg-red-500/10 text-red-700 border-red-500/20'
                              }
                            >
                              {card.difficulty}
                            </Badge>
                            <span className="text-sm font-medium truncate">{card.front}</span>
                          </div>
                          <div className="grid grid-cols-4 gap-4 text-xs">
                            <div>
                              <div className="text-muted-foreground">Reviews</div>
                              <div className="font-semibold">{card.totalReviews}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Retention</div>
                              <div
                                className="font-semibold"
                                style={{
                                  color:
                                    card.retention >= 80
                                      ? 'oklch(0.7 0.15 145)'
                                      : 'oklch(0.7 0.15 50)',
                                }}
                              >
                                {card.retention.toFixed(1)}%
                              </div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Interval</div>
                              <div className="font-semibold">{card.currentInterval}d</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Next Review</div>
                              <div className="font-semibold">
                                {format(new Date(card.nextReview), 'MMM dd')}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Review Schedule Tab */}
          <TabsContent value="schedule" className="space-y-6">
            <ChartContainer
              title="Upcoming Review Schedule"
              description="Next 14 days of scheduled reviews"
              height={400}
              variant="elevated"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={schedule}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="date" style={{ fontSize: '12px' }} />
                  <YAxis style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      borderRadius: '8px',
                      border: '1px solid rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="count" fill="oklch(0.65 0.18 280)" name="Reviews Due" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>

            {/* Optimization Suggestions */}
            <Card
              className="border-l-4"
              style={{
                backgroundColor: 'oklch(0.65 0.18 240 / 0.08)',
                borderLeftColor: 'oklch(0.65 0.18 240)',
              }}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Optimization Suggestions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm">
                  <div className="font-semibold mb-1">Review Load Distribution</div>
                  <p className="text-muted-foreground text-xs">
                    Your review schedule is well-balanced. Consider reviewing earlier in the day for
                    better retention.
                  </p>
                </div>
                <div className="text-sm">
                  <div className="font-semibold mb-1">Ease Factor Adjustment</div>
                  <p className="text-muted-foreground text-xs">
                    Average ease factor ({metrics?.averageEaseFactor.toFixed(1)}) is healthy. Cards
                    with retention 90%+ can have longer intervals.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
