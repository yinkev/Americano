/**
 * EBMEvaluator - Evidence-Based Medicine evaluation framework
 *
 * Epic 3 - Story 3.4 - Tasks 2 + 5: Source Credibility & EBM Integration
 *
 * Features:
 * - Source credibility scoring (0-100 scale)
 * - EBM hierarchy evaluation (systematic reviews > RCTs > expert opinion)
 * - Evidence level classification (I-V)
 * - Recommendation grade assignment (A-D)
 * - Clinical guideline integration
 * - Multi-factor resolution recommendations
 *
 * Architecture:
 * - Integrates with Source model for credibility scores
 * - Provides evidence-based conflict resolution guidance
 * - Medical specialty-aware credibility adjustments
 */

import { PrismaClient, $Enums, SourceType as SourceTypeEnum, type sources } from "@/generated/prisma";

/**
 * Evidence-Based Medicine hierarchy levels
 * Based on Oxford Centre for Evidence-Based Medicine Levels of Evidence
 */
export enum EvidenceLevel {
  /** Level I: Systematic reviews and meta-analyses */
  LEVEL_I = "LEVEL_I",
  /** Level II: Randomized controlled trials */
  LEVEL_II = "LEVEL_II",
  /** Level III: Cohort studies, case-control studies */
  LEVEL_III = "LEVEL_III",
  /** Level IV: Case series, case reports */
  LEVEL_IV = "LEVEL_IV",
  /** Level V: Expert opinion, editorials */
  LEVEL_V = "LEVEL_V",
}

/**
 * Recommendation grade based on evidence quality
 */
export enum RecommendationGrade {
  /** Grade A: Consistent level I evidence */
  GRADE_A = "GRADE_A",
  /** Grade B: Consistent level II-III evidence */
  GRADE_B = "GRADE_B",
  /** Grade C: Level IV evidence or inconsistent level II-III */
  GRADE_C = "GRADE_C",
  /** Grade D: Level V evidence or expert opinion */
  GRADE_D = "GRADE_D",
}

/**
 * Source credibility rating
 */
export interface CredibilityRating {
  /** Credibility score (0-100) */
  score: number;
  /** EBM evidence level */
  evidenceLevel: EvidenceLevel;
  /** Recommendation grade */
  recommendationGrade: RecommendationGrade;
  /** Explanation of score */
  rationale: string;
  /** Confidence in rating (0.0-1.0) */
  confidence: number;
}

/**
 * EBM comparison result for conflict resolution
 */
export interface EBMComparison {
  /** Recommended source ID */
  preferredSourceId: string;
  /** Alternative source ID */
  alternativeSourceId: string;
  /** Reasoning for recommendation */
  reasoning: string;
  /** Confidence in recommendation (0.0-1.0) */
  confidence: number;
  /** Evidence level comparison */
  evidenceLevelDifference: {
    preferred: EvidenceLevel;
    alternative: EvidenceLevel;
    significant: boolean;
  };
  /** Credibility score comparison */
  credibilityDifference: {
    preferred: number;
    alternative: number;
    percentDifference: number;
  };
  /** Should user manually review? */
  requiresManualReview: boolean;
}

/**
 * Source credibility criteria
 */
interface CredibilityCriteria {
  /** Base credibility by source type */
  baseScore: number;
  /** Evidence level */
  evidenceLevel: EvidenceLevel;
  /** Publication recency bonus (0-10) */
  recencyBonus: number;
  /** Medical specialty relevance (0-10) */
  specialtyRelevance: number;
  /** Peer review status bonus (0-10) */
  peerReviewBonus: number;
}

/**
 * Default credibility scores by source type
 * Task 2.1: Source authority ranking system
 */
const DEFAULT_CREDIBILITY_SCORES: Record<$Enums.SourceType, number> = {
  FIRST_AID: 95, // Gold standard for board exam prep
  GUIDELINE: 95, // Official clinical guidelines
  JOURNAL: 90, // Peer-reviewed journals
  TEXTBOOK: 85, // Medical textbooks
  LECTURE: 75, // Medical school lectures (variable quality)
  USER_NOTES: 50, // User-generated content
};

