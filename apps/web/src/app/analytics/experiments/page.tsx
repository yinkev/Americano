/**
 * Personalization Experiments Dashboard
 * Story 5.5 Task 10.5: A/B Testing Framework Dashboard
 *
 * Displays active and completed A/B experiments with variant performance comparison,
 * statistical significance analysis, and manual experiment controls
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ExperimentVariantComparison } from '@/components/analytics/experiments/ExperimentVariantComparison'
import { ExperimentMetricsTable } from '@/components/analytics/experiments/ExperimentMetricsTable'
import { ExperimentControlPanel } from '@/components/analytics/experiments/ExperimentControlPanel'
import {
  FlaskConical,
  TrendingUp,
  Users,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Info,
} from 'lucide-react'

interface PersonalizationExperiment {
  id: string
  name: string
  description: string
  variantA: Record<string, any>
  variantB: Record<string, any>
  startDate: string
  endDate: string | null
  targetUserCount: number
  successMetric: 'retention' | 'performance' | 'satisfaction'
  status: 'active' | 'completed' | 'concluded'
  assignments: ExperimentAssignment[]
  results?: ExperimentResults
}

interface ExperimentAssignment {
  id: string
  userId: string
  variant: 'A' | 'B'
  assignedAt: string
  metrics: Record<string, number>
}

interface ExperimentResults {
  variantAMetrics: {
    retention: number
    performance: number
    satisfaction: number
    sampleSize: number
  }
  variantBMetrics: {
    retention: number
    performance: number
    satisfaction: number
    sampleSize: number
  }
  statistical: {
    pValue: number
    isStatisticallySignificant: boolean
    winningVariant: 'A' | 'B' | 'NONE'
    confidenceLevel: number
  }
  recommendation: string
}

const STATUS_COLORS = {
  active: 'oklch(0.7 0.15 145)',
  completed: 'oklch(0.7 0.15 230)',
  concluded: 'oklch(0.556 0 0)',
}

const METRIC_LABELS = {
  retention: 'Retention Rate',
  performance: 'Performance Improvement',
  satisfaction: 'User Satisfaction',
}

export default function PersonalizationExperimentsDashboardPage() {
  const [experiments, setExperiments] = useState<PersonalizationExperiment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedExperiment, setSelectedExperiment] = useState<PersonalizationExperiment | null>(
    null
  )
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')

  useEffect(() => {
    fetchExperiments()
  }, [])

  async function fetchExperiments() {
    try {
      setLoading(true)
      const response = await fetch('/api/personalization/experiments')
      const result = await response.json()

      if (result.success && result.data.experiments) {
        setExperiments(result.data.experiments)
        if (result.data.experiments.length > 0 && !selectedExperiment) {
          setSelectedExperiment(result.data.experiments[0])
        }
      }
    } catch (error) {
      console.error('Error fetching experiments:', error)
      setExperiments([])
    } finally {
      setLoading(false)
    }
  }

  async function handleConcludeExperiment(experimentId: string, winningVariant: 'A' | 'B') {
    try {
      const response = await fetch(`/api/personalization/experiments/${experimentId}/conclude`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winningVariant }),
      })

      if (response.ok) {
        await fetchExperiments()
      }
    } catch (error) {
      console.error('Error concluding experiment:', error)
    }
  }

  const filteredExperiments = experiments.filter((exp) => {
    if (filter === 'all') return true
    return exp.status === filter
  })

  const activeCount = experiments.filter((e) => e.status === 'active').length
  const completedCount = experiments.filter((e) => e.status === 'completed').length

  if (loading) {
    return (
      <div className="container mx-auto py-8 max-w-7xl">
        <div className="flex items-center justify-center h-96">
          <p className="text-sm text-muted-foreground">Loading experiments...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div>
            <h1 className="text-[28px] md:text-[32px] font-heading font-bold tracking-tight text-foreground flex items-center gap-3 mb-2">
              <FlaskConical className="size-8" style={{ color: 'oklch(0.7 0.15 230)' }} />
              Personalization Experiments
            </h1>
            <p className="text-[15px] text-muted-foreground leading-relaxed">
              A/B testing framework for optimizing personalization strategies
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Active Experiments */}
          <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-xl hover:shadow-[0_12px_40px_rgba(31,38,135,0.15)] transition-all">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div
                  className="p-2 rounded-xl"
                  style={{ backgroundColor: 'oklch(0.7 0.15 145 / 0.15)' }}
                >
                  <Clock className="size-5" style={{ color: 'oklch(0.7 0.15 145)' }} />
                </div>
                <Badge
                  variant="outline"
                  className="px-2 py-1"
                  style={{
                    backgroundColor: 'oklch(0.7 0.15 145 / 0.1)',
                    borderColor: 'oklch(0.7 0.15 145)',
                    color: 'oklch(0.7 0.15 145)',
                  }}
                >
                  Active
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground font-medium mb-1">
                Active Experiments
              </p>
              <p className="text-[24px] font-heading font-bold text-foreground">{activeCount}</p>
              <p className="text-[11px] text-muted-foreground mt-1">Currently running</p>
            </CardContent>
          </Card>

          {/* Completed Experiments */}
          <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-xl hover:shadow-[0_12px_40px_rgba(31,38,135,0.15)] transition-all">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div
                  className="p-2 rounded-xl"
                  style={{ backgroundColor: 'oklch(0.7 0.15 230 / 0.15)' }}
                >
                  <CheckCircle2 className="size-5" style={{ color: 'oklch(0.7 0.15 230)' }} />
                </div>
                <Badge
                  variant="outline"
                  className="px-2 py-1"
                  style={{
                    backgroundColor: 'oklch(0.7 0.15 230 / 0.1)',
                    borderColor: 'oklch(0.7 0.15 230)',
                    color: 'oklch(0.7 0.15 230)',
                  }}
                >
                  Complete
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground font-medium mb-1">
                Completed Experiments
              </p>
              <p className="text-[24px] font-heading font-bold text-foreground">
                {completedCount}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">Awaiting analysis</p>
            </CardContent>
          </Card>

          {/* Total Users */}
          <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-xl hover:shadow-[0_12px_40px_rgba(31,38,135,0.15)] transition-all">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div
                  className="p-2 rounded-xl"
                  style={{ backgroundColor: 'oklch(0.8 0.15 85 / 0.15)' }}
                >
                  <Users className="size-5" style={{ color: 'oklch(0.8 0.15 85)' }} />
                </div>
                <Badge
                  variant="outline"
                  className="px-2 py-1"
                  style={{
                    backgroundColor: 'oklch(0.8 0.15 85 / 0.1)',
                    borderColor: 'oklch(0.8 0.15 85)',
                    color: 'oklch(0.8 0.15 85)',
                  }}
                >
                  Enrolled
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground font-medium mb-1">Total Users</p>
              <p className="text-[24px] font-heading font-bold text-foreground">
                {experiments.reduce((sum, exp) => sum + exp.assignments.length, 0)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">Across all experiments</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      {experiments.length === 0 ? (
        <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-xl">
          <CardContent className="p-12 flex flex-col items-center justify-center">
            <FlaskConical className="size-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No Experiments Running
            </h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
              A/B experiments help optimize personalization strategies by testing different
              approaches with real users. Create your first experiment to start testing.
            </p>
            <Button className="gap-2">
              <FlaskConical className="size-4" />
              Create Experiment
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column: Experiment List */}
          <div className="xl:col-span-1">
            <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-xl">
              <CardHeader>
                <CardTitle className="font-heading font-semibold text-[18px]">
                  Experiments
                </CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    variant={filter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('all')}
                    className="text-xs"
                  >
                    All
                  </Button>
                  <Button
                    variant={filter === 'active' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('active')}
                    className="text-xs"
                  >
                    Active
                  </Button>
                  <Button
                    variant={filter === 'completed' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('completed')}
                    className="text-xs"
                  >
                    Completed
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredExperiments.map((experiment) => {
                  const isSelected = selectedExperiment?.id === experiment.id
                  const statusColor = STATUS_COLORS[experiment.status]

                  return (
                    <div
                      key={experiment.id}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/30 bg-muted/10'
                      }`}
                      onClick={() => setSelectedExperiment(experiment)}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="text-sm font-semibold text-foreground line-clamp-1">
                          {experiment.name}
                        </h4>
                        <Badge
                          variant="outline"
                          className="px-2 py-0 text-xs shrink-0 capitalize"
                          style={{
                            backgroundColor: `${statusColor}/0.1`,
                            borderColor: statusColor,
                            color: statusColor,
                          }}
                        >
                          {experiment.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                        {experiment.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="size-3" />
                          <span>{experiment.assignments.length}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="size-3" />
                          <span>
                            {new Date(experiment.startDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="size-3" />
                          <span className="capitalize">
                            {METRIC_LABELS[experiment.successMetric]}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Experiment Details */}
          <div className="xl:col-span-2 space-y-6">
            {selectedExperiment ? (
              <>
                {/* Experiment Header */}
                <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-xl">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="font-heading font-semibold text-[20px] mb-2">
                          {selectedExperiment.name}
                        </CardTitle>
                        <CardDescription className="text-sm">
                          {selectedExperiment.description}
                        </CardDescription>
                      </div>
                      <Badge
                        variant="outline"
                        className="px-3 py-1.5 text-xs capitalize shrink-0"
                        style={{
                          backgroundColor: `${STATUS_COLORS[selectedExperiment.status]}/0.1`,
                          borderColor: STATUS_COLORS[selectedExperiment.status],
                          color: STATUS_COLORS[selectedExperiment.status],
                        }}
                      >
                        {selectedExperiment.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-muted/20 border border-border">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Start Date</p>
                        <p className="text-sm font-medium">
                          {new Date(selectedExperiment.startDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Target Users</p>
                        <p className="text-sm font-medium">
                          {selectedExperiment.assignments.length} / {selectedExperiment.targetUserCount}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Success Metric</p>
                        <p className="text-sm font-medium capitalize">
                          {METRIC_LABELS[selectedExperiment.successMetric]}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Variant Comparison */}
                {selectedExperiment.results && (
                  <ExperimentVariantComparison
                    experimentId={selectedExperiment.id}
                    results={selectedExperiment.results}
                    successMetric={selectedExperiment.successMetric}
                  />
                )}

                {/* Metrics Table */}
                {selectedExperiment.results && (
                  <ExperimentMetricsTable
                    results={selectedExperiment.results}
                    successMetric={selectedExperiment.successMetric}
                  />
                )}

                {/* Control Panel */}
                {selectedExperiment.status === 'completed' && selectedExperiment.results && (
                  <ExperimentControlPanel
                    experimentId={selectedExperiment.id}
                    results={selectedExperiment.results}
                    onConclude={handleConcludeExperiment}
                  />
                )}

                {/* Active Experiment Info */}
                {selectedExperiment.status === 'active' && (
                  <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-xl">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div
                          className="p-3 rounded-xl shrink-0"
                          style={{ backgroundColor: 'oklch(0.7 0.15 145)/0.15' }}
                        >
                          <Info className="size-6" style={{ color: 'oklch(0.7 0.15 145)' }} />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-base font-semibold text-foreground mb-2">
                            Experiment In Progress
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            This experiment is currently collecting data. Results will be available
                            once the target user count is reached and statistical significance can be
                            calculated. Minimum 20 users per variant and 2 weeks of data are required.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-xl">
                <CardContent className="p-12 flex flex-col items-center justify-center">
                  <Info className="size-12 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Select an experiment to view details
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
