'use client'

import { motion } from 'motion/react'
import { useMemo, useState } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { applyChartTheme, chartTheme } from '@/lib/chart-theme'
import { usePersonalStore } from '@/stores/personal'

// Mock Data Types
interface IRTDataPoint {
  question_number: number
  theta: number
  theta_ci_lower: number
  theta_ci_upper: number
  difficulty: number
  timestamp: string
}

interface EfficiencyMetrics {
  questions_answered: number
  target_questions: number
  efficiency_score: number
  time_saved_minutes: number
}

interface SessionSummary {
  session_id: string
  objective_name: string
  final_theta: number
  questions_answered: number
  duration_minutes: number
  date: string
}

// Mock Data Generator
function generateMockIRTData(): IRTDataPoint[] {
  const data: IRTDataPoint[] = []
  let theta = 0

  for (let i = 1; i <= 12; i++) {
    // Simulate IRT convergence
    const noise = (Math.random() - 0.5) * 0.3
    theta += noise
    theta = Math.max(-3, Math.min(3, theta)) // Clamp to -3 to 3

    // Confidence interval narrows as more questions answered
    const ci_width = 1.5 / Math.sqrt(i)

    data.push({
      question_number: i,
      theta: Number(theta.toFixed(2)),
      theta_ci_lower: Number((theta - ci_width).toFixed(2)),
      theta_ci_upper: Number((theta + ci_width).toFixed(2)),
      difficulty: Number((theta + (Math.random() - 0.5) * 0.5).toFixed(2)),
      timestamp: new Date(Date.now() - (12 - i) * 60000).toISOString(),
    })
  }

  return data
}

function generateMockEfficiencyMetrics(): EfficiencyMetrics {
  return {
    questions_answered: 12,
    target_questions: 20,
    efficiency_score: 85,
    time_saved_minutes: 15,
  }
}

function generateMockSessionHistory(): SessionSummary[] {
  const objectives = [
    'Cardiovascular Physiology',
    'Respiratory System',
    'Renal Pathology',
    'Pharmacology',
  ]

  return Array.from({ length: 8 }, (_, i) => ({
    session_id: `session_${i + 1}`,
    objective_name: objectives[i % objectives.length],
    final_theta: Number((Math.random() * 2 - 1).toFixed(2)),
    questions_answered: Math.floor(Math.random() * 8) + 8,
    duration_minutes: Math.floor(Math.random() * 20) + 15,
    date: new Date(Date.now() - (7 - i) * 86400000).toISOString().split('T')[0],
  }))
}

