/**
 * Orchestration Dashboard Page
 * Story 5.3 Task 7.1
 *
 * Main dashboard for session orchestration featuring:
 * - Optimal time slot recommendations
 * - Session plan preview
 * - Cognitive load monitoring
 * - Calendar integration status
 */

'use client'

import { Brain, Calendar, Clock, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { CalendarStatusWidget } from '@/components/orchestration/CalendarStatusWidget'
import { CognitiveLoadIndicator } from '@/components/orchestration/CognitiveLoadIndicator'
import { OptimalTimeSlotsPanel } from '@/components/orchestration/OptimalTimeSlotsPanel'
import { SessionPlanPreview } from '@/components/orchestration/SessionPlanPreview'

// Temporary mock user ID - replace with actual auth
const MOCK_USER_ID = 'test-user-123'

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
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [sessionPlan, setSessionPlan] = useState<SessionPlan | null>(null)
  const [loadingPlan, setLoadingPlan] = useState(false)
  const [calendarConnected, setCalendarConnected] = useState(false)

  async function handleSelectSlot(slot: TimeSlot) {
    setSelectedSlot(slot)
    setLoadingPlan(true)

    try {
      const res = await fetch('/api/orchestration/session-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: MOCK_USER_ID,
          missionId: 'mission-example', // In real app, get from context
          startTime: slot.startTime,
          duration: slot.duration,
        }),
      })

      if (!res.ok) throw new Error('Failed to create session plan')

      const data = await res.json()
      setSessionPlan(data.plan)
    } catch (err) {
      console.error('Failed to create session plan:', err)
    } finally {
      setLoadingPlan(false)
    }
  }

  function handleCustomizePlan() {
    // TODO: Open customization modal
    console.log('Customize plan clicked')
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'oklch(0.98 0.01 230)' }}>
      {/* Header */}
      <header
        className="border-b sticky top-0 z-10 backdrop-blur-md"
        style={{
          backgroundColor: 'oklch(0.98 0.01 230)/0.8',
          borderColor: 'oklch(0.9 0.02 230)',
        }}
      >
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl" style={{ backgroundColor: 'oklch(0.7 0.12 145)/0.1' }}>
              <Sparkles className="size-6" style={{ color: 'oklch(0.5 0.2 145)' }} />
            </div>
            <div>
              <h1 className="font-heading text-3xl font-bold text-foreground">
                Smart Session Orchestration
              </h1>
              <p className="text-muted-foreground mt-1">
                Personalized study recommendations based on your patterns and availability
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Info Banner */}
        {!calendarConnected && (
          <div
            className="mb-6 p-4 rounded-lg border"
            style={{
              backgroundColor: 'oklch(0.8 0.15 85)/0.1',
              borderColor: 'oklch(0.8 0.15 85)',
              borderLeft: '4px solid oklch(0.8 0.15 85)',
            }}
          >
            <div className="flex items-start gap-3">
              <Calendar
                className="size-5 shrink-0 mt-0.5"
                style={{ color: 'oklch(0.6 0.15 85)' }}
              />
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground mb-1">
                  Connect your calendar for better recommendations
                </p>
                <p className="text-xs text-muted-foreground">
                  We'll sync your availability to suggest conflict-free study times and improve
                  scheduling accuracy.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Time Slots */}
          <div className="lg:col-span-2 space-y-6">
            {/* Optimal Time Slots */}
            <OptimalTimeSlotsPanel userId={MOCK_USER_ID} onSelectSlot={handleSelectSlot} />

            {/* Session Plan Preview */}
            <SessionPlanPreview
              plan={sessionPlan}
              loading={loadingPlan}
              onCustomize={handleCustomizePlan}
            />
          </div>

          {/* Right Column - Widgets */}
          <div className="space-y-6">
            {/* Calendar Status */}
            <CalendarStatusWidget userId={MOCK_USER_ID} onStatusChange={setCalendarConnected} />

            {/* Cognitive Load */}
            <CognitiveLoadIndicator userId={MOCK_USER_ID} />

            {/* Quick Stats */}
            <QuickStatsCard />
          </div>
        </div>

        {/* Action Section */}
        {sessionPlan && (
          <div className="mt-8">
            <div
              className="p-6 rounded-xl border"
              style={{
                backgroundColor: 'oklch(0.7 0.12 145)/0.05',
                borderColor: 'oklch(0.7 0.12 145)/0.2',
              }}
            >
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-start gap-4 text-left">
                  <div
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: 'oklch(0.7 0.12 145)/0.1' }}
                  >
                    <Clock className="size-6" style={{ color: 'oklch(0.5 0.2 145)' }} />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-lg text-foreground">
                      Ready to Start?
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your personalized session plan is ready. Start studying at the optimal time
                      for best results.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 shrink-0">
                  <button
                    className="px-6 py-3 rounded-lg font-semibold transition-all hover:brightness-95"
                    style={{
                      backgroundColor: 'oklch(0.95 0.01 230)',
                      color: 'oklch(0.5 0.05 230)',
                    }}
                  >
                    Schedule for Later
                  </button>
                  <button
                    className="px-6 py-3 rounded-lg font-semibold transition-all hover:brightness-95"
                    style={{
                      backgroundColor: 'oklch(0.7 0.12 145)',
                      color: 'white',
                    }}
                  >
                    Start Session Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

/**
 * Quick Stats Card
 * Shows adherence and effectiveness metrics
 */
function QuickStatsCard() {
  return (
    <div className="bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-lg p-6 space-y-4">
      <h3 className="font-heading font-semibold text-lg text-foreground flex items-center gap-2">
        <Brain className="size-5" style={{ color: 'oklch(0.6 0.05 230)' }} />
        Your Progress
      </h3>

      <div className="space-y-3">
        {/* Adherence Rate */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Adherence Rate</span>
            <span className="text-sm font-semibold text-foreground">67%</span>
          </div>
          <div
            className="h-2 rounded-full overflow-hidden"
            style={{ backgroundColor: 'oklch(0.95 0.01 230)' }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: '67%',
                backgroundColor: 'oklch(0.7 0.12 145)',
              }}
            />
          </div>
        </div>

        {/* Performance Improvement */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Performance Boost</span>
            <span className="text-sm font-semibold" style={{ color: 'oklch(0.5 0.2 145)' }}>
              +23%
            </span>
          </div>
          <div
            className="h-2 rounded-full overflow-hidden"
            style={{ backgroundColor: 'oklch(0.95 0.01 230)' }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: '23%',
                backgroundColor: 'oklch(0.7 0.12 145)',
              }}
            />
          </div>
        </div>

        {/* Sessions This Week */}
        <div className="pt-3 border-t" style={{ borderColor: 'oklch(0.9 0.02 230)' }}>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">This Week</span>
            <div className="text-right">
              <p className="text-lg font-bold text-foreground">12</p>
              <p className="text-xs text-muted-foreground">orchestrated sessions</p>
            </div>
          </div>
        </div>
      </div>

      {/* View Details Link */}
      <button
        className="w-full py-2 text-sm font-medium transition-colors hover:underline"
        style={{ color: 'oklch(0.5 0.2 145)' }}
        onClick={() => (window.location.href = '/analytics/orchestration-effectiveness')}
      >
        View Full Analytics →
      </button>
    </div>
  )
}
