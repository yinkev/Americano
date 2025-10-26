'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { ChevronDown, ChevronUp, Settings, Clock, Target, Wand2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'

interface MissionObjective {
  objectiveId: string
  objective: {
    id: string
    title: string
    complexity: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED'
    isHighYield: boolean
  }
  estimatedMinutes: number
  completed: boolean
}

interface MissionPreviewData {
  preview: true
  objectives: MissionObjective[]
  estimatedMinutes: number
  priorityBreakdown?: {
    fsrs: number
    highYield: number
    weakAreas: number
  }
}

export function MissionPreview() {
  const [preview, setPreview] = useState<MissionPreviewData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isCustomizing, setIsCustomizing] = useState(false)
  const [customMinutes, setCustomMinutes] = useState(50)

  useEffect(() => {
    fetchPreview()
  }, [])

  async function fetchPreview() {
    try {
      setIsLoading(true)
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const dateStr = tomorrow.toISOString().split('T')[0]

      const response = await fetch(`/api/learning/mission/preview?date=${dateStr}`)
      const data = await response.json()

      if (data.success && data.data) {
        setPreview(data.data)
        setCustomMinutes(data.data.estimatedMinutes || 50)
      }
    } catch (error) {
      console.error('Failed to fetch mission preview:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleCustomize() {
    setIsCustomizing(false)
    await fetchPreview()
  }

  if (isLoading) {
    return (
      <Card className="bg-transparent border-none shadow-none rounded-xl">
        <CardContent className="p-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded-xl w-1/2" />
            <div className="h-4 bg-muted rounded-xl w-full" />
            <div className="h-4 bg-muted rounded-xl w-3/4" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!preview || preview.objectives.length === 0) {
    return (
      <Card className="bg-transparent border-none shadow-none rounded-xl">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-3 font-heading">
            <Wand2 className="w-6 h-6 text-primary" />
            Tomorrow's Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-md font-semibold text-muted-foreground">No objectives planned for tomorrow yet.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      {/* I would add a motion.div here for a subtle entrance animation */}
      <Card className="bg-transparent border-none shadow-none rounded-xl">
        <CardHeader className="p-6">
          <CardTitle className="text-xl flex items-center justify-between font-heading">
            <span className="flex items-center gap-3">
              <Wand2 className="w-6 h-6 text-primary" />
              Tomorrow's Plan
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCustomizing(true)}
              className="h-9 gap-2 text-sm rounded-full"
            >
              <Settings className="w-4 h-4" />
              Adjust
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between text-md">
            <span className="font-semibold text-foreground">
              {preview.objectives.length} objectives
            </span>
            <span className="flex items-center gap-2 text-muted-foreground font-medium">
              <Clock className="w-5 h-5" />
              {preview.estimatedMinutes} min
            </span>
          </div>

          {/* I would add a motion.div here to animate the expansion */}
          <div className="space-y-3 pt-4">
            {preview.objectives.slice(0, isExpanded ? preview.objectives.length : 2).map((obj, index) => (
              <div key={obj.objectiveId} className="flex items-start gap-3 text-md p-3 rounded-xl bg-card">
                <span className="text-primary font-bold">{index + 1}.</span>
                <span className="flex-1 text-foreground font-medium">{obj.objective.title}</span>
              </div>
            ))}
            {preview.objectives.length > 2 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full h-9 gap-2 text-sm text-muted-foreground hover:text-foreground rounded-full"
              >
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {isExpanded ? 'Show Less' : `Show ${preview.objectives.length - 2} More`}
              </Button>
            )}
          </div>

          <div className="pt-4 text-sm text-center text-muted-foreground italic">
            Your mission for tomorrow is all set!
          </div>
        </CardContent>
      </Card>

      <Dialog open={isCustomizing} onOpenChange={setIsCustomizing}>
        <DialogContent className="sm:max-w-md bg-card rounded-xl shadow-none border-none">
          <DialogHeader className="p-6">
            <DialogTitle className="text-2xl font-heading">Customize Your Mission</DialogTitle>
            <DialogDescription className="text-md">Adjust the duration for tomorrow's study session.</DialogDescription>
          </DialogHeader>
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <Label htmlFor="minutes" className="text-lg font-semibold">Target Time</Label>
              <div className="flex items-center gap-4">
                <Slider
                  id="minutes"
                  min={15}
                  max={120}
                  step={5}
                  value={[customMinutes]}
                  onValueChange={(value) => setCustomMinutes(value[0])}
                  className="flex-1"
                />
                <span className="text-xl font-bold text-primary w-20 text-center">
                  {customMinutes} min
                </span>
              </div>
            </div>
          </div>
          <DialogFooter className="p-6">
            <Button variant="outline" onClick={() => setIsCustomizing(false)} className="rounded-full text-lg px-6 py-3">Cancel</Button>
            <Button onClick={handleCustomize} className="rounded-full text-lg px-6 py-3">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
