/**
 * SearchSuggestionEngine
 * Story 3.6 Task 2: Search Suggestions and Autocomplete
 *
 * Provides intelligent autocomplete suggestions for search queries including:
 * - Medical terminology
 * - Previous searches (user history)
 * - Content titles
 * - Knowledge graph concepts
 * - Learning objectives
 *
 * Performance target: <100ms response time
 *
 * @module SearchSuggestionEngine
 */

import { prisma } from '@/lib/db'
import { SuggestionType } from '@/generated/prisma'

/**
 * Suggestion response interface
 */
export interface Suggestion {
  text: string
  type: SuggestionType
  metadata?: {
    source?: string
    category?: string
    frequency?: number
  }
  score: number  // Relevance score 0.0-1.0
}

/**
 * Get autocomplete suggestions for a partial query
 *
 * Task 2.1: Core autocomplete engine with ranking algorithm
 *
 * Ranking factors:
 * - Medical terminology gets highest priority
 * - Frequency of previous searches
 * - Recency of usage
 * - Semantic relevance
 *
 * @param partial - Partial search query (min 2 characters)
 * @param limit - Maximum suggestions to return (default: 10)
 * @param userId - Optional user ID for personalized suggestions
 * @returns Array of suggestions sorted by relevance
 */
export async function getSuggestions(
  partial: string,
  limit: number = 10,
  userId?: string
): Promise<Suggestion[]> {
  if (!partial || partial.length < 2) {
    // Return recent searches for empty query
    if (userId) {
      return getRecentSearches(userId, limit)
    }
    return []
  }

  const normalizedQuery = partial.toLowerCase().trim()
  const suggestions: Suggestion[] = []

  try {
    // 1. Get matching suggestions from SearchSuggestion table
    const dbSuggestions = await prisma.searchSuggestion.findMany({
      where: {
        term: {
          startsWith: normalizedQuery,
          mode: 'insensitive',
        },
      },
      orderBy: [
        { frequency: 'desc' },
        { lastUsed: 'desc' },
      ],
      take: limit * 2, // Get more for filtering/ranking
    })

    // Convert to Suggestion format with scoring
    for (const dbSug of dbSuggestions) {
      const metadata = dbSug.metadata as any
      suggestions.push({
        text: dbSug.term,
        type: dbSug.suggestionType,
        metadata: {
          source: metadata?.source,
          category: metadata?.category,
          frequency: dbSug.frequency,
        },
        score: calculateSuggestionScore(dbSug, normalizedQuery),
      })
    }

    // 2. Get suggestions from user's search history if userId provided
    if (userId) {
      const userSearches = await getUserSearchSuggestions(userId, normalizedQuery, 5)
      suggestions.push(...userSearches)
    }

    // 3. Get suggestions from content titles
    const contentSuggestions = await getContentTitleSuggestions(normalizedQuery, 5)
    suggestions.push(...contentSuggestions)

    // 4. Get suggestions from concepts
    const conceptSuggestions = await getConceptSuggestions(normalizedQuery, 5)
    suggestions.push(...conceptSuggestions)

    // Deduplicate and sort by score
    const uniqueSuggestions = deduplicateSuggestions(suggestions)
    uniqueSuggestions.sort((a, b) => b.score - a.score)

    return uniqueSuggestions.slice(0, limit)
  } catch (error) {
    console.error('Failed to get search suggestions:', error)
    return []
  }
}

/**
 * Calculate suggestion relevance score
 *
 * Scoring factors:
 * - Type priority: Medical term > Previous search > Content > Concept
 * - Frequency: Higher frequency = higher score
 * - Recency: Recent usage boosts score
 * - Match quality: Exact prefix match scores higher
 */
function calculateSuggestionScore(
  suggestion: any,
  query: string
): number {
  let score = 0.0

  // Type priority
  const typePriority: Record<string, number> = {
    MEDICAL_TERM: 1.0,
    PREVIOUS_SEARCH: 0.9,
    LEARNING_OBJECTIVE: 0.85,
    CONTENT_TITLE: 0.8,
    CONCEPT: 0.75,
  }
  score += (typePriority[suggestion.suggestionType] || 0.5) * 0.4

  // Frequency factor (normalize to 0-1, max at 100 searches)
  const frequencyScore = Math.min(suggestion.frequency / 100, 1.0)
  score += frequencyScore * 0.3

  // Recency factor (boost if used in last 7 days)
  const daysSinceLastUse = (Date.now() - new Date(suggestion.lastUsed).getTime()) / (1000 * 60 * 60 * 24)
  const recencyScore = Math.max(0, 1.0 - (daysSinceLastUse / 30))
  score += recencyScore * 0.2

  // Match quality (exact prefix match scores higher)
  const term = suggestion.term.toLowerCase()
  if (term === query) {
    score += 0.1  // Exact match
  } else if (term.startsWith(query)) {
    score += 0.05  // Prefix match
  }

  return Math.min(score, 1.0)
}

/**
 * Get recent searches when no query provided
 */
