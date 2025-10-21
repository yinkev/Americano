/**
 * Calendar Disconnect API Route
 * Story 5.3 Task 6: DELETE /api/calendar/disconnect
 *
 * Revoke calendar integration and delete tokens
 *
 * NOTE: This is a stub implementation for Story 5.3
 * Database model `calendarIntegration` not yet created
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const DisconnectSchema = z.object({
  userId: z.string().min(1),
})

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = DisconnectSchema.parse(body)

    // STUB: Calendar integration not yet implemented
    console.log('[STUB] Calendar disconnect requested for user:', userId)

    return NextResponse.json({
      success: true,
      message: 'Calendar integration feature coming in Story 5.3',
    })
  } catch (error) {
    console.error('Calendar disconnect error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: error.issues },
        { status: 400 },
      )
    }

    return NextResponse.json({ error: 'Failed to disconnect calendar' }, { status: 500 })
  }
}
