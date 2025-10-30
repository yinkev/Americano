'use client'

import { motion } from 'motion/react'
import { useMemo, useState } from 'react'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { applyChartTheme, chartTheme } from '@/lib/chart-theme'
import { usePersonalStore } from '@/stores/personal'

// Mock Data Types
interface ValidationResponse {
  id: string
  question_text: string
  confidence: number
  actual_score: number
  four_dim_scores: {
    knowledge: number
    reasoning: number
    application: number
    integration: number
  }
  is_calibrated: boolean
  scenario_type: string
  timestamp: string
}

interface CalibrationMetrics {
  overall_accuracy: number
  overconfidence_rate: number
  underconfidence_rate: number
  perfect_calibration_rate: number
}

interface FourDimEvolution {
  date: string
  knowledge: number
  reasoning: number
  application: number
  integration: number
}

interface MasteryStatus {
  objective: string
  verification_status: 'verified' | 'in_progress' | 'not_started'
  confidence_score: number
  validation_count: number
}

// Mock Data Generators
function generateMockValidationResponses(): ValidationResponse[] {
  const scenarios = ['Acute Care', 'Chronic Disease', 'Preventive Care', 'Emergency Medicine']
  const questions = [
    'Diagnose the patient presenting with chest pain and shortness of breath',
    'Interpret ECG showing ST elevation in leads II, III, and aVF',
    'Develop treatment plan for Type 2 Diabetes with complications',
    'Evaluate pharmacological options for hypertension management',
  ]

  return Array.from({ length: 15 }, (_, i) => {
    const confidence = Math.floor(Math.random() * 5) + 1
    const actual = Math.floor(Math.random() * 30) + 70
    const is_calibrated = Math.abs(confidence * 20 - actual) < 15

    return {
      id: `val_${i + 1}`,
      question_text: questions[i % questions.length],
      confidence,
      actual_score: actual,
      four_dim_scores: {
        knowledge: Math.floor(Math.random() * 20) + 80,
        reasoning: Math.floor(Math.random() * 20) + 75,
        application: Math.floor(Math.random() * 25) + 70,
        integration: Math.floor(Math.random() * 25) + 65,
      },
      is_calibrated,
      scenario_type: scenarios[i % scenarios.length],
      timestamp: new Date(Date.now() - (15 - i) * 86400000).toISOString(),
    }
  })
}

function generateCalibrationMetrics(responses: ValidationResponse[]): CalibrationMetrics {
  const calibrated = responses.filter((r) => r.is_calibrated).length
  let overconfident = 0
  let underconfident = 0

  responses.forEach((r) => {
    const expected = r.confidence * 20
    if (expected > r.actual_score + 15) overconfident++
    if (expected < r.actual_score - 15) underconfident++
  })

  return {
    overall_accuracy: Math.round((calibrated / responses.length) * 100),
    overconfidence_rate: Math.round((overconfident / responses.length) * 100),
    underconfidence_rate: Math.round((underconfident / responses.length) * 100),
    perfect_calibration_rate: Math.round((calibrated / responses.length) * 100),
  }
}

function generateFourDimEvolution(): FourDimEvolution[] {
  return Array.from({ length: 7 }, (_, i) => ({
    date: new Date(Date.now() - (6 - i) * 86400000).toISOString().split('T')[0],
    knowledge: 75 + i * 2 + Math.random() * 5,
    reasoning: 70 + i * 2.5 + Math.random() * 5,
    application: 65 + i * 3 + Math.random() * 5,
    integration: 60 + i * 3.5 + Math.random() * 5,
  }))
}

