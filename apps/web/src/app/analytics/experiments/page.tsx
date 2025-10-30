/**
 * A/B Testing Experiments Dashboard
 * Agent 10: Experiments & Personalization
 *
 * Complete A/B testing dashboard with:
 * - Experiment list with filtering
 * - Variant performance comparison
 * - Statistical significance analysis
 * - Winner declaration interface
 * - Experiment creation wizard
 */

'use client'

import {
  Calendar,
  CheckCircle2,
  Clock,
  FlaskConical,
  Info,
  Plus,
  TrendingUp,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  ExperimentControlPanel,
  ExperimentMetricsTable,
  ExperimentVariantComparison,
} from '@/features/analytics/components/experiments'

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

interface Experiment {
  id: string
  name: string
  description: string
  hypothesis: string
  variantA: {
    name: string
    description: string
    config: Record<string, any>
  }
  variantB: {
    name: string
    description: string
    config: Record<string, any>
  }
  startDate: string
  endDate: string | null
  targetUserCount: number
  currentUserCount: number
  successMetric: 'retention' | 'performance' | 'satisfaction'
  status: 'draft' | 'active' | 'completed' | 'concluded'
  results?: ExperimentResults
  createdAt: string
}

const STATUS_COLORS = {
  draft: 'oklch(0.556 0 0)',
  active: 'oklch(0.7 0.15 145)',
  completed: 'oklch(0.7 0.15 230)',
  concluded: 'oklch(0.8 0.15 85)',
}

const METRIC_LABELS = {
  retention: 'Retention Rate',
  performance: 'Performance Score',
  satisfaction: 'User Satisfaction',
}

// Mock data generator
function generateMockExperiments(): Experiment[] {
  return [
    {
      id: 'exp-001',
      name: 'Spaced Repetition Timing Optimization',
      description: 'Testing optimal spacing intervals for card reviews to maximize retention',
      hypothesis:
        'Increasing spacing intervals by 20% will improve long-term retention without affecting short-term performance',
      variantA: {
        name: 'Current Timing (Control)',
        description: 'Standard spacing: 1d, 3d, 7d, 14d, 30d',
        config: { intervals: [1, 3, 7, 14, 30] },
      },
      variantB: {
        name: 'Extended Timing (Test)',
        description: 'Extended spacing: 1d, 4d, 9d, 18d, 36d',
        config: { intervals: [1, 4, 9, 18, 36] },
      },
      startDate: '2025-10-15',
      endDate: null,
      targetUserCount: 200,
      currentUserCount: 156,
      successMetric: 'retention',
      status: 'completed',
      results: {
        variantAMetrics: {
          retention: 78.5,
          performance: 82.3,
          satisfaction: 4.2,
          sampleSize: 78,
        },
        variantBMetrics: {
          retention: 85.2,
          performance: 79.8,
          satisfaction: 4.4,
          sampleSize: 78,
        },
        statistical: {
          pValue: 0.0234,
          isStatisticallySignificant: true,
          winningVariant: 'B',
          confidenceLevel: 95,
        },
        recommendation:
          'Roll out Variant B (Extended Timing). Shows 6.7% improvement in retention with statistical significance (p=0.023).',
      },
      createdAt: '2025-10-10',
    },
    {
      id: 'exp-002',
      name: 'Mission Difficulty Adaptation',
      description: 'Testing adaptive difficulty vs fixed difficulty for daily missions',
      hypothesis:
        'Adaptive difficulty based on recent performance will improve engagement and reduce frustration',
      variantA: {
        name: 'Fixed Difficulty',
        description: 'Standard mission difficulty progression',
        config: { adaptiveDifficulty: false },
      },
      variantB: {
        name: 'Adaptive Difficulty',
        description: 'AI-adjusted difficulty based on user performance',
        config: { adaptiveDifficulty: true, adaptationRate: 0.2 },
      },
      startDate: '2025-10-20',
      endDate: null,
      targetUserCount: 150,
      currentUserCount: 89,
      successMetric: 'satisfaction',
      status: 'active',
      createdAt: '2025-10-18',
    },
    {
      id: 'exp-003',
      name: 'Content Format: Text vs Video',
      description: 'Comparing learning outcomes between text-based and video-based explanations',
      hypothesis:
        'Video-based explanations will improve comprehension for visual learners without hurting overall performance',
      variantA: {
        name: 'Text Explanations',
        description: 'Traditional text-based explanations with diagrams',
        config: { format: 'text' },
      },
      variantB: {
        name: 'Video Explanations',
        description: 'Short video explanations with interactive elements',
        config: { format: 'video' },
      },
      startDate: '2025-09-25',
      endDate: '2025-10-25',
      targetUserCount: 250,
      currentUserCount: 250,
      successMetric: 'performance',
      status: 'completed',
      results: {
        variantAMetrics: {
          retention: 76.8,
          performance: 84.2,
          satisfaction: 4.1,
          sampleSize: 125,
        },
        variantBMetrics: {
          retention: 75.3,
          performance: 81.5,
          satisfaction: 4.5,
          sampleSize: 125,
        },
        statistical: {
          pValue: 0.1823,
          isStatisticallySignificant: false,
          winningVariant: 'NONE',
          confidenceLevel: 82,
        },
        recommendation:
          'No clear winner. Consider running a longer experiment or segmenting by learning style.',
      },
      createdAt: '2025-09-20',
    },
    {
      id: 'exp-004',
      name: 'Gamification: Badges vs Points',
      description: 'Testing different gamification approaches for engagement',
      hypothesis: 'Achievement badges will drive more consistent engagement than point systems',
      variantA: {
        name: 'Points System',
        description: 'Earn points for activities, unlock rewards',
        config: { gamification: 'points' },
      },
      variantB: {
        name: 'Badge System',
        description: 'Collect achievement badges, track milestones',
        config: { gamification: 'badges' },
      },
      startDate: '2025-11-01',
      endDate: null,
      targetUserCount: 300,
      currentUserCount: 45,
      successMetric: 'retention',
      status: 'active',
      createdAt: '2025-10-28',
    },
  ]
}

