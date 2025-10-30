/**
 * Settings: Source Preferences Page
 *
 * Epic 3 - Story 3.4 - Task 2.4: User Source Preference System
 *
 * Features:
 * - List all medical sources with credibility scores
 * - Allow users to customize trust levels (HIGH, MEDIUM, LOW, BLOCKED)
 * - Set priority rankings for automatic conflict resolution
 * - Save preferences to UserSourcePreference model
 *
 * Design:
 * - Glassmorphism styling (bg-white/80 backdrop-blur-md)
 * - OKLCH colors (no gradients)
 * - Responsive layout
 * - Accessible controls
 */

'use client'

import { AlertCircle, Check, Loader2 } from 'lucide-react'
import * as React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

// Types
type SourceType = 'FIRST_AID' | 'GUIDELINE' | 'JOURNAL' | 'TEXTBOOK' | 'LECTURE' | 'USER_NOTES'
type TrustLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'BLOCKED'

interface Source {
  id: string
  name: string
  type: SourceType
  credibilityScore: number
  medicalSpecialty: string | null
  metadata: Record<string, any>
}

interface UserSourcePreference {
  id: string
  sourceId: string
  trustLevel: TrustLevel
  priority: number
  notes: string | null
}

interface SourceWithPreference extends Source {
  userPreference?: UserSourcePreference
}

/**
 * Get trust level badge color (OKLCH colors)
 */
function getTrustLevelColor(trustLevel: TrustLevel): string {
  switch (trustLevel) {
    case 'HIGH':
      return 'bg-[oklch(0.7_0.15_145)] text-white' // Green
    case 'MEDIUM':
      return 'bg-[oklch(0.7_0.15_80)] text-white' // Yellow-green
    case 'LOW':
      return 'bg-[oklch(0.7_0.15_35)] text-white' // Orange
    case 'BLOCKED':
      return 'bg-[oklch(0.5_0.15_25)] text-white' // Red
    default:
      return 'bg-gray-300 text-gray-800'
  }
}

/**
 * Get source type badge color (OKLCH colors)
 */
function getSourceTypeBadge(type: SourceType): { label: string; color: string } {
  const badges: Record<SourceType, { label: string; color: string }> = {
    FIRST_AID: { label: 'First Aid', color: 'bg-[oklch(0.7_0.15_260)] text-white' }, // Blue
    GUIDELINE: { label: 'Guideline', color: 'bg-[oklch(0.65_0.15_280)] text-white' }, // Purple
    JOURNAL: { label: 'Journal', color: 'bg-[oklch(0.65_0.15_220)] text-white' }, // Indigo
    TEXTBOOK: { label: 'Textbook', color: 'bg-[oklch(0.7_0.15_180)] text-white' }, // Cyan
    LECTURE: { label: 'Lecture', color: 'bg-[oklch(0.7_0.15_100)] text-white' }, // Lime
    USER_NOTES: { label: 'User Notes', color: 'bg-gray-400 text-white' },
  }

  return badges[type] || { label: type, color: 'bg-gray-300 text-gray-800' }
}

/**
 * Settings: Source Preferences Page Component
 */
