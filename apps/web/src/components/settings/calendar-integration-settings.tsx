/**
 * CalendarIntegrationSettings Component
 * Story 5.3 Task 6.4
 *
 * Settings section for calendar integration:
 * - OAuth connection flow (Google Calendar, Outlook)
 * - Connection status display
 * - Disconnect functionality
 * - Privacy notices
 */

'use client'

import { useState, useEffect } from 'react'
import { Calendar, CheckCircle, Clock, LogOut, RefreshCw, AlertCircle, Loader2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useUserStore } from '@/store/use-user-store'
import { toast } from 'sonner'

interface CalendarStatus {
  connected: boolean
  provider?: 'GOOGLE' | 'OUTLOOK'
  lastSyncAt?: string
  calendarId?: string
}

export function CalendarIntegrationSettings() {
  const { userEmail } = useUserStore()
  const [status, setStatus] = useState<CalendarStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  useEffect(() => {
    fetchStatus()
  }, [userEmail])

  async function fetchStatus() {
    try {
      const res = await fetch(`/api/calendar/status?userId=${userEmail}`)
      if (!res.ok) throw new Error('Failed to fetch calendar status')
      const data = await res.json()
      setStatus(data)
    } catch (err) {
      console.error('Failed to fetch calendar status:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleConnect() {
    try {
      const res = await fetch('/api/calendar/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'GOOGLE', userId: userEmail }),
      })

      if (!res.ok) throw new Error('Failed to initiate OAuth')

      const data = await res.json()
      window.location.href = data.authorizationUrl
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to connect calendar')
    }
  }

  async function handleSync() {
    setSyncing(true)
    try {
      const res = await fetch('/api/calendar/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userEmail, daysAhead: 7 }),
      })

      if (!res.ok) throw new Error('Sync failed')

      const data = await res.json()
      toast.success(`Synced ${data.syncedEvents} events from your calendar`)

      await fetchStatus()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to sync calendar')
    } finally {
      setSyncing(false)
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true)
    try {
      const res = await fetch('/api/calendar/disconnect', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userEmail }),
      })

      if (!res.ok) throw new Error('Disconnect failed')

      toast.success('Calendar disconnected successfully')
      setStatus({ connected: false })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to disconnect calendar')
    } finally {
      setDisconnecting(false)
    }
  }

  if (loading) {
    return (
      <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-2xl">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Calendar className="size-5" />
            Calendar Integration
          </CardTitle>
          <CardDescription className="text-gray-600">
            Connect your calendar for smarter study scheduling
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-6 animate-spin" style={{ color: 'oklch(0.6 0.05 230)' }} />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-2xl">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <Calendar className="size-5" />
          Calendar Integration
        </CardTitle>
        <CardDescription className="text-gray-600">
          Connect your calendar for smarter study scheduling
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Privacy Notice */}
        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="size-4 text-blue-600" />
          <AlertDescription className="text-blue-800 text-sm">
            <strong>Privacy:</strong> We only read your calendar availability to avoid scheduling
            conflicts. We never read event details or modify your calendar without permission. You
            can disconnect at any time.
          </AlertDescription>
        </Alert>

        {!status?.connected ? (
          /* Not Connected State */
          <div className="space-y-4">
            <div
              className="p-6 rounded-lg text-center space-y-4"
              style={{ backgroundColor: 'oklch(0.95 0.01 230)' }}
            >
              <Calendar
                className="size-16 mx-auto"
                style={{ color: 'oklch(0.6 0.05 230)', strokeWidth: 1.5 }}
              />
              <div>
                <p className="font-medium text-foreground mb-2">No calendar connected</p>
                <p className="text-sm text-muted-foreground">
                  Connect your calendar to get study time recommendations that avoid conflicts with
                  your existing schedule
                </p>
              </div>
            </div>

            <Button
              onClick={handleConnect}
              className="w-full min-h-11"
              style={{
                backgroundColor: 'oklch(0.7 0.12 145)',
                color: 'white',
              }}
            >
              <Calendar className="size-4 mr-2" />
              Connect Google Calendar
            </Button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div
                className="p-4 rounded-lg"
                style={{ backgroundColor: 'oklch(0.95 0.01 230)' }}
              >
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle className="size-4" style={{ color: 'oklch(0.7 0.12 145)' }} />
                  Benefits
                </h4>
                <ul className="space-y-1 text-muted-foreground text-xs">
                  <li>• Avoid scheduling study sessions during conflicts</li>
                  <li>• Find optimal free time blocks automatically</li>
                  <li>• Smarter recommendations based on your schedule</li>
                </ul>
              </div>
              <div
                className="p-4 rounded-lg"
                style={{ backgroundColor: 'oklch(0.95 0.01 230)' }}
              >
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <AlertCircle className="size-4" style={{ color: 'oklch(0.6 0.05 230)' }} />
                  What We Access
                </h4>
                <ul className="space-y-1 text-muted-foreground text-xs">
                  <li>• Only event start/end times (no details)</li>
                  <li>• Read-only access to availability</li>
                  <li>• No access to event descriptions or attendees</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          /* Connected State */
          <div className="space-y-4">
            <div
              className="p-4 rounded-lg space-y-3"
              style={{
                backgroundColor: 'oklch(0.7 0.12 145)/0.1',
                borderLeft: '4px solid oklch(0.7 0.12 145)',
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="size-5" style={{ color: 'oklch(0.7 0.12 145)' }} />
                    <span className="font-semibold text-foreground">
                      {status.provider === 'GOOGLE' && 'Google Calendar Connected'}
                      {status.provider === 'OUTLOOK' && 'Outlook Calendar Connected'}
                    </span>
                  </div>
                  {status.lastSyncAt && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="size-4" />
                      <span>
                        Last synced {formatDistanceToNow(new Date(status.lastSyncAt), { addSuffix: true })}
                      </span>
                    </div>
                  )}
                </div>
                <Badge
                  variant="outline"
                  className="shrink-0"
                  style={{
                    backgroundColor: 'oklch(0.7 0.12 145)/0.1',
                    borderColor: 'oklch(0.7 0.12 145)',
                    color: 'oklch(0.5 0.2 145)',
                  }}
                >
                  Active
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={handleSync}
                disabled={syncing}
                className="min-h-11"
              >
                {syncing ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="size-4 mr-2" />
                    Sync Now
                  </>
                )}
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" disabled={disconnecting} className="min-h-11">
                    <LogOut className="size-4 mr-2" />
                    Disconnect
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-white/95 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.15)]">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Disconnect Calendar?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove calendar integration and stop syncing your availability. Study
                      time recommendations will be based solely on your historical patterns. You can
                      reconnect at any time.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDisconnect}
                      style={{
                        backgroundColor: 'oklch(0.6 0.15 25)',
                        color: 'white',
                      }}
                    >
                      {disconnecting ? (
                        <>
                          <Loader2 className="size-4 mr-2 animate-spin" />
                          Disconnecting...
                        </>
                      ) : (
                        'Disconnect'
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="size-4 text-green-600" />
              <AlertDescription className="text-green-800 text-sm">
                Your calendar is connected. The system will automatically sync your availability daily
                and use it to suggest optimal study times that don't conflict with your schedule.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
