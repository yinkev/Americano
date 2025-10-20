/**
 * PerformancePrivacySettings Component
 * Story 2.2 Task 8
 *
 * Privacy controls for performance tracking data
 */

'use client'

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

export function PerformancePrivacySettings() {
  const [trackingEnabled, setTrackingEnabled] = React.useState(true)
  const [includeInAnalytics, setIncludeInAnalytics] = React.useState(true)
  const [showResetConfirmation, setShowResetConfirmation] = React.useState(false)
  const [resetting, setResetting] = React.useState(false)
  const [exporting, setExporting] = React.useState(false)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    fetchPreferences()
  }, [])

  async function fetchPreferences() {
    try {
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const result = await response.json()
        const user = result.data.user
        setTrackingEnabled(user.performanceTrackingEnabled)
        setIncludeInAnalytics(user.includeInAnalytics)
      }
    } catch (error) {
      console.error('Error fetching preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  async function updatePreference(field: string, value: boolean) {
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      })

      if (!response.ok) throw new Error('Failed to update preference')
    } catch (error) {
      console.error('Error updating preference:', error)
      alert('Failed to update preference. Please try again.')
    }
  }

  async function handleExport() {
    try {
      setExporting(true)
      const response = await fetch('/api/performance/export')

      if (!response.ok) throw new Error('Failed to export data')

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `performance-data-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting data:', error)
      alert('Failed to export data. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  async function handleReset() {
    try {
      setResetting(true)
      const response = await fetch('/api/performance/reset', {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to reset data')

      const result = await response.json()
      alert(result.data.message)
      setShowResetConfirmation(false)
    } catch (error) {
      console.error('Error resetting data:', error)
      alert('Failed to reset data. Please try again.')
    } finally {
      setResetting(false)
    }
  }

  if (loading) {
    return (
      <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-2xl">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-800">Performance Privacy</CardTitle>
          <CardDescription className="text-gray-600">Loading...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-2xl">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-gray-800">Performance Privacy</CardTitle>
        <CardDescription className="text-gray-600">
          Control how your learning performance data is tracked and used
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Privacy Toggles */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white/60 backdrop-blur-sm rounded-xl">
            <div className="flex-1">
              <Label htmlFor="tracking-enabled" className="text-base font-medium text-gray-900">
                Track Performance Metrics
              </Label>
              <p className="text-sm text-gray-600 mt-1">
                Calculate weakness scores, mastery levels, and performance trends
              </p>
            </div>
            <Switch
              id="tracking-enabled"
              checked={trackingEnabled}
              onCheckedChange={(checked) => {
                setTrackingEnabled(checked)
                updatePreference('performanceTrackingEnabled', checked)
              }}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-white/60 backdrop-blur-sm rounded-xl">
            <div className="flex-1">
              <Label htmlFor="analytics-enabled" className="text-base font-medium text-gray-900">
                Include in Analytics
              </Label>
              <p className="text-sm text-gray-600 mt-1">
                Use performance data for insights, recommendations, and mission generation
              </p>
            </div>
            <Switch
              id="analytics-enabled"
              checked={includeInAnalytics}
              onCheckedChange={(checked) => {
                setIncludeInAnalytics(checked)
                updatePreference('includeInAnalytics', checked)
              }}
            />
          </div>
        </div>

        {/* Data Management */}
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <h4 className="text-sm font-medium text-blue-900 mb-2">📊 Data Ownership</h4>
            <p className="text-sm text-blue-700">
              You own your learning data. Export it anytime in JSON format (FERPA compliant).
            </p>
          </div>

          <Button
            onClick={handleExport}
            disabled={exporting}
            variant="outline"
            className="w-full min-h-[44px] rounded-xl bg-white/60 hover:bg-white/80 border-gray-300"
          >
            {exporting ? 'Exporting...' : 'Export My Performance Data'}
          </Button>
        </div>

        {/* Reset Data */}
        <div className="border-t border-gray-200 pt-6">
          <h4 className="text-base font-medium text-gray-900 mb-2">Reset All Performance Data</h4>
          <p className="text-sm text-gray-600 mb-4">
            Permanently delete all performance metrics, weakness scores, and mastery levels. This
            will reset all learning objectives to "NOT_STARTED" status.
          </p>

          {!showResetConfirmation ? (
            <Button
              onClick={() => setShowResetConfirmation(true)}
              variant="destructive"
              className="bg-rose-400 hover:bg-rose-500 shadow-md hover:shadow-lg rounded-xl min-h-[44px]"
            >
              Reset All Performance Data
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl">
                <p className="text-sm text-rose-800 font-semibold mb-2">⚠️ Are you sure?</p>
                <p className="text-sm text-rose-700">This will permanently delete:</p>
                <ul className="text-sm text-rose-700 list-disc list-inside mt-2 space-y-1">
                  <li>All performance metric records (time-series data)</li>
                  <li>All weakness scores and mastery levels</li>
                  <li>All self-assessment confidence ratings</li>
                  <li>Study time and review history aggregates</li>
                </ul>
                <p className="text-sm text-rose-800 font-semibold mt-3">
                  This action cannot be undone. Individual review records and flashcards will not be
                  affected.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleReset}
                  disabled={resetting}
                  variant="destructive"
                  className="flex-1 bg-rose-500 hover:bg-rose-600 shadow-md hover:shadow-lg rounded-xl min-h-[44px]"
                >
                  {resetting ? 'Resetting...' : 'Yes, Reset All Data'}
                </Button>
                <Button
                  onClick={() => setShowResetConfirmation(false)}
                  disabled={resetting}
                  variant="outline"
                  className="flex-1 border-gray-300 hover:bg-gray-50 rounded-xl min-h-[44px]"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
