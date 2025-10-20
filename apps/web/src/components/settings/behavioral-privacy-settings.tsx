'use client'

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
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
import { toast } from 'sonner'

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
      <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-2xl">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-800">
            Behavioral Pattern Analysis
          </CardTitle>
          <CardDescription className="text-gray-600">
            Pattern analysis helps optimize your study experience by identifying what works best for
            you.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Toggle 1: Enable behavioral pattern analysis */}
          <div className="flex items-center justify-between space-x-4">
            <div className="flex-1 space-y-1">
              <label htmlFor="behavioral-analysis" className="text-sm font-medium text-gray-800">
                Enable behavioral pattern analysis
              </label>
              <p className="text-sm text-gray-600">
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
              className="min-h-[44px] min-w-[44px] flex items-center justify-center"
            />
          </div>

          {/* Toggle 2: Enable learning style profiling */}
          <div className="flex items-center justify-between space-x-4">
            <div className="flex-1 space-y-1">
              <label htmlFor="learning-style" className="text-sm font-medium text-gray-800">
                Enable learning style profiling
              </label>
              <p className="text-sm text-gray-600">
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
              className="min-h-[44px] min-w-[44px] flex items-center justify-center"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-gray-200 space-y-3">
            {/* Export Button */}
            <Button
              onClick={handleExportPatterns}
              disabled={exporting}
              variant="outline"
              className="w-full border-gray-300 hover:bg-gray-50 rounded-lg transition-all duration-200 min-h-[44px]"
            >
              {exporting ? 'Exporting...' : 'Export My Behavioral Patterns'}
            </Button>

            {/* Delete Button */}
            <Button
              onClick={() => setShowDeleteDialog(true)}
              disabled={deleting}
              variant="destructive"
              className="w-full bg-rose-500 hover:bg-rose-600 shadow-md hover:shadow-lg rounded-lg transition-all duration-200 min-h-[44px]"
            >
              Delete All Behavioral Patterns
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-white/95 backdrop-blur-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-semibold text-gray-800">
              Delete All Behavioral Data?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              This will permanently delete all detected patterns, insights, and your learning
              profile. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={deleting}
              className="border-gray-300 hover:bg-gray-50 rounded-lg transition-all duration-200 min-h-[44px]"
            >
              Keep My Data
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAllPatterns}
              disabled={deleting}
              className="bg-rose-500 hover:bg-rose-600 text-white shadow-md hover:shadow-lg rounded-lg transition-all duration-200 min-h-[44px]"
            >
              {deleting ? 'Deleting...' : 'Delete Everything'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
