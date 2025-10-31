/**
 * PATCH /api/user/preferences
 *
 * Update user preferences including peer calibration data sharing opt-in/opt-out.
 * Implements privacy-first approach with clear consent management.
 *
 * Story 4.4 Task 9: Peer Calibration Comparison - Privacy Opt-in
 */

import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'

const preferencesSchema = z.object({
  userId: z.string().optional(),
  sharePeerCalibrationData: z.boolean().optional(),
  // Future preferences can be added here
})

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const params = preferencesSchema.parse(body)

    // Default to hardcoded kevy@americano.dev for MVP
    const userId = params.userId || 'kevy@americano.dev'

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'USER_NOT_FOUND',
          message: 'User not found',
        },
        { status: 404 },
      )
    }

    // Build update data (only include fields that were provided)
    const updateData: { sharePeerCalibrationData?: boolean } = {}
    if (params.sharePeerCalibrationData !== undefined) {
      updateData.sharePeerCalibrationData = params.sharePeerCalibrationData
    }

    // Update user preferences
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        sharePeerCalibrationData: true,
        // Include other preference fields as they're added
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          preferences: {
            sharePeerCalibrationData: updatedUser.sharePeerCalibrationData,
          },
          message: updateData.sharePeerCalibrationData
            ? 'You are now sharing anonymized calibration data with peers'
            : updateData.sharePeerCalibrationData === false
              ? 'You have opted out of peer calibration data sharing'
              : 'Preferences updated successfully',
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error('[API] User preferences update error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Invalid preferences data',
          details: error.issues,
        },
        { status: 400 },
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'PREFERENCES_UPDATE_FAILED',
        message: 'Failed to update user preferences',
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId') || 'kevy@americano.dev'

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        sharePeerCalibrationData: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'USER_NOT_FOUND',
          message: 'User not found',
        },
        { status: 404 },
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          preferences: {
            sharePeerCalibrationData: user.sharePeerCalibrationData,
          },
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error('[API] Get user preferences error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'PREFERENCES_FETCH_FAILED',
        message: 'Failed to fetch user preferences',
      },
      { status: 500 },
    )
  }
}
