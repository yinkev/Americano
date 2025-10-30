/**
 * First Aid Updater Job API
 *
 * Epic 3 - Story 3.3 - AC#8: Job management API
 *
 * Endpoints:
 * - GET: Get job status and last execution
 * - POST: Manually trigger update check (admin only)
 * - PATCH: Update job configuration (admin only)
 */

import { type NextRequest, NextResponse } from 'next/server'
import { getFirstAidUpdater, runFirstAidUpdateCheck } from '@/jobs/first-aid-updater'

/**
 * GET /api/jobs/first-aid-updater
 * Get job status and last execution result
 */
export async function GET() {
  try {
    const updater = getFirstAidUpdater()
    const status = updater.getStatus()
    const lastExecution = updater.getLastExecution()

    return NextResponse.json(
      {
        success: true,
        data: {
          status,
          lastExecution,
        },
      },
      { status: 200 },
    )
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get job status',
      },
      { status: 500 },
    )
  }
}

/**
 * POST /api/jobs/first-aid-updater
 * Manually trigger First Aid update check
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Add authentication/authorization check
    // Only allow admin users to manually trigger jobs
    // const session = await getServerSession()
    // if (!session?.user?.isAdmin) {
    //   return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
    // }

    const body = await request.json().catch(() => ({}))
    const dryRun = body.dryRun ?? false

    console.log(`🔄 Manual First Aid update check triggered (dryRun: ${dryRun})`)

    const updater = getFirstAidUpdater({ dryRun })
    const result = await runFirstAidUpdateCheck()

    return NextResponse.json(
      {
        success: result.success,
        data: result,
      },
      { status: 200 },
    )
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to run update check',
      },
      { status: 500 },
    )
  }
}

/**
 * PATCH /api/jobs/first-aid-updater
 * Update job configuration
 */
export async function PATCH(request: NextRequest) {
  try {
    // TODO: Add authentication/authorization check
    // const session = await getServerSession()
    // if (!session?.user?.isAdmin) {
    //   return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
    // }

    const body = await request.json()
    const { enabled, schedule, notificationMethod } = body

    const updater = getFirstAidUpdater()
    updater.updateConfig({
      enabled,
      schedule,
      notificationMethod,
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          message: 'Job configuration updated',
          config: updater.getStatus(),
        },
      },
      { status: 200 },
    )
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update job configuration',
      },
      { status: 500 },
    )
  }
}