async function getRecentSearches(
  userId: string,
  limit: number
): Promise<Suggestion[]> {
  try {
    const recentSearches = await prisma.searchQuery.findMany({
      where: {
        userId,
        isAnonymized: false,
        resultCount: { gt: 0 },  // Only searches that returned results
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
      distinct: ['query'],
    })

    return recentSearches.map(search => ({
      text: search.query,
      type: 'PREVIOUS_SEARCH' as SuggestionType,
      metadata: {
        source: 'recent_history',
      },
      score: 1.0,  // Recent searches get high scores
    }))
  } catch (error) {
    console.error('Failed to get recent searches:', error)
    return []
  }
}

/**
 * Get suggestions from user's search history
 */
async function getUserSearchSuggestions(
  userId: string,
  query: string,
  limit: number
): Promise<Suggestion[]> {
  try {
    const searches = await prisma.searchQuery.findMany({
      where: {
        userId,
        query: {
          contains: query,
          mode: 'insensitive',
        },
        isAnonymized: false,
        resultCount: { gt: 0 },
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
      distinct: ['query'],
    })

    return searches.map(search => ({
      text: search.query,
      type: 'PREVIOUS_SEARCH' as SuggestionType,
      metadata: {
        source: 'user_history',
      },
      score: 0.85,
    }))
  } catch (error) {
    console.error('Failed to get user search suggestions:', error)
    return []
  }
}

/**
 * Get suggestions from lecture titles
 */
async function getContentTitleSuggestions(
  query: string,
  limit: number
): Promise<Suggestion[]> {
  try {
    const lectures = await prisma.lecture.findMany({
      where: {
        title: {
          contains: query,
          mode: 'insensitive',
        },
        processingStatus: 'COMPLETED',
      },
      select: {
        title: true,
        course: {
          select: {
            name: true,
          },
        },
      },
      take: limit,
    })

    return lectures.map(lecture => ({
      text: lecture.title,
      type: 'CONTENT_TITLE' as SuggestionType,
      metadata: {
        source: 'lecture',
        category: lecture.course?.name,
      },
      score: 0.75,
    }))
  } catch (error) {
    console.error('Failed to get content title suggestions:', error)
    return []
  }
}

/**
 * Get suggestions from knowledge graph concepts
 */
async function getConceptSuggestions(
  query: string,
  limit: number
): Promise<Suggestion[]> {
  try {
    const concepts = await prisma.concept.findMany({
      where: {
        name: {
          contains: query,
          mode: 'insensitive',
        },
      },
      select: {
        name: true,
        category: true,
      },
      take: limit,
    })

    return concepts.map(concept => ({
      text: concept.name,
      type: 'CONCEPT' as SuggestionType,
      metadata: {
        source: 'knowledge_graph',
        category: concept.category || undefined,
      },
      score: 0.7,
    }))
  } catch (error) {
    console.error('Failed to get concept suggestions:', error)
    return []
  }
}

/**
 * Deduplicate suggestions by text (keep highest score)
 */
function deduplicateSuggestions(suggestions: Suggestion[]): Suggestion[] {
  const map = new Map<string, Suggestion>()

  for (const suggestion of suggestions) {
    const key = suggestion.text.toLowerCase()
    const existing = map.get(key)

    if (!existing || suggestion.score > existing.score) {
      map.set(key, suggestion)
    }
  }

  return Array.from(map.values())
}

/**
 * Update or create a search suggestion
 * Called when a user performs a search
 *
 * Task 2.2: Track search terms for autocomplete
 */
export async function updateSearchSuggestion(
  term: string,
  type: SuggestionType,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    const normalizedTerm = term.trim()

    if (normalizedTerm.length < 2) {
      return  // Don't track very short terms
    }

    // TODO: SearchSuggestion model removed in Epic 4 - needs schema migration
    // await prisma.searchSuggestion.upsert({
    //   where: { term: normalizedTerm },
    //   update: {
    //     frequency: { increment: 1 },
    //     lastUsed: new Date(),
    //   },
    //   create: {
    //     term: normalizedTerm,
    //     suggestionType: type,
    //     frequency: 1,
    //     metadata: metadata || {},
    //   },
    // })
  } catch (error) {
    console.error('Failed to update search suggestion:', error)
    // Don't throw - suggestion tracking shouldn't break search
  }
}

/**
 * Seed medical terminology suggestions
 * Should be run during initial setup or periodically
 *
 * Task 2.1: Pre-populate medical terms for autocomplete
 */
export async function seedMedicalTerms(terms: Array<{ term: string; category?: string }>): Promise<number> {
  let seeded = 0

  try {
    // TODO: SearchSuggestion model removed in Epic 4 - needs schema migration
    // for (const { term, category } of terms) {
    //   await prisma.searchSuggestion.upsert({
    //     where: { term },
    //     update: {},  // Don't update if exists
    //     create: {
    //       term,
    //       suggestionType: 'MEDICAL_TERM',
    //       frequency: 10,  // Start with base frequency
    //       metadata: category ? { category } : {},
    //     },
    //   })
    //   seeded++
    // }

    console.log(`Seeded ${seeded} medical term suggestions (disabled - model removed)`)
    return seeded
  } catch (error) {
    console.error('Failed to seed medical terms:', error)
    return seeded
  }
}

/**
 * Clean up old, rarely-used suggestions
 * Run periodically to keep suggestion database lean
 *
 * Task 2.4: Maintain suggestion quality
 */
export async function cleanupOldSuggestions(
  daysOld: number = 90,
  minFrequency: number = 2
): Promise<number> {
  try {
    // TODO: SearchSuggestion model removed in Epic 4 - needs schema migration
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    // const result = await prisma.searchSuggestion.deleteMany({
    //   where: {
    //     lastUsed: { lt: cutoffDate },
    //     frequency: { lt: minFrequency },
    //     suggestionType: {
    //       not: 'MEDICAL_TERM',  // Don't delete medical terms
    //     },
    //   },
    // })

    console.log(`Cleaned up 0 old suggestions (disabled - model removed)`)
    return 0
  } catch (error) {
    console.error('Failed to cleanup old suggestions:', error)
    return 0
  }
}

/**
 * Export service interface
 */
export const searchSuggestionEngine = {
  getSuggestions,
  updateSearchSuggestion,
  seedMedicalTerms,
  cleanupOldSuggestions,
  getRecentSearches,
}
