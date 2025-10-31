/**
 * WeakAreasPanel
 * Lightweight panel that lists the user's weakest learning objectives.
 * Fetches from /api/performance/weak-areas (already implemented).
 */

'use client'

import { useEffect, useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type WeakArea = {
  id: string
  objective: string
  complexity?: string | null
  weaknessScore: number
  masteryLevel?: string | null
  lastStudiedAt?: string | null
  lecture?: {
    id?: string
    title?: string
  } | null
}

interface Props {
  limit?: number
}

export function WeakAreasPanel({ limit = 5 }: Props) {
  const [items, setItems] = useState<WeakArea[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`/api/performance/weak-areas?limit=${limit}`)
        if (!res.ok) throw new Error('Failed to load weak areas')
        const json = await res.json()
        if (!cancelled) setItems(json.data?.weakAreas ?? [])
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Unknown error')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [limit])

  return (
    <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)]">
      <CardHeader>
        <CardTitle className="text-lg font-heading">Weak Areas</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading weak areas…</div>
        ) : error ? (
          <div className="flex items-center gap-2 text-[oklch(0.65_0.15_10)]">
            <AlertCircle className="size-4" />
            <span className="text-sm">{error}</span>
          </div>
        ) : items.length === 0 ? (
          <div className="text-sm text-muted-foreground">No weak areas identified. Nice work!</div>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-start justify-between rounded-lg border border-border/60 bg-card/30 px-3 py-2"
              >
                <div>
                  <div className="font-medium text-gray-900">
                    {item.objective}
                  </div>
                  <div className="text-xs text-gray-500">
                    {item.lecture?.title ?? 'Unmapped lecture'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {item.complexity ? (
                    <Badge variant="secondary" className="text-[11px]">
                      {item.complexity}
                    </Badge>
                  ) : null}
                  <Badge className="text-[11px] bg-[oklch(0.70_0.20_30)]/10 text-[oklch(0.70_0.20_30)]">
                    Weakness {Math.round(item.weaknessScore * 100)}%
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

