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

export function MissionPreferences() {
  const [saving, setSaving] = useState(false)
  const [preferences, setPreferences] = useState({
    defaultMissionMinutes: 50,
    missionDifficulty: 'AUTO',
    preferredStudyTime: '',
    autoGenerateMissions: true,
  })

  useEffect(() => {
    fetchPreferences()
  }, [])

  async function fetchPreferences() {
    try {
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const data = await response.json()
        setPreferences({
          defaultMissionMinutes: data.data.user.defaultMissionMinutes || 50,
          missionDifficulty: data.data.user.missionDifficulty || 'AUTO',
          preferredStudyTime: data.data.user.preferredStudyTime || '',
          autoGenerateMissions: data.data.user.autoGenerateMissions ?? true,
        })
      }
    } catch (error) {
      console.error('Failed to fetch preferences:', error)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      })

      if (response.ok) {
        toast.success('Mission preferences saved!')
      } else {
        throw new Error('Failed to save preferences')
      }
    } catch (error) {
      toast.error('Failed to save mission preferences')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-2xl">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-gray-800">Mission Preferences</CardTitle>
        <CardDescription className="text-gray-600">
          Customize your daily study missions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Default Mission Duration */}
        <div className="space-y-2">
          <Label htmlFor="mission-duration">Default Mission Duration</Label>
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
            <span className="text-sm font-medium text-gray-700 w-16 text-right">
              {preferences.defaultMissionMinutes} min
            </span>
          </div>
          <p className="text-xs text-gray-500">
            Missions will include 2-4 objectives fitting within this time
          </p>
        </div>

        {/* Mission Difficulty */}
        <div className="space-y-2">
          <Label htmlFor="mission-difficulty">Mission Difficulty</Label>
          <Select
            value={preferences.missionDifficulty}
            onValueChange={(value) => setPreferences({ ...preferences, missionDifficulty: value })}
          >
            <SelectTrigger id="mission-difficulty">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AUTO">Auto (adapts to your performance)</SelectItem>
              <SelectItem value="EASY">Easy (2 objectives, mostly basic, 30-40 min)</SelectItem>
              <SelectItem value="MODERATE">
                Moderate (3 objectives, mixed complexity, 45-60 min)
              </SelectItem>
              <SelectItem value="CHALLENGING">
                Challenging (4 objectives, includes advanced, 60-75 min)
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500">
            Auto mode adjusts based on your recent completion rates
          </p>
        </div>

        {/* Preferred Study Time */}
        <div className="space-y-2">
          <Label htmlFor="preferred-time">Preferred Study Time (optional)</Label>
          <Input
            id="preferred-time"
            type="time"
            value={preferences.preferredStudyTime}
            onChange={(e) => setPreferences({ ...preferences, preferredStudyTime: e.target.value })}
            placeholder="HH:MM"
          />
          <p className="text-xs text-gray-500">
            Missions will be generated 1 hour before this time (e.g., 07:00 for morning study)
          </p>
        </div>

        {/* Auto-Generate Missions */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="auto-generate">Auto-Generate Daily Missions</Label>
            <p className="text-xs text-gray-500">Automatically create missions each day</p>
          </div>
          <Switch
            id="auto-generate"
            checked={preferences.autoGenerateMissions}
            onCheckedChange={(checked) =>
              setPreferences({ ...preferences, autoGenerateMissions: checked })
            }
          />
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t border-gray-100">
          <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90">
            {saving ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