/**
 * Evidence level mapping by source type
 * Task 2.2: EBM hierarchy implementation
 */
const SOURCE_TYPE_TO_EVIDENCE_LEVEL: Record<$Enums.SourceType, EvidenceLevel> = {
  GUIDELINE: EvidenceLevel.LEVEL_I, // Based on systematic reviews
  JOURNAL: EvidenceLevel.LEVEL_II, // Typically RCTs or cohort studies
  FIRST_AID: EvidenceLevel.LEVEL_II, // Curated evidence-based content
  TEXTBOOK: EvidenceLevel.LEVEL_III, // Compiled knowledge
  LECTURE: EvidenceLevel.LEVEL_IV, // Educational synthesis
  USER_NOTES: EvidenceLevel.LEVEL_V, // Personal opinion
};

// Minimal shape needed from `sources` for EBM evaluation
type MinimalSource = Pick<
  sources,
  "id" | "type" | "credibilityScore" | "lastUpdated" | "medicalSpecialty" | "metadata"
>;

/**
 * EBMEvaluator - Evidence-Based Medicine evaluation service
 *
 * @example
 * ```typescript
 * const evaluator = new EBMEvaluator()
 *
 * // Evaluate a source
 * const rating = await evaluator.evaluateSource(source)
 *
 * // Compare sources for conflict resolution
 * const comparison = await evaluator.compareEvidence(conflictId)
 *
 * // Get recommendation
 * console.log(`Prefer ${comparison.preferredSourceId}: ${comparison.reasoning}`)
 * ```
 */
