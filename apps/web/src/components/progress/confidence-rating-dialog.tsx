/**
 * ConfidenceRatingDialog Component
 * Story 2.2 Task 6
 *
 * Self-assessment dialog for confidence tracking
 */

'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface Props {
  objectiveId: string
  objectiveText: string
  isOpen: boolean
  onClose: () => void
  onSubmit?: (confidenceLevel: number, notes?: string) => void
}

export function ConfidenceRatingDialog({
  objectiveId,
  objectiveText,
  isOpen,
  onClose,
  onSubmit,
}: Props) {
  const [selectedConfidence, setSelectedConfidence] = useState<number | null>(null)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) return null

  async function handleSubmit() {
    if (selectedConfidence === null) return

    try {
      setSubmitting(true)

      const response = await fetch('/api/performance/self-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          objectiveId,
          confidenceLevel: selectedConfidence,
          notes: notes.trim() || undefined,
        }),
      })

      if (!response.ok) throw new Error('Failed to submit assessment')

      if (onSubmit) {
        onSubmit(selectedConfidence, notes.trim() || undefined)
      }

      // Reset and close
      setSelectedConfidence(null)
      setNotes('')
      onClose()
    } catch (error) {
      console.error('Error submitting confidence rating:', error)
      alert('Failed to submit confidence rating. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const confidenceLevels = [
    { value: 1, label: 'Not Confident', emoji: '😰', description: 'Need to review this' },
    { value: 2, label: 'Slightly Confident', emoji: '😕', description: 'Struggling with this' },
    { value: 3, label: 'Moderately Confident', emoji: '😐', description: 'Getting there' },
    { value: 4, label: 'Confident', emoji: '😊', description: 'Feel good about this' },
    { value: 5, label: 'Very Confident', emoji: '😄', description: 'Mastered this!' },
  ]

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={onClose} />

      {/* Dialog */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(31,38,135,0.2)] max-w-lg w-full p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-xl font-heading font-bold text-gray-900">
                How confident are you?
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Rate your understanding of this learning objective
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Objective Text */}
          <div className="mb-6 p-4 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-700 italic">"{objectiveText}"</p>
          </div>

          {/* Confidence Level Buttons */}
          <div className="space-y-3 mb-6">
            {confidenceLevels.map((level) => (
              <button
                key={level.value}
                onClick={() => setSelectedConfidence(level.value)}
                className={`w-full p-4 rounded-xl text-left transition-all min-h-[44px] ${
                  selectedConfidence === level.value
                    ? 'bg-[oklch(0.55_0.22_264)] text-white shadow-lg scale-[1.02]'
                    : 'bg-white/60 hover:bg-white/80 text-gray-700'
                } shadow-sm`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{level.emoji}</span>
                  <div className="flex-1">
                    <div className="font-medium">{level.label}</div>
                    <div
                      className={`text-xs ${
                        selectedConfidence === level.value ? 'text-white/80' : 'text-gray-500'
                      }`}
                    >
                      {level.description}
                    </div>
                  </div>
                  <div
                    className={`text-lg font-bold ${
                      selectedConfidence === level.value ? 'text-white' : 'text-gray-400'
                    }`}
                  >
                    {level.value}/5
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Optional Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any thoughts or reflections on this objective?"
              className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm rounded-xl border-2 border-transparent focus:border-[oklch(0.55_0.22_264)] focus:outline-none transition-colors resize-none"
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl font-medium bg-white/60 text-gray-700 hover:bg-white/80 shadow-sm transition-colors min-h-[44px]"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={selectedConfidence === null || submitting}
              className="flex-1 px-4 py-3 rounded-xl font-medium bg-[oklch(0.55_0.22_264)] text-white hover:bg-[oklch(0.50_0.22_264)] shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            >
              {submitting ? 'Submitting...' : 'Submit Rating'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
