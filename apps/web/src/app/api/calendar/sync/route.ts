/**
 * Calendar Sync API Route
 * Story 5.3 Task 6: POST /api/calendar/sync
 *
 * Trigger manual calendar sync and return conflicts
 */

import { NextRequest, NextResponse } from 'next/server'
import { syncUserCalendar } from '@/lib/calendar/calendar-sync-service'
import { z } from 'zod'

const SyncSchema = z.object({
  userId: z.string().min(1),
  daysAhead: z.number().min(1).max(30).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, daysAhead } = SyncSchema.parse(body)

    // Perform calendar sync
    const result = await syncUserCalendar(userId, daysAhead || 7)

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Sync failed' }, { status: 400 })
    }

    return NextResponse.json({
      syncedEvents: result.eventsSynced,
      conflicts: result.conflicts,
    })
  } catch (error) {
    console.error('Calendar sync error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: error.issues },
        { status: 400 },
      )
    }

    return NextResponse.json({ error: 'Failed to sync calendar' }, { status: 500 })
  }
}
