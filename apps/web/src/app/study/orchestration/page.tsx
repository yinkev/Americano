'use client'

import { Brain, Calendar, Clock, History, Play, Settings, TrendingUp } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { CalendarStatusWidget } from '@/components/orchestration/CalendarStatusWidget'
import { CognitiveLoadIndicator } from '@/components/orchestration/CognitiveLoadIndicator'
import { OptimalTimeSlotsPanel } from '@/components/orchestration/OptimalTimeSlotsPanel'
import { SessionPlanPreview } from '@/components/orchestration/SessionPlanPreview'
import { SessionPlanCustomizeDialog } from '@/components/orchestration/session-plan-customize-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useStudySession } from '@/hooks/use-study-session'
import { useUserStore } from '@/store/use-user-store'

interface TimeSlot {
  startTime: string
  endTime: string
  duration: number
  score: number
  confidence: number
  reasoning: string[]
  calendarConflict: boolean
  conflictingEvents?: Array<{ summary: string; start: string; end: string }>
}

interface SessionPlan {
  id: string
  startTime: string
  endTime: string
  duration: number
  intensity: 'LOW' | 'MEDIUM' | 'HIGH'
  contentSequence: {
    sequence: Array<{
      type: 'flashcard' | 'new_flashcard' | 'validation' | 'clinical' | 'lecture' | 'break'
      id: string | null
      duration: number
      phase: 'warmup' | 'peak' | 'winddown'
      difficulty?: number
    }>
    totalDuration: number
    phases: {
      warmUp: number
      peak: number
      windDown: number
    }
  }
  breaks: {
    breakIntervals: number[]
    breakDurations: number[]
    totalBreakTime: number
    reasoning: string
  }
  confidence: number
}

