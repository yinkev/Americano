/**
 * Weekly Pattern Analysis Scheduler
 * Story 5.1 Task 10
 *
 * Automated background job that runs every Sunday at 11 PM to analyze
 * behavioral patterns for eligible users.
 *
 * Schedule: Weekly (Sunday 11 PM)
 * Trigger: Vercel Cron or manual HTTP GET
 *
 * Implementation based on story context lines 1076-1126:
 * - Query users with behavioralAnalysisEnabled = true
 * - Check data sufficiency (6+ weeks, 20+ sessions, 50+ reviews)
 * - Trigger incremental analysis (forceReanalysis: false)
 * - Send notifications (email/in-app) for new insights
 *
 * @subsystem Behavioral Analytics and Personalization
 * @location apps/web/src/app/api/cron/weekly-pattern-analysis/route.ts
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { BehavioralPatternEngine } from '@/subsystems/behavioral-analytics/behavioral-pattern-engine'

/**
 * Minimum data requirements (from story context lines 579-587)
 */
const MIN_WEEKS = 6
const MIN_SESSIONS = 20
const MIN_REVIEWS = 50

/**
 * Rate limiting: max 1 analysis per day per user (from story context line 593)
 */
const ONE_DAY_MS = 24 * 60 * 60 * 1000

/**
 * Weekly Pattern Analysis Cron Job Handler
 *
 * Logic (from story context lines 1083-1091):
 * FOR EACH user WHERE behavioralAnalysisEnabled = true:
 *   IF user.lastAnalyzedAt IS NULL OR (now - user.lastAnalyzedAt) > 7 days:
 *     studySessionCount = COUNT StudySession WHERE userId AND completedAt > (now - 6 weeks)
 *     reviewCount = COUNT Review WHERE userId AND reviewedAt > (now - 6 weeks)
 *     IF studySessionCount >= 20 AND reviewCount >= 50:
 *       TRIGGER POST /api/analytics/patterns/analyze {userId, forceReanalysis: false}
 *       SEND notification email/in-app
 *
 * @param request - NextRequest object
 * @returns JSON response with analysis summary
 */
