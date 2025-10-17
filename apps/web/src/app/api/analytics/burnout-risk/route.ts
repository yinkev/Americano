/**
 * GET /api/analytics/burnout-risk
 *
 * Get current burnout risk assessment
 * Story 5.4 Task 6.4
 */

import { NextRequest, NextResponse } from 'next/server';
import { burnoutPreventionEngine } from '@/subsystems/behavioral-analytics/burnout-prevention-engine';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId parameter is required' },
        { status: 400 }
      );
    }

    // Check for cached assessment (within 24 hours)
    const recentAssessment = await prisma.burnoutRiskAssessment.findFirst({
      where: {
        userId,
        assessmentDate: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      orderBy: { assessmentDate: 'desc' },
    });

    // Return cached assessment if available
    if (recentAssessment) {
      return NextResponse.json({
        success: true,
        riskScore: recentAssessment.riskScore,
        riskLevel: recentAssessment.riskLevel,
        contributingFactors: recentAssessment.contributingFactors,
        recommendations: recentAssessment.recommendations,
        lastAssessmentDate: recentAssessment.assessmentDate,
        cached: true,
      });
    }

    // Perform new assessment
    const assessment = await burnoutPreventionEngine.assessBurnoutRisk(userId);

    // Generate intervention plan
    const interventionPlan = burnoutPreventionEngine.recommendIntervention(assessment);

    return NextResponse.json({
      success: true,
      riskScore: assessment.riskScore,
      riskLevel: assessment.riskLevel,
      contributingFactors: assessment.contributingFactors,
      warningSignals: assessment.warningSignals,
      recommendations: assessment.recommendations,
      interventionPlan,
      lastAssessmentDate: assessment.assessmentDate,
      confidence: assessment.confidence,
      cached: false,
    });
  } catch (error) {
    console.error('Error assessing burnout risk:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to assess burnout risk' },
      { status: 500 }
    );
  }
}
