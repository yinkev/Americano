'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Sparkles, User, Clock, BookOpen, Target, Brain, RotateCcw, Pause } from 'lucide-react'

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
  const [preferences, setPreferences] = useState({
    personalizationLevel: 'MEDIUM',
    missionPersonalizationEnabled: true,
    contentPersonalizationEnabled: true,
    assessmentPersonalizationEnabled: true,
    sessionPersonalizationEnabled: true,
    autoAdaptEnabled: true,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // Mock data for demonstration
    setPreferences({
        personalizationLevel: 'MEDIUM',
        missionPersonalizationEnabled: true,
        contentPersonalizationEnabled: true,
        assessmentPersonalizationEnabled: true,
        sessionPersonalizationEnabled: true,
        autoAdaptEnabled: true,
    })
  }, [])

  function handleLevelChange(values: number[]) {
    const newLevel = PERSONALIZATION_LEVELS[values[0]].label as typeof preferences.personalizationLevel
    setPreferences((prev) => (prev ? { ...prev, personalizationLevel: newLevel } : prev))
  }

  function handleFeatureToggle(feature: keyof typeof preferences) {
    setPreferences((prev) => (prev ? { ...prev, [feature]: !prev[feature] } : prev))
  }

  async function handleSave() {
    // Save logic
  }

  const currentLevelIndex = PERSONALIZATION_LEVELS.findIndex((l) => l.label === preferences.personalizationLevel)
  const currentLevel = PERSONALIZATION_LEVELS[currentLevelIndex]

  return (
    <Card className="p-6 bg-card  border-border/50 shadow-none rounded-xl">
      <CardHeader className="p-0 mb-6">
        <div className="flex items-center gap-4">
            <div className="p-3 bg-card rounded-xl">
                <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <div>
                <CardTitle className="text-2xl font-heading font-bold">Personalization Settings</CardTitle>
                <CardDescription className="text-lg text-muted-foreground">Control how the platform adapts to your learning patterns.</CardDescription>
            </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-xl font-semibold">Personalization Level</Label>
            <Button variant="ghost" size="lg" className="rounded-full font-bold text-lg shadow-none gap-2">View Dashboard</Button>
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
            <div className="flex justify-between text-md font-semibold text-muted-foreground">
              {PERSONALIZATION_LEVELS.map((level) => (
                <span key={level.value} className={level.value === currentLevelIndex ? 'font-bold text-foreground' : ''}>
                  {level.label}
                </span>
              ))}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-card border-border/50 shadow-none">
            <p className="text-lg font-semibold mb-1" style={{color: currentLevel.color}}>{currentLevel.description}</p>
            <p className="text-md text-muted-foreground">More detailed explanation of this level of personalization.</p>
          </div>
        </div>

        <Separator className="my-6" />

        <div className="space-y-4">
          <Label className="text-xl font-semibold">Individual Features</Label>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-xl bg-card border-border/50 shadow-none">
              <div className="space-y-1">
                <Label htmlFor="mission-timing" className="text-xl font-semibold cursor-pointer">Adapt Mission Timing</Label>
                <p className="text-md text-muted-foreground">Recommend optimal study times based on your performance patterns.</p>
              </div>
              <Switch id="mission-timing" checked={preferences.missionPersonalizationEnabled} onCheckedChange={() => handleFeatureToggle('missionPersonalizationEnabled')} className="scale-125" />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-card border-border/50 shadow-none">
              <div className="space-y-1">
                <Label htmlFor="session-duration" className="text-xl font-semibold cursor-pointer">Adapt Session Duration</Label>
                <p className="text-md text-muted-foreground">Adjust session length based on your attention patterns and focus capacity.</p>
              </div>
              <Switch id="session-duration" checked={preferences.sessionPersonalizationEnabled} onCheckedChange={() => handleFeatureToggle('sessionPersonalizationEnabled')} className="scale-125" />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-card border-border/50 shadow-none">
              <div className="space-y-1">
                <Label htmlFor="content-recs" className="text-xl font-semibold cursor-pointer">Personalize Content Recommendations</Label>
                <p className="text-md text-muted-foreground">Tailor content suggestions to your learning style (visual, kinesthetic, etc.).</p>
              </div>
              <Switch id="content-recs" checked={preferences.contentPersonalizationEnabled} onCheckedChange={() => handleFeatureToggle('contentPersonalizationEnabled')} className="scale-125" />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-card border-border/50 shadow-none">
              <div className="space-y-1">
                <Label htmlFor="assessment-diff" className="text-xl font-semibold cursor-pointer">Adapt Assessment Difficulty</Label>
                <p className="text-md text-muted-foreground">Optimize question difficulty and frequency based on your progress.</p>
              </div>
              <Switch id="assessment-diff" checked={preferences.assessmentPersonalizationEnabled} onCheckedChange={() => handleFeatureToggle('assessmentPersonalizationEnabled')} className="scale-125" />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-card border-border/50 shadow-none">
              <div className="space-y-1">
                <Label htmlFor="cognitive-load" className="text-xl font-semibold cursor-pointer">Auto-Adjust Based on Cognitive Load</Label>
                <p className="text-md text-muted-foreground">Automatically reduce difficulty when stress or burnout is detected.</p>
              </div>
              <Switch id="cognitive-load" checked={preferences.autoAdaptEnabled} onCheckedChange={() => handleFeatureToggle('autoAdaptEnabled')} className="scale-125" />
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        <div className="space-y-4">
          <Label className="text-xl font-semibold">Manual Overrides</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button variant="outline" size="lg" className="rounded-full font-bold text-lg shadow-none gap-2"><RotateCcw /> Reset All</Button>
            <Button variant="outline" size="lg" className="rounded-full font-bold text-lg shadow-none gap-2"><Pause /> Pause for 1 Week</Button>
            <Button variant="outline" size="lg" className="rounded-full font-bold text-lg shadow-none gap-2">Prefer Standard Missions</Button>
          </div>
          <p className="text-md text-muted-foreground">
            Reset will clear all personalization data and restart from defaults. Pause temporarily disables
            personalization while keeping your data.
          </p>
        </div>

        <div className="pt-6 border-t-2 border-border/50">
          <Button onClick={handleSave} disabled={saving} size="lg" className="rounded-full font-bold text-lg shadow-none gap-2">
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
