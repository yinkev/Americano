'use client'

import { useState, useEffect } from 'react'
import { Calendar, CheckCircle, Clock, LogOut, RefreshCw, AlertCircle, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export function CalendarIntegrationSettings() {
  const [status, setStatus] = useState({
    connected: false,
    provider: 'GOOGLE',
    lastSyncAt: new Date().toISOString(),
  })
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  async function handleConnect() {
    // Connect logic
  }

  async function handleSync() {
    // Sync logic
  }

  async function handleDisconnect() {
    // Disconnect logic
  }

  return (
    <Card className="p-6 bg-card  border-border/50 shadow-none rounded-xl">
      <CardHeader className="p-0 mb-6">
        <div className="flex items-center gap-4">
            <div className="p-3 bg-card rounded-xl">
                <Calendar className="w-8 h-8 text-primary" />
            </div>
            <div>
                <CardTitle className="text-2xl font-heading font-bold">Calendar Integration</CardTitle>
                <CardDescription className="text-lg text-muted-foreground">Connect your calendar for smarter study scheduling.</CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 space-y-6">
        <div className="p-4 rounded-xl bg-card border-2 border-blue-200/50 text-blue-800">
          <p className="text-md font-semibold">Privacy Notice:</p>
          <p className="text-sm mt-1">We only read your calendar availability to avoid scheduling conflicts. We never read event details or modify your calendar without permission.</p>
        </div>

        {!status.connected ? (
          <div className="space-y-4">
            <div className="text-center p-8 rounded-xl bg-card">
              <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-semibold">No calendar connected</p>
              <p className="text-md text-muted-foreground">Connect your calendar to get study time recommendations that avoid conflicts with your existing schedule.</p>
            </div>
            <Button onClick={handleConnect} size="lg" className="w-full rounded-full font-bold text-lg shadow-none gap-2">
              <Calendar /> Connect Google Calendar
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-card border-2 border-green-200/50 text-green-800 flex items-center gap-3">
              <CheckCircle className="w-6 h-6" />
              <p className="text-lg font-semibold">Connected to {status.provider} Calendar</p>
              <Badge className="ml-auto text-md font-semibold px-3 py-1 rounded-full bg-card text-green-500 border-2 border-green-500/20">Active</Badge>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleSync} disabled={syncing} size="lg" variant="outline" className="flex-1 rounded-full font-bold text-lg shadow-none gap-2">
                {syncing ? <><Loader2 className="animate-spin" /> Syncing...</> : <><RefreshCw /> Sync Now</>}
              </Button>
              <Button onClick={handleDisconnect} disabled={disconnecting} size="lg" variant="outline" className="flex-1 rounded-full font-bold text-lg shadow-none gap-2 text-destructive border-destructive/50 hover:bg-card">
                {disconnecting ? <><Loader2 className="animate-spin" /> Disconnecting...</> : <><LogOut /> Disconnect</>}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
