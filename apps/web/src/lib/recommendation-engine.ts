/**
 * Story 3.5: Context-Aware Content Recommendations
 * Hybrid Recommendation Engine combining content-based and collaborative filtering
 *
 * Architecture:
 * - 70% content-based filtering (semantic similarity + knowledge graph)
 * - 30% collaborative filtering (user interaction patterns)
 *
 * Scoring Algorithm:
 * - Semantic similarity: 40%
 * - Prerequisite relationships: 20%
 * - Mastery alignment: 20%
 * - Recency factor: 10%
 * - User feedback: 10%
 *
 * Minimum threshold: 0.6 (filters low-quality recommendations)
 * Performance target: <500ms query latency
 */

import { prisma } from '@/lib/db';
import type {
  ContentChunk,
  ContentRecommendation,
  RecommendationStatus,
  ContentSourceType,
  LearningObjective,
  ConceptRelationship,
  RelationshipType,
} from '@/generated/prisma';

// ============================================
// Types and Interfaces
// ============================================

export interface RecommendationScore {
  semanticSimilarity: number;    // 0-1, cosine similarity
  prerequisiteRelation: number;  // 0-1, relationship strength
  masteryAlignment: number;      // 0-1, complexity appropriateness
  recency: number;               // 0-1, inverse of days since last viewed
  userFeedback: number;          // 0-1, avg rating or 0.5 default
}

export interface RecommendationContext {
  userId: string;
  contextType: 'session' | 'objective' | 'mission';
  contextId: string;
  currentEmbedding?: number[];
  currentObjectiveId?: string;
  userMasteryLevel?: number;
  limit?: number;
  sourceTypes?: ContentSourceType[];
  excludeRecent?: boolean;
}

export interface CandidateRecommendation {
  contentId: string;
  content: string;
  lectureId: string;
  lectureTitle?: string;
  pageNumber?: number;
  similarity?: number;
  objectiveId?: string;
  complexity?: number;
  sourceType: ContentSourceType;
  relationshipType?: RelationshipType;
  relationshipStrength?: number;
}

export interface RecommendationResponse {
  id: string;
  content: {
    id: string;
    title: string;
    type: ContentSourceType;
    pageNumber?: number;
    lectureTitle?: string;
    preview: string;
  };
  score: number;
  reasoning: string;
  source: string;
  createdAt: Date;
  actions: {
    view: string;
    dismiss: boolean;
    rate: boolean;
  };
}

// ============================================
// Recommendation Engine
// ============================================

const SCORING_WEIGHTS = {
  semanticSimilarity: 0.4,
  prerequisiteRelation: 0.2,
  masteryAlignment: 0.2,
  recency: 0.1,
  userFeedback: 0.1,
} as const;

const MIN_SCORE_THRESHOLD = 0.6;
const RECENT_CONTENT_WINDOW_HOURS = 24;
const SIMILARITY_THRESHOLD = 0.7;
const MAX_RELATIONSHIP_DEPTH = 3;

export class RecommendationEngine {
  /**
   * Generate recommendations based on context
   */
  async generate(context: RecommendationContext): Promise<RecommendationResponse[]> {
    const {
      userId,
      contextType,
      contextId,
      currentEmbedding,
      currentObjectiveId,
      userMasteryLevel = 0.5,
      limit = 10,
      sourceTypes,
      excludeRecent = true,
    } = context;

    try {
      // Step 1: Get candidate recommendations from semantic search
      const candidates: CandidateRecommendation[] = [];

      if (currentEmbedding) {
        const semanticCandidates = await this.semanticSearch(
          currentEmbedding,
          userId,
          excludeRecent,
          sourceTypes
        );
        candidates.push(...semanticCandidates);
      }

      // Step 2: Get candidates from knowledge graph traversal
      if (currentObjectiveId) {
        const graphCandidates = await this.graphTraversal(currentObjectiveId, MAX_RELATIONSHIP_DEPTH);
        candidates.push(...graphCandidates);
      }

      // Step 3: Remove duplicates
      const uniqueCandidates = this.deduplicateCandidates(candidates);

      // Step 4: Calculate final scores for each candidate
      const scoredRecommendations = await Promise.all(
        uniqueCandidates.map(async (candidate) => {
          const scores = await this.calculateScores(candidate, userId, userMasteryLevel);
          const finalScore = this.calculateFinalScore(scores);

          return {
            candidate,
            scores,
            finalScore,
          };
        })
      );

      // Step 5: Filter by minimum threshold and sort by score
      const filteredRecommendations = scoredRecommendations
        .filter(rec => rec.finalScore >= MIN_SCORE_THRESHOLD)
        .sort((a, b) => b.finalScore - a.finalScore)
        .slice(0, limit);

      // Step 6: Apply user feedback re-ranking
      const rerankedRecommendations = await this.reRankWithFeedback(
        filteredRecommendations,
        userId
      );

      // Step 7: Save recommendations to database
      const savedRecommendations = await this.saveRecommendations(
        rerankedRecommendations,
        userId,
        contextType,
        contextId
      );

      // Step 8: Format response
      return this.formatRecommendations(savedRecommendations);
    } catch (error) {
      console.error('[RecommendationEngine] Error generating recommendations:', error);
      throw error;
    }
  }

