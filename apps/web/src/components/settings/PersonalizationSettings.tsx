/**
 * PersonalizationSettings Component
 * Story 5.5 Task 12: User Control Over Personalization
 *
 * Provides user control over personalization level and individual features
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
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
import {
  Brain,
  Clock,
  BookOpen,
  Target,
  Activity,
  RotateCcw,
  Pause,
  Info,
  TrendingUp,
  Sparkles,
} from 'lucide-react'

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
    const newLevel = PERSONALIZATION_LEVELS[values[0]].label as PersonalizationPreferences['personalizationLevel']
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
      <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-2xl">
        <CardContent className="p-6 h-64 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading personalization settings...</p>
        </CardContent>
      </Card>
    )
  }

  if (!preferences) {
    return (
      <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-2xl">
        <CardContent className="p-6 h-64 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Failed to load preferences</p>
        </CardContent>
      </Card>
    )
  }

  const currentLevelIndex = PERSONALIZATION_LEVELS.findIndex((l) => l.label === preferences.personalizationLevel)
  const currentLevel = PERSONALIZATION_LEVELS[currentLevelIndex]

  return (
    <>
      <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-2xl">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <Sparkles className="size-5 text-[oklch(0.7_0.15_230)]" />
                Personalization Settings
              </CardTitle>
              <CardDescription className="text-gray-600 mt-1">
                Control how the platform adapts to your learning patterns
              </CardDescription>
            </div>
            <Badge
              variant="outline"
              className="shrink-0 px-3 py-1.5"
              style={{
                backgroundColor: `${currentLevel.color}/0.1`,
                borderColor: currentLevel.color,
                color: currentLevel.color,
              }}
            >
              {currentLevel.label}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Personalization Level Slider */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold text-foreground">Personalization Level</Label>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-2"
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
              <div className="flex justify-between text-xs text-muted-foreground">
                {PERSONALIZATION_LEVELS.map((level) => (
                  <span key={level.value} className={level.value === currentLevelIndex ? 'font-semibold text-foreground' : ''}>
                    {level.label}
                  </span>
                ))}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-muted/30 border border-border">
              <div className="flex items-start gap-3">
                <Info className="size-5 text-[oklch(0.7_0.15_230)] shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">{currentLevel.description}</p>
                  {preferences.personalizationLevel === 'NONE' && (
                    <p className="text-xs text-muted-foreground">
                      Standard recommendations without adaptation to your learning patterns.
                    </p>
                  )}
                  {preferences.personalizationLevel === 'LOW' && (
                    <p className="text-xs text-muted-foreground">
                      Adapts mission timing and session duration based on your patterns.
                    </p>
                  )}
                  {preferences.personalizationLevel === 'MEDIUM' && (
                    <p className="text-xs text-muted-foreground">
                      Adds content recommendations and assessment difficulty adjustments.
                    </p>
                  )}
                  {preferences.personalizationLevel === 'HIGH' && (
                    <p className="text-xs text-muted-foreground">
                      Full adaptive experience with cognitive load monitoring and proactive interventions.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Feature-Level Toggles */}
          <div className="space-y-4">
            <Label className="text-base font-semibold text-foreground">Individual Features</Label>
            <div className="space-y-3">
              {/* Mission Timing */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/10 border border-border hover:border-primary/30 transition-colors">
                <div className="flex items-start gap-3 flex-1">
                  <Clock className="size-5 text-[oklch(0.7_0.15_230)] shrink-0 mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="mission-timing" className="text-sm font-medium text-foreground cursor-pointer">
                      Adapt Mission Timing
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
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
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/10 border border-border hover:border-primary/30 transition-colors">
                <div className="flex items-start gap-3 flex-1">
                  <Activity className="size-5 text-[oklch(0.7_0.15_145)] shrink-0 mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="session-duration" className="text-sm font-medium text-foreground cursor-pointer">
                      Adapt Session Duration
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
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
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/10 border border-border hover:border-primary/30 transition-colors">
                <div className="flex items-start gap-3 flex-1">
                  <BookOpen className="size-5 text-[oklch(0.8_0.15_85)] shrink-0 mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="content-recs" className="text-sm font-medium text-foreground cursor-pointer">
                      Personalize Content Recommendations
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Tailor content suggestions to your learning style (visual, kinesthetic, etc.)
                    </p>
                  </div>
                </div>
                <Switch
                  id="content-recs"
                  checked={preferences.contentPersonalizationEnabled}
                  onCheckedChange={() => handleFeatureToggle('contentPersonalizationEnabled')}
                  disabled={preferences.personalizationLevel === 'NONE' || preferences.personalizationLevel === 'LOW'}
                />
              </div>

              {/* Assessment Difficulty */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/10 border border-border hover:border-primary/30 transition-colors">
                <div className="flex items-start gap-3 flex-1">
                  <Target className="size-5 text-[oklch(0.6_0.15_25)] shrink-0 mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="assessment-diff" className="text-sm font-medium text-foreground cursor-pointer">
                      Adapt Assessment Difficulty
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Optimize question difficulty and frequency based on your progress
                    </p>
                  </div>
                </div>
                <Switch
                  id="assessment-diff"
                  checked={preferences.assessmentPersonalizationEnabled}
                  onCheckedChange={() => handleFeatureToggle('assessmentPersonalizationEnabled')}
                  disabled={preferences.personalizationLevel === 'NONE' || preferences.personalizationLevel === 'LOW'}
                />
              </div>

              {/* Cognitive Load Auto-Adjust */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/10 border border-border hover:border-primary/30 transition-colors">
                <div className="flex items-start gap-3 flex-1">
                  <Brain className="size-5 text-[oklch(0.7_0.15_300)] shrink-0 mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="cognitive-load" className="text-sm font-medium text-foreground cursor-pointer">
                      Auto-Adjust Based on Cognitive Load
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
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
            <Label className="text-base font-semibold text-foreground">Manual Overrides</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button
                variant="outline"
                className="justify-start gap-2"
                onClick={() => setShowResetDialog(true)}
                disabled={saving}
              >
                <RotateCcw className="size-4" />
                Reset All
              </Button>
              <Button
                variant="outline"
                className="justify-start gap-2"
                onClick={() => setShowPauseDialog(true)}
                disabled={saving || preferences.personalizationLevel === 'NONE'}
              >
                <Pause className="size-4" />
                Pause for 1 Week
              </Button>
              <Button variant="outline" className="justify-start gap-2" disabled>
                <BookOpen className="size-4" />
                Prefer Standard Missions
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Reset will clear all personalization data and restart from defaults. Pause temporarily disables
              personalization while keeping your data.
            </p>
          </div>

          {/* Save Changes */}
          {hasChanges && (
            <div className="flex items-center justify-between p-4 rounded-xl bg-[oklch(0.7_0.15_230)]/10 border border-[oklch(0.7_0.15_230)]/30">
              <p className="text-sm font-medium text-foreground">You have unsaved changes</p>
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent className="bg-white/95 backdrop-blur-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Reset All Personalizations?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>This will:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Clear all learning profile data</li>
                <li>Reset personalization level to MEDIUM</li>
                <li>Restart pattern analysis from scratch</li>
                <li>Remove all personalized recommendations</li>
              </ul>
              <p className="font-semibold text-foreground mt-3">This action cannot be undone.</p>
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
        <AlertDialogContent className="bg-white/95 backdrop-blur-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Pause Personalization?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Personalization will be paused for 1 week. During this time:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
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
