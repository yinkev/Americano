'use client'

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Shield, Download, Trash2 } from 'lucide-react'

export function PerformancePrivacySettings() {
  const [trackingEnabled, setTrackingEnabled] = React.useState(true)
  const [includeInAnalytics, setIncludeInAnalytics] = React.useState(true)
  const [showResetConfirmation, setShowResetConfirmation] = React.useState(false)
  const [resetting, setResetting] = React.useState(false)
  const [exporting, setExporting] = React.useState(false)

  async function handleExport() {
    // Export logic
  }

  async function handleReset() {
    // Reset logic
  }

  return (
    <Card className="p-6 bg-card  border-border/50 shadow-none rounded-xl">
      <CardHeader className="p-0 mb-6">
        <div className="flex items-center gap-4">
            <div className="p-3 bg-card rounded-xl">
                <Shield className="w-8 h-8 text-primary" />
            </div>
            <div>
                <CardTitle className="text-2xl font-heading font-bold">Performance Privacy</CardTitle>
                <CardDescription className="text-lg text-muted-foreground">Control how your learning performance data is tracked and used.</CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-card border-border/50 shadow-none">
            <div className="space-y-1">
              <Label htmlFor="tracking-enabled" className="text-xl font-semibold cursor-pointer">
                Track Performance Metrics
              </Label>
              <p className="text-md text-muted-foreground">
                Calculate weakness scores, mastery levels, and performance trends.
              </p>
            </div>
            <Switch
              id="tracking-enabled"
              checked={trackingEnabled}
              onCheckedChange={setTrackingEnabled}
              className="scale-125"
            />
          </div>

          <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-card border-border/50 shadow-none">
            <div className="space-y-1">
              <Label htmlFor="analytics-enabled" className="text-xl font-semibold cursor-pointer">
                Include in Analytics
              </Label>
              <p className="text-md text-muted-foreground">
                Use performance data for insights, recommendations, and mission generation.
              </p>
            </div>
            <Switch
              id="analytics-enabled"
              checked={includeInAnalytics}
              onCheckedChange={setIncludeInAnalytics}
              className="scale-125"
            />
          </div>
        </div>

        <div className="space-y-4 pt-6 border-t-2 border-border/50">
          <h4 className="text-xl font-heading font-bold">Data Management</h4>
          <p className="text-md text-muted-foreground">
            You own your learning data. Export it anytime in JSON format (FERPA compliant).
          </p>
          <Button
            onClick={handleExport}
            disabled={exporting}
            size="lg" className="w-full rounded-full font-bold text-lg shadow-none gap-2"
          >
            {exporting ? 'Exporting...' : <><Download /> Export My Performance Data</>}
          </Button>
        </div>

        <div className="space-y-4 pt-6 border-t-2 border-border/50">
          <h4 className="text-xl font-heading font-bold text-destructive">Reset All Performance Data</h4>
          <p className="text-md text-muted-foreground">
            Permanently delete all performance metrics, weakness scores, and mastery levels. This
            will reset all learning objectives to "NOT_STARTED" status.
          </p>

          {!showResetConfirmation ? (
            <Button
              onClick={() => setShowResetConfirmation(true)}
              variant="destructive"
              size="lg" className="w-full rounded-full font-bold text-lg shadow-none gap-2"
            >
              <Trash2 /> Reset All Performance Data
            </Button>
          ) : (
            <div className="space-y-4 p-4 rounded-xl bg-card border-2 border-destructive/50">
              <p className="text-lg font-semibold text-destructive">⚠️ Are you sure?</p>
              <p className="text-md text-destructive/80">
                This action cannot be undone. All your performance history will be lost.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={handleReset}
                  disabled={resetting}
                  variant="destructive"
                  size="lg" className="flex-1 rounded-full font-bold text-lg shadow-none gap-2"
                >
                  {resetting ? 'Resetting...' : 'Yes, Reset All Data'}
                </Button>
                <Button
                  onClick={() => setShowResetConfirmation(false)}
                  disabled={resetting}
                  variant="outline"
                  size="lg" className="flex-1 rounded-full font-bold text-lg shadow-none gap-2"
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
