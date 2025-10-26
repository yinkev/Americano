'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Target, Clock, Zap } from 'lucide-react'

export function MissionPreferences() {
  const [saving, setSaving] = useState(false)
  const [preferences, setPreferences] = useState({
    defaultMissionMinutes: 50,
    missionDifficulty: 'AUTO',
    preferredStudyTime: '',
    autoGenerateMissions: true,
  })

  useEffect(() => {
    // Mock data for demonstration
    setPreferences({
        defaultMissionMinutes: 60,
        missionDifficulty: 'MODERATE',
        preferredStudyTime: '08:00',
        autoGenerateMissions: true,
    })
  }, [])

  async function handleSave() {
    // Save logic
  }

  return (
    <Card className="p-6 bg-card  border-border/50 shadow-none rounded-xl">
      <CardHeader className="p-0 mb-6">
        <div className="flex items-center gap-4">
            <div className="p-3 bg-card rounded-xl">
                <Target className="w-8 h-8 text-primary" />
            </div>
            <div>
                <CardTitle className="text-2xl font-heading font-bold">Mission Preferences</CardTitle>
                <CardDescription className="text-lg text-muted-foreground">Customize your daily study missions.</CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 space-y-6">
        <div className="space-y-4">
          <Label htmlFor="mission-duration" className="text-xl font-semibold">Default Mission Duration</Label>
          <div className="flex items-center gap-4">
            <Slider
              id="mission-duration"
              min={30}
              max={90}
              step={5}
              value={[preferences.defaultMissionMinutes]}
              onValueChange={(value) =>
                setPreferences({ ...preferences, defaultMissionMinutes: value[0] })
              }
              className="flex-1"
            />
            <span className="text-2xl font-bold w-20 text-right text-primary">
              {preferences.defaultMissionMinutes} min
            </span>
          </div>
          <p className="text-md text-muted-foreground">
            Missions will include 2-4 objectives fitting within this time.
          </p>
        </div>

        <div className="space-y-4">
          <Label htmlFor="mission-difficulty" className="text-xl font-semibold">Mission Difficulty</Label>
          <Select
            value={preferences.missionDifficulty}
            onValueChange={(value) => setPreferences({ ...preferences, missionDifficulty: value })}
          >
            <SelectTrigger id="mission-difficulty" className="h-14 text-lg rounded-full bg-card border-none focus:ring-2 focus:ring-primary">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card  rounded-xl border-border/50">
              <SelectItem value="AUTO" className="text-lg">Auto (adapts to your performance)</SelectItem>
              <SelectItem value="EASY" className="text-lg">Easy (2 objectives, mostly basic, 30-40 min)</SelectItem>
              <SelectItem value="MODERATE" className="text-lg">
                Moderate (3 objectives, mixed complexity, 45-60 min)
              </SelectItem>
              <SelectItem value="CHALLENGING" className="text-lg">
                Challenging (4 objectives, includes advanced, 60-75 min)
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-md text-muted-foreground">
            Auto mode adjusts based on your recent completion rates.
          </p>
        </div>

        <div className="space-y-4">
          <Label htmlFor="preferred-time" className="text-xl font-semibold">Preferred Study Time (optional)</Label>
          <Input
            id="preferred-time"
            type="time"
            value={preferences.preferredStudyTime}
            onChange={(e) => setPreferences({ ...preferences, preferredStudyTime: e.target.value })}
            className="h-14 text-lg rounded-full bg-card border-none focus:ring-2 focus:ring-primary"
          />
          <p className="text-md text-muted-foreground">
            Missions will be generated 1 hour before this time (e.g., 07:00 for morning study).
          </p>
        </div>

        <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-card border-border/50 shadow-none">
          <div className="space-y-1">
            <Label htmlFor="auto-generate" className="text-xl font-semibold cursor-pointer">Auto-Generate Daily Missions</Label>
            <p className="text-md text-muted-foreground">Automatically create missions each day.</p>
          </div>
          <Switch
            id="auto-generate"
            checked={preferences.autoGenerateMissions}
            onCheckedChange={(checked) =>
              setPreferences({ ...preferences, autoGenerateMissions: checked })
            }
            className="scale-125"
          />
        </div>

        <div className="pt-6 border-t-2 border-border/50">
          <Button onClick={handleSave} disabled={saving} size="lg" className="rounded-full font-bold text-lg shadow-none gap-2">
            {saving ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