export default function OrchestrationPage() {
  const router = useRouter()
  const { userEmail } = useUserStore()

  // Wave 2: Study session hook for state management
  const studySession = useStudySession()

  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null)
  const [sessionPlan, setSessionPlan] = useState<SessionPlan | null>(null)
  const [loadingPlan, setLoadingPlan] = useState(false)
  const [showCustomizeDialog, setShowCustomizeDialog] = useState(false)
  const [calendarConnected, setCalendarConnected] = useState(false)
  const [sessionHistory, setSessionHistory] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  // Fetch recent session history on mount
  useEffect(() => {
    async function fetchSessionHistory() {
      setLoadingHistory(true)
      try {
        const res = await fetch(`/api/learning/sessions?limit=5&userId=${userEmail}`)
        if (!res.ok) throw new Error('Failed to fetch session history')

        const data = await res.json()
        setSessionHistory(data.data?.sessions || [])
      } catch (err) {
        console.error('Failed to fetch session history:', err)
      } finally {
        setLoadingHistory(false)
      }
    }

    fetchSessionHistory()
  }, [userEmail])

  // Fetch session plan when time slot is selected
  useEffect(() => {
    if (!selectedTimeSlot) {
      setSessionPlan(null)
      return
    }

    async function fetchSessionPlan() {
      if (!selectedTimeSlot) return

      setLoadingPlan(true)
      try {
        const res = await fetch('/api/orchestration/session-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userEmail,
            startTime: selectedTimeSlot.startTime,
            duration: selectedTimeSlot.duration,
          }),
        })

        if (!res.ok) throw new Error('Failed to fetch session plan')

        const data = await res.json()
        setSessionPlan(data.plan)
      } catch (err) {
        console.error('Failed to fetch session plan:', err)
        toast.error('Failed to load session plan')
      } finally {
        setLoadingPlan(false)
      }
    }

    fetchSessionPlan()
  }, [selectedTimeSlot, userEmail])

  function handleTimeSlotSelect(timeSlot: TimeSlot) {
    setSelectedTimeSlot(timeSlot)
  }

  function handleStartSession() {
    if (!selectedTimeSlot) return

    // Navigate to study session with the selected time slot
    const params = new URLSearchParams({
      startTime: selectedTimeSlot.startTime,
      duration: selectedTimeSlot.duration.toString(),
    })
    router.push(`/study?${params.toString()}`)
  }

  function handleCustomizeSchedule() {
    setShowCustomizeDialog(true)
  }

  function handleCalendarSettings() {
    // Navigate to calendar settings
    router.push('/settings?tab=calendar')
  }

  function handleCalendarStatusChange(connected: boolean) {
    setCalendarConnected(connected)
  }

  function handleSavePlanCustomization(customPlan: Partial<SessionPlan>) {
    if (sessionPlan) {
      setSessionPlan({ ...sessionPlan, ...customPlan })
      toast.success('Session plan customized')
    }
    setShowCustomizeDialog(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[oklch(0.98_0.02_250)] via-[oklch(0.96_0.01_250)] to-[oklch(0.94_0.02_250)]">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-full bg-[oklch(0.7_0.15_230)]/10 p-3">
              <Clock className="size-6 text-[oklch(0.7_0.15_230)]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[oklch(0.145_0_0)]">Study Orchestration</h1>
              <p className="text-[oklch(0.556_0_0)]">
                AI-powered timing and session planning for optimal learning
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Time Slots and Session Plan */}
          <div className="lg:col-span-2 space-y-6">
            {/* Today's Recommended Study Schedule */}
            <Card className="rounded-2xl bg-white/80 backdrop-blur-md border border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="size-5 text-[oklch(0.7_0.15_230)]" />
                  Today's Recommended Study Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-[oklch(0.556_0_0)] mb-4">
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>

                {/* Quick Action Buttons */}
                <div className="flex items-center gap-3 mb-6">
                  <Button
                    onClick={handleStartSession}
                    disabled={!selectedTimeSlot}
                    className="bg-[oklch(0.7_0.15_230)] hover:bg-[oklch(0.65_0.15_230)]"
                  >
                    <Play className="size-4 mr-2" />
                    Start Recommended Session
                  </Button>
                  <Button variant="outline" onClick={handleCustomizeSchedule}>
                    <Settings className="size-4 mr-2" />
                    Customize Schedule
                  </Button>
                </div>

                {/* Selected Time Slot Info */}
                {selectedTimeSlot && (
                  <div className="p-4 rounded-xl bg-[oklch(0.7_0.15_230)]/5 border border-[oklch(0.7_0.15_230)]/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-[oklch(0.145_0_0)] mb-1">
                          Selected Time Slot
                        </h4>
                        <p className="text-sm text-[oklch(0.556_0_0)]">
                          {selectedTimeSlot.startTime} - {selectedTimeSlot.endTime}
                        </p>
                      </div>
                      <Button size="sm" onClick={() => setSelectedTimeSlot(null)} variant="outline">
                        Change
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Optimal Time Recommendations */}
            <OptimalTimeSlotsPanel userId={userEmail} onSelectSlot={handleTimeSlotSelect} />

            {/* Session Plan Preview */}
            {selectedTimeSlot && (
              <SessionPlanPreview
                plan={sessionPlan}
                loading={loadingPlan}
                onCustomize={handleCustomizeSchedule}
              />
            )}
          </div>

          {/* Right Column - Cognitive Load and Calendar Status */}
          <div className="space-y-6">
            {/* Cognitive Load Indicator */}
            <CognitiveLoadIndicator userId={userEmail} />

            {/* Calendar Integration Status */}
            <CalendarStatusWidget userId={userEmail} onStatusChange={handleCalendarStatusChange} />

            {/* Session History - Wave 2 Feature */}
            <Card className="rounded-2xl bg-white/80 backdrop-blur-md border border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="size-5 text-[oklch(0.7_0.15_230)]" />
                  Recent Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingHistory ? (
                  <div className="space-y-3">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : sessionHistory.length > 0 ? (
                  <div className="space-y-3">
                    {sessionHistory.map((session) => (
                      <button
                        key={session.id}
                        onClick={() => router.push(`/study/sessions/${session.id}`)}
                        className="w-full text-left p-3 rounded-lg hover:bg-[oklch(0.7_0.15_230)]/5 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Clock className="size-3 text-[oklch(0.556_0_0)]" />
                              <p className="text-xs text-[oklch(0.556_0_0)]">
                                {new Date(session.startedAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="mt-1 flex items-center gap-2">
                              <TrendingUp className="size-3 text-[oklch(0.7_0.15_230)]" />
                              <p className="text-sm font-medium text-[oklch(0.145_0_0)]">
                                {Math.floor((session.durationMs || 0) / 60000)}m session
                              </p>
                            </div>
                          </div>
                          <div className="ml-2">
                            <div className="text-xs font-semibold text-[oklch(0.7_0.15_145)]">
                              {session.reviewsCompleted || 0} cards
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => router.push('/sessions')}
                    >
                      View All Sessions
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-[oklch(0.556_0_0)] text-center py-4">
                    No recent sessions
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Quick Settings */}
            <Card className="rounded-2xl bg-white/80 backdrop-blur-md border border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="size-5" />
                  Quick Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => router.push('/settings')}
                  >
                    <Settings className="size-4 mr-2" />
                    Study Preferences
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => router.push('/settings/exams')}
                  >
                    <Calendar className="size-4 mr-2" />
                    Exam Schedule
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => router.push('/priorities')}
                  >
                    <Brain className="size-4 mr-2" />
                    Learning Priorities
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Section - Additional Info */}
        <div className="mt-8">
          <Card className="rounded-2xl bg-white/80 backdrop-blur-md border border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="size-5 text-[oklch(0.7_0.15_230)]" />
                How It Works
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="rounded-full bg-[oklch(0.7_0.15_230)]/10 p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                    <Clock className="size-8 text-[oklch(0.7_0.15_230)]" />
                  </div>
                  <h3 className="font-semibold text-[oklch(0.145_0_0)] mb-2">Pattern Analysis</h3>
                  <p className="text-sm text-[oklch(0.556_0_0)]">
                    We analyze your historical performance data to identify when you learn best
                  </p>
                </div>

                <div className="text-center">
                  <div className="rounded-full bg-[oklch(0.75_0.15_160)]/10 p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                    <Brain className="size-8 text-[oklch(0.75_0.15_160)]" />
                  </div>
                  <h3 className="font-semibold text-[oklch(0.145_0_0)] mb-2">
                    Cognitive Awareness
                  </h3>
                  <p className="text-sm text-[oklch(0.556_0_0)]">
                    Session intensity adapts to your current cognitive load and fatigue levels
                  </p>
                </div>

                <div className="text-center">
                  <div className="rounded-full bg-[oklch(0.7_0.15_50)]/10 p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                    <Calendar className="size-8 text-[oklch(0.7_0.15_50)]" />
                  </div>
                  <h3 className="font-semibold text-[oklch(0.145_0_0)] mb-2">Smart Scheduling</h3>
                  <p className="text-sm text-[oklch(0.556_0_0)]">
                    Calendar integration prevents conflicts and finds optimal study windows
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Session Plan Customization Dialog */}
        {sessionPlan && (
          <SessionPlanCustomizeDialog
            open={showCustomizeDialog}
            onOpenChange={setShowCustomizeDialog}
            currentPlan={sessionPlan}
            onSave={handleSavePlanCustomization}
          />
        )}
      </div>
    </div>
  )
}
