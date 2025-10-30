/**
 * GET /api/calibration/peer-comparison
 *
 * Fetch peer calibration comparison data (anonymized, opt-in only)
 *
 * Story 4.4 Task 4.4: Peer Calibration Comparison Endpoint
 *
 * Privacy requirements:
 * - User must opt-in via sharePeerCalibrationData preference
 * - Minimum peer pool size: 20 users (constraint #9)
 * - All data anonymized (no individual identification)
 * - Returns aggregated statistics only
 *
 * Returns:
 * - User's correlation coefficient and percentile ranking
 * - Peer distribution statistics (quartiles, median, mean)
 * - Common overconfident topics across peer group
 * - Peer average correlation coefficient
 *
 * @see story-context-4.4.xml interface "GET /api/calibration/peer-comparison"
 * @see story-context-4.4.xml constraint #9 (privacy requirements)
 */

import { type NextRequest, NextResponse } from 'next/server'
import { errorResponse, successResponse } from '@/lib/api-response'
import { getUserId } from '@/lib/auth'
import { calculateCorrelation, normalizeConfidence } from '@/lib/confidence-calibrator'
import { prisma } from '@/lib/db'

/**
 * Calculate percentile ranking of user within peer distribution
 * @param userValue - User's correlation coefficient
 * @param peerValues - Array of peer correlation coefficients
 * @returns Percentile (0-100)
 */
function calculatePercentile(userValue: number, peerValues: number[]): number {
  if (peerValues.length === 0) {
    return 50 // Default to 50th percentile if no peers
  }

  const valuesBelow = peerValues.filter((v) => v < userValue).length
  return Math.round((valuesBelow / peerValues.length) * 100)
}

/**
 * Calculate quartiles from sorted array
 * @param sortedValues - Sorted array of numbers
 * @returns [Q1, Q2 (median), Q3]
 */
function calculateQuartiles(sortedValues: number[]): [number, number, number] {
  const n = sortedValues.length
  if (n === 0) {
    return [0, 0, 0]
  }

  const q1Index = Math.floor(n * 0.25)
  const q2Index = Math.floor(n * 0.5)
  const q3Index = Math.floor(n * 0.75)

  return [sortedValues[q1Index], sortedValues[q2Index], sortedValues[q3Index]]
}

