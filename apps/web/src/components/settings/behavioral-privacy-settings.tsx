'use client'

import * as React from 'react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'

export function BehavioralPrivacySettings() {
  const [behavioralAnalysisEnabled, setBehavioralAnalysisEnabled] = React.useState(true)
  const [learningStyleProfilingEnabled, setLearningStyleProfilingEnabled] = React.useState(true)
  const [loading, setLoading] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)
  const [exporting, setExporting] = React.useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)

  // Load current settings on mount
  React.useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch('/api/user/privacy')
        if (!response.ok) {
          throw new Error('Failed to load privacy settings')
        }
        const data = await response.json()
        setBehavioralAnalysisEnabled(data.behavioralAnalysisEnabled ?? true)
        setLearningStyleProfilingEnabled(data.learningStyleProfilingEnabled ?? true)
      } catch (error) {
        console.error('Error loading privacy settings:', error)
        toast.error('Failed to load privacy settings')
      }
    }

    loadSettings()
  }, [])

  // Update privacy setting
  async function updatePrivacySetting(
    field: 'behavioralAnalysisEnabled' | 'learningStyleProfilingEnabled',
    value: boolean,
  ) {
    setLoading(true)

    try {
      const response = await fetch('/api/user/privacy', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [field]: value }),
      })

      if (!response.ok) {
        throw new Error('Failed to update privacy settings')
      }

      const data = await response.json()

      if (field === 'behavioralAnalysisEnabled') {
        setBehavioralAnalysisEnabled(data.behavioralAnalysisEnabled)
      } else {
        setLearningStyleProfilingEnabled(data.learningStyleProfilingEnabled)
      }

      toast.success('Privacy settings updated')
    } catch (error) {
      console.error('Error updating privacy settings:', error)
      toast.error('Failed to update privacy settings')

      // Revert toggle on error
      if (field === 'behavioralAnalysisEnabled') {
        setBehavioralAnalysisEnabled(!value)
      } else {
        setLearningStyleProfilingEnabled(!value)
      }
    } finally {
      setLoading(false)
    }
  }

  // Delete all behavioral patterns
  async function handleDeleteAllPatterns() {
    setDeleting(true)

    try {
      const response = await fetch('/api/analytics/patterns/all', {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete behavioral patterns')
      }

      toast.success('All behavioral patterns deleted successfully')
      setShowDeleteDialog(false)
    } catch (error) {
      console.error('Error deleting patterns:', error)
      toast.error('Failed to delete behavioral patterns')
    } finally {
      setDeleting(false)
    }
  }

  // Export behavioral patterns
  async function handleExportPatterns() {
    setExporting(true)

    try {
      const response = await fetch('/api/analytics/export')

      if (!response.ok) {
        throw new Error('Failed to export behavioral patterns')
      }

      const data = await response.json()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const filename = `behavioral-patterns-${data.userId}-${timestamp}.json`

      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success('Behavioral patterns exported successfully')
    } catch (error) {
      console.error('Error exporting patterns:', error)
      toast.error('Failed to export behavioral patterns')
    } finally {
      setExporting(false)
    }
  }

  return (
    <>
      <Card className="bg-white border shadow-sm hover:shadow-md transition-shadow duration-300 rounded-lg">
        <CardHeader className="p-4">
          <CardTitle className="text-[20px] font-heading font-semibold tracking-tight">
            Behavioral Pattern Analysis
          </CardTitle>
          <CardDescription className="text-[13px] text-muted-foreground">
            Pattern analysis helps optimize your study experience by identifying what works best for
            you.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 space-y-6">
          {/* Toggle 1: Enable behavioral pattern analysis */}
          <div className="flex items-center justify-between gap-4 p-4 rounded-lg bg-muted/10 border border-border hover:border-primary/30 hover:shadow-sm transition-all duration-200">
            <div className="flex-1 space-y-1">
              <label
                htmlFor="behavioral-analysis"
                className="text-[13px] font-medium cursor-pointer"
              >
                Enable behavioral pattern analysis
              </label>
              <p className="text-[11px] text-muted-foreground">
                Analyze your study patterns to provide personalized recommendations
              </p>
            </div>
            <Switch
              id="behavioral-analysis"
              checked={behavioralAnalysisEnabled}
              onCheckedChange={(checked) =>
                updatePrivacySetting('behavioralAnalysisEnabled', checked)
              }
              disabled={loading}
            />
          </div>

          {/* Toggle 2: Enable learning style profiling */}
          <div className="flex items-center justify-between gap-4 p-4 rounded-lg bg-muted/10 border border-border hover:border-primary/30 hover:shadow-sm transition-all duration-200">
            <div className="flex-1 space-y-1">
              <label htmlFor="learning-style" className="text-[13px] font-medium cursor-pointer">
                Enable learning style profiling
              </label>
              <p className="text-[11px] text-muted-foreground">
                Identify your VARK learning style (Visual, Auditory, Kinesthetic, Reading/Writing)
              </p>
            </div>
            <Switch
              id="learning-style"
              checked={learningStyleProfilingEnabled}
              onCheckedChange={(checked) =>
                updatePrivacySetting('learningStyleProfilingEnabled', checked)
              }
              disabled={loading}
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t space-y-3">
            {/* Export Button */}
            <Button
              onClick={handleExportPatterns}
              disabled={exporting}
              variant="outline"
              className="w-full text-[13px] hover:scale-[1.02] active:scale-[0.98] transition-transform duration-150"
            >
              {exporting ? 'Exporting...' : 'Export My Behavioral Patterns'}
            </Button>

            {/* Delete Button */}
            <Button
              onClick={() => setShowDeleteDialog(true)}
              disabled={deleting}
              variant="destructive"
              className="w-full text-[13px] hover:scale-[1.02] active:scale-[0.98] transition-transform duration-150"
            >
              Delete All Behavioral Patterns
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-white border shadow-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[16px] font-semibold">
              Delete All Behavioral Data?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[13px]">
              This will permanently delete all detected patterns, insights, and your learning
              profile. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting} className="text-[13px]">
              Keep My Data
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAllPatterns}
              disabled={deleting}
              className="text-[13px]"
            >
              {deleting ? 'Deleting...' : 'Delete Everything'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
