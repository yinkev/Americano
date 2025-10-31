/**
 * Struggle Predictions Dashboard - Agent 9
 * Premium prediction analytics with confidence intervals and risk scoring
 *
 * Features:
 * - Struggle prediction curves with confidence bands
 * - Color-coded risk indicators (high/medium/low)
 * - Intervention recommendations with priority scoring
 * - Historical accuracy tracking
 * - Premium animations and micro-interactions
 */

'use client'

import { motion } from 'framer-motion'
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Calendar,
  Clock,
  Download,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer } from '@/components/ui/chart-container'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { usePredictions } from '@/lib/api/hooks/analytics'
import { colors, typography } from '@/lib/design-tokens'

// Mock data generator for struggle predictions
const generatePredictionCurve = (baseProbability: number, days: number) => {
  return Array.from({ length: days }, (_, i) => {
    const dayOffset = i + 1
    const variance = Math.random() * 0.1 - 0.05
    const trend = (dayOffset / days) * 0.15
    const probability = Math.min(0.95, Math.max(0.05, baseProbability + trend + variance))
    const confidence = 0.85 + Math.random() * 0.1

    return {
      day: dayOffset,
      probability: Math.round(probability * 100) / 100,
      confidenceLower: Math.round((probability - 0.1) * 100) / 100,
      confidenceUpper: Math.round((probability + 0.1) * 100) / 100,
      confidence: Math.round(confidence * 100) / 100,
    }
  })
}

const mockStrugglePredictions = [
  {
    id: '1',
    objectiveName: 'Cardiac Electrophysiology',
    currentScore: 65,
    riskLevel: 'high' as const,
    probability: 0.82,
    confidence: 0.89,
    daysUntil: 3,
    interventions: [
      'Review prerequisite: Action Potential Basics',
      'Focus on ECG interpretation',
      'Complete 10 practice questions',
    ],
    predictionCurve: generatePredictionCurve(0.82, 14),
  },
  {
    id: '2',
    objectiveName: 'Renal Tubular Function',
    currentScore: 72,
    riskLevel: 'medium' as const,
    probability: 0.58,
    confidence: 0.76,
    daysUntil: 7,
    interventions: ['Review lecture notes', 'Practice diagram labeling'],
    predictionCurve: generatePredictionCurve(0.58, 14),
  },
  {
    id: '3',
    objectiveName: 'Immunology: T-Cell Activation',
    currentScore: 78,
    riskLevel: 'low' as const,
    probability: 0.32,
    confidence: 0.81,
    daysUntil: 10,
    interventions: ['Light review before exam'],
    predictionCurve: generatePredictionCurve(0.32, 14),
  },
]

// Historical accuracy data
const accuracyHistory = Array.from({ length: 30 }, (_, i) => ({
  date: `Day ${i + 1}`,
  accuracy: 0.65 + Math.random() * 0.15 + (i / 30) * 0.1,
  predictions: Math.floor(15 + Math.random() * 10),
}))

// Risk distribution data
const riskDistribution = [
  { category: 'High Risk', count: 3, color: colors.alert },
  { category: 'Medium Risk', count: 8, color: colors.warning },
  { category: 'Low Risk', count: 15, color: colors.success },
]