export default function AdaptiveAnalyticsPage() {
  const { timeRange, objectiveId, setTimeRange, setObjectiveId } = usePersonalStore()
  const [isExporting, setIsExporting] = useState(false)

  // Mock data hooks (in production, use useSessionMetrics)
  const irtData = useMemo(() => generateMockIRTData(), [])
  const efficiencyMetrics = useMemo(() => generateMockEfficiencyMetrics(), [])
  const sessionHistory = useMemo(() => generateMockSessionHistory(), [])

  const handleExport = () => {
    setIsExporting(true)
    setTimeout(() => {
      // Generate CSV
      const csvContent = [
        ['Question', 'Theta', 'CI Lower', 'CI Upper', 'Difficulty', 'Timestamp'],
        ...irtData.map((d) => [
          d.question_number,
          d.theta,
          d.theta_ci_lower,
          d.theta_ci_upper,
          d.difficulty,
          d.timestamp,
        ]),
      ]
        .map((row) => row.join(','))
        .join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `adaptive-analytics-${new Date().toISOString()}.csv`
      a.click()
      URL.revokeObjectURL(url)

      setIsExporting(false)
    }, 500)
  }

  const latestPoint = irtData[irtData.length - 1]
  const ciWidth = latestPoint.theta_ci_upper - latestPoint.theta_ci_lower
  const shouldStop = ciWidth < 0.3

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-3xl font-bold">Adaptive Assessment Analytics</h1>
        <p className="text-muted-foreground mt-1">
          IRT metrics tracking with theta estimates, difficulty trajectory, and efficiency analysis
        </p>
      </motion.div>

      {/* Filters */}
      <motion.div
        className="flex flex-wrap gap-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Select value={timeRange} onValueChange={(v) => setTimeRange(v as any)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={objectiveId || 'all'}
          onValueChange={(v) => setObjectiveId(v === 'all' ? null : v)}
        >
          <SelectTrigger className="w-[240px]">
            <SelectValue placeholder="Select objective" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All objectives</SelectItem>
            <SelectItem value="cardio">Cardiovascular Physiology</SelectItem>
            <SelectItem value="resp">Respiratory System</SelectItem>
            <SelectItem value="renal">Renal Pathology</SelectItem>
            <SelectItem value="pharm">Pharmacology</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={handleExport} loading={isExporting} className="ml-auto">
          Export CSV
        </Button>
      </motion.div>

      {/* Key Metrics */}
      <motion.div
        className="grid gap-4 md:grid-cols-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Current Theta (θ)</CardDescription>
            <CardTitle className="text-3xl">{latestPoint.theta.toFixed(2)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              CI: [{latestPoint.theta_ci_lower.toFixed(2)}, {latestPoint.theta_ci_upper.toFixed(2)}]
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Width: {ciWidth.toFixed(2)} {shouldStop && '✓ Converged'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Questions Answered</CardDescription>
            <CardTitle className="text-3xl">
              {efficiencyMetrics.questions_answered}
              <span className="text-lg text-muted-foreground">
                /{efficiencyMetrics.target_questions}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {Math.round(
                (efficiencyMetrics.questions_answered / efficiencyMetrics.target_questions) * 100,
              )}
              % complete
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Efficiency Score</CardDescription>
            <CardTitle className="text-3xl">{efficiencyMetrics.efficiency_score}%</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-success">{efficiencyMetrics.time_saved_minutes} min saved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Early Stop Status</CardDescription>
            <CardTitle className="text-2xl">{shouldStop ? 'Ready' : 'In Progress'}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {shouldStop ? 'CI < 0.3 threshold met' : `CI: ${ciWidth.toFixed(2)} > 0.3`}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Theta Trajectory Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Ability Estimate Trajectory (θ)</CardTitle>
            <CardDescription>IRT theta evolution with 95% confidence intervals</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart
                data={irtData}
                {...applyChartTheme()}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid {...chartTheme.grid} />
                <XAxis
                  dataKey="question_number"
                  {...chartTheme.axis}
                  label={{
                    value: 'Question Number',
                    position: 'insideBottom',
                    offset: -5,
                  }}
                />
                <YAxis
                  {...chartTheme.axis}
                  domain={[-3, 3]}
                  label={{
                    value: 'Ability (θ)',
                    angle: -90,
                    position: 'insideLeft',
                  }}
                />
                <Tooltip
                  contentStyle={{
                    ...chartTheme.tooltip.contentStyle,
                    backgroundColor: 'hsl(var(--popover))',
                    borderColor: 'hsl(var(--border))',
                    color: 'hsl(var(--popover-foreground))',
                  }}
                />
                <Legend {...chartTheme.legend} />

                <Line
                  type="monotone"
                  dataKey="theta_ci_upper"
                  stroke="oklch(0.7 0.1 240)"
                  strokeDasharray="5 5"
                  name="Upper CI"
                  dot={false}
                  strokeWidth={1}
                />
                <Line
                  type="monotone"
                  dataKey="theta_ci_lower"
                  stroke="oklch(0.7 0.1 240)"
                  strokeDasharray="5 5"
                  name="Lower CI"
                  dot={false}
                  strokeWidth={1}
                />
                <Line
                  type="monotone"
                  dataKey="theta"
                  stroke="oklch(0.65 0.2 240)"
                  strokeWidth={3}
                  name="Theta (θ)"
                  dot={{ r: 4 }}
                />

                <ReferenceLine y={0} stroke="oklch(0.5 0.05 230)" strokeDasharray="3 3" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Difficulty Adaptation Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Question Difficulty Adaptation</CardTitle>
            <CardDescription>
              Difficulty tracking vs ability estimate (maximum information principle)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart
                {...applyChartTheme()}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid {...chartTheme.grid} />
                <XAxis
                  type="number"
                  dataKey="question_number"
                  name="Question"
                  {...chartTheme.axis}
                  label={{
                    value: 'Question Number',
                    position: 'insideBottom',
                    offset: -5,
                  }}
                />
                <YAxis
                  type="number"
                  {...chartTheme.axis}
                  domain={[-3, 3]}
                  label={{
                    value: 'Difficulty / Ability',
                    angle: -90,
                    position: 'insideLeft',
                  }}
                />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{
                    ...chartTheme.tooltip.contentStyle,
                    backgroundColor: 'hsl(var(--popover))',
                    borderColor: 'hsl(var(--border))',
                    color: 'hsl(var(--popover-foreground))',
                  }}
                />
                <Legend {...chartTheme.legend} />

                <Scatter
                  name="Question Difficulty"
                  data={irtData}
                  dataKey="difficulty"
                  fill="oklch(0.7 0.15 50)"
                  shape="cross"
                />
                <Scatter
                  name="Ability (θ)"
                  data={irtData}
                  dataKey="theta"
                  fill="oklch(0.65 0.2 240)"
                />
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Session History Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Session History</CardTitle>
            <CardDescription>
              Recent adaptive assessment sessions with final theta estimates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Objective</th>
                    <th className="px-4 py-3 text-right">Final θ</th>
                    <th className="px-4 py-3 text-right">Questions</th>
                    <th className="px-4 py-3 text-right">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {sessionHistory.map((session) => (
                    <tr
                      key={session.session_id}
                      className="border-b hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3">{session.date}</td>
                      <td className="px-4 py-3">{session.objective_name}</td>
                      <td className="px-4 py-3 text-right font-mono">
                        {session.final_theta > 0 ? '+' : ''}
                        {session.final_theta.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right">{session.questions_answered}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {session.duration_minutes} min
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