export async function GET(request: NextRequest) {
  try {
    // Optional authorization check for cron jobs
    // Vercel Cron sends a special header that can be validated
    const authHeader = request.headers.get('authorization')
    if (
      process.env.CRON_SECRET &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid cron secret' },
        { status: 401 }
      )
    }

    console.log('[Cron] Starting weekly pattern analysis job...')

    // Query all users with behavioral analysis enabled
    const eligibleUsers = await prisma.user.findMany({
      where: {
        behavioralAnalysisEnabled: true,
      },
      select: {
        id: true,
        email: true,
      },
    })

    // Fetch learning profiles for eligible users
    const userProfiles = await prisma.userLearningProfile.findMany({
      where: {
        userId: {
          in: eligibleUsers.map((u) => u.id),
        },
      },
      select: {
        userId: true,
        lastAnalyzedAt: true,
      },
    })

    const profileMap = new Map(userProfiles.map((p) => [p.userId, p]))

    console.log(`[Cron] Found ${eligibleUsers.length} users with behavioral analysis enabled`)

    const results = {
      totalUsers: eligibleUsers.length,
      analyzed: 0,
      skipped: 0,
      insufficientData: 0,
      rateLimited: 0,
      errors: 0,
      notifications: 0,
    }

    const now = new Date()
    const sixWeeksAgo = new Date(now.getTime() - MIN_WEEKS * 7 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Process each user
    for (const user of eligibleUsers) {
      try {
        const profile = profileMap.get(user.id)
        const lastAnalyzedAt = profile?.lastAnalyzedAt

        // Check if analysis is due (null or > 7 days old)
        if (lastAnalyzedAt && lastAnalyzedAt > sevenDaysAgo) {
          console.log(`[Cron] Skipping user ${user.id} - analyzed recently (${lastAnalyzedAt.toISOString()})`)
          results.skipped++
          continue
        }

        // Rate limiting: max 1 analysis per day
        if (lastAnalyzedAt && now.getTime() - lastAnalyzedAt.getTime() < ONE_DAY_MS) {
          console.log(`[Cron] Rate limiting user ${user.id} - analyzed within 24 hours`)
          results.rateLimited++
          continue
        }

        // Check data sufficiency: count sessions and reviews in last 6 weeks
        const [studySessionCount, reviewCount] = await Promise.all([
          prisma.studySession.count({
            where: {
              userId: user.id,
              completedAt: {
                not: null,
                gte: sixWeeksAgo,
              },
            },
          }),
          prisma.review.count({
            where: {
              userId: user.id,
              reviewedAt: {
                gte: sixWeeksAgo,
              },
            },
          }),
        ])

        console.log(
          `[Cron] User ${user.id} data: ${studySessionCount} sessions, ${reviewCount} reviews`
        )

        // Check if user has sufficient data
        if (studySessionCount < MIN_SESSIONS || reviewCount < MIN_REVIEWS) {
          console.log(
            `[Cron] Skipping user ${user.id} - insufficient data (need ${MIN_SESSIONS} sessions and ${MIN_REVIEWS} reviews)`
          )
          results.insufficientData++

          // TODO: Send notification about data requirements
          // Email: "Complete {weeksNeeded} more weeks of study sessions to unlock personalized learning patterns"
          // In-app: Progress bar notification
          console.log(
            `[TODO] Send insufficient data notification to user ${user.id}: Need ${Math.max(0, MIN_SESSIONS - studySessionCount)} more sessions, ${Math.max(0, MIN_REVIEWS - reviewCount)} more reviews`
          )

          continue
        }

        // Trigger pattern analysis with incremental mode (forceReanalysis: false)
        console.log(`[Cron] Triggering pattern analysis for user ${user.id}...`)

        const analysisResults = await BehavioralPatternEngine.runFullAnalysis(user.id)

        if (analysisResults.insufficientData) {
          console.log(`[Cron] Analysis returned insufficient data for user ${user.id}`)
          results.insufficientData++
          continue
        }

        results.analyzed++

        // Count new insights (not yet acknowledged)
        const newInsightsCount = analysisResults.insights.filter(
          (insight) => !insight.acknowledgedAt
        ).length

        console.log(
          `[Cron] Analysis complete for user ${user.id}: ${analysisResults.patterns.length} patterns, ${newInsightsCount} new insights`
        )

        // Send notifications if new insights were generated
        if (newInsightsCount > 0) {
          // TODO: Send email notification
          // Subject: "We've discovered {count} new insights about your learning patterns"
          // Body: Summarize top 3 insights, link to /analytics/learning-patterns
          console.log(
            `[TODO] Send email to ${user.email}: "We've discovered ${newInsightsCount} new insights about your learning patterns"`
          )

          // TODO: Create in-app notification
          // Badge count on analytics nav item
          // Toast notification on next login
          console.log(
            `[TODO] Create in-app notification for user ${user.id}: ${newInsightsCount} new insights available`
          )

          results.notifications++
        }
      } catch (userError) {
        console.error(`[Cron] Error processing user ${user.id}:`, userError)
        results.errors++
        // Continue to next user
      }
    }

    console.log('[Cron] Weekly pattern analysis job complete:', results)

    return NextResponse.json(
      {
        success: true,
        message: 'Weekly pattern analysis completed',
        timestamp: now.toISOString(),
        results,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[Cron] Error in weekly pattern analysis job:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error during pattern analysis',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * POST handler for manual triggering (same logic as GET)
 *
 * This allows manual execution of the cron job via:
 * POST /api/cron/weekly-pattern-analysis
 *
 * Useful for testing or manual triggers from admin dashboard.
 */
export async function POST(request: NextRequest) {
  return GET(request)
}