export class EBMEvaluator {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Disconnect Prisma client
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }

  /**
   * Task 2.1, 5.1: Evaluate source credibility and evidence level
   *
   * Calculates comprehensive credibility rating based on:
   * - Source type base score
   * - Evidence level
   * - Publication recency
   * - Medical specialty relevance
   * - Peer review status
   *
   * @param source - Source to evaluate
   * @param specialty - Optional medical specialty context
   * @returns Credibility rating with EBM classification
   */
  async evaluateSource(source: MinimalSource, specialty?: string): Promise<CredibilityRating> {
    // Get base score and evidence level
    const baseScore = source.credibilityScore || DEFAULT_CREDIBILITY_SCORES[source.type];
    const evidenceLevel = this.determineEvidenceLevel(source);

    // Calculate bonuses
    const recencyBonus = this.calculateRecencyBonus(source.lastUpdated);
    const specialtyRelevance = this.calculateSpecialtyRelevance(source, specialty);
    const peerReviewBonus = this.calculatePeerReviewBonus(source);

    // Final score (capped at 100)
    const finalScore = Math.min(
      100,
      baseScore + recencyBonus + specialtyRelevance + peerReviewBonus,
    );

    // Determine recommendation grade
    const recommendationGrade = this.determineRecommendationGrade(evidenceLevel, finalScore);

    // Generate rationale
    const rationale = this.generateRationale({
      baseScore,
      evidenceLevel,
      recencyBonus,
      specialtyRelevance,
      peerReviewBonus,
    });

    // Confidence based on available metadata
    const confidence = this.calculateConfidence(source);

    return {
      score: finalScore,
      evidenceLevel,
      recommendationGrade,
      rationale,
      confidence,
    };
  }

  /**
   * Task 5.2: Compare evidence between two sources in a conflict
   *
   * Performs multi-factor analysis:
   * - Source credibility scores
   * - EBM evidence levels
   * - Publication recency
   * - User preferences (from UserSourcePreference)
   *
   * @param conflictId - ID of conflict to analyze
   * @param userId - Optional user ID for preference integration
   * @returns Evidence comparison with recommendation
   */
  async compareEvidence(conflictId: string, userId?: string): Promise<EBMComparison> {
    // Fetch conflict with sources
    const conflict = await this.prisma.conflicts.findUnique({
      where: { id: conflictId },
      include: {
        content_chunks_conflicts_sourceAChunkIdTocontent_chunks: {
          include: {
            lecture: true,
          },
        },
        content_chunks_conflicts_sourceBChunkIdTocontent_chunks: {
          include: {
            lecture: true,
          },
        },
      },
    });

    if (!conflict) {
      throw new Error(`Conflict ${conflictId} not found`);
    }

    // Create temporary source-like objects for evaluation based on lecture chunks
    const lectureType: $Enums.SourceType = SourceTypeEnum.LECTURE;
    const sourceA: MinimalSource = {
      id: conflict.sourceAChunkId,
      type: lectureType,
      credibilityScore: DEFAULT_CREDIBILITY_SCORES[lectureType],
      lastUpdated:
        conflict.content_chunks_conflicts_sourceAChunkIdTocontent_chunks?.lecture?.uploadedAt ??
        null,
      metadata: {},
      medicalSpecialty: null,
    };

    const sourceB: MinimalSource = {
      id: conflict.sourceBChunkId,
      type: lectureType,
      credibilityScore: DEFAULT_CREDIBILITY_SCORES[lectureType],
      lastUpdated:
        conflict.content_chunks_conflicts_sourceBChunkIdTocontent_chunks?.lecture?.uploadedAt ??
        null,
      metadata: {},
      medicalSpecialty: null,
    };

    // Evaluate both sources
    const ratingA = await this.evaluateSource(sourceA);
    const ratingB = await this.evaluateSource(sourceB);

    // Apply user preferences if available
    const userPreferences = userId ? await this.getUserSourcePreferences(userId) : null;
    const preferenceAdjustment = this.applyUserPreferences(
      sourceA.id!,
      sourceB.id!,
      userPreferences,
    );

    // Calculate adjusted scores
    const adjustedScoreA = ratingA.score + preferenceAdjustment.sourceA;
    const adjustedScoreB = ratingB.score + preferenceAdjustment.sourceB;

    // Determine preferred source
    const preferSourceA = adjustedScoreA > adjustedScoreB;

    const preferred = preferSourceA ? ratingA : ratingB;
    const alternative = preferSourceA ? ratingB : ratingA;

    const preferredSourceId = preferSourceA ? sourceA.id! : sourceB.id!;
    const alternativeSourceId = preferSourceA ? sourceB.id! : sourceA.id!;

    // Calculate confidence
    const scoreDifference = Math.abs(adjustedScoreA - adjustedScoreB);
    const evidenceLevelDiff = Math.abs(
      this.evidenceLevelToNumber(ratingA.evidenceLevel) -
        this.evidenceLevelToNumber(ratingB.evidenceLevel),
    );

    // High confidence if significant difference in both score and evidence level
    const confidence = Math.min(1.0, scoreDifference / 100 + evidenceLevelDiff / 5);

    // Determine if manual review needed
    const requiresManualReview = scoreDifference < 10 || confidence < 0.5;

    // Generate reasoning
    const reasoning = this.generateComparisonReasoning(
      preferSourceA ? sourceA.type : sourceB.type,
      preferSourceA ? ratingA : ratingB,
      scoreDifference,
      preferenceAdjustment,
    );

    return {
      preferredSourceId,
      alternativeSourceId,
      reasoning,
      confidence,
      evidenceLevelDifference: {
        preferred: preferred.evidenceLevel,
        alternative: alternative.evidenceLevel,
        significant: evidenceLevelDiff >= 2,
      },
      credibilityDifference: {
        preferred: preferSourceA ? adjustedScoreA : adjustedScoreB,
        alternative: preferSourceA ? adjustedScoreB : adjustedScoreA,
        percentDifference: (scoreDifference / Math.max(adjustedScoreA, adjustedScoreB)) * 100,
      },
      requiresManualReview,
    };
  }

  /**
   * Task 5.3: Get clinical guideline for a topic
   *
   * Returns official clinical guideline if available
   * (Placeholder for future guideline database integration)
   *
   * @param topic - Medical topic or condition
   * @returns Clinical guideline source or null
   */
  async getClinicallGuideline(topic: string): Promise<sources | null> {
    // Future: Query clinical guideline database
    // For MVP: Return null (guidelines will be added via seed data)
    return null;
  }

  /**
   * Determine evidence level for source
   * Task 2.2: EBM hierarchy mapping
   */
  private determineEvidenceLevel(source: Pick<MinimalSource, "type" | "metadata">): EvidenceLevel {
    // Check metadata for explicit evidence level
    const metadata = source.metadata;
    if (this.isRecord(metadata)) {
      const val = (metadata as Record<string, unknown>).evidenceLevel;
      if (typeof val === "string" && (Object.values(EvidenceLevel) as string[]).includes(val)) {
        return val as EvidenceLevel;
      }
    }

    // Default based on source type
    return SOURCE_TYPE_TO_EVIDENCE_LEVEL[source.type];
  }

  /**
   * Calculate recency bonus (0-10 points)
   * Newer sources get higher bonus
   */
  private calculateRecencyBonus(lastUpdated?: Date | null): number {
    if (!lastUpdated) return 0;

    const now = new Date();
    const ageYears = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24 * 365);

    if (ageYears < 1) return 10; // <1 year old
    if (ageYears < 2) return 7; // 1-2 years
    if (ageYears < 5) return 4; // 2-5 years
    if (ageYears < 10) return 2; // 5-10 years
    return 0; // >10 years
  }

  /**
   * Calculate medical specialty relevance (0-10 points)
   * Higher bonus if source specialty matches context
   */
  private calculateSpecialtyRelevance(
    source: Pick<MinimalSource, "medicalSpecialty">,
    specialty?: string,
  ): number {
    if (!specialty || !source.medicalSpecialty) return 5; // Neutral if unknown

    const sourceSpecialty = source.medicalSpecialty.toLowerCase();
    const contextSpecialty = specialty.toLowerCase();

    // Exact match
    if (sourceSpecialty === contextSpecialty) return 10;

    // Partial match
    if (sourceSpecialty.includes(contextSpecialty) || contextSpecialty.includes(sourceSpecialty)) {
      return 7;
    }

    // No match
    return 0;
  }

  /**
   * Calculate peer review bonus (0-10 points)
   * Peer-reviewed sources get higher credibility
   */
  private calculatePeerReviewBonus(source: Pick<MinimalSource, "type" | "metadata">): number {
    const metadata = source.metadata;

    if (this.isRecord(metadata) && (metadata as Record<string, unknown>).peerReviewed === true)
      return 10;
    if (source.type === SourceTypeEnum.JOURNAL || source.type === SourceTypeEnum.GUIDELINE) return 8; // Assumed peer-reviewed
    return 0;
  }

  /**
   * Determine recommendation grade from evidence level and score
   */
  private determineRecommendationGrade(
    evidenceLevel: EvidenceLevel,
    score: number,
  ): RecommendationGrade {
    if (evidenceLevel === EvidenceLevel.LEVEL_I && score >= 90) {
      return RecommendationGrade.GRADE_A;
    }

    if (
      (evidenceLevel === EvidenceLevel.LEVEL_II || evidenceLevel === EvidenceLevel.LEVEL_III) &&
      score >= 75
    ) {
      return RecommendationGrade.GRADE_B;
    }

    if (evidenceLevel === EvidenceLevel.LEVEL_IV && score >= 60) {
      return RecommendationGrade.GRADE_C;
    }

    return RecommendationGrade.GRADE_D;
  }

  /**
   * Generate rationale for credibility score
   */
  private generateRationale(criteria: CredibilityCriteria): string {
    const parts: string[] = [];

    parts.push(`Base credibility: ${criteria.baseScore}/100`);
    parts.push(`Evidence level: ${criteria.evidenceLevel}`);

    if (criteria.recencyBonus > 0) {
      parts.push(`Recent publication (+${criteria.recencyBonus})`);
    }

    if (criteria.specialtyRelevance > 5) {
      parts.push(`Specialty relevance (+${criteria.specialtyRelevance})`);
    }

    if (criteria.peerReviewBonus > 0) {
      parts.push(`Peer-reviewed (+${criteria.peerReviewBonus})`);
    }

    return parts.join("; ");
  }

  /**
   * Calculate confidence in rating based on metadata completeness
   */
  private calculateConfidence(source: Pick<MinimalSource, "lastUpdated" | "medicalSpecialty" | "metadata">): number {
    let confidence = 0.5; // Base confidence

    if (source.lastUpdated) confidence += 0.15;
    if (source.medicalSpecialty) confidence += 0.15;
    if (source.metadata) confidence += 0.2;

    return Math.min(1.0, confidence);
  }

  /**
   * Convert evidence level to numeric value for comparison
   */
  private evidenceLevelToNumber(level: EvidenceLevel): number {
    const mapping = {
      [EvidenceLevel.LEVEL_I]: 5,
      [EvidenceLevel.LEVEL_II]: 4,
      [EvidenceLevel.LEVEL_III]: 3,
      [EvidenceLevel.LEVEL_IV]: 2,
      [EvidenceLevel.LEVEL_V]: 1,
    };
    return mapping[level];
  }

  /**
   * Task 2.4: Get user source preferences
   */
  private async getUserSourcePreferences(userId: string) {
    return await this.prisma.user_source_preferences.findMany({
      where: { userId },
      include: { sources: true },
    });
  }

  /**
   * Task 2.4: Apply user source preferences to credibility scores
   */
  private applyUserPreferences(
    sourceAId: string,
    sourceBId: string,
    preferences: any[] | null,
  ): { sourceA: number; sourceB: number } {
    if (!preferences || preferences.length === 0) {
      return { sourceA: 0, sourceB: 0 };
    }

    let adjustmentA = 0;
    let adjustmentB = 0;

    for (const pref of preferences) {
      if (pref.sourceId === sourceAId) {
        adjustmentA = this.trustLevelToBonus(pref.trustLevel);
      }
      if (pref.sourceId === sourceBId) {
        adjustmentB = this.trustLevelToBonus(pref.trustLevel);
      }
    }

    return { sourceA: adjustmentA, sourceB: adjustmentB };
  }

  /**
   * Convert trust level to credibility bonus/penalty
   */
  private trustLevelToBonus(trustLevel: string): number {
    const mapping: Record<string, number> = {
      HIGH: 10,
      MEDIUM: 0,
      LOW: -10,
      BLOCKED: -100, // Effectively eliminates this source
    };
    return mapping[trustLevel] || 0;
  }

  /**
   * Generate reasoning for comparison result
   */
  private generateComparisonReasoning(
    preferredType: $Enums.SourceType,
    rating: CredibilityRating,
    scoreDifference: number,
    preferences: { sourceA: number; sourceB: number },
  ): string {
    const parts: string[] = [];

    // Primary reason
    parts.push(
      `Prefer ${preferredType} source (credibility score: ${rating.score}/100, ${rating.evidenceLevel})`,
    );

    // Evidence level
    parts.push(`Evidence grade: ${rating.recommendationGrade}`);

    // Score difference
    if (scoreDifference > 20) {
      parts.push(`Significantly higher credibility (+${scoreDifference} points)`);
    } else if (scoreDifference > 10) {
      parts.push(`Moderately higher credibility (+${scoreDifference} points)`);
    } else {
      parts.push(`Marginally higher credibility (+${scoreDifference} points)`);
    }

    // User preferences
    if (preferences.sourceA !== 0 || preferences.sourceB !== 0) {
      parts.push(`User preferences applied`);
    }

    return parts.join(". ");
  }
  // Narrow unknown to record helper
  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
  }
}

/**
 * Singleton instance
 */
export const ebmEvaluator = new EBMEvaluator();

/**
 * Cleanup handler
 */
if (typeof process !== "undefined") {
  process.on("beforeExit", async () => {
    await ebmEvaluator.disconnect();
  });
}
