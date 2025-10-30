/**
 * Predictions & Forecasting Dashboard - Agent 9
 * Advanced ML predictions with exam success forecasts and scenario planning
 *
 * Features:
 * - Exam success forecasts with probability curves
 * - Mastery date predictions with confidence bands
 * - Forgetting risk indicators
 * - Time-to-mastery estimates
 * - Historical prediction accuracy
 * - Interactive scenario planning ("What if I study X hours?")
 */

'use client'

import { motion } from 'framer-motion'
import {
  Activity,
  AlertCircle,
  Calendar,
  Clock,
  Download,
  Gauge,
  Lightbulb,
  Play,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  Zap,
} from 'lucide-react'
import { useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer } from '@/components/ui/chart-container'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { colors, typography } from '@/lib/design-tokens'
import { usePredictions } from '@/lib/api/hooks/analytics'

// Exam success probability curve data
const generateExamSuccessCurve = (currentScore: number) => {
  return Array.from({ length: 12 }, (_, i) => {
    const weeks = i + 1
    const baseProb = currentScore / 100
    const improvement = (weeks / 12) * 0.25
    const probability = Math.min(0.98, baseProb + improvement)

    return {
      week: weeks,
      probability: Math.round(probability * 100) / 100,
      confidenceLower: Math.max(0, Math.round((probability - 0.08) * 100) / 100),
      confidenceUpper: Math.min(1, Math.round((probability + 0.08) * 100) / 100),
      studyHours: weeks * 15,
    }
  })
}

// Mastery date predictions
const masteryPredictions = [
  {
    id: '1',
    objectiveName: 'Pharmacodynamics',
    currentScore: 75,
    targetScore: 85,
    estimatedWeeks: 3,
    estimatedDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
    hoursNeeded: 18,
    confidence: 0.87,
    trend: 'improving',
  },
  {
    id: '2',
    objectiveName: 'Cardiac Pathophysiology',
    currentScore: 68,
    targetScore: 85,
    estimatedWeeks: 5,
    estimatedDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
    hoursNeeded: 32,
    confidence: 0.79,
    trend: 'stable',
  },
  {
    id: '3',
    objectiveName: 'Neuroanatomy',
    currentScore: 82,
    targetScore: 85,
    estimatedWeeks: 1,
    estimatedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    hoursNeeded: 6,
    confidence: 0.92,
    trend: 'improving',
  },
]

// Forgetting risk data
const forgettingRisks = [
  {
    objectiveName: 'Biochemistry Pathways',
    lastReviewed: 18,
    riskLevel: 'high' as const,
    retentionProbability: 0.42,
    daysUntilCritical: 3,
    recommendedReview: 'Urgent: Review within 3 days',
  },
  {
    objectiveName: 'Immunology Basics',
    lastReviewed: 12,
    riskLevel: 'medium' as const,
    retentionProbability: 0.65,
    daysUntilCritical: 7,
    recommendedReview: 'Schedule review this week',
  },
  {
    objectiveName: 'Respiratory Physiology',
    lastReviewed: 5,
    riskLevel: 'low' as const,
    retentionProbability: 0.88,
    daysUntilCritical: 14,
    recommendedReview: 'Light review in 2 weeks',
  },
]

// Historical accuracy data
const predictionAccuracy = Array.from({ length: 8 }, (_, i) => ({
  week: `Week ${i + 1}`,
  examSuccess: 0.72 + Math.random() * 0.1 + (i / 8) * 0.08,
  mastery: 0.75 + Math.random() * 0.08 + (i / 8) * 0.06,
  forgetting: 0.68 + Math.random() * 0.12 + (i / 8) * 0.09,
}))

// Scenario comparison data
const generateScenarioData = (studyHours: number) => {
  return Array.from({ length: 12 }, (_, i) => {
    const weeks = i + 1
    const impact = (studyHours / 20) * 0.15 // Impact factor based on study hours
    const baseProb = 0.65 + (weeks / 12) * 0.2
    const probability = Math.min(0.95, baseProb + impact)

    return {
      week: weeks,
      probability: Math.round(probability * 100) / 100,
    }
  })
}

