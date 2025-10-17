/**
 * Story 5.2 Task 13.2: Feature Extraction Testing API
 *
 * Test endpoint to verify StruggleFeatureExtractor produces expected features.
 * Use this to validate:
 * - Prerequisite gap feature = 1.0 (missing prerequisite)
 * - Historical struggle feature = 0.8 (past physiology struggles)
 * - Retention feature = 0.3 (low retention in topic area)
 * - All values normalized 0-1
 * - Data quality score reflects completeness
 */

import { NextRequest, NextResponse } from 'next/server';
import { StruggleFeatureExtractor } from '@/subsystems/behavioral-analytics/struggle-feature-extractor';
import { z } from 'zod';

const requestSchema = z.object({
  userId: z.string(),
  objectiveId: z.string()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, objectiveId } = requestSchema.parse(body);

    console.log('🧪 Testing feature extraction...');
    console.log(`  User ID: ${userId}`);
    console.log(`  Objective ID: ${objectiveId}`);

    // Extract features
    const startTime = Date.now();
    const featureVector = await StruggleFeatureExtractor.extractFeaturesForObjective(
      userId,
      objectiveId
    );
    const extractionTime = Date.now() - startTime;

    // Validate feature ranges (all should be 0-1)
    const violations: string[] = [];
    const features = { ...featureVector, metadata: undefined };

    Object.entries(features).forEach(([key, value]) => {
      if (typeof value === 'number' && (value < 0 || value > 1)) {
        violations.push(`${key}: ${value} (out of range [0, 1])`);
      }
    });

    // Identify high-risk features (>0.6)
    const highRiskFeatures: Record<string, number> = {};
    Object.entries(features).forEach(([key, value]) => {
      if (typeof value === 'number' && value > 0.6) {
        highRiskFeatures[key] = value;
      }
    });

    // Identify protective features (<0.4)
    const protectiveFeatures: Record<string, number> = {};
    Object.entries(features).forEach(([key, value]) => {
      if (typeof value === 'number' && value < 0.4) {
        protectiveFeatures[key] = value;
      }
    });

    // Calculate non-default feature count
    const nonDefaultCount = Object.entries(features).filter(
      ([key, value]) => typeof value === 'number' && Math.abs(value - 0.5) > 0.01
    ).length;

    // Feature importance scores
    const featureImportance = StruggleFeatureExtractor.calculateFeatureImportance();

    // Calculate weighted risk score
    let weightedRiskScore = 0;
    Object.entries(features).forEach(([key, value]) => {
      if (typeof value === 'number' && featureImportance[key]) {
        weightedRiskScore += value * featureImportance[key];
      }
    });

    // Test assertions
    const assertions = {
      allFeaturesInRange: violations.length === 0,
      dataQualityScoreValid:
        featureVector.metadata.dataQuality >= 0 &&
        featureVector.metadata.dataQuality <= 1,
      hasNonDefaultFeatures: nonDefaultCount >= 5,
      extractionTimeAcceptable: extractionTime < 1000, // <1 second
    };

    const allAssertionsPassed = Object.values(assertions).every(v => v === true);

    return NextResponse.json({
      success: true,
      testResult: allAssertionsPassed ? 'PASS' : 'FAIL',
      extractionTimeMs: extractionTime,
      featureVector,
      featureImportance,
      analysis: {
        highRiskFeatures,
        protectiveFeatures,
        nonDefaultFeatureCount: nonDefaultCount,
        totalFeatures: Object.keys(features).length,
        dataQuality: featureVector.metadata.dataQuality,
        weightedRiskScore: Math.round(weightedRiskScore * 100) / 100
      },
      assertions,
      violations: violations.length > 0 ? violations : null,
      recommendations: generateRecommendations(featureVector, highRiskFeatures)
    });

  } catch (error: any) {
    console.error('Feature extraction test failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

function generateRecommendations(
  featureVector: any,
  highRiskFeatures: Record<string, number>
): string[] {
  const recommendations: string[] = [];

  if (featureVector.prerequisiteGapCount > 0.5) {
    recommendations.push(
      `🚨 CRITICAL: ${Math.round(featureVector.prerequisiteGapCount * 100)}% of prerequisites are unmastered. Recommend PREREQUISITE_REVIEW intervention.`
    );
  }

  if (featureVector.retentionScore < 0.4) {
    recommendations.push(
      `⚠️  LOW RETENTION: ${Math.round(featureVector.retentionScore * 100)}% retention score. Recommend SPACED_REPETITION_BOOST intervention.`
    );
  }

  if (featureVector.complexityMismatch > 0.6) {
    recommendations.push(
      `⚠️  COMPLEXITY MISMATCH: Content difficulty exceeds user ability by ${Math.round(featureVector.complexityMismatch * 100)}%. Recommend DIFFICULTY_PROGRESSION intervention.`
    );
  }

  if (featureVector.historicalStruggleScore > 0.7) {
    recommendations.push(
      `⚠️  HISTORICAL PATTERN: High struggle history in similar topics (${Math.round(featureVector.historicalStruggleScore * 100)}%). User may need additional support.`
    );
  }

  if (featureVector.cognitiveLoadIndicator > 0.7) {
    recommendations.push(
      `⚠️  COGNITIVE OVERLOAD: ${Math.round(featureVector.cognitiveLoadIndicator * 100)}% cognitive load. Recommend COGNITIVE_LOAD_REDUCE intervention.`
    );
  }

  if (featureVector.contentTypeMismatch > 0.5) {
    recommendations.push(
      `📝 CONTENT MISMATCH: Learning style doesn't match content format. Recommend CONTENT_FORMAT_ADAPT intervention.`
    );
  }

  if (featureVector.metadata.dataQuality < 0.5) {
    recommendations.push(
      `⚠️  INSUFFICIENT DATA: Data quality score ${Math.round(featureVector.metadata.dataQuality * 100)}%. Predictions may have low confidence. Encourage more study activity.`
    );
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ No significant risk factors detected. User appears well-prepared for this objective.');
  }

  return recommendations;
}

export async function GET() {
  return NextResponse.json({
    endpoint: 'POST /api/test/feature-extraction',
    description: 'Test feature extraction for struggle prediction',
    requiredBody: {
      userId: 'string',
      objectiveId: 'string'
    },
    expectedOutput: {
      testResult: 'PASS | FAIL',
      extractionTimeMs: 'number (<1000ms)',
      featureVector: 'Complete feature vector with 15 features',
      analysis: 'Risk analysis and feature breakdown',
      assertions: 'Validation checks',
      recommendations: 'Intervention recommendations'
    }
  });
}
