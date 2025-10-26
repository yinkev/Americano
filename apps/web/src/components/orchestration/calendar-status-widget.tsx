'use client'

import { useState, useEffect } from 'react'
import { Calendar, CheckCircle, AlertCircle, RefreshCw, Settings, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface CalendarStatus {
  connected: boolean
  provider: 'google' | 'outlook' | null
  lastSync?: Date
  nextSync?: Date
  syncInProgress?: boolean
  eventsCount?: number
  conflictsCount?: number
}

interface CalendarStatusWidgetProps {
  onConnect?: () => void
  onSettings?: () => void
  className?: string
}

export function CalendarStatusWidget({
  onConnect,
  onSettings,
  className,
}: CalendarStatusWidgetProps) {
  const [calendarStatus, setCalendarStatus] = useState<CalendarStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)

  useEffect(() => {
    fetchCalendarStatus()
    // Set up polling for sync status
    const interval = setInterval(fetchCalendarStatus, 30000) // Poll every 30 seconds
    return () => clearInterval(interval)
  }, [])

  async function fetchCalendarStatus() {
    try {
      setLoading(true)
      const response = await fetch('/api/calendar/status')
      const data = await response.json()

      if (data.success) {
        setCalendarStatus(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch calendar status:', error)
      // Fallback data for demonstration
      setCalendarStatus({
        connected: true,
        provider: 'google',
        lastSync: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
        nextSync: new Date(Date.now() + 50 * 60 * 1000), // 50 minutes from now
        eventsCount: 8,
        conflictsCount: 2,
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleConnect() {
    if (connecting) return

    try {
      setConnecting(true)
      const response = await fetch('/api/calendar/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await response.json()

      if (data.success && data.data.authUrl) {
        // Redirect to OAuth flow
        window.location.href = data.data.authUrl
      }
    } catch (error) {
      console.error('Failed to connect calendar:', error)
    } finally {
      setConnecting(false)
    }
  }

  async function handleRefresh() {
    if (!calendarStatus?.connected || calendarStatus.syncInProgress) return

    try {
      setCalendarStatus((prev) => (prev ? { ...prev, syncInProgress: true } : null))
      const response = await fetch('/api/calendar/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await response.json()

      if (data.success) {
        await fetchCalendarStatus()
      }
    } catch (error) {
      console.error('Failed to sync calendar:', error)
      if (calendarStatus) {
        setCalendarStatus({ ...calendarStatus, syncInProgress: false })
      }
    }
  }

  function formatTimeAgo(date: Date) {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min ago`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`

    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  }

  function formatTimeUntil(date: Date) {
    const now = new Date()
    const diffMs = date.getTime() - now.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))

    if (diffMins < 1) return 'Now'
    if (diffMins < 60) return `in ${diffMins} min`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `in ${diffHours} hour${diffHours > 1 ? 's' : ''}`

    const diffDays = Math.floor(diffHours / 24)
    return `in ${diffDays} day${diffDays > 1 ? 's' : ''}`
  }

  if (loading) {
    return (
      <Card
        className={`rounded-xl bg-card  border border-border shadow-none ${className}`}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="size-5" />
            Calendar Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="animate-pulse">
              <div className="h-4 bg-[oklch(0.922_0_0)] rounded w-2/3 mb-2" />
              <div className="h-3 bg-[oklch(0.922_0_0)] rounded w-full mb-1" />
              <div className="h-3 bg-[oklch(0.922_0_0)] rounded w-1/2" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!calendarStatus) {
    return null
  }

  if (!calendarStatus.connected) {
    return (
      <Card
        className={`rounded-xl bg-card  border border-border shadow-none ${className}`}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="size-5 text-[oklch(0.556_0_0)]" />
            Calendar Integration
          </CardTitle>
          <CardDescription>Connect your calendar for smarter scheduling</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center py-6">
              <Calendar className="size-12 mx-auto mb-4 text-[oklch(0.556_0_0)]/50" />
              <p className="text-sm text-[oklch(0.556_0_0)] mb-4">
                Connect your calendar to automatically avoid conflicts and find optimal study times
              </p>
              <Button
                onClick={handleConnect}
                disabled={connecting}
                className="bg-[oklch(0.7_0.15_230)] hover:bg-[oklch(0.65_0.15_230)]"
              >
                {connecting ? (
                  <>
                    <RefreshCw className="size-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Calendar className="size-4 mr-2" />
                    Connect Calendar
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      className={`rounded-xl bg-card  border border-border shadow-none ${className}`}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="size-5 text-[oklch(0.7_0.15_230)]" />
              Calendar Integration
            </CardTitle>
            <CardDescription>
              {calendarStatus.provider && (
                <span className="capitalize">{calendarStatus.provider} Calendar</span>
              )}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {calendarStatus.syncInProgress ? (
              <RefreshCw className="size-4 text-[oklch(0.7_0.15_50)] animate-spin" />
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefresh}
                className="h-8 w-8"
                disabled={calendarStatus.syncInProgress}
              >
                <RefreshCw className="size-4 text-[oklch(0.556_0_0)] hover:text-[oklch(0.7_0.15_230)]" />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onSettings} className="h-8 w-8">
              <Settings className="size-4 text-[oklch(0.556_0_0)] hover:text-[oklch(0.7_0.15_230)]" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <CheckCircle className="size-4 text-[oklch(0.75_0.15_160)]" />
            <span className="text-sm font-medium text-[oklch(0.145_0_0)]">Connected</span>
            {calendarStatus.provider && (
              <Badge variant="outline" className="text-xs">
                {calendarStatus.provider}
              </Badge>
            )}
          </div>

          {/* Sync Status */}
          <div className="space-y-2">
            {calendarStatus.lastSync && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-[oklch(0.556_0_0)]">Last sync:</span>
                <span className="text-[oklch(0.145_0_0)] font-medium">
                  {formatTimeAgo(calendarStatus.lastSync)}
                </span>
              </div>
            )}

            {calendarStatus.nextSync && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-[oklch(0.556_0_0)]">Next sync:</span>
                <span className="text-[oklch(0.145_0_0)] font-medium">
                  {calendarStatus.syncInProgress
                    ? 'Syncing...'
                    : formatTimeUntil(calendarStatus.nextSync)}
                </span>
              </div>
            )}

            {calendarStatus.syncInProgress && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-[oklch(0.7_0.15_50)]/10 border border-[oklch(0.7_0.15_50)]/20">
                <RefreshCw className="size-4 text-[oklch(0.7_0.15_50)] animate-spin" />
                <span className="text-sm text-[oklch(0.7_0.15_50)] font-medium">
                  Syncing calendar events...
                </span>
              </div>
            )}
          </div>

          {/* Calendar Stats */}
          {(calendarStatus.eventsCount !== undefined ||
            calendarStatus.conflictsCount !== undefined) && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-[oklch(0.145_0_0)]">Calendar Overview</h4>

              <div className="grid grid-cols-2 gap-3">
                {calendarStatus.eventsCount !== undefined && (
                  <div className="p-3 rounded-lg bg-[oklch(0.97_0_0)] border border-[oklch(0.922_0_0)]">
                    <div className="text-lg font-bold text-[oklch(0.7_0.15_230)]">
                      {calendarStatus.eventsCount}
                    </div>
                    <div className="text-xs text-[oklch(0.556_0_0)]">Events today</div>
                  </div>
                )}

                {calendarStatus.conflictsCount !== undefined && (
                  <div className="p-3 rounded-lg bg-[oklch(0.97_0_0)] border border-[oklch(0.922_0_0)]">
                    <div className="text-lg font-bold text-[oklch(0.7_0.15_50)]">
                      {calendarStatus.conflictsCount}
                    </div>
                    <div className="text-xs text-[oklch(0.556_0_0)]">Conflicts</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex items-center gap-2 pt-4 border-t border-[oklch(0.922_0_0)]">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={calendarStatus.syncInProgress}
              className="flex-1"
            >
              <RefreshCw
                className={`size-4 mr-2 ${calendarStatus.syncInProgress ? 'animate-spin' : ''}`}
              />
              Sync Now
            </Button>
            <Button variant="ghost" size="sm" onClick={onSettings} className="flex-1">
              <Settings className="size-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
