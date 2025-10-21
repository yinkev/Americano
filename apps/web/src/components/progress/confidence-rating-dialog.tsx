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
        <div className="bg-background border shadow-lg rounded-lg max-w-lg w-full p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-[20px] font-heading font-semibold">
                How confident are you?
              </h3>
              <p className="text-[13px] text-muted-foreground mt-1">
                Rate your understanding of this learning objective
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-secondary/80 transition-all duration-150"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Objective Text */}
          <div className="mb-6 p-4 bg-secondary/30 rounded-lg">
            <p className="text-[13px] text-foreground italic">"{objectiveText}"</p>
          </div>

          {/* Confidence Level Buttons */}
          <div className="space-y-3 mb-6">
            {confidenceLevels.map((level) => (
              <button
                key={level.value}
                onClick={() => setSelectedConfidence(level.value)}
                className={`w-full p-4 rounded-lg text-left transition-all duration-150 min-h-[44px] hover:scale-[1.01] active:scale-[0.99] ${
                  selectedConfidence === level.value
                    ? 'bg-clinical text-clinical-foreground shadow-md'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{level.emoji}</span>
                  <div className="flex-1">
                    <div className="font-medium text-[15px]">{level.label}</div>
                    <div className="text-[11px] opacity-80">
                      {level.description}
                    </div>
                  </div>
                  <div className="text-lg font-bold">
                    {level.value}/5
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Optional Notes */}
          <div className="mb-6">
            <label className="block text-[11px] font-medium text-foreground mb-2 uppercase tracking-wide">Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any thoughts or reflections on this objective?"
              className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:border-clinical focus:outline-none focus:ring-2 focus:ring-clinical/20 transition-all resize-none"
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 h-9 px-4 rounded-lg font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={selectedConfidence === null || submitting}
              className="flex-1 h-9 px-4 rounded-lg font-medium bg-clinical text-clinical-foreground hover:bg-clinical/90 transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {submitting ? 'Submitting...' : 'Submit Rating'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