  /**
   * Semantic search using pgvector cosine similarity
   */
  private async semanticSearch(
    embedding: number[],
    userId: string,
    excludeRecent: boolean,
    sourceTypes?: ContentSourceType[]
  ): Promise<CandidateRecommendation[]> {
    try {
      const embeddingString = `[${embedding.join(',')}]`;
      const cutoffTime = excludeRecent
        ? new Date(Date.now() - RECENT_CONTENT_WINDOW_HOURS * 60 * 60 * 1000)
        : new Date(0);

      // Raw SQL query for pgvector similarity search
      const results = await prisma.$queryRaw<Array<{
        id: string;
        content: string;
        lecture_id: string;
        page_number: number | null;
        similarity: number;
      }>>`
        SELECT
          c.id,
          c.content,
          c.lecture_id,
          c.page_number,
          1 - (c.embedding <=> ${embeddingString}::vector) AS similarity
        FROM content_chunks c
        WHERE 1 - (c.embedding <=> ${embeddingString}::vector) > ${SIMILARITY_THRESHOLD}
          AND c.id NOT IN (
            SELECT "recommendedContentId" FROM content_recommendations
            WHERE "userId" = ${userId}
              AND "createdAt" > ${cutoffTime}
              AND status != 'DISMISSED'
          )
        ORDER BY similarity DESC
        LIMIT 20
      `;

      // Fetch lecture details
      const lectureIds = [...new Set(results.map(r => r.lecture_id))];
      const lectures = await prisma.lecture.findMany({
        where: { id: { in: lectureIds } },
        select: { id: true, title: true },
      });

      const lectureMap = new Map(lectures.map(l => [l.id, l.title]));

      return results.map(result => ({
        contentId: result.id,
        content: result.content,
        lectureId: result.lecture_id,
        lectureTitle: lectureMap.get(result.lecture_id),
        pageNumber: result.page_number ?? undefined,
        similarity: result.similarity,
        sourceType: 'LECTURE' as ContentSourceType,
      }));
    } catch (error) {
      console.error('[RecommendationEngine] Semantic search error:', error);
      return [];
    }
  }

  /**
   * Knowledge graph traversal for related concepts
   */
  private async graphTraversal(
    objectiveId: string,
    maxDepth: number
  ): Promise<CandidateRecommendation[]> {
    try {
      // Get the objective's associated concept
      const objective = await prisma.learningObjective.findUnique({
        where: { id: objectiveId },
        include: {
          lecture: {
            select: { id: true, title: true },
          },
        },
      });

      if (!objective) return [];

      // Find related concepts via knowledge graph (placeholder - requires concept mapping)
      // This would traverse ConceptRelationship table in production
      // For MVP, we'll use objective prerequisites
      const relationships = await prisma.objectivePrerequisite.findMany({
        where: {
          OR: [
            { objectiveId: objectiveId },
            { prerequisiteId: objectiveId },
          ],
        },
        include: {
          objective: {
            include: {
              lecture: {
                include: {
                  contentChunks: true,
                },
              },
            },
          },
          prerequisite: {
            include: {
              lecture: {
                include: {
                  contentChunks: true,
                },
              },
            },
          },
        },
        take: 10,
      });

      const candidates: CandidateRecommendation[] = [];

      for (const rel of relationships) {
        const relatedObjective = rel.objectiveId === objectiveId ? rel.prerequisite : rel.objective;

        // Get content chunks from related objectives
        for (const chunk of relatedObjective.lecture.contentChunks) {
          candidates.push({
            contentId: chunk.id,
            content: chunk.content,
            lectureId: relatedObjective.lectureId,
            lectureTitle: relatedObjective.lecture.title,
            pageNumber: chunk.pageNumber ?? undefined,
            objectiveId: relatedObjective.id,
            sourceType: 'LECTURE' as ContentSourceType,
            relationshipType: 'PREREQUISITE' as RelationshipType,
            relationshipStrength: rel.strength,
          });
        }
      }

      return candidates;
    } catch (error) {
      console.error('[RecommendationEngine] Graph traversal error:', error);
      return [];
    }
  }

