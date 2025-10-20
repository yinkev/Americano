'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ObjectiveEditDialog } from './objective-edit-dialog'
import type { ObjectiveComplexity } from '@/lib/ai/chatmock-client'

interface Objective {
  id: string
  objective: string
  complexity: ObjectiveComplexity
  pageStart: number | null
  pageEnd: number | null
  isHighYield: boolean
  boardExamTags: string[]
}

interface ObjectiveListProps {
  lectureId: string
}

const COMPLEXITY_COLORS = {
  BASIC: 'bg-green-100 text-green-800',
  INTERMEDIATE: 'bg-blue-100 text-blue-800',
  ADVANCED: 'bg-purple-100 text-purple-800',
}

export function ObjectiveList({ lectureId }: ObjectiveListProps) {
  const [objectives, setObjectives] = useState<Objective[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingObjective, setEditingObjective] = useState<Objective | null>(null)
  const [isExtracting, setIsExtracting] = useState(false)

  const fetchObjectives = async () => {
    try {
      const response = await fetch(`/api/objectives?lectureId=${lectureId}`)
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to fetch objectives')
      }

      setObjectives(data.data.objectives)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleExtractObjectives = async () => {
    setIsExtracting(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/extract/objectives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lectureId }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error?.message || 'Extraction failed')
      }

      await fetchObjectives()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Extraction failed')
    } finally {
      setIsExtracting(false)
    }
  }

  const handleSave = async (id: string, updates: Partial<Objective>) => {
    const response = await fetch(`/api/objectives/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to save')
    }

    await fetchObjectives()
  }

  const handleDelete = async (id: string) => {
    const response = await fetch(`/api/objectives/${id}`, {
      method: 'DELETE',
    })

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to delete')
    }

    await fetchObjectives()
  }

  useEffect(() => {
    fetchObjectives()
  }, [lectureId])

  if (loading) {
    return <div className="text-center py-8">Loading objectives...</div>
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">Error: {error}</p>
        <Button onClick={() => fetchObjectives()}>Retry</Button>
      </div>
    )
  }

  const groupedByComplexity = {
    BASIC: objectives.filter((obj) => obj.complexity === 'BASIC'),
    INTERMEDIATE: objectives.filter((obj) => obj.complexity === 'INTERMEDIATE'),
    ADVANCED: objectives.filter((obj) => obj.complexity === 'ADVANCED'),
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Learning Objectives</h2>
        {objectives.length === 0 && (
          <Button onClick={handleExtractObjectives} disabled={isExtracting}>
            {isExtracting ? 'Extracting...' : 'Extract Objectives'}
          </Button>
        )}
        {objectives.length > 0 && (
          <Button variant="outline" onClick={handleExtractObjectives} disabled={isExtracting}>
            {isExtracting ? 'Re-extracting...' : 'Re-extract'}
          </Button>
        )}
      </div>

      {objectives.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          No objectives yet. Click "Extract Objectives" to analyze this lecture.
        </p>
      ) : (
        <div className="space-y-6">
          {(['BASIC', 'INTERMEDIATE', 'ADVANCED'] as const).map((complexity) => {
            const objs = groupedByComplexity[complexity]
            if (objs.length === 0) return null

            return (
              <section key={complexity}>
                <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                  {complexity} Level
                  <Badge className={COMPLEXITY_COLORS[complexity]}>{objs.length}</Badge>
                </h3>
                <div className="space-y-2">
                  {objs.map((obj) => (
                    <div
                      key={obj.id}
                      className="bg-white/95 backdrop-blur-xl rounded-xl p-4 shadow-[0_8px_32px_rgba(31,38,135,0.1)] hover:scale-[1.01] transition-transform"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <p className="text-gray-900">{obj.objective}</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {obj.isHighYield && (
                              <Badge className="bg-yellow-100 text-yellow-800">⭐ High-Yield</Badge>
                            )}
                            {obj.pageStart && obj.pageEnd && (
                              <Badge variant="outline">
                                {obj.pageStart === obj.pageEnd
                                  ? `Page ${obj.pageStart}`
                                  : `Pages ${obj.pageStart}-${obj.pageEnd}`}
                              </Badge>
                            )}
                            {obj.boardExamTags.map((comp) => (
                              <Badge key={comp} variant="outline" className="text-xs">
                                {comp}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setEditingObjective(obj)}>
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}

      {editingObjective && (
        <ObjectiveEditDialog
          objective={editingObjective}
          open={true}
          onOpenChange={(open) => !open && setEditingObjective(null)}
          onSave={(updates) => handleSave(editingObjective.id, updates)}
          onDelete={() => handleDelete(editingObjective.id)}
        />
      )}
    </div>
  )
}
