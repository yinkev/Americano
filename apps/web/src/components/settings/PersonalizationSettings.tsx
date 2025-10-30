/**
 * PersonalizationSettings Component
 * Story 5.5 Task 12: User Control Over Personalization
 *
 * Provides user control over personalization level and individual features
 */

'use client'

import {
  Activity,
  BookOpen,
  Brain,
  Clock,
  Info,
  Pause,
  RotateCcw,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'

interface PersonalizationPreferences {
  personalizationLevel: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH'
  missionPersonalizationEnabled: boolean
  contentPersonalizationEnabled: boolean
  assessmentPersonalizationEnabled: boolean
  sessionPersonalizationEnabled: boolean
  autoAdaptEnabled: boolean
  disabledFeatures: string[]
  updatedAt: string
}

const PERSONALIZATION_LEVELS = [
  {
    value: 0,
    label: 'NONE',
    description: 'No personalization, default recommendations',
    color: 'oklch(0.556 0 0)',
  },
  {
    value: 1,
    label: 'LOW',
    description: 'Basic pattern-based adjustments',
    color: 'oklch(0.8 0.15 85)',
  },
  {
    value: 2,
    label: 'MEDIUM',
    description: 'Pattern + prediction-based personalization',
    color: 'oklch(0.7 0.15 145)',
  },
  {
    value: 3,
    label: 'HIGH',
    description: 'Full adaptive personalization (all features)',
    color: 'oklch(0.7 0.15 230)',
  },
]

export function PersonalizationSettings() {
  const [preferences, setPreferences] = useState<PersonalizationPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [showPauseDialog, setShowPauseDialog] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    fetchPreferences()
  }, [])

  async function fetchPreferences() {
    try {
      setLoading(true)
      const response = await fetch('/api/personalization/preferences')
      const data = await response.json()

      if (data.success && data.data.preferences) {
        setPreferences(data.data.preferences)
      } else {
        // Default preferences
        setPreferences({
          personalizationLevel: 'MEDIUM',
          missionPersonalizationEnabled: true,
          contentPersonalizationEnabled: true,
          assessmentPersonalizationEnabled: true,
          sessionPersonalizationEnabled: true,
          autoAdaptEnabled: true,
          disabledFeatures: [],
          updatedAt: new Date().toISOString(),
        })
      }
    } catch (error) {
      console.error('Error fetching preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  async function savePreferences(updates: Partial<PersonalizationPreferences>) {
    try {
      setSaving(true)
      const response = await fetch('/api/personalization/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      const data = await response.json()

      if (data.success && data.data.preferences) {
        setPreferences(data.data.preferences)
        setHasChanges(false)
      }
    } catch (error) {
      console.error('Error saving preferences:', error)
    } finally {
      setSaving(false)
    }
  }

  function handleLevelChange(values: number[]) {
    const newLevel = PERSONALIZATION_LEVELS[values[0]]
      .label as PersonalizationPreferences['personalizationLevel']
    setPreferences((prev) => (prev ? { ...prev, personalizationLevel: newLevel } : null))
    setHasChanges(true)
  }

  function handleFeatureToggle(
    feature: keyof Pick<
      PersonalizationPreferences,
      | 'missionPersonalizationEnabled'
      | 'contentPersonalizationEnabled'
      | 'assessmentPersonalizationEnabled'
      | 'sessionPersonalizationEnabled'
      | 'autoAdaptEnabled'
    >,
  ) {
    setPreferences((prev) => (prev ? { ...prev, [feature]: !prev[feature] } : null))
    setHasChanges(true)
  }

  async function handleSave() {
    if (!preferences) return

    await savePreferences({
      personalizationLevel: preferences.personalizationLevel,
      missionPersonalizationEnabled: preferences.missionPersonalizationEnabled,
      contentPersonalizationEnabled: preferences.contentPersonalizationEnabled,
      assessmentPersonalizationEnabled: preferences.assessmentPersonalizationEnabled,
      sessionPersonalizationEnabled: preferences.sessionPersonalizationEnabled,
      autoAdaptEnabled: preferences.autoAdaptEnabled,
    })
  }

  async function handleReset() {
    await savePreferences({
      personalizationLevel: 'MEDIUM',
      missionPersonalizationEnabled: true,
      contentPersonalizationEnabled: true,
      assessmentPersonalizationEnabled: true,
      sessionPersonalizationEnabled: true,
      autoAdaptEnabled: true,
      disabledFeatures: [],
    })
    setShowResetDialog(false)
  }

  async function handlePause() {
    await savePreferences({
      personalizationLevel: 'NONE',
    })
    setShowPauseDialog(false)
  }

  if (loading) {
    return (
      <Card className="bg-white border shadow-sm rounded-lg">
        <CardContent className="p-4 h-64 flex items-center justify-center">
          <p className="text-[13px] text-muted-foreground">Loading personalization settings...</p>
        </CardContent>
      </Card>
    )
  }

  if (!preferences) {
    return (
      <Card className="bg-white border shadow-sm rounded-lg">
        <CardContent className="p-4 h-64 flex items-center justify-center">
          <p className="text-[13px] text-muted-foreground">Failed to load preferences</p>
        </CardContent>
      </Card>
    )
  }

  const currentLevelIndex = PERSONALIZATION_LEVELS.findIndex(
    (l) => l.label === preferences.personalizationLevel,
  )
  const currentLevel = PERSONALIZATION_LEVELS[currentLevelIndex]

  return (
    <>
      <Card className="bg-white border shadow-sm hover:shadow-md transition-shadow duration-300 rounded-lg">
        <CardHeader className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-[20px] font-heading font-semibold tracking-tight flex items-center gap-2">
                <Sparkles className="size-5" style={{ color: 'oklch(0.7 0.15 230)' }} />
                Personalization Settings
              </CardTitle>
              <CardDescription className="text-[13px] text-muted-foreground mt-1">
                Control how the platform adapts to your learning patterns
              </CardDescription>
            </div>
            <Badge
              variant="outline"
              className="shrink-0 px-3 py-1.5 text-[11px]"
              style={{
                backgroundColor: `${currentLevel.color}15`,
                borderColor: currentLevel.color,
                color: currentLevel.color,
              }}
            >
              {currentLevel.label}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-6">
          {/* Personalization Level Slider */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-[15px] font-semibold">Personalization Level</Label>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-2 text-[13px] hover:scale-[1.02] active:scale-[0.98] transition-transform duration-150"
                onClick={() => window.open('/analytics/personalization', '_blank')}
              >
                <TrendingUp className="size-4" />
                View Dashboard
              </Button>
            </div>
            <div className="space-y-4 px-2">
              <Slider
                value={[currentLevelIndex]}
                min={0}
                max={3}
                step={1}
                onValueChange={handleLevelChange}
                className="w-full"
              />
              <div className="flex justify-between text-[11px] text-muted-foreground">
                {PERSONALIZATION_LEVELS.map((level) => (
                  <span
                    key={level.value}
                    className={
                      level.value === currentLevelIndex ? 'font-semibold text-foreground' : ''
                    }
                  >
                    {level.label}
                  </span>
                ))}
              </div>
            </div>
            <div className="p-4 rounded-lg bg-muted/30 border border-border">
              <div className="flex items-start gap-3">
                <Info className="size-5 shrink-0 mt-0.5" style={{ color: 'oklch(0.7 0.15 230)' }} />
                <div>
                  <p className="text-[13px] font-medium mb-1">{currentLevel.description}</p>
                  {preferences.personalizationLevel === 'NONE' && (
                    <p className="text-[11px] text-muted-foreground">
                      Standard recommendations without adaptation to your learning patterns.
                    </p>
                  )}
                  {preferences.personalizationLevel === 'LOW' && (
                    <p className="text-[11px] text-muted-foreground">
                      Adapts mission timing and session duration based on your patterns.
                    </p>
                  )}
                  {preferences.personalizationLevel === 'MEDIUM' && (
                    <p className="text-[11px] text-muted-foreground">
                      Adds content recommendations and assessment difficulty adjustments.
                    </p>
                  )}
                  {preferences.personalizationLevel === 'HIGH' && (
                    <p className="text-[11px] text-muted-foreground">
                      Full adaptive experience with cognitive load monitoring and proactive
                      interventions.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Feature-Level Toggles */}
          <div className="space-y-4">
            <Label className="text-[15px] font-semibold">Individual Features</Label>
            <div className="space-y-3">
              {/* Mission Timing */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/10 border border-border hover:border-primary/30 hover:shadow-sm transition-all duration-200">
                <div className="flex items-start gap-3 flex-1">
                  <Clock
                    className="size-5 shrink-0 mt-1"
                    style={{ color: 'oklch(0.7 0.15 230)' }}
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor="mission-timing"
                      className="text-[13px] font-medium cursor-pointer"
                    >
                      Adapt Mission Timing
                    </Label>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Recommend optimal study times based on your performance patterns
                    </p>
                  </div>
                </div>
                <Switch
                  id="mission-timing"
                  checked={preferences.missionPersonalizationEnabled}
                  onCheckedChange={() => handleFeatureToggle('missionPersonalizationEnabled')}
                  disabled={preferences.personalizationLevel === 'NONE'}
                />
              </div>

              {/* Session Duration */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/10 border border-border hover:border-primary/30 hover:shadow-sm transition-all duration-200">
                <div className="flex items-start gap-3 flex-1">
                  <Activity
                    className="size-5 shrink-0 mt-1"
                    style={{ color: 'oklch(0.7 0.15 145)' }}
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor="session-duration"
                      className="text-[13px] font-medium cursor-pointer"
                    >
                      Adapt Session Duration
                    </Label>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Adjust session length based on your attention patterns and focus capacity
                    </p>
                  </div>
                </div>
                <Switch
                  id="session-duration"
                  checked={preferences.sessionPersonalizationEnabled}
                  onCheckedChange={() => handleFeatureToggle('sessionPersonalizationEnabled')}
                  disabled={preferences.personalizationLevel === 'NONE'}
                />
              </div>

              {/* Content Recommendations */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/10 border border-border hover:border-primary/30 hover:shadow-sm transition-all duration-200">
                <div className="flex items-start gap-3 flex-1">
                  <BookOpen
                    className="size-5 shrink-0 mt-1"
                    style={{ color: 'oklch(0.8 0.15 85)' }}
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor="content-recs"
                      className="text-[13px] font-medium cursor-pointer"
                    >
                      Personalize Content Recommendations
                    </Label>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Tailor content suggestions to your learning style (visual, kinesthetic, etc.)
                    </p>
                  </div>
                </div>
                <Switch
                  id="content-recs"
                  checked={preferences.contentPersonalizationEnabled}
                  onCheckedChange={() => handleFeatureToggle('contentPersonalizationEnabled')}
                  disabled={
                    preferences.personalizationLevel === 'NONE' ||
                    preferences.personalizationLevel === 'LOW'
                  }
                />
              </div>

              {/* Assessment Difficulty */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/10 border border-border hover:border-primary/30 hover:shadow-sm transition-all duration-200">
                <div className="flex items-start gap-3 flex-1">
                  <Target
                    className="size-5 shrink-0 mt-1"
                    style={{ color: 'oklch(0.6 0.15 25)' }}
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor="assessment-diff"
                      className="text-[13px] font-medium cursor-pointer"
                    >
                      Adapt Assessment Difficulty
                    </Label>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Optimize question difficulty and frequency based on your progress
                    </p>
                  </div>
                </div>
                <Switch
                  id="assessment-diff"
                  checked={preferences.assessmentPersonalizationEnabled}
                  onCheckedChange={() => handleFeatureToggle('assessmentPersonalizationEnabled')}
                  disabled={
                    preferences.personalizationLevel === 'NONE' ||
                    preferences.personalizationLevel === 'LOW'
                  }
                />
              </div>

              {/* Cognitive Load Auto-Adjust */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/10 border border-border hover:border-primary/30 hover:shadow-sm transition-all duration-200">
                <div className="flex items-start gap-3 flex-1">
                  <Brain
                    className="size-5 shrink-0 mt-1"
                    style={{ color: 'oklch(0.7 0.15 300)' }}
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor="cognitive-load"
                      className="text-[13px] font-medium cursor-pointer"
                    >
                      Auto-Adjust Based on Cognitive Load
                    </Label>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Automatically reduce difficulty when stress or burnout is detected
                    </p>
                  </div>
                </div>
                <Switch
                  id="cognitive-load"
                  checked={preferences.autoAdaptEnabled}
                  onCheckedChange={() => handleFeatureToggle('autoAdaptEnabled')}
                  disabled={preferences.personalizationLevel !== 'HIGH'}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Manual Override Actions */}
          <div className="space-y-4">
            <Label className="text-[15px] font-semibold">Manual Overrides</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button
                variant="outline"
                className="justify-start gap-2 text-[13px] hover:scale-[1.02] active:scale-[0.98] transition-transform duration-150"
                onClick={() => setShowResetDialog(true)}
                disabled={saving}
              >
                <RotateCcw className="size-4" />
                Reset All
              </Button>
              <Button
                variant="outline"
                className="justify-start gap-2 text-[13px] hover:scale-[1.02] active:scale-[0.98] transition-transform duration-150"
                onClick={() => setShowPauseDialog(true)}
                disabled={saving || preferences.personalizationLevel === 'NONE'}
              >
                <Pause className="size-4" />
                Pause for 1 Week
              </Button>
              <Button variant="outline" className="justify-start gap-2 text-[13px]" disabled>
                <BookOpen className="size-4" />
                Prefer Standard Missions
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Reset will clear all personalization data and restart from defaults. Pause temporarily
              disables personalization while keeping your data.
            </p>
          </div>

          {/* Save Changes */}
          {hasChanges && (
            <div
              className="flex items-center justify-between p-4 rounded-lg border"
              style={{
                backgroundColor: 'oklch(0.7 0.15 230 / 0.1)',
                borderColor: 'oklch(0.7 0.15 230 / 0.3)',
              }}
            >
              <p className="text-[13px] font-medium">You have unsaved changes</p>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="gap-2 text-[13px] hover:scale-[1.02] active:scale-[0.98] transition-transform duration-150"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent className="bg-white border shadow-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[16px]">Reset All Personalizations?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-[13px]">
              <p>This will:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Clear all learning profile data</li>
                <li>Reset personalization level to MEDIUM</li>
                <li>Restart pattern analysis from scratch</li>
                <li>Remove all personalized recommendations</li>
              </ul>
              <p className="font-semibold mt-3">This action cannot be undone.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset}>Reset Everything</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Pause Confirmation Dialog */}
      <AlertDialog open={showPauseDialog} onOpenChange={setShowPauseDialog}>
        <AlertDialogContent className="bg-white border shadow-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[16px]">Pause Personalization?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-[13px]">
              <p>Personalization will be paused for 1 week. During this time:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>You'll receive standard, non-personalized recommendations</li>
                <li>Your existing data will be preserved</li>
                <li>You can re-enable personalization anytime</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePause}>Pause for 1 Week</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