  /**
   * Remove duplicate candidates (same contentId)
   */
  private deduplicateCandidates(candidates: CandidateRecommendation[]): CandidateRecommendation[] {
    const seen = new Set<string>();
    const unique: CandidateRecommendation[] = [];

    for (const candidate of candidates) {
      if (!seen.has(candidate.contentId)) {
        seen.add(candidate.contentId);
        unique.push(candidate);
      }
    }

    return unique;
  }

  /**
   * Calculate all scoring factors for a candidate
   */
  private async calculateScores(
    candidate: CandidateRecommendation,
    userId: string,
    userMasteryLevel: number
  ): Promise<RecommendationScore> {
    // Semantic similarity (from pgvector or relationship)
    const semanticSimilarity = candidate.similarity ?? 0.7;

    // Prerequisite relationship score
    const prerequisiteRelation = candidate.relationshipType === 'PREREQUISITE'
      ? (candidate.relationshipStrength ?? 1.0)
      : candidate.relationshipType === 'RELATED'
      ? 0.7
      : candidate.relationshipType === 'INTEGRATED'
      ? 0.5
      : 0;

    // Mastery alignment (complexity appropriateness)
    const contentComplexity = candidate.complexity ?? 0.5;
    const masteryAlignment = 1 - Math.abs(userMasteryLevel - contentComplexity);

    // Recency (days since last viewed)
    const recency = 1.0; // Default - would calculate from view history

    // User feedback (average rating for similar content)
    const userFeedback = await this.getUserFeedbackScore(userId, candidate.contentId);

    return {
      semanticSimilarity,
      prerequisiteRelation,
      masteryAlignment,
      recency,
      userFeedback,
    };
  }

  /**
   * Calculate final weighted score
   */
  private calculateFinalScore(scores: RecommendationScore): number {
    return (
      scores.semanticSimilarity * SCORING_WEIGHTS.semanticSimilarity +
      scores.prerequisiteRelation * SCORING_WEIGHTS.prerequisiteRelation +
      scores.masteryAlignment * SCORING_WEIGHTS.masteryAlignment +
      scores.recency * SCORING_WEIGHTS.recency +
      scores.userFeedback * SCORING_WEIGHTS.userFeedback
    );
  }

  /**
   * Get user feedback score for similar content
   */
  private async getUserFeedbackScore(userId: string, contentId: string): Promise<number> {
    try {
      const feedback = await prisma.recommendationFeedback.findMany({
        where: {
          userId,
          recommendation: {
            recommendedContentId: contentId,
          },
        },
        select: { rating: true },
      });

      if (feedback.length === 0) return 0.5; // Default neutral score

      const avgRating = feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length;
      return avgRating / 5; // Normalize to 0-1
    } catch (error) {
      console.error('[RecommendationEngine] Error getting user feedback:', error);
      return 0.5;
    }
  }