export default function ExperimentsDashboardPage() {
  const [experiments, setExperiments] = useState<Experiment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newExperiment, setNewExperiment] = useState({
    name: '',
    description: '',
    hypothesis: '',
    successMetric: 'retention' as 'retention' | 'performance' | 'satisfaction',
    targetUserCount: 100,
  })

  useEffect(() => {
    fetchExperiments()
  }, [])

  async function fetchExperiments() {
    try {
      setLoading(true)
      // In production, fetch from API
      // const response = await fetch('/api/analytics/experiments')
      // const result = await response.json()

      // For now, use mock data
      await new Promise((resolve) => setTimeout(resolve, 500))
      const mockExperiments = generateMockExperiments()
      setExperiments(mockExperiments)

      if (mockExperiments.length > 0 && !selectedExperiment) {
        setSelectedExperiment(mockExperiments[0])
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
      // In production, call API
      // await fetch(`/api/analytics/experiments/${experimentId}/conclude`, {
      //   method: 'POST',
      //   body: JSON.stringify({ winningVariant }),
      // })

      await new Promise((resolve) => setTimeout(resolve, 1000))
      await fetchExperiments()
    } catch (error) {
      console.error('Error concluding experiment:', error)
    }
  }

  async function handleCreateExperiment() {
    try {
      // In production, call API
      // await fetch('/api/analytics/experiments', {
      //   method: 'POST',
      //   body: JSON.stringify(newExperiment),
      // })

      await new Promise((resolve) => setTimeout(resolve, 500))
      setShowCreateDialog(false)
      setNewExperiment({
        name: '',
        description: '',
        hypothesis: '',
        successMetric: 'retention',
        targetUserCount: 100,
      })
      await fetchExperiments()
    } catch (error) {
      console.error('Error creating experiment:', error)
    }
  }

  const filteredExperiments = experiments.filter((exp) => {
    if (filter === 'all') return true
    return exp.status === filter
  })

  const activeCount = experiments.filter((e) => e.status === 'active').length
  const completedCount = experiments.filter((e) => e.status === 'completed').length
  const conclusiveResults = experiments.filter(
    (e) => e.results?.statistical.isStatisticallySignificant,
  ).length

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
              A/B Testing Experiments
            </h1>
            <p className="text-[15px] text-muted-foreground leading-relaxed">
              Test and optimize learning strategies with data-driven experimentation
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
            <Plus className="size-4" />
            New Experiment
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div
                  className="p-2 rounded-xl"
                  style={{ backgroundColor: 'oklch(0.7 0.15 145 / 0.15)' }}
                >
                  <Clock className="size-5" style={{ color: 'oklch(0.7 0.15 145)' }} />
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground font-medium mb-1">
                Active Experiments
              </p>
              <p className="text-[24px] font-heading font-bold text-foreground">{activeCount}</p>
              <p className="text-[11px] text-muted-foreground mt-1">Currently running</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div
                  className="p-2 rounded-xl"
                  style={{ backgroundColor: 'oklch(0.7 0.15 230 / 0.15)' }}
                >
                  <CheckCircle2 className="size-5" style={{ color: 'oklch(0.7 0.15 230)' }} />
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground font-medium mb-1">
                Awaiting Analysis
              </p>
              <p className="text-[24px] font-heading font-bold text-foreground">{completedCount}</p>
              <p className="text-[11px] text-muted-foreground mt-1">Ready to conclude</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div
                  className="p-2 rounded-xl"
                  style={{ backgroundColor: 'oklch(0.8 0.15 85 / 0.15)' }}
                >
                  <TrendingUp className="size-5" style={{ color: 'oklch(0.8 0.15 85)' }} />
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground font-medium mb-1">
                Significant Results
              </p>
              <p className="text-[24px] font-heading font-bold text-foreground">
                {conclusiveResults}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                of {experiments.length} experiments
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div
                  className="p-2 rounded-xl"
                  style={{ backgroundColor: 'oklch(0.7 0.15 230 / 0.15)' }}
                >
                  <Users className="size-5" style={{ color: 'oklch(0.7 0.15 230)' }} />
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground font-medium mb-1">
                Total Participants
              </p>
              <p className="text-[24px] font-heading font-bold text-foreground">
                {experiments.reduce((sum, exp) => sum + exp.currentUserCount, 0)}
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
            <h3 className="text-lg font-semibold text-foreground mb-2">No Experiments Yet</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
              A/B experiments help you test and validate learning strategies with real data. Create
              your first experiment to start optimizing the learning experience.
            </p>
            <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
              <Plus className="size-4" />
              Create First Experiment
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
                  All Experiments
                </CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    variant={filter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('all')}
                    className="text-xs"
                  >
                    All ({experiments.length})
                  </Button>
                  <Button
                    variant={filter === 'active' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('active')}
                    className="text-xs"
                  >
                    Active ({activeCount})
                  </Button>
                  <Button
                    variant={filter === 'completed' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('completed')}
                    className="text-xs"
                  >
                    Completed ({completedCount})
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredExperiments.map((experiment) => {
                  const isSelected = selectedExperiment?.id === experiment.id
                  const statusColor = STATUS_COLORS[experiment.status]
                  const progress = (experiment.currentUserCount / experiment.targetUserCount) * 100

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
                        <h4 className="text-sm font-semibold text-foreground line-clamp-2">
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

                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                          <span>Progress</span>
                          <span>
                            {experiment.currentUserCount}/{experiment.targetUserCount} users
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min(progress, 100)}%`,
                              backgroundColor: statusColor,
                            }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
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
                        <CardDescription className="text-sm mb-3">
                          {selectedExperiment.description}
                        </CardDescription>
                        <div className="p-3 rounded-xl bg-muted/20 border border-border">
                          <p className="text-xs text-muted-foreground mb-1 font-semibold">
                            Hypothesis
                          </p>
                          <p className="text-sm text-foreground">{selectedExperiment.hypothesis}</p>
                        </div>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Variant A */}
                      <div className="p-4 rounded-xl border border-border bg-muted/10">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-semibold">
                            A
                          </div>
                          <h4 className="text-sm font-semibold text-foreground">
                            {selectedExperiment.variantA.name}
                          </h4>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {selectedExperiment.variantA.description}
                        </p>
                      </div>

                      {/* Variant B */}
                      <div className="p-4 rounded-xl border border-border bg-muted/10">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="px-2 py-0.5 rounded bg-secondary/10 text-secondary text-xs font-semibold">
                            B
                          </div>
                          <h4 className="text-sm font-semibold text-foreground">
                            {selectedExperiment.variantB.name}
                          </h4>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {selectedExperiment.variantB.description}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-muted/20 border border-border mt-4">
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
                        <p className="text-xs text-muted-foreground mb-1">Participants</p>
                        <p className="text-sm font-medium">
                          {selectedExperiment.currentUserCount} /{' '}
                          {selectedExperiment.targetUserCount}
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

                {/* Results Section */}
                {selectedExperiment.results ? (
                  <>
                    <ExperimentVariantComparison
                      experimentId={selectedExperiment.id}
                      results={selectedExperiment.results}
                      successMetric={selectedExperiment.successMetric}
                    />

                    <ExperimentMetricsTable
                      results={selectedExperiment.results}
                      successMetric={selectedExperiment.successMetric}
                    />

                    {selectedExperiment.status === 'completed' && (
                      <ExperimentControlPanel
                        experimentId={selectedExperiment.id}
                        results={selectedExperiment.results}
                        onConclude={handleConcludeExperiment}
                      />
                    )}
                  </>
                ) : (
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
                          <p className="text-sm text-muted-foreground mb-3">
                            This experiment is currently collecting data. Results will be available
                            once the target user count is reached and statistical significance can
                            be calculated.
                          </p>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <div className="size-2 rounded-full bg-green-500" />
                              <span className="text-muted-foreground">
                                Minimum sample size: 20 users per variant
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="size-2 rounded-full bg-green-500" />
                              <span className="text-muted-foreground">
                                Minimum duration: 2 weeks
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="size-2 rounded-full bg-yellow-500" />
                              <span className="text-muted-foreground">
                                Current progress:{' '}
                                {(
                                  (selectedExperiment.currentUserCount /
                                    selectedExperiment.targetUserCount) *
                                  100
                                ).toFixed(0)}
                                %
                              </span>
                            </div>
                          </div>
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

      {/* Create Experiment Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Experiment</DialogTitle>
            <DialogDescription>
              Set up an A/B test to optimize learning strategies
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Experiment Name</Label>
              <Input
                id="name"
                placeholder="e.g., Spaced Repetition Timing Optimization"
                value={newExperiment.name}
                onChange={(e) => setNewExperiment({ ...newExperiment, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of what you're testing"
                value={newExperiment.description}
                onChange={(e) =>
                  setNewExperiment({ ...newExperiment, description: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hypothesis">Hypothesis</Label>
              <Textarea
                id="hypothesis"
                placeholder="What outcome do you expect from this experiment?"
                value={newExperiment.hypothesis}
                onChange={(e) => setNewExperiment({ ...newExperiment, hypothesis: e.target.value })}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="metric">Success Metric</Label>
                <Select
                  value={newExperiment.successMetric}
                  onValueChange={(value: 'retention' | 'performance' | 'satisfaction') =>
                    setNewExperiment({ ...newExperiment, successMetric: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="retention">Retention Rate</SelectItem>
                    <SelectItem value="performance">Performance Score</SelectItem>
                    <SelectItem value="satisfaction">User Satisfaction</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="users">Target User Count</Label>
                <Input
                  id="users"
                  type="number"
                  min={40}
                  step={10}
                  value={newExperiment.targetUserCount}
                  onChange={(e) =>
                    setNewExperiment({
                      ...newExperiment,
                      targetUserCount: parseInt(e.target.value) || 100,
                    })
                  }
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-muted/20 border border-border">
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold">Note:</span> After creating the experiment, you'll
                configure Variant A (control) and Variant B (test) settings on the next screen.
                Minimum 20 users per variant required for statistical significance.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateExperiment}
              disabled={!newExperiment.name || !newExperiment.description}
            >
              Create Experiment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
