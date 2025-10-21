'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MissionPreferences } from '@/components/settings/mission-preferences'
import { MissionAdaptation } from '@/components/settings/mission-adaptation'
import { PerformancePrivacySettings } from '@/components/settings/performance-privacy-settings'
import { BehavioralPrivacySettings } from '@/components/settings/behavioral-privacy-settings'
import { CalendarIntegrationSettings } from '@/components/settings/calendar-integration-settings'
import { PersonalizationSettings } from '@/components/settings/PersonalizationSettings'

export default function SettingsPage() {
  const router = useRouter()
  const [deleting, setDeleting] = React.useState(false)
  const [showConfirmation, setShowConfirmation] = React.useState(false)

  const handleDeleteDemoUser = async () => {
    setDeleting(true)

    try {
      const response = await fetch('/api/demo/delete', {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to delete demo user')
      }

      // Success - redirect to home
      alert('Dumpling demo user deleted successfully! All demo data has been removed.')
      router.push('/')
      router.refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete demo user')
      setDeleting(false)
      setShowConfirmation(false)
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <h1 className="text-3xl font-semibold text-gray-800 mb-8">Settings</h1>

      <div className="space-y-6">
        {/* Demo User Section */}
        <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-2xl">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-800">Demo User</CardTitle>
            <CardDescription className="text-gray-600">
              Manage Dumpling demo user and placeholder data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  <strong>Dumpling 🥟</strong> is a demo user with 6 PNWU-COM OMS 1 courses (Gross
                  Anatomy, SciFOM, Pharmacology, OPP, Clinical Skills, Community Doctoring). Delete
                  Dumpling to remove all demo data and start fresh with your own content.
                </p>
              </div>

              {!showConfirmation ? (
                <Button
                  onClick={() => setShowConfirmation(true)}
                  variant="destructive"
                  className="bg-rose-400 hover:bg-rose-500 shadow-md hover:shadow-lg rounded-lg transition-all duration-200"
                >
                  Delete Demo User (Dumpling)
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg">
                    <p className="text-sm text-rose-800 font-semibold mb-2">⚠️ Are you sure?</p>
                    <p className="text-sm text-rose-700">
                      This will permanently delete Dumpling and ALL associated data:
                    </p>
                    <ul className="text-sm text-rose-700 list-disc list-inside mt-2 space-y-1">
                      <li>All courses (6 PNWU-COM OMS 1 courses)</li>
                      <li>All uploaded lectures and content</li>
                      <li>All flashcards and study sessions</li>
                      <li>All progress and analytics data</li>
                    </ul>
                    <p className="text-sm text-rose-800 font-semibold mt-3">
                      This action cannot be undone.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={handleDeleteDemoUser}
                      disabled={deleting}
                      variant="destructive"
                      className="bg-rose-500 hover:bg-rose-600 shadow-md hover:shadow-lg rounded-lg transition-all duration-200"
                    >
                      {deleting ? 'Deleting...' : 'Yes, Delete Dumpling'}
                    </Button>
                    <Button
                      onClick={() => setShowConfirmation(false)}
                      disabled={deleting}
                      variant="outline"
                      className="border-gray-300 hover:bg-gray-50 rounded-lg transition-all duration-200"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Mission Preferences */}
        <MissionPreferences />

        {/* Mission Adaptation - Story 2.6 Task C */}
        <MissionAdaptation />

        {/* Performance Privacy Settings */}
        <PerformancePrivacySettings />

        {/* Behavioral Privacy Settings - Story 5.1 Task 11 */}
        <BehavioralPrivacySettings />

        {/* Calendar Integration Settings - Story 5.3 Task 6.4 */}
        <CalendarIntegrationSettings />

        {/* Personalization Settings - Story 5.5 Task 12 */}
        <PersonalizationSettings />

        {/* Future Settings Sections */}
        <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-2xl">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-800">Profile</CardTitle>
            <CardDescription className="text-gray-600">
              User profile settings (coming soon)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              Profile settings will be available after authentication is implemented.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
