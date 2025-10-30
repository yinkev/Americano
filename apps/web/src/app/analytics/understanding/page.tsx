/**
 * Understanding Analytics Dashboard - Agent 9
 * 4-dimensional understanding assessment with radar charts and skill profiles
 *
 * Features:
 * - Comprehension pattern dashboards
 * - 4D understanding scores (terminology, relationships, application, clarity)
 * - Radar charts for skill profiles
 * - Strengths/weaknesses breakdown
 * - Trend analysis over time
 */

'use client'

import { motion } from 'framer-motion'
import {
  Activity,
  Award,
  BookOpen,
  Brain,
  ChevronRight,
  Download,
  Lightbulb,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react'
import { useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { colors, typography } from '@/lib/design-tokens'
import { useUnderstandingDashboard } from '@/lib/api/hooks/analytics'

// Mock data for 4D understanding
const dimensionScores = {
  overall: 82.5,
  dimensions: [
    {
      name: 'Terminology',
      score: 88,
      percentile: 85,
      description: 'Medical vocabulary and terminology mastery',
      icon: BookOpen,
      color: colors.clinical,
    },
    {
      name: 'Relationships',
      score: 79,
      percentile: 72,
      description: 'Concept connections and interdependencies',
      icon: Brain,
      color: colors.lab,
    },
    {
      name: 'Application',
      score: 85,
      percentile: 81,
      description: 'Clinical scenario application',
      icon: Zap,
      color: colors.energy,
    },
    {
      name: 'Clarity',
      score: 78,
      percentile: 68,
      description: 'Explanation clarity for patients',
      icon: Lightbulb,
      color: colors.warning,
    },
  ],
}

// Radar chart data
const radarData = [
  {
    dimension: 'Terminology',
    you: 88,
    cohortAvg: 75,
    target: 85,
  },
  {
    dimension: 'Relationships',
    you: 79,
    cohortAvg: 78,
    target: 85,
  },
  {
    dimension: 'Application',
    you: 85,
    cohortAvg: 72,
    target: 85,
  },
  {
    dimension: 'Clarity',
    you: 78,
    cohortAvg: 70,
    target: 85,
  },
]

// Strengths and weaknesses
const strengths = [
  {
    name: 'Pharmacokinetics',
    dimension: 'Terminology',
    score: 94,
    improvement: '+12%',
  },
  {
    name: 'Cardiac Physiology',
    dimension: 'Application',
    score: 91,
    improvement: '+8%',
  },
  {
    name: 'Neuroanatomy',
    dimension: 'Terminology',
    score: 89,
    improvement: '+5%',
  },
]

const weaknesses = [
  {
    name: 'Immunology Pathways',
    dimension: 'Relationships',
    score: 62,
    trend: 'improving',
    recommendation: 'Review concept maps',
  },
  {
    name: 'Patient Communication',
    dimension: 'Clarity',
    score: 68,
    trend: 'stable',
    recommendation: 'Practice patient explanations',
  },
  {
    name: 'Renal Physiology',
    dimension: 'Application',
    score: 71,
    trend: 'declining',
    recommendation: 'Complete clinical cases',
  },
]

// Historical trend data (30 days)
const trendData = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  terminology: 75 + Math.random() * 10 + (i / 30) * 8,
  relationships: 70 + Math.random() * 8 + (i / 30) * 6,
  application: 72 + Math.random() * 12 + (i / 30) * 10,
  clarity: 68 + Math.random() * 9 + (i / 30) * 7,
}))

// Objectives by mastery level
const masteryBreakdown = [
  { level: 'Expert', count: 12, color: colors.success, threshold: '≥85%' },
  { level: 'Proficient', count: 18, color: colors.clinical, threshold: '70-84%' },
  { level: 'Developing', count: 8, color: colors.warning, threshold: '60-69%' },
  { level: 'Beginner', count: 3, color: colors.alert, threshold: '<60%' },
]

