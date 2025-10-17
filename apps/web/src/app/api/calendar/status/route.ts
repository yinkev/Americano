/**
 * Calendar Status API Route
 * Story 5.3 Task 6: GET /api/calendar/status
 *
 * Check calendar integration status for user
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const integration = await prisma.calendarIntegration.findUnique({
      where: { userId },
      select: {
        calendarProvider: true,
        syncEnabled: true,
        lastSyncAt: true,
      },
    })

    if (!integration) {
      return NextResponse.json({
        connected: false,
      })
    }

    return NextResponse.json({
      connected: true,
      provider: integration.calendarProvider,
      syncEnabled: integration.syncEnabled,
      lastSyncAt: integration.lastSyncAt,
    })
  } catch (error) {
    console.error('Calendar status check error:', error)
    return NextResponse.json({ error: 'Failed to check calendar status' }, { status: 500 })
  }
}