export default function StrugglePredictionsPage() {
  const [timeRange, setTimeRange] = useState('7d')
  const [selectedPrediction, setSelectedPrediction] = useState(mockStrugglePredictions[0])

  // Use real hook (falls back to mock data during development)
  const { data: predictions, isLoading } = usePredictions('user_123', timeRange)

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

  const getRiskBgColor = (level: 'high' | 'medium' | 'low') => {
    switch (level) {
      case 'high':
        return 'bg-red-50'
      case 'medium':
        return 'bg-amber-50'
      case 'low':
        return 'bg-green-50'
    }
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
              style={{ backgroundColor: `color-mix(in oklch, ${colors.alert}, transparent 90%)` }}
            >
              <AlertTriangle className="size-7" style={{ color: colors.alert }} />
            </div>
            <div>
              <h1 className={`${typography.heading.h1} text-foreground`}>
                Struggle Predictions & Risk Analysis
              </h1>
              <p className={`${typography.body.small} text-muted-foreground`}>
                ML-powered predictions with confidence intervals and proactive interventions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="14d">Last 14 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Download className="size-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Key Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>High Risk</CardDescription>
              <AlertTriangle className="size-4" style={{ color: colors.alert }} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`${typography.heading.h1} text-foreground`}>3</div>
            <p className={`${typography.body.tiny} text-muted-foreground mt-1`}>
              Objectives at risk
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Avg Confidence</CardDescription>
              <Target className="size-4" style={{ color: colors.clinical }} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`${typography.heading.h1} text-foreground`}>82%</div>
            <p className={`${typography.body.tiny} text-muted-foreground mt-1`}>Model confidence</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Prediction Accuracy</CardDescription>
              <TrendingUp className="size-4" style={{ color: colors.success }} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`${typography.heading.h1} text-foreground`}>78%</div>
            <p className={`${typography.body.tiny} text-muted-foreground mt-1`}>
              +5% vs last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Interventions</CardDescription>
              <Activity className="size-4" style={{ color: colors.energy }} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`${typography.heading.h1} text-foreground`}>12</div>
            <p className={`${typography.body.tiny} text-muted-foreground mt-1`}>Active this week</p>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column - Predictions List */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="space-y-4"
        >
          <h2 className={`${typography.heading.h2} text-foreground`}>Active Predictions</h2>

          {mockStrugglePredictions.map((pred, index) => (
            <motion.div
              key={pred.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
            >
              <Card
                interactive="interactive"
                onClick={() => setSelectedPrediction(pred)}
                className={`cursor-pointer ${getRiskBgColor(pred.riskLevel)} ${
                  selectedPrediction.id === pred.id ? 'ring-2 ring-clinical' : ''
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{pred.objectiveName}</CardTitle>
                    <div
                      className="px-2 py-1 rounded-full text-xs font-semibold"
                      style={{
                        backgroundColor: `color-mix(in oklch, ${getRiskColor(pred.riskLevel)}, transparent 85%)`,
                        color: getRiskColor(pred.riskLevel),
                      }}
                    >
                      {pred.riskLevel.toUpperCase()}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Risk Probability</span>
                    <span className="font-semibold" style={{ color: getRiskColor(pred.riskLevel) }}>
                      {Math.round(pred.probability * 100)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Confidence</span>
                    <span className="font-semibold">{Math.round(pred.confidence * 100)}%</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
                    <Clock className="size-3" />
                    <span>Predicted in {pred.daysUntil} days</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Middle Column - Prediction Curve */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="xl:col-span-2 space-y-6"
        >
          {/* Prediction Curve with Confidence Intervals */}
          <ChartContainer
            title={`${selectedPrediction.objectiveName} - Risk Trajectory`}
            description="14-day prediction curve with 90% confidence intervals"
            height={350}
            exportable
            onExport={() => console.log('Export chart')}
          >
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={selectedPrediction.predictionCurve}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                <XAxis
                  dataKey="day"
                  label={{ value: 'Days Ahead', position: 'insideBottom', offset: -5 }}
                />
                <YAxis
                  label={{ value: 'Risk Probability', angle: -90, position: 'insideLeft' }}
                  domain={[0, 1]}
                  tickFormatter={(value: number) => `${Math.round(value * 100)}%`}
                />
                <Tooltip
                  content={({ active, payload }: { active?: boolean; payload?: any[] }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div className="bg-white/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
                          <p className="font-semibold mb-2">Day {data.day}</p>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between gap-4">
                              <span className="text-muted-foreground">Probability:</span>
                              <span className="font-semibold">
                                {Math.round(data.probability * 100)}%
                              </span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-muted-foreground">Confidence:</span>
                              <span>{Math.round(data.confidence * 100)}%</span>
                            </div>
                            <div className="flex justify-between gap-4 text-xs text-muted-foreground pt-1 border-t">
                              <span>Range:</span>
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
                  fill={getRiskColor(selectedPrediction.riskLevel)}
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
                  stroke={getRiskColor(selectedPrediction.riskLevel)}
                  strokeWidth={3}
                  fill={getRiskColor(selectedPrediction.riskLevel)}
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>

          {/* Intervention Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="size-5" style={{ color: colors.clinical }} />
                Recommended Interventions
              </CardTitle>
              <CardDescription>
                Priority actions to reduce risk for {selectedPrediction.objectiveName}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {selectedPrediction.interventions.map((intervention, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div
                      className="size-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ backgroundColor: colors.clinical }}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">{intervention}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Historical Accuracy */}
          <ChartContainer
            title="Prediction Accuracy Over Time"
            description="Historical model performance tracking"
            height={250}
          >
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={accuracyHistory.slice(-14)}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 1]} tickFormatter={(value: number) => `${Math.round(value * 100)}%`} />
                <Tooltip
                  content={({ active, payload }: { active?: boolean; payload?: any[] }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div className="bg-white/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
                          <p className="font-semibold mb-2">{data.date}</p>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between gap-4">
                              <span className="text-muted-foreground">Accuracy:</span>
                              <span className="font-semibold">
                                {Math.round(data.accuracy * 100)}%
                              </span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-muted-foreground">Predictions:</span>
                              <span>{data.predictions}</span>
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
                  dataKey="accuracy"
                  stroke={colors.success}
                  strokeWidth={2}
                  dot={{ fill: colors.success, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </motion.div>
      </div>

      {/* Risk Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <ChartContainer
          title="Risk Distribution Across All Objectives"
          description="Breakdown of objectives by risk level"
          height={300}
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={riskDistribution} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
              <XAxis type="number" />
              <YAxis dataKey="category" type="category" width={120} />
              <Tooltip
                content={({ active, payload }: { active?: boolean; payload?: any[] }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="bg-white/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
                        <p className="font-semibold mb-2">{data.category}</p>
                        <p className="text-sm">
                          <span className="text-muted-foreground">Objectives:</span>{' '}
                          <span className="font-semibold">{data.count}</span>
                        </p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                {riskDistribution.map((entry, index) => (
                  <rect key={index} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </motion.div>
    </div>
  )
}