export async function GET(request: NextRequest) {
  try {
    // Get user ID (hardcoded for MVP per CLAUDE.md)
    const userId = await getUserId()

    // Check if user has opted-in to peer comparison (constraint #9)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { sharePeerCalibrationData: true },
    })

    if (!user) {
      return NextResponse.json(errorResponse('USER_NOT_FOUND', 'User not found'), { status: 404 })
    }

    if (!user.sharePeerCalibrationData) {
      return NextResponse.json(
        errorResponse(
          'PEER_COMPARISON_DISABLED',
          'Please enable peer comparison in settings to access this feature',
        ),
        { status: 403 },
      )
    }

    // Fetch all users who have opted-in to peer comparison
    const optedInUsers = await prisma.user.findMany({
      where: {
        sharePeerCalibrationData: true,
      },
      select: {
        id: true,
      },
    })

    // Enforce minimum peer pool size (constraint #9: 20 users minimum)
    const MINIMUM_PEER_POOL_SIZE = 20
    if (optedInUsers.length < MINIMUM_PEER_POOL_SIZE) {
      return NextResponse.json(
        errorResponse(
          'INSUFFICIENT_PEER_DATA',
          `Insufficient peer data for comparison - need ${MINIMUM_PEER_POOL_SIZE}+ participants (currently ${optedInUsers.length})`,
        ),
        { status: 400 },
      )
    }

    // Calculate correlation coefficient for each opted-in user
    const peerCorrelations: Array<{ userId: string; correlation: number }> = []

    for (const peer of optedInUsers) {
      // Fetch peer's validation responses with calibration data (last 90 days)
      const ninetyDaysAgo = new Date()
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

      const peerResponses = await prisma.validationResponse.findMany({
        where: {
          userId: peer.id,
          respondedAt: {
            gte: ninetyDaysAgo,
          },
          preAssessmentConfidence: {
            not: null,
          },
        },
        select: {
          preAssessmentConfidence: true,
          score: true,
        },
      })

      // Calculate correlation for this peer
      if (peerResponses.length >= 5) {
        const confidenceArray = peerResponses
          .filter((r) => r.preAssessmentConfidence !== null)
          .map((r) => normalizeConfidence(r.preAssessmentConfidence!))
        const scoreArray = peerResponses.map((r) => r.score * 100)

        const correlation = calculateCorrelation(confidenceArray, scoreArray)
        if (correlation !== null) {
          peerCorrelations.push({ userId: peer.id, correlation })
        }
      }
    }

    // Calculate user's correlation coefficient
    const userResponses = await prisma.validationResponse.findMany({
      where: {
        userId,
        respondedAt: {
          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
        },
        preAssessmentConfidence: {
          not: null,
        },
      },
      select: {
        preAssessmentConfidence: true,
        score: true,
        prompt: {
          select: {
            conceptName: true,
          },
        },
        calibrationDelta: true,
      },
    })

    const userConfidenceArray = userResponses
      .filter((r) => r.preAssessmentConfidence !== null)
      .map((r) => normalizeConfidence(r.preAssessmentConfidence!))
    const userScoreArray = userResponses.map((r) => r.score * 100)

    const userCorrelation = calculateCorrelation(userConfidenceArray, userScoreArray)

    if (userCorrelation === null) {
      return NextResponse.json(
        errorResponse(
          'INSUFFICIENT_USER_DATA',
          'You need at least 5 assessments with confidence data to see peer comparison',
        ),
        { status: 400 },
      )
    }

    // Extract peer correlation values (anonymized)
    const peerCorrelationValues = peerCorrelations.map((p) => p.correlation)

    // Calculate peer distribution statistics
    const sortedPeerValues = [...peerCorrelationValues].sort((a, b) => a - b)
    const [q1, median, q3] = calculateQuartiles(sortedPeerValues)
    const mean =
      peerCorrelationValues.reduce((sum, val) => sum + val, 0) / peerCorrelationValues.length

    // Calculate user's percentile ranking
    const userPercentile = calculatePercentile(userCorrelation, peerCorrelationValues)

    // Identify common overconfident topics across peer group
    // Fetch all opted-in users' validation responses
    const allPeerResponses = await prisma.validationResponse.findMany({
      where: {
        userId: {
          in: optedInUsers.map((u) => u.id),
        },
        respondedAt: {
          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
        },
        calibrationDelta: {
          not: null,
        },
      },
      select: {
        userId: true,
        calibrationDelta: true,
        prompt: {
          select: {
            conceptName: true,
          },
        },
      },
    })

    // Group by topic and count users with overconfidence pattern
    const topicOverconfidenceCount: Record<string, Set<string>> = {}

    allPeerResponses.forEach((response) => {
      const conceptName = response.prompt.conceptName
      const delta = response.calibrationDelta!

      if (delta > 15) {
        // Overconfident threshold
        if (!topicOverconfidenceCount[conceptName]) {
          topicOverconfidenceCount[conceptName] = new Set()
        }
        topicOverconfidenceCount[conceptName].add(response.userId)
      }
    })

    // Identify topics where 50%+ of peers show overconfidence
    const commonOverconfidentTopics: string[] = []
    const halfPeerCount = optedInUsers.length / 2

    for (const [topic, userSet] of Object.entries(topicOverconfidenceCount)) {
      if (userSet.size >= halfPeerCount) {
        commonOverconfidentTopics.push(topic)
      }
    }

    // Sort by prevalence
    commonOverconfidentTopics.sort((a, b) => {
      const countA = topicOverconfidenceCount[a].size
      const countB = topicOverconfidenceCount[b].size
      return countB - countA
    })

    return NextResponse.json(
      successResponse({
        userCorrelation,
        userPercentile,
        peerDistribution: {
          quartiles: [q1, median, q3],
          median,
          mean,
        },
        commonOverconfidentTopics,
        peerAvgCorrelation: mean,
        peerPoolSize: optedInUsers.length,
      }),
    )
  } catch (error) {
    console.error('Error fetching peer comparison data:', error)
    return NextResponse.json(
      errorResponse(
        'INTERNAL_ERROR',
        error instanceof Error ? error.message : 'Failed to fetch peer comparison data',
      ),
      { status: 500 },
    )
  }
}
