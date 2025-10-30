'use client'

import { Activity, Clock, DollarSign, Target, TrendingUp, Users } from 'lucide-react'
import * as React from 'react'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { DashboardLayout, FilterBar, MetricGrid } from '@/components/layouts'
import {
  ChartContainer,
  EmptyState,
  InsightCard,
  MetricCard,
  StatCard,
  TrendIndicator,
} from '@/components/ui'
import { Button } from '@/components/ui/button'

// Sample data
const chartData = [
  { month: 'Jan', value: 100 },
  { month: 'Feb', value: 120 },
  { month: 'Mar', value: 115 },
  { month: 'Apr', value: 140 },
  { month: 'May', value: 135 },
  { month: 'Jun', value: 160 },
]

const sparklineData = [
  { value: 100 },
  { value: 120 },
  { value: 115 },
  { value: 140 },
  { value: 135 },
  { value: 160 },
]

/**
 * Components Demo Page
 * Showcases all premium UI components with real examples
 */
export default function ComponentsDemo() {
  const [timeRange, setTimeRange] = React.useState('30d')
  const [filters, setFilters] = React.useState<Record<string, string | string[]>>({})
  const [showLoading, setShowLoading] = React.useState(false)
  const [showEmpty, setShowEmpty] = React.useState(false)

  const handleFilterChange = React.useCallback((key: string, value: string | string[]) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleClearFilters = React.useCallback(() => {
    setFilters({})
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Simple header for demo */}
      <header className="border-b bg-background">
        <div className="container flex items-center justify-between py-4">
          <div>
            <h1 className="text-2xl font-bold">Component Library Demo</h1>
            <p className="text-sm text-muted-foreground">
              Premium UI components with Framer Motion animations
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={showLoading ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowLoading(!showLoading)}
            >
              Toggle Loading
            </Button>
            <Button
              variant={showEmpty ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowEmpty(!showEmpty)}
            >
              Toggle Empty
            </Button>
          </div>
        </div>
      </header>

      {/* FilterBar Demo */}
      <FilterBar
        selectedTimeRange={timeRange}
        onTimeRangeChange={setTimeRange}
        filterCategories={[
          {
            label: 'Objectives',
            key: 'objectives',
            options: [
              { label: 'Accuracy', value: 'accuracy', count: 42 },
              { label: 'Speed', value: 'speed', count: 28 },
              { label: 'Retention', value: 'retention', count: 35 },
            ],
            multiSelect: true,
          },
          {
            label: 'Status',
            key: 'status',
            options: [
              { label: 'Active', value: 'active', count: 15 },
              { label: 'Complete', value: 'complete', count: 30 },
            ],
          },
        ]}
        selectedFilters={filters}
        onFilterChange={handleFilterChange}
        onClearAll={handleClearFilters}
        sticky
        stickyTop={0}
      />

      {/* Main Content */}
      <main className="container py-8">
        <div className="space-y-8">
          {/* Section 1: StatCards */}
          <section>
            <h2 className="mb-4 text-xl font-semibold">StatCards</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Total Users"
                sublabel="Active in last 30 days"
                value={1234}
                previousValue={1100}
                trend="up"
                loading={showLoading}
              />
              <StatCard
                label="Revenue"
                sublabel="Monthly recurring"
                value={12345}
                previousValue={12000}
                trend="up"
                formatValue={(v) => `$${v.toLocaleString()}`}
                variant="success"
                loading={showLoading}
              />
              <StatCard
                label="Conversion Rate"
                sublabel="Last 7 days"
                value={3.2}
                percentageChange={5.1}
                trend="up"
                formatValue={(v) => `${v.toFixed(1)}%`}
                variant="primary"
                loading={showLoading}
              />
              <StatCard
                label="Avg Response Time"
                sublabel="P95 latency"
                value={245}
                percentageChange={-8.2}
                trend="down"
                formatValue={(v) => `${v}ms`}
                upIsGood={false}
                variant="warning"
                loading={showLoading}
              />
            </div>
          </section>

          {/* Section 2: TrendIndicators */}
          <section>
            <h2 className="mb-4 text-xl font-semibold">TrendIndicators</h2>
            <div className="flex flex-wrap gap-4 rounded-lg border p-6">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Small:</span>
                <TrendIndicator direction="up" value={12.5} size="sm" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Medium:</span>
                <TrendIndicator direction="up" value={12.5} size="md" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Large:</span>
                <TrendIndicator direction="up" value={12.5} size="lg" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Down (good):</span>
                <TrendIndicator direction="down" value={-5.2} upIsGood={false} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Neutral:</span>
                <TrendIndicator direction="neutral" />
              </div>
            </div>
          </section>

          {/* Section 3: InsightCards */}
          <section>
            <h2 className="mb-4 text-xl font-semibold">InsightCards</h2>
            <div className="space-y-4">
              <InsightCard
                title="Performance Improvement"
                description="Your response time has improved by 20% this week! Keep up the great work."
                priority="success"
                actions={[
                  {
                    label: 'View Details',
                    onClick: () => alert('View details clicked'),
                  },
                ]}
                dismissible
                badge="New"
              />
              <InsightCard
                title="Study Pattern Alert"
                description="You've been studying intensively for 3 hours. Consider taking a break to improve retention."
                priority="warning"
                icon={Clock}
                actions={[
                  {
                    label: 'Take a Break',
                    onClick: () => alert('Break time!'),
                  },
                  {
                    label: 'Remind Me Later',
                    onClick: () => alert('Reminder set'),
                    variant: 'outline',
                  },
                ]}
                timestamp="5 minutes ago"
              />
              <InsightCard
                title="Action Required"
                description="Your subscription expires in 3 days. Renew now to avoid service interruption."
                priority="critical"
                actions={[
                  {
                    label: 'Renew Now',
                    onClick: () => alert('Renew clicked'),
                  },
                ]}
              />
              <InsightCard
                title="New Feature Available"
                description="Check out our new analytics dashboard with advanced filtering capabilities."
                priority="info"
                dismissible
              />
            </div>
          </section>

          {/* Section 4: MetricGrid with MetricCards */}
          <section>
            <h2 className="mb-4 text-xl font-semibold">MetricCards Grid</h2>
            {showEmpty ? (
              <MetricGrid
                columns={3}
                emptyState={{
                  title: 'No metrics available',
                  description: 'Add your first metric to get started',
                  action: {
                    label: 'Add Metric',
                    onClick: () => alert('Add metric clicked'),
                  },
                }}
              >
                {[]}
              </MetricGrid>
            ) : (
              <MetricGrid columns={3} gap="md" stagger loading={showLoading}>
                <MetricCard
                  title="Active Users"
                  value="1,234"
                  trend="up"
                  percentageChange={12.5}
                  description="Last 30 days"
                  icon={<Users className="h-4 w-4" />}
                  status="success"
                  sparklineData={sparklineData}
                />
                <MetricCard
                  title="Revenue"
                  value="$12,345"
                  trend="up"
                  percentageChange={8.2}
                  description="Monthly recurring"
                  icon={<DollarSign className="h-4 w-4" />}
                  status="success"
                />
                <MetricCard
                  title="Conversion Rate"
                  value="3.2%"
                  trend="up"
                  percentageChange={5.1}
                  description="Last 7 days"
                  icon={<Target className="h-4 w-4" />}
                  status="info"
                />
                <MetricCard
                  title="Avg Session Duration"
                  value="8m 42s"
                  trend="down"
                  percentageChange={-2.3}
                  description="Compared to last week"
                  icon={<Clock className="h-4 w-4" />}
                  status="warning"
                />
                <MetricCard
                  title="Active Sessions"
                  value="234"
                  trend="up"
                  percentageChange={15.7}
                  description="Real-time"
                  icon={<Activity className="h-4 w-4" />}
                  status="success"
                />
                <MetricCard
                  title="Growth Rate"
                  value="+23%"
                  trend="up"
                  percentageChange={3.4}
                  description="Month over month"
                  icon={<TrendingUp className="h-4 w-4" />}
                  status="success"
                  sparklineData={sparklineData}
                />
              </MetricGrid>
            )}
          </section>

          {/* Section 5: ChartContainer */}
          <section>
            <h2 className="mb-4 text-xl font-semibold">ChartContainer</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <ChartContainer
                title="Revenue Over Time"
                description="Monthly revenue for the past 6 months"
                exportable
                onExport={() => alert('Export clicked')}
                loading={showLoading}
                empty={showEmpty}
              >
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '0.5rem',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>

              <ChartContainer
                title="User Growth"
                description="New users per month"
                variant="elevated"
                loading={showLoading}
              >
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '0.5rem',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="hsl(var(--chart-1))"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--chart-1))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </section>

          {/* Section 6: EmptyStates */}
          <section>
            <h2 className="mb-4 text-xl font-semibold">EmptyStates</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg border p-4">
                <EmptyState
                  variant="no-data"
                  compact
                  action={{
                    label: 'Refresh',
                    onClick: () => alert('Refresh clicked'),
                  }}
                />
              </div>
              <div className="rounded-lg border p-4">
                <EmptyState
                  variant="no-results"
                  compact
                  action={{
                    label: 'Clear Filters',
                    onClick: () => alert('Clear clicked'),
                  }}
                />
              </div>
              <div className="rounded-lg border p-4">
                <EmptyState
                  variant="error"
                  compact
                  action={{
                    label: 'Try Again',
                    onClick: () => alert('Retry clicked'),
                  }}
                />
              </div>
              <div className="rounded-lg border p-4">
                <EmptyState variant="loading" compact />
              </div>
              <div className="rounded-lg border p-4">
                <EmptyState
                  variant="empty"
                  compact
                  action={{
                    label: 'Get Started',
                    onClick: () => alert('Get started clicked'),
                  }}
                />
              </div>
              <div className="rounded-lg border p-4">
                <EmptyState variant="not-found" compact />
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
