/**
 * MissionAdaptation Component
 * Story 2.6 - Task C: Mission Adaptation Settings
 *
 * Displays mission adaptation controls with:
 * - Auto-adapt difficulty toggle
 * - Manual duration/complexity/difficulty sliders
 * - Reset to recommended settings button
 * - Adaptation history display
 *
 * Maps to Acceptance Criteria #3
 */

'use client'

import { format } from 'date-fns'
import { Clock, RotateCcw, Settings, Sparkles, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'

interface UserProfile {
  id: string
  defaultMissionMinutes: number
  missionDifficulty: string
  lastMissionAdaptation: string | null
}

interface AdaptationEvent {
  timestamp: string
  change: string
  reason: string
}

export function MissionAdaptation() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [autoAdapt, setAutoAdapt] = useState(true)
  const [manualDuration, setManualDuration] = useState(50)
  const [manualDifficulty, setManualDifficulty] = useState(2) // 0=EASY, 1=MODERATE, 2=CHALLENGING
  const [adaptationHistory, setAdaptationHistory] = useState<AdaptationEvent[]>([])

  useEffect(() => {
    fetchProfile()
    fetchAdaptationHistory()
  }, [])

  async function fetchProfile() {
    try {
      setLoading(true)
      const response = await fetch('/api/user/profile', {
        headers: {
          'X-User-Email': 'kevy@americano.dev',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch profile')
      }

      const data = await response.json()
      const user = data.data.user

      setProfile(user)
      setManualDuration(user.defaultMissionMinutes || 50)
      setAutoAdapt(user.missionDifficulty === 'AUTO')

      // Map difficulty string to index
      const difficultyMap: Record<string, number> = {
        EASY: 0,
        MODERATE: 1,
        CHALLENGING: 2,
        AUTO: 1, // Default to moderate if AUTO
      }
      setManualDifficulty(difficultyMap[user.missionDifficulty] || 1)
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  async function fetchAdaptationHistory() {
    try {
      // In production, this would fetch from API
      // For now, we'll check lastMissionAdaptation from profile
      if (profile?.lastMissionAdaptation) {
        setAdaptationHistory([
          {
            timestamp: profile.lastMissionAdaptation,
            change: 'Mission difficulty adjusted',
            reason: 'Based on recent completion patterns',
          },
        ])
      }
    } catch (error) {
      console.error('Error fetching adaptation history:', error)
    }
  }

  async function handleSave() {
    if (!profile) return

    setSaving(true)
    try {
      const difficultyValues = ['EASY', 'MODERATE', 'CHALLENGING']
      const missionDifficulty = autoAdapt ? 'AUTO' : difficultyValues[manualDifficulty]

      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': 'kevy@americano.dev',
        },
        body: JSON.stringify({
          defaultMissionMinutes: manualDuration,
          missionDifficulty,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save settings')
      }

      const data = await response.json()
      setProfile(data.data.user)

      toast.success('Mission adaptation settings saved!')
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  async function handleResetToRecommended() {
    try {
      // Fetch recommended settings from analytics
      const response = await fetch('/api/analytics/missions/recommendations', {
        headers: {
          'X-User-Email': 'kevy@americano.dev',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch recommendations')
      }

      const data = await response.json()
      const recommendations = data.data.recommendations || []

      // Find duration recommendation
      const durationRec = recommendations.find((r: any) => r.type === 'DURATION')
      if (durationRec && durationRec.value?.duration) {
        setManualDuration(durationRec.value.duration)
      } else {
        // Default recommended settings
        setManualDuration(50)
      }

      setAutoAdapt(true)
      setManualDifficulty(1) // MODERATE

      toast.success('Reset to recommended settings!', {
        description: 'Based on your recent performance data',
      })
    } catch (error) {
      console.error('Error resetting settings:', error)
      // Fallback to sensible defaults
      setManualDuration(50)
      setAutoAdapt(true)
      setManualDifficulty(1)

      toast.success('Reset to default settings')
    }
  }

  if (loading) {
    return (
      <Card className="bg-white border shadow-sm rounded-lg">
        <CardHeader className="p-4">
          <CardTitle className="text-[20px] font-heading font-semibold tracking-tight">
            Mission Adaptation
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-muted rounded" />
            <div className="h-12 bg-muted rounded" />
            <div className="h-12 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const difficultyLabels = ['Easy', 'Moderate', 'Challenging']
  const difficultyColors = ['oklch(0.75 0.15 160)', 'oklch(0.7 0.15 50)', 'oklch(0.65 0.15 10)']

  return (
    <Card className="bg-white border shadow-sm hover:shadow-md transition-shadow duration-300 rounded-lg">
      <CardHeader className="p-4">
        <div className="flex items-center gap-3">
          <div
            className="rounded-full p-2"
            style={{ backgroundColor: 'oklch(0.7 0.15 280 / 0.1)' }}
          >
            <Settings className="size-5" style={{ color: 'oklch(0.7 0.15 280)' }} />
          </div>
          <div>
            <CardTitle className="text-[20px] font-heading font-semibold tracking-tight">
              Mission Adaptation
            </CardTitle>
            <CardDescription className="text-[13px] text-muted-foreground">
              Control how missions adapt to your performance
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-6">
        {/* Auto-Adapt Toggle */}
        <div className="flex items-center justify-between gap-4 p-4 rounded-lg bg-muted/10 border border-border hover:border-primary/30 hover:shadow-sm transition-all duration-200">
          <div className="space-y-0.5">
            <Label htmlFor="auto-adapt" className="text-[13px] font-medium cursor-pointer">
              Auto-adapt mission difficulty
            </Label>
            <p className="text-[11px] text-muted-foreground">
              Automatically adjust based on completion patterns
            </p>
          </div>
          <Switch id="auto-adapt" checked={autoAdapt} onCheckedChange={setAutoAdapt} />
        </div>

        {/* Manual Duration Override */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-muted-foreground" />
            <Label htmlFor="manual-duration" className="text-[13px] font-medium">
              Mission Duration
            </Label>
            {!autoAdapt && (
              <span
                className="text-[11px] text-muted-foreground px-2 py-0.5 rounded-full"
                style={{ backgroundColor: 'oklch(0.97 0 0)' }}
              >
                Manual Override
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <Slider
              id="manual-duration"
              min={30}
              max={90}
              step={5}
              value={[manualDuration]}
              onValueChange={(value) => setManualDuration(value[0])}
              disabled={autoAdapt}
              className="flex-1"
            />
            <span className="text-[13px] font-semibold w-20 text-right">{manualDuration} min</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {autoAdapt
              ? 'Duration will be automatically adjusted based on your performance'
              : 'Missions will target this duration regardless of performance'}
          </p>
        </div>

        {/* Manual Difficulty Override */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-4 text-muted-foreground" />
            <Label htmlFor="manual-difficulty" className="text-[13px] font-medium">
              Mission Difficulty
            </Label>
            {!autoAdapt && (
              <span
                className="text-[11px] text-muted-foreground px-2 py-0.5 rounded-full"
                style={{ backgroundColor: 'oklch(0.97 0 0)' }}
              >
                Manual Override
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <Slider
              id="manual-difficulty"
              min={0}
              max={2}
              step={1}
              value={[manualDifficulty]}
              onValueChange={(value) => setManualDifficulty(value[0])}
              disabled={autoAdapt}
              className="flex-1"
            />
            <span
              className="text-[13px] font-semibold w-28 text-right"
              style={{ color: difficultyColors[manualDifficulty] }}
            >
              {difficultyLabels[manualDifficulty]}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Easier</span>
            <span>More Challenging</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {autoAdapt
              ? 'Difficulty will adapt based on your 7-day completion rate'
              : 'Missions will use this difficulty level consistently'}
          </p>
        </div>

        {/* Adaptation History */}
        {profile?.lastMissionAdaptation && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-muted-foreground" />
              <Label className="text-[13px] font-medium">Recent Adaptation</Label>
            </div>
            <div
              className="p-4 rounded-lg border"
              style={{ backgroundColor: 'oklch(0.97 0 0)', borderColor: 'oklch(0.9 0 0)' }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="rounded-full p-2 flex-shrink-0"
                  style={{ backgroundColor: 'oklch(0.7 0.15 230 / 0.1)' }}
                >
                  <RotateCcw className="size-4" style={{ color: 'oklch(0.7 0.15 230)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium mb-1">Settings adjusted automatically</p>
                  <p className="text-[11px] text-muted-foreground mb-2">
                    Based on your recent completion patterns
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {format(new Date(profile.lastMissionAdaptation), 'MMMM d, yyyy')}
                  </p>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Adaptations are limited to once per week to maintain consistency
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            onClick={handleResetToRecommended}
            variant="outline"
            disabled={saving}
            className="flex-1 gap-2 text-[13px] hover:scale-[1.02] active:scale-[0.98] transition-transform duration-150"
          >
            <RotateCcw className="size-4" />
            Reset to Recommended
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 gap-2 text-[13px] hover:scale-[1.02] active:scale-[0.98] transition-transform duration-150"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
