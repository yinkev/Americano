'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Settings, RotateCcw, Zap, TrendingUp } from 'lucide-react'

export function MissionAdaptation() {
  const [saving, setSaving] = useState(false)
  const [autoAdapt, setAutoAdapt] = useState(true)
  const [manualDuration, setManualDuration] = useState(50)
  const [manualDifficulty, setManualDifficulty] = useState(1) // 0=EASY, 1=MODERATE, 2=CHALLENGING

  useEffect(() => {
    // Mock data for demonstration
    setAutoAdapt(true)
    setManualDuration(55)
    setManualDifficulty(1)
  }, [])

  async function handleSave() {
    // Save logic
  }

  async function handleResetToRecommended() {
    // Reset logic
  }

  const difficultyLabels = ['Easy', 'Moderate', 'Challenging']
  const difficultyColors = ['oklch(0.70 0.15 150)', 'oklch(0.75 0.12 240)', 'oklch(0.78 0.13 340)']

  return (
    <Card className="p-6 bg-card  border-border/50 shadow-none rounded-xl">
      <CardHeader className="p-0 mb-6">
        <div className="flex items-center gap-4">
            <div className="p-3 bg-card rounded-xl">
                <Zap className="w-8 h-8 text-primary" />
            </div>
            <div>
                <CardTitle className="text-2xl font-heading font-bold">Mission Adaptation</CardTitle>
                <CardDescription className="text-lg text-muted-foreground">Control how missions adapt to your performance.</CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 space-y-6">
        <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-card border-border/50 shadow-none">
          <div className="space-y-1">
            <Label htmlFor="auto-adapt" className="text-xl font-semibold cursor-pointer">Auto-adapt mission difficulty</Label>
            <p className="text-md text-muted-foreground">
              Automatically adjust based on completion patterns.
            </p>
          </div>
          <Switch
            id="auto-adapt"
            checked={autoAdapt}
            onCheckedChange={setAutoAdapt}
            className="scale-125"
          />
        </div>

        <div className="space-y-4">
          <Label htmlFor="manual-duration" className="text-xl font-semibold flex items-center gap-2"><Clock /> Mission Duration</Label>
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
            <span className="text-2xl font-bold w-20 text-right text-primary">
              {manualDuration} min
            </span>
          </div>
          <p className="text-md text-muted-foreground">
            {autoAdapt
              ? 'Duration will be automatically adjusted based on your performance.'
              : 'Missions will target this duration regardless of performance.'}
          </p>
        </div>

        <div className="space-y-4">
          <Label htmlFor="manual-difficulty" className="text-xl font-semibold flex items-center gap-2"><TrendingUp /> Mission Difficulty</Label>
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
              className="text-2xl font-bold w-28 text-right"
              style={{ color: difficultyColors[manualDifficulty] }}
            >
              {difficultyLabels[manualDifficulty]}
            </span>
          </div>
          <div className="flex items-center justify-between text-md text-muted-foreground mt-2">
            <span>Easier</span>
            <span>More Challenging</span>
          </div>
          <p className="text-md text-muted-foreground">
            {autoAdapt
              ? 'Difficulty will adapt based on your 7-day completion rate.'
              : 'Missions will use this difficulty level consistently.'}
          </p>
        </div>

        <div className="pt-6 border-t-2 border-border/50 flex gap-3">
          <Button
            onClick={handleResetToRecommended}
            variant="outline"
            disabled={saving}
            size="lg" className="rounded-full font-bold text-lg shadow-none gap-2 flex-1"
          >
            <RotateCcw className="w-6 h-6" />
            Reset to Recommended
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            size="lg" className="rounded-full font-bold text-lg shadow-none gap-2 flex-1"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
