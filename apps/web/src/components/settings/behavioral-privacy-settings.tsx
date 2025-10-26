'use client'

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Shield, Download, Trash2 } from 'lucide-react'

export function BehavioralPrivacySettings() {
  const [behavioralAnalysisEnabled, setBehavioralAnalysisEnabled] = React.useState(true)
  const [learningStyleProfilingEnabled, setLearningStyleProfilingEnabled] = React.useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)
  const [exporting, setExporting] = React.useState(false)

  async function handleDeleteAllPatterns() {
    // Delete logic
  }

  async function handleExportPatterns() {
    // Export logic
  }

  return (
    <Card className="p-6 bg-card  border-border/50 shadow-none rounded-xl">
      <CardHeader className="p-0 mb-6">
        <div className="flex items-center gap-4">
            <div className="p-3 bg-card rounded-xl">
                <Shield className="w-8 h-8 text-primary" />
            </div>
            <div>
                <CardTitle className="text-2xl font-heading font-bold">Behavioral Privacy</CardTitle>
                <CardDescription className="text-lg text-muted-foreground">Control how your learning patterns are analyzed.</CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-card border-border/50 shadow-none">
            <div className="space-y-1">
              <Label htmlFor="behavioral-analysis" className="text-xl font-semibold cursor-pointer">
                Enable Behavioral Pattern Analysis
              </Label>
              <p className="text-md text-muted-foreground">
                Analyze your study patterns to provide personalized recommendations.
              </p>
            </div>
            <Switch
              id="behavioral-analysis"
              checked={behavioralAnalysisEnabled}
              onCheckedChange={setBehavioralAnalysisEnabled}
              className="scale-125"
            />
          </div>

          <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-card border-border/50 shadow-none">
            <div className="space-y-1">
              <Label htmlFor="learning-style" className="text-xl font-semibold cursor-pointer">
                Enable Learning Style Profiling
              </Label>
              <p className="text-md text-muted-foreground">
                Identify your VARK learning style (Visual, Auditory, Kinesthetic, Reading/Writing).
              </p>
            </div>
            <Switch
              id="learning-style"
              checked={learningStyleProfilingEnabled}
              onCheckedChange={setLearningStyleProfilingEnabled}
              className="scale-125"
            />
          </div>
        </div>

        <div className="space-y-4 pt-6 border-t-2 border-border/50">
          <h4 className="text-xl font-heading font-bold">Data Management</h4>
          <p className="text-md text-muted-foreground">
            You own your behavioral data. Export it anytime in JSON format.
          </p>
          <Button
            onClick={handleExportPatterns}
            disabled={exporting}
            size="lg" className="w-full rounded-full font-bold text-lg shadow-none gap-2"
          >
            {exporting ? 'Exporting...' : <><Download /> Export My Behavioral Patterns</>}
          </Button>
        </div>

        <div className="space-y-4 pt-6 border-t-2 border-border/50">
          <h4 className="text-xl font-heading font-bold text-destructive">Delete All Behavioral Patterns</h4>
          <p className="text-md text-muted-foreground">
            Permanently delete all detected patterns, insights, and your learning profile. This action cannot be undone.
          </p>

          {!showDeleteDialog ? (
            <Button
              onClick={() => setShowDeleteDialog(true)}
              variant="destructive"
              size="lg" className="w-full rounded-full font-bold text-lg shadow-none gap-2"
            >
              <Trash2 /> Delete All Behavioral Patterns
            </Button>
          ) : (
            <div className="space-y-4 p-4 rounded-xl bg-card border-2 border-destructive/50">
              <p className="text-lg font-semibold text-destructive">⚠️ Are you sure?</p>
              <p className="text-md text-destructive/80">
                This will permanently delete all behavioral data. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={handleDeleteAllPatterns}
                  disabled={deleting}
                  variant="destructive"
                  size="lg" className="flex-1 rounded-full font-bold text-lg shadow-none gap-2"
                >
                  {deleting ? 'Deleting...' : 'Yes, Delete All Data'}
                </Button>
                <Button
                  onClick={() => setShowDeleteDialog(false)}
                  disabled={deleting}
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