export default function UnderstandingAnalyticsPage() {
  const [timeRange, setTimeRange] = useState('30d')
  const [selectedDimension, setSelectedDimension] = useState(dimensionScores.dimensions[0])

  // Use real hook (falls back to mock data during development)
  const { data: dashboard, isLoading } = useUnderstandingDashboard('user_123', timeRange)

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
              style={{ backgroundColor: `color-mix(in oklch, ${colors.clinical}, transparent 90%)` }}
            >
              <Brain className="size-7" style={{ color: colors.clinical }} />
            </div>
            <div>
              <h1 className={`${typography.heading.h1} text-foreground`}>
                Understanding Analytics
              </h1>
              <p className={`${typography.body.small} text-muted-foreground`}>
                4-dimensional comprehension assessment across all learning objectives
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
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Download className="size-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Overall Score Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Overall Understanding Score</CardTitle>
                <CardDescription>Composite across all 4 dimensions</CardDescription>
              </div>
              <Award className="size-12" style={{ color: colors.clinical }} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <div className={`text-6xl font-bold`} style={{ color: colors.clinical }}>
                {dimensionScores.overall}
              </div>
              <div className="text-2xl text-muted-foreground mb-2">/100</div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <TrendingUp className="size-4" style={{ color: colors.success }} />
              <span className={`${typography.body.small}`} style={{ color: colors.success }}>
                +4.2% from last month
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 4D Dimension Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {dimensionScores.dimensions.map((dim, index) => {
          const Icon = dim.icon
          return (
            <motion.div
              key={dim.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
            >
              <Card
                interactive="interactive"
                onClick={() => setSelectedDimension(dim)}
                className={`cursor-pointer ${selectedDimension.name === dim.name ? 'ring-2' : ''}`}
                style={
                  selectedDimension.name === dim.name ? { borderColor: dim.color } : undefined
                }
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Icon className="size-5" style={{ color: dim.color }} />
                    <div
                      className="px-2 py-1 rounded-full text-xs font-semibold"
                      style={{
                        backgroundColor: `color-mix(in oklch, ${dim.color}, transparent 85%)`,
                        color: dim.color,
                      }}
                    >
                      {dim.percentile}th %ile
                    </div>
                  </div>
                  <CardTitle className="text-base mt-2">{dim.name}</CardTitle>
                  <CardDescription className="text-xs">{dim.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-1">
                    <div className="text-3xl font-bold" style={{ color: dim.color }}>
                      {dim.score}
                    </div>
                    <div className="text-lg text-muted-foreground mb-1">/100</div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column - Radar Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="xl:col-span-2 space-y-6"
        >
          {/* Skill Profile Radar */}
          <ChartContainer
            title="4D Skill Profile"
            description="Your performance vs cohort average vs target"
            height={400}
            exportable
            onExport={() => console.log('Export radar')}
          >
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={radarData}>
                <PolarGrid stroke={colors.border} />
                <PolarAngleAxis
                  dataKey="dimension"
                  tick={{ fill: colors.mutedForeground, fontSize: 12 }}
                />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: colors.mutedForeground }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div className="bg-white/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
                          <p className="font-semibold mb-2">{data.dimension}</p>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between gap-4">
                              <span style={{ color: colors.clinical }}>Your Score:</span>
                              <span className="font-semibold">{data.you}</span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span style={{ color: colors.warning }}>Cohort Avg:</span>
                              <span>{data.cohortAvg}</span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span style={{ color: colors.success }}>Target:</span>
                              <span>{data.target}</span>
                            </div>
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Radar
                  name="Your Score"
                  dataKey="you"
                  stroke={colors.clinical}
                  fill={colors.clinical}
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Radar
                  name="Cohort Average"
                  dataKey="cohortAvg"
                  stroke={colors.warning}
                  fill={colors.warning}
                  fillOpacity={0.1}
                  strokeWidth={1}
                  strokeDasharray="5 5"
                />
                <Radar
                  name="Target"
                  dataKey="target"
                  stroke={colors.success}
                  fill="none"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                />
              </RadarChart>
            </ResponsiveContainer>
          </ChartContainer>

          {/* Trend Analysis */}
          <ChartContainer
            title="Dimension Trends Over Time"
            description="30-day progress across all 4 dimensions"
            height={300}
          >
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                <XAxis dataKey="day" label={{ value: 'Days', position: 'insideBottom', offset: -5 }} />
                <YAxis domain={[60, 95]} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div className="bg-white/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
                          <p className="font-semibold mb-2">Day {data.day}</p>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between gap-4">
                              <span className="text-muted-foreground">Terminology:</span>
                              <span>{Math.round(data.terminology)}</span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-muted-foreground">Relationships:</span>
                              <span>{Math.round(data.relationships)}</span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-muted-foreground">Application:</span>
                              <span>{Math.round(data.application)}</span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-muted-foreground">Clarity:</span>
                              <span>{Math.round(data.clarity)}</span>
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
                  dataKey="terminology"
                  stroke={colors.clinical}
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="relationships"
                  stroke={colors.lab}
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="application"
                  stroke={colors.energy}
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="clarity"
                  stroke={colors.warning}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </motion.div>

        {/* Right Column - Strengths & Weaknesses */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="space-y-6"
        >
          {/* Strengths */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="size-5" style={{ color: colors.success }} />
                Top Strengths
              </CardTitle>
              <CardDescription>Objectives you've mastered</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {strengths.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
                  className="p-3 rounded-lg bg-green-50 border border-green-200 hover:bg-green-100 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.dimension}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold" style={{ color: colors.success }}>
                        {item.score}
                      </div>
                      <div className="text-xs" style={{ color: colors.success }}>
                        {item.improvement}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>

          {/* Weaknesses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="size-5" style={{ color: colors.warning }} />
                Improvement Areas
              </CardTitle>
              <CardDescription>Focus areas for growth</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {weaknesses.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.7 + index * 0.1 }}
                  className="p-3 rounded-lg bg-amber-50 border border-amber-200"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.dimension}</p>
                    </div>
                    <div
                      className="font-bold"
                      style={{
                        color:
                          item.score >= 70
                            ? colors.warning
                            : item.score >= 60
                              ? colors.warning
                              : colors.alert,
                      }}
                    >
                      {item.score}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-amber-200">
                    <ChevronRight className="size-3" />
                    <span>{item.recommendation}</span>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>

          {/* Mastery Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="size-5" style={{ color: colors.clinical }} />
                Mastery Breakdown
              </CardTitle>
              <CardDescription>Objectives by proficiency level</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {masteryBreakdown.map((level, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.8 + index * 0.1 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="size-10 rounded-full flex items-center justify-center text-lg font-bold text-white"
                      style={{ backgroundColor: level.color }}
                    >
                      {level.count}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{level.level}</p>
                      <p className="text-xs text-muted-foreground">{level.threshold}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
