/**
 * CalendarStatusWidget Component
 * Story 5.4 - Orchestration Components Epic 5 Transformation
 *
 * Compact widget showing calendar integration status with
 * connect/disconnect/sync actions.
 *
 * Epic 5 Design: Clean status cards, OKLCH colors, NO gradients
 * Accessibility: ARIA labels, semantic HTML, keyboard navigation
 */

'use client'

import { useState, useEffect } from 'react'
import {
  Calendar,
  CheckCircle,
  RefreshCw,
  Settings,
  LogOut,
  Clock,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
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
import { useToast } from '@/hooks/use-toast'

interface CalendarStatus {
  connected: boolean
  provider?: 'GOOGLE' | 'OUTLOOK'
  lastSyncAt?: string
}

interface Props {
  userId: string
  onStatusChange?: (connected: boolean) => void
  className?: string
}

export function CalendarStatusWidget({ userId, onStatusChange, className = '' }: Props) {
  const [status, setStatus] = useState<CalendarStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchStatus()
  }, [userId])

  async function fetchStatus() {
    try {
      const res = await fetch(`/api/calendar/status?userId=${userId}`)
      if (!res.ok) throw new Error('Failed to fetch calendar status')
      const data = await res.json()
      setStatus(data)
      onStatusChange?.(data.connected)
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
        body: JSON.stringify({ provider: 'GOOGLE', userId }),
      })

      if (!res.ok) throw new Error('Failed to initiate OAuth')

      const data = await res.json()
      window.location.href = data.authorizationUrl
    } catch (err) {
      toast({
        title: 'Connection Failed',
        description: err instanceof Error ? err.message : 'Failed to connect calendar',
        variant: 'destructive',
      })
    }
  }

  async function handleSync() {
    setSyncing(true)
    try {
      const res = await fetch('/api/calendar/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, daysAhead: 7 }),
      })

      if (!res.ok) throw new Error('Sync failed')

      const data = await res.json()
      toast({
        title: 'Sync Complete',
        description: `Synced ${data.syncedEvents} events from your calendar`,
      })

      await fetchStatus()
    } catch (err) {
      toast({
        title: 'Sync Failed',
        description: err instanceof Error ? err.message : 'Failed to sync calendar',
        variant: 'destructive',
      })
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
        body: JSON.stringify({ userId }),
      })

      if (!res.ok) throw new Error('Disconnect failed')

      toast({
        title: 'Calendar Disconnected',
        description: 'Your calendar has been successfully disconnected',
      })

      setStatus({ connected: false })
      onStatusChange?.(false)
    } catch (err) {
      toast({
        title: 'Disconnect Failed',
        description: err instanceof Error ? err.message : 'Failed to disconnect calendar',
        variant: 'destructive',
      })
    } finally {
      setDisconnecting(false)
    }
  }

  if (loading) {
    return (
      <Card className={`shadow-none ${className}`}>
        <CardHeader className="p-4 pb-0">
          <h3 className="font-heading font-semibold text-foreground text-[16px]">Calendar Integration</h3>
        </CardHeader>
        <CardContent className="p-4 pt-4">
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    )
  }

  // Not Connected State
  if (!status?.connected) {
    return (
      <Card className={`shadow-none ${className}`}>
        <CardHeader className="p-4 pb-0">
          <div className="flex items-center gap-2">
            <Calendar className="size-5 text-info" />
            <h3 className="font-heading font-semibold text-foreground text-[16px]">Calendar Integration</h3>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-4 space-y-4">
          <div
            className="p-4 rounded-lg text-center space-y-3"
            style={{ backgroundColor: 'oklch(0.95 0 0)' }}
          >
            <Calendar
              className="size-12 mx-auto text-info"
              style={{ strokeWidth: 1.5 }}
            />
            <div>
              <p className="text-[13px] font-medium text-foreground mb-1">
                Connect your calendar for smarter scheduling
              </p>
              <p className="text-[11px] text-muted-foreground">
                We'll avoid conflicts and suggest optimal study times based on your availability
              </p>
            </div>
          </div>

          <Button
            onClick={handleConnect}
            className="w-full min-h-11"
            style={{
              backgroundColor: 'oklch(0.7 0.15 145)',
              color: 'white',
            }}
          >
            <Calendar className="size-4 mr-2" />
            Connect Google Calendar
          </Button>

          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <AlertCircle className="size-3 shrink-0" />
            <span>We only read availability for scheduling. You can disconnect anytime.</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Connected State
  const getProviderIcon = () => {
    switch (status.provider) {
      case 'GOOGLE':
        return '📅' // Google Calendar emoji
      case 'OUTLOOK':
        return '📆' // Outlook Calendar emoji
      default:
        return '📅'
    }
  }

  const getProviderLabel = () => {
    switch (status.provider) {
      case 'GOOGLE':
        return 'Google Calendar'
      case 'OUTLOOK':
        return 'Outlook Calendar'
      default:
        return 'Calendar'
    }
  }

  return (
    <Card className={`shadow-none ${className}`}>
      <CardHeader className="p-4 pb-0">
        <div className="flex items-center gap-2">
          <Calendar className="size-5" style={{ color: 'oklch(0.7 0.15 145)' }} />
          <h3 className="font-heading font-semibold text-foreground text-[16px]">Calendar Integration</h3>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-4 space-y-4">
        {/* Connected Status */}
        <div
          className="p-4 rounded-lg"
          style={{
            backgroundColor: 'color-mix(in oklch, oklch(0.7 0.15 145), transparent 95%)',
            borderLeft: '3px solid oklch(0.7 0.15 145)',
          }}
        >
          <div className="flex items-start gap-3">
            <div className="text-2xl">{getProviderIcon()}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="size-4" style={{ color: 'oklch(0.7 0.15 145)' }} />
                <span className="text-[13px] font-semibold text-foreground">
                  {getProviderLabel()} Connected
                </span>
              </div>
              {status.lastSyncAt && (
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Clock className="size-3" />
                  <span>
                    Last sync:{' '}
                    {formatDistanceToNow(new Date(status.lastSyncAt), { addSuffix: true })}
                  </span>
                </div>
              )}
            </div>
            <Badge
              variant="outline"
              className="shrink-0 px-2 py-0.5"
              style={{
                backgroundColor: 'color-mix(in oklch, oklch(0.7 0.15 145), transparent 90%)',
                borderColor: 'oklch(0.7 0.15 145)',
                color: 'oklch(0.5 0.20 145)',
              }}
            >
              Active
            </Badge>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={syncing}
            className="min-h-10"
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
              <Button variant="outline" size="sm" disabled={disconnecting} className="min-h-10">
                <LogOut className="size-4 mr-2" />
                Disconnect
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="font-heading text-[20px]">Disconnect Calendar?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove calendar integration and stop syncing your availability. Study
                  time recommendations will be based solely on your historical patterns.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDisconnect}
                  style={{
                    backgroundColor: 'oklch(0.6 0.20 30)',
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

        {/* Settings Link */}
        <button
          className="w-full flex items-center justify-center gap-2 py-2 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => (window.location.href = '/settings?tab=calendar')}
        >
          <Settings className="size-3" />
          <span>Calendar Settings</span>
        </button>
      </CardContent>
    </Card>
  )
}
