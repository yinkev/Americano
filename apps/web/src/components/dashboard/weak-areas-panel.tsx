/**
 * WeakAreasPanel Component
 * Story 2.2 Task 5
 *
 * Displays top weak learning objectives on dashboard
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface WeakArea {
  id: string
  objective: string
  complexity: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED'
  weaknessScore: number
  masteryLevel: 'NOT_STARTED' | 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'MASTERED'
  lastStudiedAt: string | null
  lecture: {
    id: string
    title: string
    course: {
      id: string
      name: string
    }
  }
}

interface Props {
  userId?: string
  courseFilter?: string
  limit?: number
}

export function WeakAreasPanel({ userId, courseFilter, limit = 5 }: Props) {
  const [weakAreas, setWeakAreas] = useState<WeakArea[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchWeakAreas()
  }, [courseFilter, limit])

  async function fetchWeakAreas() {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.set('limit', limit.toString())
      if (courseFilter) params.set('courseId', courseFilter)

      const response = await fetch(`/api/performance/weak-areas?${params}`)

      if (!response.ok) throw new Error('Failed to fetch weak areas')

      const result = await response.json()
      setWeakAreas(result.data.weakAreas)
    } catch (error) {
      console.error('Error fetching weak areas:', error)
    } finally {
      setLoading(false)
    }
  }

  function getMasteryColor(level: string): string {
    switch (level) {
      case 'MASTERED':
        return 'oklch(0.7 0.15 160)' // Green
      case 'ADVANCED':
        return 'oklch(0.55 0.22 264)' // Blue
      case 'INTERMEDIATE':
        return 'oklch(0.75 0.15 85)' // Yellow
      case 'BEGINNER':
        return 'oklch(0.70 0.20 30)' // Orange
      case 'NOT_STARTED':
      default:
        return 'oklch(0.6 0 0)' // Gray
    }
  }

  async function handleFocusOnWeaknesses() {
    // Generate mission prioritizing weak areas
    try {
      const response = await fetch('/api/learning/mission/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prioritizeWeakAreas: true,
        }),
      })

      if (response.ok) {
        router.push('/study')
      }
    } catch (error) {
      console.error('Error generating weak areas mission:', error)
    }
  }

  if (loading) {
    return (
      <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-heading font-bold">Weak Areas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading weak areas...</div>
        </CardContent>
      </Card>
    )
  }

  if (weakAreas.length === 0) {
    return (
      <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-heading font-bold">Weak Areas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            🎉 No weak areas identified. Keep up the great work!
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card interactive="interactive" className="bg-white/80 backdrop-blur-md border-white/30">
      <CardHeader>
        <CardTitle className="text-xl font-heading font-bold">Weak Areas</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {weakAreas.map((area) => (
          <Link
            key={area.id}
            href={`/library/${area.lecture.id}?highlight=${area.id}`}
            className="block p-4 bg-white/60 backdrop-blur-sm rounded-xl hover:bg-white/80 transition-colors shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground line-clamp-2 mb-1">{area.objective}</div>
                <div className="text-sm text-muted-foreground mb-2">
                  {area.lecture.course.name} • {area.lecture.title}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <Badge
                    variant="outline"
                    className="font-medium"
                    style={{
                      backgroundColor: `color-mix(in oklch, ${getMasteryColor(area.masteryLevel)} 10%, transparent)`,
                      color: getMasteryColor(area.masteryLevel),
                      borderColor: getMasteryColor(area.masteryLevel),
                    }}
                  >
                    {area.masteryLevel.replace('_', ' ')}
                  </Badge>
                  <Badge variant="outline" className="bg-muted text-muted-foreground">
                    {area.complexity}
                  </Badge>
                  {area.lastStudiedAt && (
                    <span className="text-muted-foreground">
                      Last: {format(new Date(area.lastStudiedAt), 'MMM d')}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="text-right">
                  <div className="text-2xl font-bold text-destructive">
                    {Math.round(area.weaknessScore * 100)}
                  </div>
                  <div className="text-xs text-muted-foreground">Weakness</div>
                </div>
              </div>
            </div>
          </Link>
        ))}

        {/* Action Buttons */}
        <div className="mt-6 flex gap-3">
          <Button
            onClick={handleFocusOnWeaknesses}
            className="flex-1"
            variant="default"
          >
            Focus on Weaknesses
          </Button>
          <Button
            asChild
            variant="outline"
            className="flex-1"
          >
            <Link href="/progress">View All Progress</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
