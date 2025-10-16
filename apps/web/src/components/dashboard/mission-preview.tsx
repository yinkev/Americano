'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { ChevronDown, ChevronUp, Settings, Clock, Target } from 'lucide-react'
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
      // Calculate tomorrow's date
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
    // Store customization preference (would be saved to user preferences in Task 8)
    // For now, just close dialog and re-fetch with custom time
    setIsCustomizing(false)

    // Re-fetch preview with custom time
    // Note: This would ideally save to user preferences first
    await fetchPreview()
  }

  if (isLoading) {
    return (
      <Card className="bg-white/80 backdrop-blur-md border-white/20 shadow-[0_8px_32px_rgba(31,38,135,0.1)]">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="w-5 h-5" />
            Tomorrow's Mission Preview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!preview || preview.objectives.length === 0) {
    return (
      <Card className="bg-white/80 backdrop-blur-md border-white/20 shadow-[0_8px_32px_rgba(31,38,135,0.1)]">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="w-5 h-5" />
            Tomorrow's Mission Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">No objectives available for tomorrow yet. Check back later!</p>
        </CardContent>
      </Card>
    )
  }

  const complexityColors = {
    BASIC: 'bg-green-100 text-green-800 border-green-200',
    INTERMEDIATE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    ADVANCED: 'bg-red-100 text-red-800 border-red-200',
  }

  return (
    <>
      <Card className="bg-white/80 backdrop-blur-md border-white/20 shadow-[0_8px_32px_rgba(31,38,135,0.1)] hover:shadow-[0_8px_32px_rgba(31,38,135,0.15)] transition-shadow">
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              🔮 Tomorrow's Mission Preview
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCustomizing(true)}
              className="h-8 gap-1.5 text-xs"
            >
              <Settings className="w-3.5 h-3.5" />
              Adjust
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Summary */}
          <div className="flex items-center gap-3 text-sm">
            <span className="font-medium text-gray-900">
              {preview.objectives.length} {preview.objectives.length === 1 ? 'objective' : 'objectives'}
            </span>
            <span className="text-gray-400">•</span>
            <span className="flex items-center gap-1.5 text-gray-600">
              <Clock className="w-4 h-4" />
              {preview.estimatedMinutes} min estimated
            </span>
          </div>

          {/* Expandable Objective List */}
          <div className="space-y-2">
            {!isExpanded ? (
              <div className="space-y-1.5">
                {preview.objectives.slice(0, 2).map((obj, index) => (
                  <div key={obj.objectiveId} className="flex items-start gap-2 text-sm">
                    <span className="text-gray-500 font-medium">{index + 1}.</span>
                    <span className="flex-1 text-gray-700">{obj.objective.title}</span>
                    <span className="text-gray-500 text-xs">({obj.estimatedMinutes}m)</span>
                  </div>
                ))}
                {preview.objectives.length > 2 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(true)}
                    className="w-full h-8 gap-1.5 text-xs text-gray-600 hover:text-gray-900"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                    Show {preview.objectives.length - 2} more
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {preview.objectives.map((obj, index) => (
                  <div key={obj.objectiveId} className="space-y-1">
                    <div className="flex items-start gap-2 text-sm">
                      <span className="text-gray-500 font-medium">{index + 1}.</span>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-900">{obj.objective.title}</span>
                          {obj.objective.isHighYield && <span className="text-xs">⭐</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`text-xs py-0 ${complexityColors[obj.objective.complexity]}`}>
                            {obj.objective.complexity}
                          </Badge>
                          <span className="text-gray-500 text-xs">{obj.estimatedMinutes} minutes</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(false)}
                  className="w-full h-8 gap-1.5 text-xs text-gray-600 hover:text-gray-900"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                  Show less
                </Button>
              </div>
            )}
          </div>

          {/* Priority Breakdown (if available) */}
          {preview.priorityBreakdown && (
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-1.5">Priority Balance:</p>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-gray-700">
                  📅 FSRS: {Math.round(preview.priorityBreakdown.fsrs * 100)}%
                </span>
                <span className="text-gray-700">
                  ⭐ High-yield: {Math.round(preview.priorityBreakdown.highYield * 100)}%
                </span>
                <span className="text-gray-700">
                  🎯 Weak areas: {Math.round(preview.priorityBreakdown.weakAreas * 100)}%
                </span>
              </div>
            </div>
          )}

          {/* Action Message */}
          <div className="pt-2 text-xs text-gray-600 italic">
            Mission will generate automatically tomorrow morning
          </div>
        </CardContent>
      </Card>

      {/* Customization Dialog */}
      <Dialog open={isCustomizing} onOpenChange={setIsCustomizing}>
        <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle>Adjust Tomorrow's Mission</DialogTitle>
            <DialogDescription>
              Customize your mission duration and preferences
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="minutes">Target Study Time</Label>
              <div className="flex items-center gap-3">
                <Slider
                  id="minutes"
                  min={15}
                  max={120}
                  step={5}
                  value={[customMinutes]}
                  onValueChange={(value) => setCustomMinutes(value[0])}
                  className="flex-1"
                />
                <span className="text-sm font-medium text-gray-700 w-16 text-right">
                  {customMinutes} min
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Mission will include 2-4 objectives fitting within this time
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCustomizing(false)}>
              Cancel
            </Button>
            <Button onClick={handleCustomize}>
              Apply Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