function generateMasteryStatus(): MasteryStatus[] {
  const objectives = [
    'Cardiovascular Physiology',
    'Respiratory System',
    'Renal Pathology',
    'Pharmacology',
  ]
  const statuses: Array<'verified' | 'in_progress' | 'not_started'> = [
    'verified',
    'in_progress',
    'in_progress',
    'not_started',
  ]

  return objectives.map((obj, i) => ({
    objective: obj,
    verification_status: statuses[i],
    confidence_score: statuses[i] === 'verified' ? 95 : statuses[i] === 'in_progress' ? 75 : 40,
    validation_count: statuses[i] === 'verified' ? 12 : statuses[i] === 'in_progress' ? 6 : 2,
  }))
}

export default function ValidationAnalyticsPage() {
  const { timeRange, objectiveId, setTimeRange, setObjectiveId } = usePersonalStore()
  const [isExporting, setIsExporting] = useState(false)

  // Mock data
  const responses = useMemo(() => generateMockValidationResponses(), [])
  const calibrationMetrics = useMemo(() => generateCalibrationMetrics(responses), [responses])
  const fourDimEvolution = useMemo(() => generateFourDimEvolution(), [])
  const masteryStatus = useMemo(() => generateMasteryStatus(), [])

  const handleExport = () => {
    setIsExporting(true)
    setTimeout(() => {
      const csvContent = [
        ['ID', 'Question', 'Confidence', 'Actual Score', 'Calibrated', 'Scenario', 'Timestamp'],
        ...responses.map((r) => [
          r.id,
          r.question_text,
          r.confidence,
          r.actual_score,
          r.is_calibrated,
          r.scenario_type,
          r.timestamp,
        ]),
      ]
        .map((row) => row.join(','))
        .join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `validation-analytics-${new Date().toISOString()}.csv`
      a.click()
      URL.revokeObjectURL(url)

      setIsExporting(false)
    }, 500)
  }

  // Prepare calibration chart data
  const calibrationData = responses.map((r) => ({
    confidence: r.confidence * 20,
    actual: r.actual_score,
    name: `Q${responses.indexOf(r) + 1}`,
  }))

  // Scenario performance data
  const scenarioData = Object.entries(
    responses.reduce(
      (acc, r) => {
        if (!acc[r.scenario_type]) acc[r.scenario_type] = { total: 0, count: 0 }
        acc[r.scenario_type].total += r.actual_score
        acc[r.scenario_type].count += 1
        return acc
      },
      {} as Record<string, { total: number; count: number }>,
    ),
  ).map(([scenario, data]) => ({
    scenario,
    average: Math.round(data.total / data.count),
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-3xl font-bold">Validation Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Response history, confidence calibration, 4D score evolution, and mastery verification
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

      {/* Calibration Metrics */}
      <motion.div
        className="grid gap-4 md:grid-cols-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Overall Accuracy</CardDescription>
            <CardTitle className="text-3xl">{calibrationMetrics.overall_accuracy}%</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {responses.filter((r) => r.is_calibrated).length} / {responses.length} responses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Overconfidence Rate</CardDescription>
            <CardTitle className="text-3xl">{calibrationMetrics.overconfidence_rate}%</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Confidence exceeds performance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Underconfidence Rate</CardDescription>
            <CardTitle className="text-3xl">{calibrationMetrics.underconfidence_rate}%</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Performance exceeds confidence</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Perfect Calibration</CardDescription>
            <CardTitle className="text-3xl">
              {calibrationMetrics.perfect_calibration_rate}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-success">Within 15% accuracy</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Calibration Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Confidence vs Actual Performance</CardTitle>
            <CardDescription>
              Calibration tracking - points near diagonal indicate good calibration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart
                data={calibrationData}
                {...applyChartTheme()}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid {...chartTheme.grid} />
                <XAxis
                  dataKey="name"
                  {...chartTheme.axis}
                  label={{
                    value: 'Question',
                    position: 'insideBottom',
                    offset: -5,
                  }}
                />
                <YAxis
                  {...chartTheme.axis}
                  domain={[0, 100]}
                  label={{
                    value: 'Score (%)',
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
                  dataKey="confidence"
                  stroke="oklch(0.7 0.15 50)"
                  strokeWidth={2}
                  name="Predicted (Confidence)"
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="oklch(0.65 0.2 240)"
                  strokeWidth={2}
                  name="Actual Score"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* 4D Score Evolution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>4-Dimensional Score Evolution</CardTitle>
            <CardDescription>
              Knowledge, Reasoning, Application, and Integration scores over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart
                data={fourDimEvolution}
                {...applyChartTheme()}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid {...chartTheme.grid} />
                <XAxis
                  dataKey="date"
                  {...chartTheme.axis}
                  label={{
                    value: 'Date',
                    position: 'insideBottom',
                    offset: -5,
                  }}
                />
                <YAxis
                  {...chartTheme.axis}
                  domain={[50, 100]}
                  label={{
                    value: 'Score',
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
                  dataKey="knowledge"
                  stroke="oklch(0.65 0.2 240)"
                  strokeWidth={2}
                  name="Knowledge"
                />
                <Line
                  type="monotone"
                  dataKey="reasoning"
                  stroke="oklch(0.7 0.15 145)"
                  strokeWidth={2}
                  name="Reasoning"
                />
                <Line
                  type="monotone"
                  dataKey="application"
                  stroke="oklch(0.7 0.15 50)"
                  strokeWidth={2}
                  name="Application"
                />
                <Line
                  type="monotone"
                  dataKey="integration"
                  stroke="oklch(0.65 0.2 280)"
                  strokeWidth={2}
                  name="Integration"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Clinical Scenario Performance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Clinical Scenario Performance</CardTitle>
            <CardDescription>Average performance across different scenario types</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={scenarioData}
                {...applyChartTheme()}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid {...chartTheme.grid} />
                <XAxis
                  dataKey="scenario"
                  {...chartTheme.axis}
                  label={{
                    value: 'Scenario Type',
                    position: 'insideBottom',
                    offset: -5,
                  }}
                />
                <YAxis
                  {...chartTheme.axis}
                  domain={[0, 100]}
                  label={{
                    value: 'Average Score',
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
                <Bar dataKey="average" fill="oklch(0.65 0.2 240)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Mastery Verification Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Mastery Verification Status</CardTitle>
            <CardDescription>Progress towards objective mastery verification</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {masteryStatus.map((status) => (
                <div
                  key={status.objective}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                >
                  <div>
                    <h3 className="font-medium">{status.objective}</h3>
                    <p className="text-sm text-muted-foreground">
                      {status.validation_count} validations • {status.confidence_score}% confidence
                    </p>
                  </div>
                  <Badge
                    variant={
                      status.verification_status === 'verified'
                        ? 'default'
                        : status.verification_status === 'in_progress'
                          ? 'secondary'
                          : 'outline'
                    }
                  >
                    {status.verification_status === 'verified'
                      ? 'Verified'
                      : status.verification_status === 'in_progress'
                        ? 'In Progress'
                        : 'Not Started'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Validation Response History Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.7 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Validation Response History</CardTitle>
            <CardDescription>
              Recent validation attempts with confidence and calibration status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Scenario</th>
                    <th className="px-4 py-3 text-right">Confidence</th>
                    <th className="px-4 py-3 text-right">Actual</th>
                    <th className="px-4 py-3 text-left">Calibrated</th>
                  </tr>
                </thead>
                <tbody>
                  {responses.slice(0, 10).map((response) => (
                    <tr key={response.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        {new Date(response.timestamp).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">{response.scenario_type}</td>
                      <td className="px-4 py-3 text-right">{response.confidence}/5</td>
                      <td className="px-4 py-3 text-right font-mono">{response.actual_score}%</td>
                      <td className="px-4 py-3">
                        <Badge variant={response.is_calibrated ? 'default' : 'outline'}>
                          {response.is_calibrated ? 'Yes' : 'No'}
                        </Badge>
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
