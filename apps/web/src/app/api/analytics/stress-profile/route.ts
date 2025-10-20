/**
 * GET /api/analytics/stress-profile
 *
 * Get personalized stress profile
 * Story 5.4 Task 6.6
 */

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/generated/prisma'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId parameter is required' },
        { status: 400 },
      )
    }

    // Fetch user learning profile with stress data
    const userProfile = await prisma.userLearningProfile.findUnique({
      where: { userId },
    })

    if (!userProfile) {
      return NextResponse.json({
        success: true,
        profileExists: false,
        primaryStressors: [],
        loadTolerance: 65, // Default
        avgCognitiveLoad: null,
        avgRecoveryTime: null,
        effectiveCopingStrategies: [],
        profileConfidence: 0,
      })
    }

    // Extract stress profile data from learningStyleProfile JSON
    const learningStyle = (userProfile.learningStyleProfile as any) || {}
    const stressProfile = learningStyle.stressProfile || {
      primaryStressors: [],
      avgRecoveryTime: 24,
      copingStrategies: [],
    }

    // Fetch stress-related patterns to enhance profile
    // Use BehavioralPattern as proxy for stress patterns
    const stressPatterns = await prisma.behavioralPattern.findMany({
      where: {
        userId,
        confidence: { gte: 0.6 },
        patternType: {
          in: ['ATTENTION_CYCLE', 'PERFORMANCE_PEAK'], // Stress-related patterns
        },
      },
      orderBy: { occurrenceCount: 'desc' },
      take: 5,
    })

    // Identify primary stressors from patterns
    const primaryStressors = stressPatterns.map((p) => ({
      type: p.patternType,
      frequency: p.occurrenceCount,
      confidence: p.confidence,
    }))

    // Calculate profile confidence based on data quality
    const cognitiveLoadCount = await prisma.cognitiveLoadMetric.count({
      where: { userId },
    })

    const profileConfidence = Math.min(
      1.0,
      (userProfile.dataQualityScore || 0) * 0.5 +
        (cognitiveLoadCount / 100) * 0.3 +
        (stressPatterns.length / 10) * 0.2,
    )

    return NextResponse.json({
      success: true,
      profileExists: true,
      primaryStressors,
      loadTolerance: learningStyle.loadTolerance || 65,
      avgCognitiveLoad: learningStyle.avgCognitiveLoad || null,
      avgRecoveryTime: stressProfile.avgRecoveryTime,
      effectiveCopingStrategies: stressProfile.copingStrategies || [],
      profileConfidence,
      lastAnalyzedAt: userProfile.lastAnalyzedAt,
    })
  } catch (error) {
    console.error('Error fetching stress profile:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stress profile' },
      { status: 500 },
    )
  }
}
