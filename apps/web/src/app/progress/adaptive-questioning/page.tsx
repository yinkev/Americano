'use client'

import {
  Award,
  CheckCircle2,
  CircleDot,
  Clock,
  Filter,
  Lightbulb,
  Target,
  TrendingUp,
  XCircle,
  Zap,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
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
import { Card } from '@/components/ui/card'

/**
 * Difficulty trajectory point for line chart
 */
interface DifficultyPoint {
  questionNumber: number
  difficulty: number
  score: number
}

/**
 * Score vs Difficulty point for scatter plot
 */
interface PerformancePoint {
  difficulty: number
  score: number
  conceptName: string
  date: string
}

/**
 * IRT estimate data
 */
interface IrtEstimate {
  theta: number // Knowledge estimate (-3 to +3 scale, converted to 0-100 for display)
  confidenceInterval: number // ±X points at 95% confidence
  iterations: number
}

/**
 * Mastery progress criteria
 */
interface MasteryCriteria {
  id: string
  label: string
  description: string
  completed: boolean
}

/**
 * Session history entry
 */
interface SessionHistoryEntry {
  id: string
  questionNumber: number
  conceptName: string
  difficulty: number
  score: number
  timeSpent: number // seconds
  date: string
}

/**
 * Efficiency metrics
 */
interface EfficiencyMetrics {
  questionsAsked: number
  baselineQuestions: number
  questionsSaved: number
  efficiencyPercentage: number
  timeSavedMinutes: number
}

/**
 * Skill tree level
 */
interface SkillLevel {
  level: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED'
  progress: number // 0-100
  mastered: boolean
  unlocked: boolean
}

/**
 * Adaptive Questioning Analytics Dashboard (Story 4.5 Task 10)
 *
 * Comprehensive analytics for adaptive questioning with:
 * - Line chart: Difficulty trajectory over questions asked
 * - Scatter plot: Score vs Difficulty (target zone: 60-80% correct)
 * - IRT estimate display (theta on 0-100 scale)
 * - Mastery progress tracker (5 criteria checklist)
 * - Session history table (questions, difficulty, score, time)
 * - Efficiency metrics (questions saved vs baseline 15)
 * - Skill tree visualization (BASIC/INTERMEDIATE/ADVANCED progress)
 *
 * Design: Glassmorphism with OKLCH colors, responsive, accessible
 *
 * @see Story 4.5 Task 10 (Analytics Dashboard)
 * @see Story 4.5 AC#7 (Assessment Efficiency Optimization)
 */
export default function AdaptiveQuestioningDashboardPage() {
  const [difficultyTrajectory, setDifficultyTrajectory] = useState<DifficultyPoint[]>([])
  const [performanceData, setPerformanceData] = useState<PerformancePoint[]>([])
  const [irtEstimate, setIrtEstimate] = useState<IrtEstimate | null>(null)
  const [masteryCriteria, setMasteryCriteria] = useState<MasteryCriteria[]>([])
  const [sessionHistory, setSessionHistory] = useState<SessionHistoryEntry[]>([])
  const [efficiencyMetrics, setEfficiencyMetrics] = useState<EfficiencyMetrics | null>(null)
  const [skillTree, setSkillTree] = useState<SkillLevel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dateRange, setDateRange] = useState<'7days' | '30days' | '90days'>('30days')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchAnalyticsData()
  }, [dateRange])

  const fetchAnalyticsData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/adaptive/analytics?dateRange=${dateRange}`)
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data')
      }
      const result = await response.json()
      const data = result.data

      setDifficultyTrajectory(data.difficultyTrajectory || [])
      setPerformanceData(data.performanceData || [])
      setIrtEstimate(data.irtEstimate || null)
      setMasteryCriteria(data.masteryCriteria || [])
      setSessionHistory(data.sessionHistory || [])
      setEfficiencyMetrics(data.efficiencyMetrics || null)
      setSkillTree(data.skillTree || [])
    } catch (error) {
      console.error('Error fetching analytics data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Convert IRT theta (-3 to +3) to 0-100 scale for display
  const thetaToDisplay = (theta: number) => {
    return Math.round(((theta + 3) / 6) * 100)
  }

  // Format time in seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Determine difficulty color
  const getDifficultyColor = (difficulty: number) => {
    if (difficulty < 40) return 'oklch(0.7 0.15 145)' // Green (Low)
    if (difficulty < 70) return 'oklch(0.75 0.12 85)' // Yellow (Medium)
    return 'oklch(0.65 0.20 25)' // Red (High)
  }

  // Completed criteria count
  const completedCount = masteryCriteria.filter((c) => c.completed).length

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading analytics data...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-heading font-bold text-foreground">
            Adaptive Questioning Analytics
          </h1>
          <p className="text-base text-muted-foreground">
            Track your adaptive learning journey and assessment efficiency
          </p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium bg-white/60 text-gray-700 hover:bg-white/80 shadow-sm transition-colors min-h-[44px]"
          aria-label="Toggle filters"
          aria-expanded={showFilters}
        >
          <Filter className="w-4 h-4" />
          Filters
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="p-6 bg-white/95 backdrop-blur-xl border border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] mb-6">
          <h3 className="text-lg font-heading font-bold text-foreground mb-4">Date Range</h3>
          <div className="flex gap-3 flex-wrap">
            {(['7days', '30days', '90days'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 rounded-xl font-medium transition-colors min-h-[44px] ${
                  dateRange === range
                    ? 'bg-[oklch(0.55_0.22_264)] text-white'
                    : 'bg-white/60 text-gray-700 hover:bg-white/80'
                }`}
                aria-pressed={dateRange === range}
              >
                {range === '7days' ? '7 Days' : range === '30days' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* IRT Estimate */}
        <Card className="p-6 bg-white/95 backdrop-blur-xl border border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)]">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Knowledge Level</span>
              <Target className="w-4 h-4 text-muted-foreground" />
            </div>
            {irtEstimate ? (
              <>
                <p className="text-3xl font-heading font-bold text-foreground">
                  {thetaToDisplay(irtEstimate.theta)}
                  <span className="text-lg text-muted-foreground">/100</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  ±{irtEstimate.confidenceInterval} points (95% CI)
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Not enough data</p>
            )}
          </div>
        </Card>

        {/* Mastery Progress */}
        <Card className="p-6 bg-white/95 backdrop-blur-xl border border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)]">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Mastery Progress</span>
              <Award className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-3xl font-heading font-bold text-foreground">
              {completedCount}/{masteryCriteria.length}
            </p>
            <p className="text-xs text-muted-foreground">
              {Math.round((completedCount / Math.max(masteryCriteria.length, 1)) * 100)}% complete
            </p>
          </div>
        </Card>

        {/* Efficiency Score */}
        {efficiencyMetrics && (
          <>
            <Card className="p-6 bg-white/95 backdrop-blur-xl border border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)]">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Efficiency</span>
                  <Zap className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-3xl font-heading font-bold text-foreground">
                  {efficiencyMetrics.efficiencyPercentage}%
                </p>
                <p className="text-xs text-muted-foreground">
                  {efficiencyMetrics.questionsSaved} questions saved
                </p>
              </div>
            </Card>

            <Card className="p-6 bg-white/95 backdrop-blur-xl border border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)]">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Time Saved</span>
                  <Clock className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-3xl font-heading font-bold text-foreground">
                  {efficiencyMetrics.timeSavedMinutes}
                  <span className="text-lg text-muted-foreground">m</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  vs. {efficiencyMetrics.baselineQuestions} question baseline
                </p>
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Difficulty Trajectory Line Chart */}
      {difficultyTrajectory.length > 0 && (
        <Card className="p-6 bg-white/95 backdrop-blur-xl border border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)]">
          <h2 className="text-xl font-heading font-semibold mb-6">
            Difficulty Progression Over Questions
          </h2>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart
              data={difficultyTrajectory}
              margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
            >
              <CartesianGrid stroke="oklch(0.9 0.02 240)" strokeDasharray="5 5" />
              <XAxis dataKey="questionNumber" stroke="#666" tick={{ fill: '#666', fontSize: 12 }}>
                <Label
                  value="Question Number"
                  position="insideBottom"
                  offset={-5}
                  style={{ fill: '#666', fontSize: 14 }}
                />
              </XAxis>
              <YAxis domain={[0, 100]} stroke="#666" tick={{ fill: '#666', fontSize: 12 }}>
                <Label
                  value="Difficulty Level"
                  angle={-90}
                  position="insideLeft"
                  style={{ fill: '#666', fontSize: 14 }}
                />
              </YAxis>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(12px)',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 8px 32px rgba(31,38,135,0.1)',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="difficulty"
                stroke="oklch(0.55 0.22 264)"
                strokeWidth={3}
                dot={{ r: 5 }}
                name="Difficulty"
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="oklch(0.7 0.15 145)"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Your Score"
              />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-sm text-muted-foreground mt-4 text-center">
            Track how question difficulty adapts to your performance in real-time
          </p>
        </Card>
      )}

      {/* Score vs Difficulty Scatter Plot */}
      {performanceData.length > 0 && (
        <Card className="p-6 bg-white/95 backdrop-blur-xl border border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)]">
          <h2 className="text-xl font-heading font-semibold mb-6">
            Performance vs Difficulty (Target Zone: 60-80%)
          </h2>
          <ResponsiveContainer width="100%" height={450}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 60 }}>
              <CartesianGrid stroke="oklch(0.9 0.02 240)" strokeDasharray="5 5" />
              <XAxis
                type="number"
                dataKey="difficulty"
                name="Difficulty"
                domain={[0, 100]}
                tick={{ fill: 'oklch(0.556 0 0)', fontSize: 12 }}
              >
                <Label
                  value="Difficulty Level (0-100)"
                  position="insideBottom"
                  offset={-40}
                  style={{ fill: 'oklch(0.556 0 0)', fontSize: 14 }}
                />
              </XAxis>
              <YAxis
                type="number"
                dataKey="score"
                name="Score"
                domain={[0, 100]}
                tick={{ fill: 'oklch(0.556 0 0)', fontSize: 12 }}
              >
                <Label
                  value="Score (%)"
                  angle={-90}
                  position="insideLeft"
                  offset={-40}
                  style={{ fill: 'oklch(0.556 0 0)', fontSize: 14 }}
                />
              </YAxis>
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }: { active?: boolean; payload?: any[] }) => {
                  if (active && payload && payload.length > 0) {
                    const data = payload[0].payload as PerformancePoint
                    return (
                      <div className="bg-white/95 backdrop-blur-xl border border-white/30 shadow-lg p-3 rounded-lg">
                        <p className="font-semibold text-sm mb-1">{data.conceptName}</p>
                        <p className="text-xs text-muted-foreground">
                          Difficulty: {data.difficulty} | Score: {data.score}%
                        </p>
                        <p className="text-xs text-muted-foreground">{data.date}</p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              {/* Target zone highlighting (60-80% score) */}
              <ReferenceLine
                y={60}
                stroke="oklch(0.7 0.15 145)"
                strokeDasharray="3 3"
                strokeWidth={2}
                label={{
                  value: 'Target Zone (60-80%)',
                  position: 'insideTopRight',
                  fill: 'oklch(0.7 0.15 145)',
                  fontSize: 11,
                }}
              />
              <ReferenceLine
                y={80}
                stroke="oklch(0.7 0.15 145)"
                strokeDasharray="3 3"
                strokeWidth={2}
              />
              <Scatter name="Assessments" data={performanceData} fill="oklch(0.55 0.22 264)" />
            </ScatterChart>
          </ResponsiveContainer>
          <p className="text-sm text-muted-foreground mt-4 text-center">
            Optimal challenge zone: Questions where you score 60-80% (not too easy, not too hard)
          </p>
        </Card>
      )}

      {/* Mastery Progress Tracker & Skill Tree */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mastery Criteria Checklist */}
        <Card className="p-6 bg-white/95 backdrop-blur-xl border border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)]">
          <div className="flex items-center gap-3 mb-6">
            <Award className="w-6 h-6" style={{ color: 'oklch(0.8 0.15 60)' }} />
            <h2 className="text-xl font-heading font-semibold">Mastery Verification</h2>
          </div>
          <div className="space-y-4">
            {masteryCriteria.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Start answering questions to track your mastery progress
              </p>
            ) : (
              masteryCriteria.map((criterion) => (
                <div
                  key={criterion.id}
                  className="flex items-start gap-3 p-3 rounded-xl border"
                  style={{
                    backgroundColor: criterion.completed
                      ? 'oklch(0.95 0.05 145)'
                      : 'oklch(0.98 0.02 240)',
                    borderColor: criterion.completed
                      ? 'oklch(0.85 0.08 145)'
                      : 'oklch(0.9 0.02 240)',
                  }}
                >
                  {criterion.completed ? (
                    <CheckCircle2
                      className="w-5 h-5 flex-shrink-0 mt-0.5"
                      style={{ color: 'oklch(0.7 0.15 145)' }}
                    />
                  ) : (
                    <XCircle
                      className="w-5 h-5 flex-shrink-0 mt-0.5"
                      style={{ color: 'oklch(0.65 0.08 240)' }}
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-sm text-gray-900">{criterion.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{criterion.description}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          {completedCount === masteryCriteria.length && masteryCriteria.length > 0 && (
            <div
              className="mt-6 p-4 rounded-xl border flex items-center gap-3"
              style={{
                backgroundColor: 'oklch(0.95 0.05 60)',
                borderColor: 'oklch(0.85 0.08 60)',
              }}
            >
              <Award className="w-6 h-6" style={{ color: 'oklch(0.8 0.15 60)' }} />
              <div>
                <p className="font-semibold text-gray-900">Mastery Achieved!</p>
                <p className="text-sm text-muted-foreground">
                  All criteria met - you've demonstrated comprehensive understanding
                </p>
              </div>
            </div>
          )}
        </Card>

        {/* Skill Tree Visualization */}
        <Card className="p-6 bg-white/95 backdrop-blur-xl border border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)]">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-6 h-6" style={{ color: 'oklch(0.55 0.22 264)' }} />
            <h2 className="text-xl font-heading font-semibold">Complexity Progression</h2>
          </div>
          <div className="space-y-6">
            {skillTree.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Complete assessments to unlock higher complexity levels
              </p>
            ) : (
              skillTree.map((level, index) => (
                <div key={level.level} className="relative">
                  {/* Connection line to next level */}
                  {index < skillTree.length - 1 && (
                    <div
                      className="absolute left-6 top-14 w-0.5 h-8"
                      style={{
                        backgroundColor: skillTree[index + 1].unlocked
                          ? 'oklch(0.7 0.15 145)'
                          : 'oklch(0.9 0.02 240)',
                      }}
                    />
                  )}

                  <div className="flex items-start gap-4">
                    {/* Level icon */}
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center border-2 flex-shrink-0"
                      style={{
                        backgroundColor: level.mastered
                          ? 'oklch(0.8 0.15 60)'
                          : level.unlocked
                            ? 'oklch(0.95 0.05 264)'
                            : 'oklch(0.95 0.02 240)',
                        borderColor: level.mastered
                          ? 'oklch(0.8 0.15 60)'
                          : level.unlocked
                            ? 'oklch(0.55 0.22 264)'
                            : 'oklch(0.85 0.05 240)',
                      }}
                    >
                      {level.mastered ? (
                        <Award className="w-6 h-6 text-white" />
                      ) : level.unlocked ? (
                        <CircleDot className="w-6 h-6" style={{ color: 'oklch(0.55 0.22 264)' }} />
                      ) : (
                        <CircleDot className="w-6 h-6 text-gray-400" />
                      )}
                    </div>

                    {/* Level details */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{level.level}</h3>
                        {level.mastered && (
                          <span
                            className="text-xs font-medium px-2 py-1 rounded-full"
                            style={{
                              backgroundColor: 'oklch(0.95 0.05 60)',
                              color: 'oklch(0.5 0.15 60)',
                            }}
                          >
                            MASTERED
                          </span>
                        )}
                        {!level.unlocked && (
                          <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                            LOCKED
                          </span>
                        )}
                      </div>

                      {/* Progress bar */}
                      {level.unlocked && (
                        <div className="space-y-1">
                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full transition-all duration-500 rounded-full"
                              style={{
                                width: `${level.progress}%`,
                                backgroundColor: level.mastered
                                  ? 'oklch(0.8 0.15 60)'
                                  : 'oklch(0.55 0.22 264)',
                              }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {level.progress}% complete
                          </p>
                        </div>
                      )}

                      {!level.unlocked && (
                        <p className="text-sm text-muted-foreground">
                          Complete {skillTree[index - 1]?.level || 'previous'} level to unlock
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Session History Table */}
      {sessionHistory.length > 0 && (
        <Card className="p-6 bg-white/95 backdrop-blur-xl border border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)]">
          <h2 className="text-xl font-heading font-semibold mb-6">Recent Session History</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Q#</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">
                    Concept
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-sm text-gray-700">
                    Difficulty
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-sm text-gray-700">
                    Score
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-sm text-gray-700">
                    Time
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Date</th>
                </tr>
              </thead>
              <tbody>
                {sessionHistory.map((entry) => (
                  <tr key={entry.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="py-3 px-4 text-sm text-gray-900">{entry.questionNumber}</td>
                    <td className="py-3 px-4 text-sm text-gray-900 font-medium">
                      {entry.conceptName}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: `${getDifficultyColor(entry.difficulty)}20`,
                          color: getDifficultyColor(entry.difficulty),
                        }}
                      >
                        {entry.difficulty}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-sm font-semibold text-gray-900">{entry.score}%</span>
                    </td>
                    <td className="py-3 px-4 text-center text-sm text-gray-600">
                      {formatTime(entry.timeSpent)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{entry.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Efficiency Comparison */}
      {efficiencyMetrics && (
        <Card className="p-6 bg-white/95 backdrop-blur-xl border border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)]">
          <h2 className="text-xl font-heading font-semibold mb-6">Assessment Efficiency</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bar comparison */}
            <div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={[
                    { name: 'Baseline', questions: efficiencyMetrics.baselineQuestions },
                    { name: 'Adaptive', questions: efficiencyMetrics.questionsAsked },
                  ]}
                  margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
                >
                  <CartesianGrid stroke="oklch(0.9 0.02 240)" strokeDasharray="5 5" />
                  <XAxis dataKey="name" stroke="#666" tick={{ fill: '#666', fontSize: 12 }} />
                  <YAxis stroke="#666" tick={{ fill: '#666', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(12px)',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 8px 32px rgba(31,38,135,0.1)',
                    }}
                  />
                  <Bar dataKey="questions" radius={[8, 8, 0, 0]}>
                    <Cell fill="oklch(0.65 0.08 240)" />
                    <Cell fill="oklch(0.55 0.22 264)" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Metrics text */}
            <div className="flex items-center">
              <div className="space-y-4">
                <div
                  className="p-4 rounded-xl border"
                  style={{
                    backgroundColor: 'oklch(0.95 0.05 145)',
                    borderColor: 'oklch(0.85 0.08 145)',
                  }}
                >
                  <p className="text-sm text-muted-foreground mb-1">Questions Saved</p>
                  <p
                    className="text-3xl font-heading font-bold"
                    style={{ color: 'oklch(0.7 0.15 145)' }}
                  >
                    {efficiencyMetrics.questionsSaved}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {efficiencyMetrics.efficiencyPercentage}% more efficient
                  </p>
                </div>
                <div
                  className="p-4 rounded-xl border"
                  style={{
                    backgroundColor: 'oklch(0.95 0.05 264)',
                    borderColor: 'oklch(0.85 0.08 264)',
                  }}
                >
                  <p className="text-sm text-muted-foreground mb-1">Time Saved</p>
                  <p
                    className="text-3xl font-heading font-bold"
                    style={{ color: 'oklch(0.55 0.22 264)' }}
                  >
                    {efficiencyMetrics.timeSavedMinutes}m
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Assessed in {efficiencyMetrics.questionsAsked} questions vs{' '}
                    {efficiencyMetrics.baselineQuestions}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Tips for Adaptive Learning */}
      <Card
        className="p-6 border"
        style={{
          backgroundColor: 'oklch(0.95 0.05 280)',
          borderColor: 'oklch(0.85 0.08 280)',
        }}
      >
        <div className="flex items-start gap-4">
          <Lightbulb
            className="w-6 h-6 flex-shrink-0 mt-1"
            style={{ color: 'oklch(0.68 0.16 280)' }}
          />
          <div className="flex-1">
            <h3 className="text-lg font-heading font-semibold mb-3">
              Maximizing Your Adaptive Learning
            </h3>
            <ul className="space-y-2 text-sm text-foreground">
              <li className="flex items-start gap-2">
                <span style={{ color: 'oklch(0.68 0.16 280)' }}>•</span>
                <span>
                  <strong>Target zone (60-80%):</strong> Questions should challenge you without
                  being overwhelming. This is your optimal learning zone.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: 'oklch(0.68 0.16 280)' }}>•</span>
                <span>
                  <strong>Efficiency matters:</strong> The system adapts to assess your knowledge
                  faster. Trust the process and embrace early stopping when confidence is high.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: 'oklch(0.68 0.16 280)' }}>•</span>
                <span>
                  <strong>Progress through complexity:</strong> Master BASIC concepts before
                  INTERMEDIATE and ADVANCED unlock. Build a strong foundation.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: 'oklch(0.68 0.16 280)' }}>•</span>
                <span>
                  <strong>Mastery requires consistency:</strong> All 5 criteria must be met,
                  including time-spacing. This ensures durable learning, not cramming.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}
