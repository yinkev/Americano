'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { formatDuration, formatDurationHuman } from '@/lib/format-time'
import {
  Clock,
  BookOpen,
  Target,
  ArrowLeft,
  TrendingUp,
  Star,
  CheckCircle2,
  Share2,
  Download,
  PlayCircle,
  Eye,
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { TimePerObjectiveChart } from '@/components/study/charts/time-per-objective-chart'
import { SelfAssessmentRadarChart } from '@/components/study/charts/self-assessment-radar-chart'
import { AccuracyTrendsChart } from '@/components/study/charts/accuracy-trends-chart'
import { MissionFeedbackDialog } from '@/components/missions/feedback-dialog'

interface ObjectiveCompletion {
  objectiveId: string
  completedAt: string
  timeSpentMs: number
  selfAssessment: number
  confidenceRating: number
  notes?: string
}

interface CalibrationMetrics {
  totalValidations: number;
  avgConfidenceVsPerformanceGap: number;
  categoryDistribution: {
    overconfident: number;
    underconfident: number;
    calibrated: number;
  };
  reflectionCompletionRate: number;
  calibrationTimeMinutes: number;
}

interface SessionData {
  id: string
  userId: string
  startedAt: string
  completedAt: string
  durationMs: number
  reviewsCompleted: number
  newCardsStudied: number
  sessionNotes: string | null
  objectiveCompletions: ObjectiveCompletion[] | null
  mission: {
    id: string
    objectives: {
      objectiveId: string
      estimatedMinutes: number
      objective?: {
        objective: string
        complexity: string
      }
    }[]
  } | null
  reviews: Array<{
    id: string
    rating: string
    card: {
      id: string
      front: string
      lecture: {
        id: string
        title: string
        course: {
          name: string;
        };
      } | null;
    };
  }>;
  calibrationMetrics?: CalibrationMetrics;
}

export default function SessionSummaryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [session, setSession] = useState<SessionData | null>(null)
  const [notes, setNotes] = useState('')
  const [isSavingNotes, setIsSavingNotes] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false)
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch(`/api/learning/sessions/${id}`)
        if (!response.ok) {
          throw new Error('Failed to fetch session')
        }
        const data = await response.json()
        setSession(data.data.session)
        setNotes(data.data.session.sessionNotes || '')

        // Show feedback dialog if mission exists and feedback hasn't been submitted yet
        if (data.data.session.mission && !feedbackSubmitted) {
          // Delay showing the dialog slightly for better UX
          setTimeout(() => {
            setShowFeedbackDialog(true)
          }, 1000)
        }
      } catch (error) {
        console.error('Error fetching session:', error)
        toast.error('Failed to load session')
      } finally {
        setIsLoading(false)
      }
    }

    fetchSession()
  }, [id, feedbackSubmitted])

  // Summary actions (8.3)
  const handleStartAnotherMission = async () => {
    try {
      const response = await fetch('/api/learning/mission/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regenerate: false }),
      })
      if (!response.ok) throw new Error('Failed to generate mission')
      const data = await response.json()
      const missionId = data?.data?.mission?.id
      if (missionId) {
        toast.success('New mission generated')
        router.push(`/study?missionId=${missionId}`)
      } else {
        throw new Error('Mission ID missing in response')
      }
    } catch (err) {
      console.error('Start another mission failed:', err)
      toast.error('Could not create a new mission')
    }
  }

  const handleReviewWeakAreas = async () => {
    try {
      const response = await fetch('/api/learning/mission/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prioritizeWeakAreas: true, regenerate: true }),
      })
      if (!response.ok) throw new Error('Failed to generate weak-areas mission')
      const data = await response.json()
      const missionId = data?.data?.mission?.id
      if (missionId) {
        toast.success('Weak areas mission ready')
        router.push(`/study?missionId=${missionId}`)
      } else {
        throw new Error('Mission ID missing in response')
      }
    } catch (err) {
      console.error('Review weak areas failed:', err)
      toast.error('Could not generate weak-areas mission')
    }
  }

  const handleExportSummary = () => {
    try {
      if (!session) throw new Error('No session loaded')
      const lines: string[] = []
      // Header metadata
      lines.push(`Session ID,${session.id}`)
      lines.push(`Started At,${session.startedAt}`)
      lines.push(`Completed At,${session.completedAt}`)
      lines.push(`Duration,${formatDuration(session.durationMs || 0)}`)
      lines.push('')
      // Table header
      lines.push('Objective,Time Spent (min),Estimated (min),Self-Assessment,Confidence')

      const completions = session.objectiveCompletions || []
      completions.forEach((c, index) => {
        const missionObj = session.mission?.objectives.find((o) => o.objectiveId === c.objectiveId)
        const name = missionObj?.objective?.objective || `Objective ${index + 1}`
        const spent = Math.round((c.timeSpentMs || 0) / 60000)
        const est = missionObj?.estimatedMinutes ?? 0
        const self = c.selfAssessment ?? ''
        const conf = c.confidenceRating ?? ''
        // Escape commas by wrapping in quotes if needed
        const safeName = name.includes(',') ? `"${name.replace(/"/g, '""')}"` : name
        lines.push([safeName, spent, est, self, conf].join(','))
      })

      const csv = lines.join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const dateStr = new Date(session.startedAt).toISOString().slice(0, 10)
      link.download = `session-summary-${dateStr}-${session.id}.csv`
      link.click()
      URL.revokeObjectURL(url)
      toast.success('Summary exported')
    } catch (err) {
      console.error('Export summary failed:', err)
      toast.error('Failed to export summary')
    }
  }

  const handleShareProgress = () => {
    try {
      if (!session) throw new Error('No session loaded')

      // Calculate card accuracy (weighted scoring: EASY=100%, GOOD=80%, HARD=60%, AGAIN=0%)
      const reviews = session.reviews || []
      let totalScore = 0
      const ratingWeights: Record<string, number> = {
        EASY: 100,
        GOOD: 80,
        HARD: 60,
        AGAIN: 0,
      }

      reviews.forEach((review) => {
        totalScore += ratingWeights[review.rating] || 0
      })

      const cardAccuracy = reviews.length > 0 ? Math.round(totalScore / reviews.length) : 0

      const completions = session.objectiveCompletions || []
      const objectivesCompleted = completions.length
      const totalObjectives = session.mission?.objectives.length || completions.length
      const completionPercentage =
        totalObjectives > 0 ? Math.round((objectivesCompleted / totalObjectives) * 100) : 100

      const sessionDate = format(new Date(session.startedAt), 'MMMM d, yyyy')

      const summary = `📚 Study Session Summary - ${sessionDate}

✅ Objectives: ${objectivesCompleted}/${totalObjectives} (${completionPercentage}%)
⏱️  Study Time: ${formatDurationHuman(session.durationMs)}
🎴 Cards Reviewed: ${session.reviewsCompleted} (${cardAccuracy}% accuracy)
⭐ New Cards: ${session.newCardsStudied}

View full summary: ${window.location.href}`

      navigator.clipboard.writeText(summary)
      toast.success('Summary copied to clipboard!')
    } catch (err) {
      console.error('Share progress failed:', err)
      toast.error('Failed to copy summary')
    }
  }

  const handleSaveNotes = async () => {
    if (!session) return

    setIsSavingNotes(true)
    try {
      const response = await fetch(`/api/learning/sessions/${id}/notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      })

      if (!response.ok) {
        throw new Error('Failed to save notes')
      }

      const data = await response.json()
      setSession(data.data.session)
      toast.success('Notes saved!')
    } catch (error) {
      console.error('Error saving notes:', error)
      toast.error('Failed to save notes')
    } finally {
      setIsSavingNotes(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-center" style={{ color: 'oklch(0.5 0.1 250)' }}>
            Loading session...
          </p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-center" style={{ color: 'oklch(0.5 0.1 250)' }}>
            Session not found
          </p>
        </div>
      </div>
    )
  }

  const sessionDate = format(new Date(session.startedAt), 'MMMM d, yyyy')
  const sessionTime = format(new Date(session.startedAt), 'h:mm a')

  // Calculate card accuracy (weighted scoring: EASY=100%, GOOD=80%, HARD=60%, AGAIN=0%)
  const reviews = session.reviews || []
  let totalScore = 0
  const ratingWeights: Record<string, number> = {
    EASY: 100,
    GOOD: 80,
    HARD: 60,
    AGAIN: 0,
  }

  reviews.forEach((review) => {
    totalScore += ratingWeights[review.rating] || 0
  })

  const cardAccuracy = reviews.length > 0 ? Math.round(totalScore / reviews.length) : 0

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={() => router.push('/study')} className="mb-4 -ml-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Study
          </Button>
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'oklch(0.3 0.15 250)' }}>
            Session Summary
          </h1>
          <p className="text-base" style={{ color: 'oklch(0.5 0.1 250)' }}>
            {sessionDate} at {sessionTime}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Duration */}
          <div
            className="rounded-xl p-6 "
            style={{
              background: 'oklch(1 0 0 / 0.8)',
              boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
            }}
          >
            <div className="flex items-center gap-3 mb-2">
              <Clock className="h-5 w-5" style={{ color: 'oklch(0.55 0.2 250)' }} />
              <h3 className="font-semibold" style={{ color: 'oklch(0.4 0.15 250)' }}>
                Duration
              </h3>
            </div>
            <p className="text-3xl font-bold" style={{ color: 'oklch(0.3 0.15 250)' }}>
              {formatDuration(session.durationMs)}
            </p>
            <p className="text-sm mt-1" style={{ color: 'oklch(0.6 0.1 250)' }}>
              {formatDurationHuman(session.durationMs)}
            </p>
          </div>

          {/* Reviews */}
          <div
            className="rounded-xl p-6 "
            style={{
              background: 'oklch(1 0 0 / 0.8)',
              boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
            }}
          >
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="h-5 w-5" style={{ color: 'oklch(0.65 0.2 140)' }} />
              <h3 className="font-semibold" style={{ color: 'oklch(0.4 0.15 250)' }}>
                Cards Reviewed
              </h3>
            </div>
            <p className="text-3xl font-bold" style={{ color: 'oklch(0.3 0.15 250)' }}>
              {session.reviewsCompleted}
            </p>
            <p className="text-sm mt-1" style={{ color: 'oklch(0.6 0.1 250)' }}>
              {cardAccuracy}% accuracy
            </p>
          </div>

          {/* New Cards */}
          <div
            className="rounded-xl p-6 "
            style={{
              background: 'oklch(1 0 0 / 0.8)',
              boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
            }}
          >
            <div className="flex items-center gap-3 mb-2">
              <Target className="h-5 w-5" style={{ color: 'oklch(0.6 0.2 30)' }} />
              <h3 className="font-semibold" style={{ color: 'oklch(0.4 0.15 250)' }}>
                New Cards
              </h3>
            </div>
            <p className="text-3xl font-bold" style={{ color: 'oklch(0.3 0.15 250)' }}>
              {session.newCardsStudied}
            </p>
            <p className="text-sm mt-1" style={{ color: 'oklch(0.6 0.1 250)' }}>
              new
            </p>
          </div>
        </div>

        {/* Session Notes */}
        <div
          className="rounded-xl p-6  mb-8"
          style={{
            background: 'oklch(1 0 0 / 0.8)',
            boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
          }}
        >
          <h3 className="font-semibold mb-4" style={{ color: 'oklch(0.4 0.15 250)' }}>
            Session Notes
          </h3>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes about this study session..."
            className="min-h-[120px] mb-4"
            maxLength={1000}
          />
          <div className="flex justify-between items-center">
            <p className="text-sm" style={{ color: 'oklch(0.6 0.1 250)' }}>
              {notes.length}/1000 characters
            </p>
            <Button
              onClick={handleSaveNotes}
              disabled={isSavingNotes || notes === (session.sessionNotes || '')}
              className="min-h-[44px]"
            >
              {isSavingNotes ? 'Saving...' : 'Save Notes'}
            </Button>
          </div>
        </div>

        {/* Content Studied */}
        {session.reviews.length > 0 && (
          <div
            className="rounded-xl p-6 "
            style={{
              background: 'oklch(1 0 0 / 0.8)',
              boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
            }}
          >
            <h3 className="font-semibold mb-4" style={{ color: 'oklch(0.4 0.15 250)' }}>
              Content Studied
            </h3>
            <div className="space-y-2">
              {session.reviews.slice(0, 10).map((review) => (
                <div
                  key={review.id}
                  className="p-3 rounded-xl"
                  style={{ background: 'oklch(0.98 0.005 250)' }}
                >
                  <p className="text-sm font-medium" style={{ color: 'oklch(0.4 0.15 250)' }}>
                    {review.card.front.slice(0, 100)}
                    {review.card.front.length > 100 && '...'}
                  </p>
                  {review.card.lecture && (
                    <p className="text-xs mt-1" style={{ color: 'oklch(0.6 0.1 250)' }}>
                      {review.card.lecture.course.name} • {review.card.lecture.title}
                    </p>
                  )}
                </div>
              ))}
              {session.reviews.length > 10 && (
                <p className="text-sm text-center pt-2" style={{ color: 'oklch(0.6 0.1 250)' }}>
                  +{session.reviews.length - 10} more cards reviewed
                </p>
              )}
            </div>
          </div>
        )}

        {/* Mission Objective Breakdown */}
        {session.objectiveCompletions && session.objectiveCompletions.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-6" style={{ color: 'oklch(0.3 0.15 250)' }}>
              Objective Breakdown
            </h2>

            {/* Objective Table */}
            <div
              className="rounded-xl p-6  mb-8"
              style={{
                background: 'oklch(1 0 0 / 0.8)',
                boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
              }}
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b" style={{ borderColor: 'oklch(0.9 0.01 250)' }}>
                      <th
                        className="text-left py-3 px-4 font-semibold"
                        style={{ color: 'oklch(0.4 0.15 250)' }}
                      >
                        Objective
                      </th>
                      <th
                        className="text-center py-3 px-4 font-semibold"
                        style={{ color: 'oklch(0.4 0.15 250)' }}
                      >
                        Time Spent
                      </th>
                      <th
                        className="text-center py-3 px-4 font-semibold"
                        style={{ color: 'oklch(0.4 0.15 250)' }}
                      >
                        Estimated
                      </th>
                      <th
                        className="text-center py-3 px-4 font-semibold"
                        style={{ color: 'oklch(0.4 0.15 250)' }}
                      >
                        Self-Assessment
                      </th>
                      <th
                        className="text-center py-3 px-4 font-semibold"
                        style={{ color: 'oklch(0.4 0.15 250)' }}
                      >
                        Confidence
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {session.objectiveCompletions.map((completion, index) => {
                      const missionObjective = session.mission?.objectives.find(
                        (obj) => obj.objectiveId === completion.objectiveId,
                      )
                      const timeSpentMinutes = Math.round(completion.timeSpentMs / 60000)
                      const estimatedMinutes = missionObjective?.estimatedMinutes || 0
                      const timeDelta = timeSpentMinutes - estimatedMinutes

                      return (
                        <tr
                          key={completion.objectiveId}
                          className="border-b"
                          style={{ borderColor: 'oklch(0.95 0.005 250)' }}
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-start gap-2">
                              <CheckCircle2
                                className="h-5 w-5 mt-0.5 flex-shrink-0"
                                style={{ color: 'oklch(0.65 0.2 140)' }}
                              />
                              <div>
                                <p
                                  className="text-sm font-medium"
                                  style={{ color: 'oklch(0.4 0.15 250)' }}
                                >
                                  {missionObjective?.objective?.objective ||
                                    `Objective ${index + 1}`}
                                </p>
                                {missionObjective?.objective?.complexity && (
                                  <span
                                    className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full"
                                    style={{
                                      background: 'oklch(0.95 0.01 250)',
                                      color: 'oklch(0.5 0.1 250)',
                                    }}
                                  >
                                    {missionObjective.objective.complexity}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span
                              className="text-sm font-medium"
                              style={{ color: 'oklch(0.4 0.15 250)' }}
                            >
                              {timeSpentMinutes}m
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="text-sm" style={{ color: 'oklch(0.5 0.1 250)' }}>
                              {estimatedMinutes}m
                            </span>
                            {timeDelta !== 0 && (
                              <span
                                className="block text-xs mt-1"
                                style={{
                                  color:
                                    timeDelta > 0 ? 'oklch(0.6 0.15 30)' : 'oklch(0.65 0.2 140)',
                                }}
                              >
                                {timeDelta > 0 ? '+' : ''}
                                {timeDelta}m
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Star
                                className="h-4 w-4"
                                style={{ color: 'oklch(0.7 0.15 60)' }}
                                fill="oklch(0.7 0.15 60)"
                              />
                              <span
                                className="text-sm font-medium"
                                style={{ color: 'oklch(0.4 0.15 250)' }}
                              >
                                {completion.selfAssessment}/5
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Star
                                className="h-4 w-4"
                                style={{ color: 'oklch(0.7 0.15 60)' }}
                                fill="oklch(0.7 0.15 60)"
                              />
                              <span
                                className="text-sm font-medium"
                                style={{ color: 'oklch(0.4 0.15 250)' }}
                              >
                                {completion.confidenceRating}/5
                              </span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Time Per Objective Chart */}
              <div
                className="rounded-xl p-6 "
                style={{
                  background: 'oklch(1 0 0 / 0.8)',
                  boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
                }}
              >
                <h3 className="font-semibold mb-4" style={{ color: 'oklch(0.4 0.15 250)' }}>
                  Time per Objective
                </h3>
                <TimePerObjectiveChart
                  data={session.objectiveCompletions.map((completion, index) => {
                    const missionObjective = session.mission?.objectives.find(
                      (obj) => obj.objectiveId === completion.objectiveId,
                    )
                    return {
                      objective: `Obj ${index + 1}`,
                      timeSpentMinutes: Math.round(completion.timeSpentMs / 60000),
                      estimatedMinutes: missionObjective?.estimatedMinutes || 0,
                    }
                  })}
                />
              </div>

              {/* Self-Assessment Radar Chart */}
              <div
                className="rounded-xl p-6 "
                style={{
                  background: 'oklch(1 0 0 / 0.8)',
                  boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
                }}
              >
                <h3 className="font-semibold mb-4" style={{ color: 'oklch(0.4 0.15 250)' }}>
                  Self-Assessment Overview
                </h3>
                <SelfAssessmentRadarChart
                  data={session.objectiveCompletions.map((completion, index) => ({
                    objective: `Obj ${index + 1}`,
                    score: completion.selfAssessment,
                  }))}
                />
              </div>
            </div>

            {/* Accuracy Trends Chart */}
            <div
              className="rounded-xl p-6  mb-8"
              style={{
                background: 'oklch(1 0 0 / 0.8)',
                boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
              }}
            >
              <h3 className="font-semibold mb-4" style={{ color: 'oklch(0.4 0.15 250)' }}>
                Assessment & Confidence Trends
              </h3>
              <AccuracyTrendsChart
                data={session.objectiveCompletions.map((completion, index) => ({
                  objectiveName: `Objective ${index + 1}`,
                  confidenceRating: completion.confidenceRating,
                  selfAssessment: completion.selfAssessment,
                }))}
              />
            </div>
          </div>
        )}

        {/* Performance Insights */}
        {session.objectiveCompletions && session.objectiveCompletions.length > 0 && (
          <div
            className="rounded-xl p-6  mb-8"
            style={{
              background: 'oklch(1 0 0 / 0.8)',
              boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="h-5 w-5" style={{ color: 'oklch(0.55 0.2 250)' }} />
              <h3 className="font-semibold" style={{ color: 'oklch(0.4 0.15 250)' }}>
                Performance Insights
              </h3>
            </div>
            <div className="space-y-3">
              {(() => {
                const completions = session.objectiveCompletions
                const avgSelfAssessment = (
                  completions.reduce((sum, c) => sum + c.selfAssessment, 0) / completions.length
                ).toFixed(1)
                const avgConfidence = (
                  completions.reduce((sum, c) => sum + c.confidenceRating, 0) / completions.length
                ).toFixed(1)

                const totalActualTime =
                  completions.reduce((sum, c) => sum + c.timeSpentMs, 0) / 60000
                const totalEstimatedTime =
                  session.mission?.objectives.reduce((sum, obj) => sum + obj.estimatedMinutes, 0) ||
                  0
                const timeDeltaPercent =
                  totalEstimatedTime > 0
                    ? Math.round(
                        ((totalActualTime - totalEstimatedTime) / totalEstimatedTime) * 100,
                      )
                    : 0

                const lowConfidenceObjectives = completions.filter((c) => c.confidenceRating <= 2)

                return (
                  <>
                    <div className="p-4 rounded-xl" style={{ background: 'oklch(0.98 0.005 250)' }}>
                      <p className="text-sm" style={{ color: 'oklch(0.4 0.15 250)' }}>
                        <strong>Average Self-Assessment:</strong> {avgSelfAssessment}/5 stars
                        {parseFloat(avgSelfAssessment) >= 4 && ' - Excellent understanding!'}
                        {parseFloat(avgSelfAssessment) >= 3 &&
                          parseFloat(avgSelfAssessment) < 4 &&
                          ' - Good progress!'}
                        {parseFloat(avgSelfAssessment) < 3 && ' - May need additional review'}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl" style={{ background: 'oklch(0.98 0.005 250)' }}>
                      <p className="text-sm" style={{ color: 'oklch(0.4 0.15 250)' }}>
                        <strong>Average Confidence:</strong> {avgConfidence}/5 stars
                      </p>
                    </div>

                    {totalEstimatedTime > 0 && (
                      <div
                        className="p-4 rounded-xl"
                        style={{ background: 'oklch(0.98 0.005 250)' }}
                      >
                        <p className="text-sm" style={{ color: 'oklch(0.4 0.15 250)' }}>
                          <strong>Time Management:</strong> You completed objectives{' '}
                          {timeDeltaPercent === 0 && 'exactly as estimated'}
                          {timeDeltaPercent > 0 && `${timeDeltaPercent}% slower than estimated`}
                          {timeDeltaPercent < 0 &&
                            `${Math.abs(timeDeltaPercent)}% faster than estimated`}
                        </p>
                      </div>
                    )}

                    {lowConfidenceObjectives.length > 0 && (
                      <div
                        className="p-4 rounded-xl"
                        style={{ background: 'oklch(0.98 0.01 30 / 0.1)' }}
                      >
                        <p
                          className="text-sm font-medium mb-2"
                          style={{ color: 'oklch(0.4 0.15 250)' }}
                        >
                          Recommended for Review:
                        </p>
                        <ul className="space-y-1">
                          {lowConfidenceObjectives.map((completion, index) => {
                            const missionObjective = session.mission?.objectives.find(
                              (obj) => obj.objectiveId === completion.objectiveId,
                            )
                            return (
                              <li
                                key={completion.objectiveId}
                                className="text-sm"
                                style={{ color: 'oklch(0.5 0.1 250)' }}
                              >
                                •{' '}
                                {missionObjective?.objective?.objective || `Objective ${index + 1}`}{' '}
                                (confidence: {completion.confidenceRating}/5)
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    )}
                  </>
                )
              })()}
            </div>
          </div>
        )}

        {/* Story 4.4 Task 10.6-10.8: Calibration Metrics */}
        {session.calibrationMetrics && session.calibrationMetrics.totalValidations > 0 && (
          <div
            className="rounded-xl p-6  mb-8"
            style={{
              background: 'oklch(1 0 0 / 0.8)',
              boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Target className="h-5 w-5" style={{ color: 'oklch(0.6 0.18 230)' }} />
              <h3 className="font-semibold" style={{ color: 'oklch(0.4 0.15 250)' }}>
                Confidence Calibration
              </h3>
            </div>
            <div className="space-y-3">
              {/* Average Gap */}
              <div
                className="p-4 rounded-xl"
                style={{ background: 'oklch(0.98 0.005 250)' }}
              >
                <p className="text-sm" style={{ color: 'oklch(0.4 0.15 250)' }}>
                  <strong>Average Confidence-Performance Gap:</strong>{' '}
                  {session.calibrationMetrics.avgConfidenceVsPerformanceGap}%
                  {session.calibrationMetrics.avgConfidenceVsPerformanceGap <= 15 && ' - Well calibrated!'}
                  {session.calibrationMetrics.avgConfidenceVsPerformanceGap > 15 && ' - Consider reviewing self-assessment accuracy'}
                </p>
              </div>

              {/* Category Distribution */}
              <div
                className="p-4 rounded-xl"
                style={{ background: 'oklch(0.98 0.005 250)' }}
              >
                <p className="text-sm font-medium mb-2" style={{ color: 'oklch(0.4 0.15 250)' }}>
                  Calibration Category Distribution:
                </p>
                <div className="grid grid-cols-3 gap-4 mt-2">
                  <div className="text-center">
                    <div
                      className="text-2xl font-bold mb-1"
                      style={{ color: 'oklch(0.65 0.20 25)' }}
                    >
                      {session.calibrationMetrics.categoryDistribution.overconfident}
                    </div>
                    <div className="text-xs" style={{ color: 'oklch(0.5 0.1 250)' }}>
                      Overconfident
                    </div>
                  </div>
                  <div className="text-center">
                    <div
                      className="text-2xl font-bold mb-1"
                      style={{ color: 'oklch(0.6 0.18 230)' }}
                    >
                      {session.calibrationMetrics.categoryDistribution.underconfident}
                    </div>
                    <div className="text-xs" style={{ color: 'oklch(0.5 0.1 250)' }}>
                      Underconfident
                    </div>
                  </div>
                  <div className="text-center">
                    <div
                      className="text-2xl font-bold mb-1"
                      style={{ color: 'oklch(0.7 0.15 145)' }}
                    >
                      {session.calibrationMetrics.categoryDistribution.calibrated}
                    </div>
                    <div className="text-xs" style={{ color: 'oklch(0.5 0.1 250)' }}>
                      Calibrated
                    </div>
                  </div>
                </div>
              </div>

              {/* Reflection Completion */}
              <div
                className="p-4 rounded-xl"
                style={{ background: 'oklch(0.98 0.005 250)' }}
              >
                <p className="text-sm" style={{ color: 'oklch(0.4 0.15 250)' }}>
                  <strong>Metacognitive Reflection:</strong>{' '}
                  {session.calibrationMetrics.reflectionCompletionRate}% completion rate
                  {session.calibrationMetrics.reflectionCompletionRate >= 80 && ' - Excellent engagement!'}
                  {session.calibrationMetrics.reflectionCompletionRate >= 50 && session.calibrationMetrics.reflectionCompletionRate < 80 && ' - Good reflection practice'}
                  {session.calibrationMetrics.reflectionCompletionRate < 50 && ' - Try reflecting more often to build metacognitive awareness'}
                </p>
              </div>

              {/* Total Validations */}
              <div
                className="p-4 rounded-xl"
                style={{ background: 'oklch(0.98 0.005 250)' }}
              >
                <p className="text-sm" style={{ color: 'oklch(0.4 0.15 250)' }}>
                  <strong>Total Comprehension Validations:</strong>{' '}
                  {session.calibrationMetrics.totalValidations}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-8">
          <h3 className="font-semibold mb-4 text-center" style={{ color: 'oklch(0.4 0.15 250)' }}>
            What's Next?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              onClick={handleStartAnotherMission}
              className="min-h-[44px] px-6 flex items-center justify-center gap-2"
            >
              <PlayCircle className="h-4 w-4" />
              Start Another Mission
            </Button>
            <Button
              variant="outline"
              onClick={handleReviewWeakAreas}
              className="min-h-[44px] px-6 flex items-center justify-center gap-2"
            >
              <Eye className="h-4 w-4" />
              Review Weak Areas
            </Button>
            <Button
              variant="outline"
              onClick={handleExportSummary}
              className="min-h-[44px] px-6 flex items-center justify-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export Summary
            </Button>
            <Button
              variant="outline"
              onClick={handleShareProgress}
              className="min-h-[44px] px-6 flex items-center justify-center gap-2"
            >
              <Share2 className="h-4 w-4" />
              Share Progress
            </Button>
          </div>
        </div>

        {/* Mission Feedback Dialog - Story 2.6 Task B */}
        {session.mission && (
          <MissionFeedbackDialog
            missionId={session.mission.id}
            open={showFeedbackDialog}
            onOpenChange={setShowFeedbackDialog}
            onSubmit={() => {
              setFeedbackSubmitted(true)
              setShowFeedbackDialog(false)
            }}
          />
        )}
      </div>
    </div>
  )
}
