/**
 * Orchestration Effectiveness API Route
 * Story 5.3 Task 7: GET /api/orchestration/effectiveness
 *
 * Measure orchestration effectiveness vs self-scheduled sessions
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { subDays } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const dateRange = searchParams.get('dateRange') || '30' // Default 30 days

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const days = parseInt(dateRange, 10)
    const startDate = subDays(new Date(), days)

    // Get all study sessions (missions) in date range
    const sessions = await prisma.mission.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
        },
        status: 'COMPLETED',
      },
      select: {
        id: true,
        recommendedStartTime: true,
        actualStartTime: true,
        sessionPerformanceScore: true,
        completionRate: true,
      },
    })

    if (sessions.length === 0) {
      return NextResponse.json({
        adherenceRate: 0,
        performanceImprovement: 0,
        avgConfidence: 0,
        insights: ['Insufficient data. Complete more sessions for analysis.'],
      })
    }

    // Calculate adherence rate (sessions that followed recommendations)
    const orchestratedSessions = sessions.filter(
      (s) => s.recommendedStartTime && s.actualStartTime
    )
    const followedRecommendations = orchestratedSessions.filter((s) => {
      if (!s.recommendedStartTime || !s.actualStartTime) return false

      const timeDiff = Math.abs(
        s.actualStartTime.getTime() - s.recommendedStartTime.getTime()
      )
      return timeDiff <= 30 * 60 * 1000 // Within 30 minutes = followed
    })

    const adherenceRate = orchestratedSessions.length > 0
      ? (followedRecommendations.length / orchestratedSessions.length) * 100
      : 0

    // Calculate performance improvement
    const orchestratedPerf = followedRecommendations.reduce(
      (sum, s) => sum + (s.sessionPerformanceScore || 0),
      0
    ) / (followedRecommendations.length || 1)

    const selfScheduledSessions = sessions.filter(
      (s) => !s.recommendedStartTime || !followedRecommendations.find(f => f.id === s.id)
    )

    const selfScheduledPerf = selfScheduledSessions.length > 0
      ? selfScheduledSessions.reduce(
          (sum, s) => sum + (s.sessionPerformanceScore || 0),
          0
        ) / selfScheduledSessions.length
      : orchestratedPerf

    const performanceImprovement = selfScheduledPerf > 0
      ? ((orchestratedPerf - selfScheduledPerf) / selfScheduledPerf) * 100
      : 0

    // Get average recommendation confidence
    const recommendations = await prisma.studyScheduleRecommendation.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        confidence: true,
      },
    })

    const avgConfidence = recommendations.length > 0
      ? recommendations.reduce((sum, r) => sum + r.confidence, 0) / recommendations.length
      : 0

    // Generate insights
    const insights: string[] = []

    if (adherenceRate >= 60) {
      insights.push(`Great adherence! You follow recommendations ${Math.round(adherenceRate)}% of the time.`)
    } else if (adherenceRate >= 40) {
      insights.push(`Good adherence at ${Math.round(adherenceRate)}%. Try following more recommendations.`)
    } else {
      insights.push(`Low adherence at ${Math.round(adherenceRate)}%. Following recommendations can improve outcomes.`)
    }

    if (performanceImprovement >= 20) {
      insights.push(`Following orchestration improves your performance by ${Math.round(performanceImprovement)}%!`)
    } else if (performanceImprovement >= 10) {
      insights.push(`Orchestrated sessions perform ${Math.round(performanceImprovement)}% better on average.`)
    } else if (performanceImprovement < 0) {
      insights.push('Self-scheduled sessions are currently performing better. Recommendations are adapting.')
    }

    if (avgConfidence >= 0.8) {
      insights.push('Recommendation confidence is high. Your patterns are well-established.')
    } else if (avgConfidence >= 0.6) {
      insights.push('Recommendation confidence is moderate. More data will improve accuracy.')
    } else {
      insights.push('Building your learning pattern profile. Complete more sessions for better recommendations.')
    }

    return NextResponse.json({
      adherenceRate: Math.round(adherenceRate),
      performanceImprovement: Math.round(performanceImprovement * 10) / 10,
      avgConfidence: Math.round(avgConfidence * 100) / 100,
      insights,
      stats: {
        totalSessions: sessions.length,
        orchestratedSessions: followedRecommendations.length,
        selfScheduledSessions: selfScheduledSessions.length,
        orchestratedAvgPerformance: Math.round(orchestratedPerf),
        selfScheduledAvgPerformance: Math.round(selfScheduledPerf),
      },
    })
  } catch (error) {
    console.error('Effectiveness calculation error:', error)
    return NextResponse.json(
      { error: 'Failed to calculate effectiveness' },
      { status: 500 }
    )
  }
}