export default function SourcesPage() {
  const [sources, setSources] = React.useState<SourceWithPreference[]>([])
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null)

  // Local preference state (for editing before save)
  const [preferences, setPreferences] = React.useState<Map<string, Partial<UserSourcePreference>>>(
    new Map(),
  )

  // Fetch sources and preferences on mount
  React.useEffect(() => {
    fetchSourcesAndPreferences()
  }, [])

  /**
   * Fetch all sources and user preferences
   */
  async function fetchSourcesAndPreferences() {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/settings/sources')

      if (!response.ok) {
        throw new Error('Failed to load sources')
      }

      const data = await response.json()
      setSources(data.sources || [])

      // Initialize local preferences from existing user preferences
      const prefMap = new Map<string, Partial<UserSourcePreference>>()
      data.sources.forEach((source: SourceWithPreference) => {
        if (source.userPreference) {
          prefMap.set(source.id, {
            trustLevel: source.userPreference.trustLevel,
            priority: source.userPreference.priority,
            notes: source.userPreference.notes,
          })
        }
      })
      setPreferences(prefMap)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sources')
      console.error('Error fetching sources:', err)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Update local preference state
   */
  function updatePreference(sourceId: string, updates: Partial<UserSourcePreference>) {
    setPreferences((prev) => {
      const newMap = new Map(prev)
      const existing = newMap.get(sourceId) || {}
      newMap.set(sourceId, { ...existing, ...updates })
      return newMap
    })
  }

  /**
   * Save all preferences to database
   */
  async function savePreferences() {
    setSaving(true)
    setError(null)
    setSuccessMessage(null)

    try {
      // Convert map to array for API
      const preferencesArray = Array.from(preferences.entries()).map(([sourceId, pref]) => ({
        sourceId,
        trustLevel: pref.trustLevel || 'MEDIUM',
        priority: pref.priority || 50,
        notes: pref.notes || null,
      }))

      const response = await fetch('/api/settings/sources/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: preferencesArray }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || 'Failed to save preferences')
      }

      setSuccessMessage('Source preferences saved successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)

      // Refresh data to get updated preferences
      await fetchSourcesAndPreferences()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save preferences')
      console.error('Error saving preferences:', err)
    } finally {
      setSaving(false)
    }
  }

  /**
   * Get effective trust level (from preferences or default)
   */
  function getEffectiveTrustLevel(source: SourceWithPreference): TrustLevel {
    const localPref = preferences.get(source.id)
    if (localPref?.trustLevel) {
      return localPref.trustLevel
    }
    if (source.userPreference?.trustLevel) {
      return source.userPreference.trustLevel
    }

    // Default trust level based on credibility score
    if (source.credibilityScore >= 90) return 'HIGH'
    if (source.credibilityScore >= 70) return 'MEDIUM'
    return 'LOW'
  }

  /**
   * Get effective priority (from preferences or default)
   */
  function getEffectivePriority(source: SourceWithPreference): number {
    const localPref = preferences.get(source.id)
    if (localPref?.priority !== undefined) {
      return localPref.priority
    }
    if (source.userPreference?.priority) {
      return source.userPreference.priority
    }
    return source.credibilityScore // Default to credibility score
  }

  /**
   * Check if preferences have changed
   */
  const hasChanges = React.useMemo(() => {
    return Array.from(preferences.values()).some((pref) => {
      return (
        pref.trustLevel !== undefined || pref.priority !== undefined || pref.notes !== undefined
      )
    })
  }, [preferences])

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto py-8 max-w-6xl">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[oklch(0.6_0.15_260)]" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-800 mb-2">Source Preferences</h1>
        <p className="text-gray-600">
          Customize how you trust different medical sources. Your preferences will be used when
          resolving conflicting information.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="mb-6 bg-rose-50/80 backdrop-blur-md border-rose-200 shadow-md rounded-2xl">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-rose-700">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success Message */}
      {successMessage && (
        <Card className="mb-6 bg-emerald-50/80 backdrop-blur-md border-emerald-200 shadow-md rounded-2xl">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-emerald-700">
              <Check className="h-5 w-5" />
              <p className="text-sm font-medium">{successMessage}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions Card */}
      <Card className="mb-6 bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-2xl">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-800">How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-[oklch(0.6_0.15_260)] font-semibold">•</span>
              <span>
                <strong>Trust Level:</strong> Set how much you trust each source (HIGH, MEDIUM, LOW,
                BLOCKED)
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[oklch(0.6_0.15_260)] font-semibold">•</span>
              <span>
                <strong>Priority:</strong> Higher numbers = higher priority when resolving conflicts
                (1-100)
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[oklch(0.6_0.15_260)] font-semibold">•</span>
              <span>
                <strong>Notes:</strong> Add personal notes about why you trust or distrust a source
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Sources List */}
      <div className="space-y-4">
        {sources.map((source) => {
          const typeBadge = getSourceTypeBadge(source.type)
          const trustLevel = getEffectiveTrustLevel(source)
          const priority = getEffectivePriority(source)

          return (
            <Card
              key={source.id}
              className="bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-2xl hover:shadow-[0_12px_40px_rgba(31,38,135,0.15)] transition-shadow duration-200"
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-gray-800 mb-2">
                      {source.name}
                    </CardTitle>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={typeBadge.color}>{typeBadge.label}</Badge>
                      <Badge className={getTrustLevelColor(trustLevel)}>Trust: {trustLevel}</Badge>
                      <Badge variant="outline" className="text-gray-600">
                        Credibility: {source.credibilityScore}/100
                      </Badge>
                      {source.medicalSpecialty && (
                        <Badge variant="outline" className="text-gray-600">
                          {source.medicalSpecialty}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Trust Level Selector */}
                  <div className="space-y-2">
                    <label
                      htmlFor={`trust-${source.id}`}
                      className="text-sm font-medium text-gray-700"
                    >
                      Trust Level
                    </label>
                    <Select
                      value={trustLevel}
                      onValueChange={(value) =>
                        updatePreference(source.id, { trustLevel: value as TrustLevel })
                      }
                    >
                      <SelectTrigger
                        id={`trust-${source.id}`}
                        className="bg-white/50 backdrop-blur-sm"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HIGH">High - Fully Trust</SelectItem>
                        <SelectItem value="MEDIUM">Medium - Generally Trust</SelectItem>
                        <SelectItem value="LOW">Low - Use with Caution</SelectItem>
                        <SelectItem value="BLOCKED">Blocked - Don't Use</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Priority Selector */}
                  <div className="space-y-2">
                    <label
                      htmlFor={`priority-${source.id}`}
                      className="text-sm font-medium text-gray-700"
                    >
                      Priority (1-100)
                    </label>
                    <input
                      id={`priority-${source.id}`}
                      type="number"
                      min="1"
                      max="100"
                      value={priority}
                      onChange={(e) =>
                        updatePreference(source.id, { priority: parseInt(e.target.value, 10) })
                      }
                      className="w-full px-3 py-2 bg-white/50 backdrop-blur-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[oklch(0.6_0.15_260)] focus:border-transparent"
                    />
                  </div>

                  {/* Notes */}
                  <div className="space-y-2 md:col-span-1">
                    <label
                      htmlFor={`notes-${source.id}`}
                      className="text-sm font-medium text-gray-700"
                    >
                      Notes (Optional)
                    </label>
                    <Textarea
                      id={`notes-${source.id}`}
                      placeholder="Add personal notes..."
                      value={
                        preferences.get(source.id)?.notes || source.userPreference?.notes || ''
                      }
                      onChange={(e) => updatePreference(source.id, { notes: e.target.value })}
                      className="bg-white/50 backdrop-blur-sm min-h-[80px]"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Save Button */}
      {sources.length > 0 && (
        <div className="mt-8 flex justify-end">
          <Button
            onClick={savePreferences}
            disabled={saving || !hasChanges}
            className="bg-[oklch(0.6_0.15_260)] hover:bg-[oklch(0.55_0.15_260)] text-white shadow-md hover:shadow-lg rounded-lg transition-all duration-200 px-6 py-2"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Save Preferences
              </>
            )}
          </Button>
        </div>
      )}

      {/* Empty State */}
      {sources.length === 0 && (
        <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-2xl">
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">
              No sources found. Run the seed script to populate sources.
            </p>
            <code className="mt-4 inline-block px-4 py-2 bg-gray-100 rounded-md text-sm text-gray-700">
              cd apps/web && npx ts-node prisma/seed-sources.ts
            </code>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
