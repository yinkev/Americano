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
      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-[0_8px_32px_rgba(31,38,135,0.1)] p-6">
        <h2 className="text-xl font-heading font-bold text-gray-900 mb-4">Weak Areas</h2>
        <div className="text-sm text-gray-500">Loading weak areas...</div>
      </div>
    )
  }

  if (weakAreas.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-[0_8px_32px_rgba(31,38,135,0.1)] p-6">
        <h2 className="text-xl font-heading font-bold text-gray-900 mb-4">Weak Areas</h2>
        <div className="text-sm text-gray-600">
          🎉 No weak areas identified. Keep up the great work!
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-[0_8px_32px_rgba(31,38,135,0.1)] p-6">
      <h2 className="text-xl font-heading font-bold text-gray-900 mb-4">Weak Areas</h2>

      <div className="space-y-4">
        {weakAreas.map((area) => (
          <Link
            key={area.id}
            href={`/library/${area.lecture.id}?highlight=${area.id}`}
            className="block p-4 bg-white/60 backdrop-blur-sm rounded-xl hover:bg-white/80 transition-colors shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 line-clamp-2 mb-1">{area.objective}</div>
                <div className="text-sm text-gray-500 mb-2">
                  {area.lecture.course.name} • {area.lecture.title}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span
                    className="px-2 py-1 rounded-lg font-medium"
                    style={{
                      backgroundColor: `${getMasteryColor(area.masteryLevel)} / 0.1`,
                      color: getMasteryColor(area.masteryLevel),
                    }}
                  >
                    {area.masteryLevel.replace('_', ' ')}
                  </span>
                  <span className="px-2 py-1 bg-gray-100 rounded-lg text-gray-600">
                    {area.complexity}
                  </span>
                  {area.lastStudiedAt && (
                    <span className="text-gray-500">
                      Last: {format(new Date(area.lastStudiedAt), 'MMM d')}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="text-right">
                  <div className="text-2xl font-bold text-red-600">
                    {Math.round(area.weaknessScore * 100)}
                  </div>
                  <div className="text-xs text-gray-500">Weakness</div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex gap-3">
        <button
          onClick={handleFocusOnWeaknesses}
          className="flex-1 px-4 py-3 rounded-xl font-medium bg-[oklch(0.55_0.22_264)] text-white hover:bg-[oklch(0.50_0.22_264)] shadow-sm transition-colors min-h-[44px]"
        >
          Focus on Weaknesses
        </button>
        <Link
          href="/progress"
          className="flex-1 px-4 py-3 rounded-xl font-medium bg-white/60 text-gray-700 hover:bg-white/80 shadow-sm transition-colors text-center min-h-[44px] flex items-center justify-center"
        >
          View All Progress
        </Link>
      </div>
    </div>
  )
}
