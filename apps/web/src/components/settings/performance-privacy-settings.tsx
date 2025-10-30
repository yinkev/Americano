/**
 * PerformancePrivacySettings Component
 * Story 2.2 Task 8
 *
 * Privacy controls for performance tracking data
 */

'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

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
      <Card className="bg-white border shadow-sm rounded-lg">
        <CardHeader className="p-4">
          <CardTitle className="text-[20px] font-heading font-semibold tracking-tight">
            Performance Privacy
          </CardTitle>
          <CardDescription className="text-[13px] text-muted-foreground">
            Loading...
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="bg-white border shadow-sm hover:shadow-md transition-shadow duration-300 rounded-lg">
      <CardHeader className="p-4">
        <CardTitle className="text-[20px] font-heading font-semibold tracking-tight">
          Performance Privacy
        </CardTitle>
        <CardDescription className="text-[13px] text-muted-foreground">
          Control how your learning performance data is tracked and used
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 space-y-6">
        {/* Privacy Toggles */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 p-4 rounded-lg bg-muted/10 border border-border hover:border-primary/30 hover:shadow-sm transition-all duration-200">
            <div className="flex-1">
              <Label htmlFor="tracking-enabled" className="text-[13px] font-medium cursor-pointer">
                Track Performance Metrics
              </Label>
              <p className="text-[11px] text-muted-foreground mt-1">
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

          <div className="flex items-center justify-between gap-4 p-4 rounded-lg bg-muted/10 border border-border hover:border-primary/30 hover:shadow-sm transition-all duration-200">
            <div className="flex-1">
              <Label htmlFor="analytics-enabled" className="text-[13px] font-medium cursor-pointer">
                Include in Analytics
              </Label>
              <p className="text-[11px] text-muted-foreground mt-1">
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
          <div
            className="p-4 rounded-lg border"
            style={{
              backgroundColor: 'oklch(0.65 0.18 240 / 0.1)',
              borderColor: 'oklch(0.65 0.18 240 / 0.3)',
            }}
          >
            <h4 className="text-[13px] font-medium mb-2">Data Ownership</h4>
            <p className="text-[11px]" style={{ color: 'oklch(0.4 0.15 240)' }}>
              You own your learning data. Export it anytime in JSON format (FERPA compliant).
            </p>
          </div>

          <Button
            onClick={handleExport}
            disabled={exporting}
            variant="outline"
            className="w-full text-[13px] hover:scale-[1.02] active:scale-[0.98] transition-transform duration-150"
          >
            {exporting ? 'Exporting...' : 'Export My Performance Data'}
          </Button>
        </div>

        {/* Reset Data */}
        <div className="border-t pt-6">
          <h4 className="text-[15px] font-semibold mb-2">Reset All Performance Data</h4>
          <p className="text-[13px] text-muted-foreground mb-4">
            Permanently delete all performance metrics, weakness scores, and mastery levels. This
            will reset all learning objectives to "NOT_STARTED" status.
          </p>

          {!showResetConfirmation ? (
            <Button
              onClick={() => setShowResetConfirmation(true)}
              variant="destructive"
              className="text-[13px] hover:scale-[1.02] active:scale-[0.98] transition-transform duration-150"
            >
              Reset All Performance Data
            </Button>
          ) : (
            <div className="space-y-4">
              <div
                className="p-4 rounded-lg border"
                style={{
                  backgroundColor: 'oklch(0.6 0.20 30 / 0.1)',
                  borderColor: 'oklch(0.6 0.20 30 / 0.3)',
                }}
              >
                <p
                  className="text-[13px] font-semibold mb-2"
                  style={{ color: 'oklch(0.4 0.2 30)' }}
                >
                  Are you sure?
                </p>
                <p className="text-[11px]" style={{ color: 'oklch(0.4 0.2 30)' }}>
                  This will permanently delete:
                </p>
                <ul
                  className="text-[11px] list-disc list-inside mt-2 space-y-1"
                  style={{ color: 'oklch(0.4 0.2 30)' }}
                >
                  <li>All performance metric records (time-series data)</li>
                  <li>All weakness scores and mastery levels</li>
                  <li>All self-assessment confidence ratings</li>
                  <li>Study time and review history aggregates</li>
                </ul>
                <p
                  className="text-[11px] font-semibold mt-3"
                  style={{ color: 'oklch(0.4 0.2 30)' }}
                >
                  This action cannot be undone. Individual review records and flashcards will not be
                  affected.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleReset}
                  disabled={resetting}
                  variant="destructive"
                  className="flex-1 text-[13px] hover:scale-[1.02] active:scale-[0.98] transition-transform duration-150"
                >
                  {resetting ? 'Resetting...' : 'Yes, Reset All Data'}
                </Button>
                <Button
                  onClick={() => setShowResetConfirmation(false)}
                  disabled={resetting}
                  variant="outline"
                  className="flex-1 text-[13px]"
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
