/**
 * Calendar Disconnect API Route
 * Story 5.3 Task 6: DELETE /api/calendar/disconnect
 *
 * Revoke calendar integration and delete tokens
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createGoogleCalendarProvider } from '@/lib/calendar/google-calendar-provider'
import { decryptToken } from '@/lib/crypto/token-encryption'
import { z } from 'zod'

const DisconnectSchema = z.object({
  userId: z.string().min(1),
})

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = DisconnectSchema.parse(body)

    // Get calendar integration
    const integration = await prisma.calendarIntegration.findUnique({
      where: { userId },
    })

    if (!integration) {
      return NextResponse.json({ error: 'Calendar not connected' }, { status: 404 })
    }

    // Revoke OAuth access
    try {
      const provider = createGoogleCalendarProvider()
      const accessToken = decryptToken(integration.accessToken)
      await provider.revokeAccess(accessToken)
    } catch (error) {
      console.warn('Failed to revoke OAuth access:', error)
      // Continue with deletion even if revocation fails
    }

    // Delete integration from database
    await prisma.calendarIntegration.delete({
      where: { userId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Calendar disconnect error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Failed to disconnect calendar' }, { status: 500 })
  }
}