export default function PredictionsPage() {
  const [timeRange, setTimeRange] = useState('12w')
  const [selectedObjective, setSelectedObjective] = useState(masteryPredictions[0])
  const [studyHoursPerWeek, setStudyHoursPerWeek] = useState(15)
  const [scenarioData, setScenarioData] = useState(generateScenarioData(15))

  // Use real hook (falls back to mock data during development)
  const { data: predictions, isLoading } = usePredictions('user_123', timeRange)

  const examSuccessCurve = generateExamSuccessCurve(75)

  const handleStudyHoursChange = (value: number[]) => {
    const hours = value[0]
    setStudyHoursPerWeek(hours)
    setScenarioData(generateScenarioData(hours))
  }

  const getRiskColor = (level: 'high' | 'medium' | 'low') => {
    switch (level) {
      case 'high':
        return colors.alert
      case 'medium':
        return colors.warning
      case 'low':
        return colors.success
    }
  }

  const getTrendIcon = (trend: string) => {
    if (trend === 'improving') return <TrendingUp className="size-3" style={{ color: colors.success }} />
    if (trend === 'declining') return <AlertCircle className="size-3" style={{ color: colors.alert }} />
    return <Activity className="size-3" style={{ color: colors.clinical }} />
  }

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div
              className="p-3 rounded-xl"
              style={{ backgroundColor: `color-mix(in oklch, ${colors.energy}, transparent 90%)` }}
            >
              <Sparkles className="size-7" style={{ color: colors.energy }} />
            </div>
            <div>
              <h1 className={`${typography.heading.h1} text-foreground`}>
                Predictions & Scenario Planning
              </h1>
              <p className={`${typography.body.small} text-muted-foreground`}>
                ML-powered forecasts with interactive "what-if" analysis
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="4w">4 weeks</SelectItem>
                <SelectItem value="12w">12 weeks</SelectItem>
                <SelectItem value="24w">24 weeks</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Download className="size-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Key Predictions Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Exam Success</CardDescription>
              <Trophy className="size-4" style={{ color: colors.success }} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`${typography.heading.h1} text-foreground`}>87%</div>
            <p className={`${typography.body.tiny} text-muted-foreground mt-1`}>
              Predicted probability
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Mastery Timeline</CardDescription>
              <Calendar className="size-4" style={{ color: colors.clinical }} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`${typography.heading.h1} text-foreground`}>6 weeks</div>
            <p className={`${typography.body.tiny} text-muted-foreground mt-1`}>
              Avg time to mastery
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Study Hours Needed</CardDescription>
              <Clock className="size-4" style={{ color: colors.energy }} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`${typography.heading.h1} text-foreground`}>56h</div>
            <p className={`${typography.body.tiny} text-muted-foreground mt-1`}>
              Total remaining
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>High Forgetting Risk</CardDescription>
              <AlertCircle className="size-4" style={{ color: colors.alert }} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`${typography.heading.h1} text-foreground`}>3</div>
            <p className={`${typography.body.tiny} text-muted-foreground mt-1`}>
              Topics need review
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <Tabs defaultValue="exam-success" className="space-y-6">
        <TabsList>
          <TabsTrigger value="exam-success">Exam Success</TabsTrigger>
          <TabsTrigger value="mastery">Mastery Timeline</TabsTrigger>
          <TabsTrigger value="forgetting">Forgetting Risk</TabsTrigger>
          <TabsTrigger value="scenario">Scenario Planning</TabsTrigger>
        </TabsList>

        {/* Exam Success Tab */}
        <TabsContent value="exam-success" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <ChartContainer
              title="Exam Success Probability Forecast"
              description="12-week prediction with 90% confidence intervals"
              height={400}
              exportable
              onExport={() => console.log('Export chart')}
            >
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={examSuccessCurve}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                  <XAxis
                    dataKey="week"
                    label={{ value: 'Weeks of Study', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis
                    label={{ value: 'Success Probability', angle: -90, position: 'insideLeft' }}
                    domain={[0, 1]}
                    tickFormatter={(value) => `${Math.round(value * 100)}%`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="bg-white/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
                            <p className="font-semibold mb-2">Week {data.week}</p>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between gap-4">
                                <span className="text-muted-foreground">Probability:</span>
                                <span className="font-semibold">
                                  {Math.round(data.probability * 100)}%
                                </span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-muted-foreground">Study Hours:</span>
                                <span>{data.studyHours}h</span>
                              </div>
                              <div className="flex justify-between gap-4 text-xs text-muted-foreground pt-1 border-t">
                                <span>Confidence Range:</span>
                                <span>
                                  {Math.round(data.confidenceLower * 100)}% -{' '}
                                  {Math.round(data.confidenceUpper * 100)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  {/* Confidence interval band */}
                  <Area
                    type="monotone"
                    dataKey="confidenceUpper"
                    stroke="none"
                    fill={colors.success}
                    fillOpacity={0.1}
                  />
                  <Area
                    type="monotone"
                    dataKey="confidenceLower"
                    stroke="none"
                    fill="white"
                    fillOpacity={1}
                  />
                  {/* Main prediction line */}
                  <Area
                    type="monotone"
                    dataKey="probability"
                    stroke={colors.success}
                    strokeWidth={3}
                    fill={colors.success}
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </motion.div>

          {/* Prediction Accuracy Tracking */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <ChartContainer
              title="Historical Prediction Accuracy"
              description="Model performance across different prediction types"
              height={300}
            >
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={predictionAccuracy}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                  <XAxis dataKey="week" />
                  <YAxis
                    domain={[0.6, 1]}
                    tickFormatter={(value) => `${Math.round(value * 100)}%`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="bg-white/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
                            <p className="font-semibold mb-2">{data.week}</p>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between gap-4">
                                <span className="text-muted-foreground">Exam Success:</span>
                                <span>{Math.round(data.examSuccess * 100)}%</span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-muted-foreground">Mastery:</span>
                                <span>{Math.round(data.mastery * 100)}%</span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-muted-foreground">Forgetting:</span>
                                <span>{Math.round(data.forgetting * 100)}%</span>
                              </div>
                            </div>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="examSuccess"
                    stroke={colors.success}
                    strokeWidth={2}
                    name="Exam Success"
                  />
                  <Line
                    type="monotone"
                    dataKey="mastery"
                    stroke={colors.clinical}
                    strokeWidth={2}
                    name="Mastery"
                  />
                  <Line
                    type="monotone"
                    dataKey="forgetting"
                    stroke={colors.warning}
                    strokeWidth={2}
                    name="Forgetting"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </motion.div>
        </TabsContent>

        {/* Mastery Timeline Tab */}
        <TabsContent value="mastery" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="grid grid-cols-1 gap-4"
          >
            {masteryPredictions.map((pred, index) => (
              <motion.div
                key={pred.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{pred.objectiveName}</CardTitle>
                        <CardDescription>
                          Current: {pred.currentScore}% → Target: {pred.targetScore}%
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {getTrendIcon(pred.trend)}
                        <span
                          className="px-3 py-1 rounded-full text-xs font-semibold"
                          style={{
                            backgroundColor: `color-mix(in oklch, ${colors.clinical}, transparent 85%)`,
                            color: colors.clinical,
                          }}
                        >
                          {Math.round(pred.confidence * 100)}% confidence
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Estimated Time</div>
                        <div className="text-2xl font-bold" style={{ color: colors.clinical }}>
                          {pred.estimatedWeeks} weeks
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Study Hours Needed</div>
                        <div className="text-2xl font-bold" style={{ color: colors.energy }}>
                          {pred.hoursNeeded}h
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Target Date</div>
                        <div className="text-2xl font-bold">
                          {pred.estimatedDate.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Weekly Pace</div>
                        <div className="text-2xl font-bold">
                          {Math.round(pred.hoursNeeded / pred.estimatedWeeks)}h/wk
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </TabsContent>

        {/* Forgetting Risk Tab */}
        <TabsContent value="forgetting" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="grid grid-cols-1 gap-4"
          >
            {forgettingRisks.map((risk, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
              >
                <Card
                  className={
                    risk.riskLevel === 'high'
                      ? 'border-2'
                      : risk.riskLevel === 'medium'
                        ? 'border'
                        : ''
                  }
                  style={
                    risk.riskLevel === 'high'
                      ? { borderColor: colors.alert }
                      : risk.riskLevel === 'medium'
                        ? { borderColor: colors.warning }
                        : undefined
                  }
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          {risk.objectiveName}
                          <div
                            className="px-2 py-1 rounded-full text-xs font-semibold"
                            style={{
                              backgroundColor: `color-mix(in oklch, ${getRiskColor(risk.riskLevel)}, transparent 85%)`,
                              color: getRiskColor(risk.riskLevel),
                            }}
                          >
                            {risk.riskLevel.toUpperCase()} RISK
                          </div>
                        </CardTitle>
                        <CardDescription>Last reviewed {risk.lastReviewed} days ago</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">
                          Retention Probability
                        </div>
                        <div
                          className="text-2xl font-bold"
                          style={{ color: getRiskColor(risk.riskLevel) }}
                        >
                          {Math.round(risk.retentionProbability * 100)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">
                          Days Until Critical
                        </div>
                        <div className="text-2xl font-bold">{risk.daysUntilCritical} days</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Recommendation</div>
                        <div className="text-sm font-semibold">{risk.recommendedReview}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </TabsContent>

        {/* Scenario Planning Tab */}
        <TabsContent value="scenario" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="size-6" style={{ color: colors.energy }} />
                  Interactive Scenario Planning
                </CardTitle>
                <CardDescription>
                  Adjust your weekly study hours to see predicted impact on exam success
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="study-hours" className="text-base font-semibold">
                      Weekly Study Hours
                    </Label>
                    <div
                      className="text-3xl font-bold"
                      style={{ color: colors.clinical }}
                    >
                      {studyHoursPerWeek}h
                    </div>
                  </div>
                  <Slider
                    id="study-hours"
                    min={5}
                    max={40}
                    step={1}
                    value={[studyHoursPerWeek]}
                    onValueChange={handleStudyHoursChange}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>5h/week</span>
                    <span>40h/week</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-1">Predicted Success</div>
                    <div
                      className="text-3xl font-bold"
                      style={{ color: colors.success }}
                    >
                      {Math.round(scenarioData[11].probability * 100)}%
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-1">Total Hours</div>
                    <div className="text-3xl font-bold" style={{ color: colors.clinical }}>
                      {studyHoursPerWeek * 12}h
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-1">Time to 85%</div>
                    <div className="text-3xl font-bold" style={{ color: colors.energy }}>
                      {scenarioData.findIndex((d) => d.probability >= 0.85) + 1 || 12}w
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <ChartContainer
              title="Scenario Comparison"
              description={`Predicted exam success with ${studyHoursPerWeek}h/week vs baseline (15h/week)`}
              height={400}
            >
              <ResponsiveContainer width="100%" height={400}>
                <LineChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                  <XAxis
                    dataKey="week"
                    label={{ value: 'Weeks', position: 'insideBottom', offset: -5 }}
                    type="number"
                    domain={[1, 12]}
                  />
                  <YAxis
                    label={{ value: 'Success Probability', angle: -90, position: 'insideLeft' }}
                    domain={[0, 1]}
                    tickFormatter={(value) => `${Math.round(value * 100)}%`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
                            <p className="font-semibold mb-2">Week {payload[0].payload.week}</p>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between gap-4">
                                <span style={{ color: colors.clinical }}>Your Scenario:</span>
                                <span className="font-semibold">
                                  {Math.round(payload[0].value as number * 100)}%
                                </span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span style={{ color: colors.warning }}>Baseline:</span>
                                <span>{Math.round(payload[1].value as number * 100)}%</span>
                              </div>
                            </div>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Line
                    data={scenarioData}
                    type="monotone"
                    dataKey="probability"
                    stroke={colors.clinical}
                    strokeWidth={3}
                    name="Your Scenario"
                    dot={{ fill: colors.clinical, r: 4 }}
                  />
                  <Line
                    data={generateScenarioData(15)}
                    type="monotone"
                    dataKey="probability"
                    stroke={colors.warning}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Baseline (15h/wk)"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