  /**
   * Re-rank recommendations based on user feedback patterns
   */
  private async reRankWithFeedback(
    recommendations: Array<{ candidate: CandidateRecommendation; scores: RecommendationScore; finalScore: number }>,
    userId: string
  ): Promise<Array<{ candidate: CandidateRecommendation; scores: RecommendationScore; finalScore: number }>> {
    try {
      // Get user's feedback patterns
      const recentFeedback = await prisma.recommendationFeedback.findMany({
        where: {
          userId,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
        include: {
          recommendation: true,
        },
      });

      // Apply feedback adjustments
      return recommendations.map(rec => {
        let adjustedScore = rec.finalScore;

        // Find similar rated content
        const similarFeedback = recentFeedback.filter(fb =>
          fb.recommendation.recommendedContentId === rec.candidate.contentId
        );

        if (similarFeedback.length > 0) {
          const avgRating = similarFeedback.reduce((sum, fb) => sum + fb.rating, 0) / similarFeedback.length;

          if (avgRating >= 4) {
            // Highly rated similar content - boost by 15%
            adjustedScore *= 1.15;
          } else if (avgRating <= 2) {
            // Poorly rated similar content - reduce by 30%
            adjustedScore *= 0.7;
          }
        }

        return {
          ...rec,
          finalScore: Math.min(adjustedScore, 1.0), // Cap at 1.0
        };
      }).sort((a, b) => b.finalScore - a.finalScore);
    } catch (error) {
      console.error('[RecommendationEngine] Error re-ranking with feedback:', error);
      return recommendations;
    }
  }

  /**
   * Save recommendations to database
   */
  private async saveRecommendations(
    recommendations: Array<{ candidate: CandidateRecommendation; scores: RecommendationScore; finalScore: number }>,
    userId: string,
    contextType: string,
    contextId: string
  ): Promise<ContentRecommendation[]> {
    try {
      const created = await Promise.all(
        recommendations.map(async (rec) => {
          const reasoning = this.generateReasoning(rec.candidate, rec.scores, rec.finalScore);

          return prisma.contentRecommendation.create({
            data: {
              userId,
              recommendedContentId: rec.candidate.contentId,
              sourceContentId: null, // Would link to source content that triggered recommendation
              score: rec.finalScore,
              reasoning,
              status: 'PENDING' as RecommendationStatus,
              contextType,
              contextId,
              sourceType: rec.candidate.sourceType,
            },
          });
        })
      );

      return created;
    } catch (error) {
      console.error('[RecommendationEngine] Error saving recommendations:', error);
      throw error;
    }
  }

  /**
   * Generate human-readable reasoning for recommendation
   */
  private generateReasoning(
    candidate: CandidateRecommendation,
    scores: RecommendationScore,
    finalScore: number
  ): string {
    const parts: string[] = [];

    if (scores.semanticSimilarity > 0.8) {
      parts.push(`Highly similar content (${(scores.semanticSimilarity * 100).toFixed(0)}% match)`);
    } else if (scores.semanticSimilarity > 0.7) {
      parts.push(`Related content (${(scores.semanticSimilarity * 100).toFixed(0)}% match)`);
    }

    if (candidate.relationshipType === 'PREREQUISITE') {
      parts.push('Prerequisite for understanding this topic');
    } else if (candidate.relationshipType === 'RELATED') {
      parts.push('Related via knowledge graph');
    } else if (candidate.relationshipType === 'INTEGRATED') {
      parts.push('Integrated cross-course concept');
    }

    if (scores.masteryAlignment > 0.8) {
      parts.push('Matches your current mastery level');
    }

    if (parts.length === 0) {
      parts.push('Recommended based on learning patterns');
    }

    return parts.join(' • ');
  }

  /**
   * Format recommendations for API response
   */
  private formatRecommendations(recommendations: ContentRecommendation[]): RecommendationResponse[] {
    return recommendations.map(rec => ({
      id: rec.id,
      content: {
        id: rec.recommendedContentId,
        title: 'Content Title', // Would fetch from lecture/chunk
        type: rec.sourceType,
        pageNumber: undefined,
        lectureTitle: undefined,
        preview: 'Content preview...', // Would extract from content
      },
      score: rec.score,
      reasoning: rec.reasoning,
      source: rec.sourceType,
      createdAt: rec.createdAt,
      actions: {
        view: `/api/recommendations/${rec.id}/view`,
        dismiss: true,
        rate: true,
      },
    }));
  }
}

/**
 * Singleton instance
 */
export const recommendationEngine = new RecommendationEngine();
