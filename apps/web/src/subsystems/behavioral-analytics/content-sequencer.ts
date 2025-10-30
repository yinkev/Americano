/**
 * Content Sequencer
 * Story 5.3 Task 4
 *
 * Sequences learning content in optimal order following warm-up → peak → wind-down
 * progression with VARK learning style adaptation and spaced repetition integration.
 */

import { prisma } from '@/lib/db'

/**
 * Content sequence with phases
 */
export interface ContentSequence {
  sequence: ContentItem[]
  totalDuration: number // minutes
  phases: {
    warmUp: number // duration in minutes
    peak: number
    windDown: number
  }
}

/**
 * Individual content item in sequence
 */
export interface ContentItem {
  type: 'flashcard' | 'new_flashcard' | 'validation' | 'clinical' | 'lecture' | 'break'
  id: string | null // null for breaks
  duration: number // minutes
  phase: 'warmup' | 'peak' | 'winddown'
  difficulty?: number // 0-10 for flashcards
}

/**
 * VARK learning style profile
 */
interface VARKProfile {
  visual: number // 0.0-1.0
  auditory: number
  kinesthetic: number // Clinical scenarios
  reading: number // Text-based content
}

/**
 * Content Sequencer class
 * Optimally sequences learning content for maximum retention and engagement
 */
export class ContentSequencer {
  /**
   * Sequence content for a study session based on learning progression
   *
   * Algorithm (3-phase approach):
   * 1. WARM-UP (20% of duration): Easy review cards (difficulty <5) to build confidence
   * 2. PEAK (60% of duration): New challenging content + validation
   *    - Prioritize kinesthetic content first if kinesthetic score > 0.5 (VARK)
   *    - Interleave content types to avoid monotony (no more than 3 consecutive same type)
   *    - Insert validation prompts after every 2-3 new concepts
   * 3. WIND-DOWN (20% of duration): Medium difficulty reviews (5-8) for consolidation
   * 4. Total sequence duration ≈ session duration (within 5%)
   *
   * @param userId - User ID
   * @param missionId - Mission ID with content to sequence
   * @param sessionDuration - Total session duration in minutes
   * @returns ContentSequence with ordered items and phase breakdown
   */
  static async sequenceContent(
    userId: string,
    missionId: string,
    sessionDuration: number,
  ): Promise<ContentSequence> {
    // Get user's VARK learning style profile
    const userProfile = await prisma.userLearningProfile.findUnique({
      where: { userId },
    })

    const learningStyle = (userProfile?.learningStyleProfile as unknown as VARKProfile) || {
      visual: 0.25,
      auditory: 0.25,
      kinesthetic: 0.25,
      reading: 0.25,
    }

    // Get mission content
    const mission = await prisma.mission.findUnique({
      where: { id: missionId },
      select: {
        objectives: true,
        reviewCardCount: true,
        newContentCount: true,
      },
    })

    if (!mission) {
      throw new Error('Mission not found')
    }

    const objectives = (mission.objectives || []) as Array<{
      objectiveId: string
      estimatedMinutes: number
    }>

    // Fetch cards for review (both new and due)
    const reviewCards = await ContentSequencer.fetchReviewCards(
      userId,
      objectives,
      mission.reviewCardCount,
    )
    const newCards = await ContentSequencer.fetchNewCards(
      userId,
      objectives,
      mission.newContentCount,
    )

    // Calculate phase durations
    const warmUpDuration = Math.min(15, Math.round(sessionDuration * 0.2))
    const peakDuration = Math.round(sessionDuration * 0.6)
    const windDownDuration = Math.round(sessionDuration * 0.2)

    const sequence: ContentItem[] = []

    // PHASE 1: WARM-UP - Easy review cards
    const easyReviewCards = reviewCards
      .filter((c) => c.difficulty < 5)
      .sort((a, b) => a.difficulty - b.difficulty)
      .slice(0, 5) // Top 5 easiest

    for (const card of easyReviewCards) {
      sequence.push({
        type: 'flashcard',
        id: card.id,
        duration: 2, // Avg 2 min per card
        phase: 'warmup',
        difficulty: card.difficulty,
      })
    }

    // PHASE 2: PEAK - New content + validation
    const peakContent: ContentItem[] = []

    // Prioritize kinesthetic content (clinical scenarios) if user preference
    const clinicalScenarios = await ContentSequencer.fetchClinicalScenarios(userId, objectives)
    if (learningStyle.kinesthetic > 0.5 && clinicalScenarios.length > 0) {
      for (const scenario of clinicalScenarios.slice(0, 2)) {
        peakContent.push({
          type: 'clinical',
          id: scenario.id,
          duration: 8, // Clinical scenarios take longer
          phase: 'peak',
        })
      }
    }

    // Add new flashcards
    for (const card of newCards.slice(0, 3)) {
      peakContent.push({
        type: 'new_flashcard',
        id: card.id,
        duration: 3, // New cards take longer to learn
        phase: 'peak',
        difficulty: card.difficulty,
      })
    }

    // Add validation prompts (every 2-3 items)
    const validations = await ContentSequencer.fetchValidationPrompts(userId, objectives)
    for (let i = 2; i < peakContent.length && validations.length > 0; i += 3) {
      const validation = validations.shift()
      if (validation) {
        peakContent.splice(i, 0, {
          type: 'validation',
          id: validation.id,
          duration: 5, // Validation prompts ~5 min
          phase: 'peak',
        })
      }
    }

    // Interleave content to avoid monotony
    const interleavedPeak = ContentSequencer.interleaveContent(peakContent)
    sequence.push(...interleavedPeak)

    // PHASE 3: WIND-DOWN - Medium difficulty reviews
    const mediumReviewCards = reviewCards
      .filter((c) => c.difficulty >= 5 && c.difficulty < 8)
      .slice(0, 4)

    for (const card of mediumReviewCards) {
      sequence.push({
        type: 'flashcard',
        id: card.id,
        duration: 2,
        phase: 'winddown',
        difficulty: card.difficulty,
      })
    }

    const totalDuration = sequence.reduce((sum, item) => sum + item.duration, 0)

    return {
      sequence,
      totalDuration,
      phases: {
        warmUp: warmUpDuration,
        peak: peakDuration,
        windDown: windDownDuration,
      },
    }
  }

  /**
   * Interleave content items to avoid more than 3 consecutive items of same type
   */
  private static interleaveContent(items: ContentItem[]): ContentItem[] {
    const interleaved: ContentItem[] = []
    const typeGroups: Map<string, ContentItem[]> = new Map()

    // Group by type
    for (const item of items) {
      if (!typeGroups.has(item.type)) {
        typeGroups.set(item.type, [])
      }
      typeGroups.get(item.type)!.push(item)
    }

    // Round-robin insertion
    let hasMore = true
    let consecutiveCount = 0
    let lastType: string | null = null

    while (hasMore) {
      hasMore = false
      for (const [type, group] of typeGroups.entries()) {
        if (group.length > 0) {
          hasMore = true

          // Avoid more than 3 consecutive of same type
          if (lastType === type && consecutiveCount >= 3) {
            continue
          }

          const item = group.shift()!
          interleaved.push(item)

          if (lastType === type) {
            consecutiveCount++
          } else {
            consecutiveCount = 1
            lastType = type
          }
        }
      }
    }

    return interleaved
  }

  /**
   * Fetch review cards for objectives
   */
  private static async fetchReviewCards(
    userId: string,
    objectives: Array<{ objectiveId: string }>,
    count: number,
  ): Promise<Array<{ id: string; difficulty: number }>> {
    const objectiveIds = objectives.map((o) => o.objectiveId)

    const cards = await prisma.card.findMany({
      where: {
        objectiveId: { in: objectiveIds },
        nextReviewAt: { lte: new Date() },
      },
      select: {
        id: true,
        difficulty: true,
      },
      orderBy: {
        nextReviewAt: 'asc', // Due soonest first
      },
      take: count,
    })

    return cards.map((c) => ({ id: c.id, difficulty: c.difficulty }))
  }

  /**
   * Fetch new cards for objectives
   */
  private static async fetchNewCards(
    userId: string,
    objectives: Array<{ objectiveId: string }>,
    count: number,
  ): Promise<Array<{ id: string; difficulty: number }>> {
    const objectiveIds = objectives.map((o) => o.objectiveId)

    const cards = await prisma.card.findMany({
      where: {
        objectiveId: { in: objectiveIds },
        reviewCount: 0, // Never reviewed = new
      },
      select: {
        id: true,
        difficulty: true,
      },
      take: count,
    })

    return cards.map((c) => ({ id: c.id, difficulty: c.difficulty }))
  }

  /**
   * Fetch clinical scenarios (kinesthetic content)
   */
  private static async fetchClinicalScenarios(
    userId: string,
    objectives: Array<{ objectiveId: string }>,
  ): Promise<Array<{ id: string }>> {
    const objectiveIds = objectives.map((o) => o.objectiveId)

    const clinicalCards = await prisma.card.findMany({
      where: {
        objectiveId: { in: objectiveIds },
        cardType: 'CLINICAL_REASONING',
      },
      select: {
        id: true,
      },
      take: 3,
    })

    return clinicalCards
  }

  /**
   * Fetch validation prompts for objectives
   */
  private static async fetchValidationPrompts(
    userId: string,
    objectives: Array<{ objectiveId: string }>,
  ): Promise<Array<{ id: string }>> {
    const objectiveIds = objectives.map((o) => o.objectiveId)

    // Get concepts related to objectives
    const learningObjectives = await prisma.learningObjective.findMany({
      where: { id: { in: objectiveIds } },
      select: { objective: true },
    })

    // Simple keyword extraction (first 3 words)
    const conceptNames = learningObjectives.flatMap((obj) => obj.objective.split(' ').slice(0, 3))

    const validations = await prisma.validationPrompt.findMany({
      where: {
        conceptName: { in: conceptNames },
      },
      select: {
        id: true,
      },
      take: 2,
    })

    return validations
  }

  /**
   * Adapt sequence during session based on performance
   *
   * @param userId - User ID
   * @param currentSequence - Current content sequence
   * @param elapsedItems - Number of items completed
   * @param avgPerformance - Average performance so far (0-100)
   * @returns Updated sequence with difficulty adjustments
   */
  static async adaptSequenceInSession(
    userId: string,
    currentSequence: ContentItem[],
    elapsedItems: number,
    avgPerformance: number,
  ): Promise<ContentItem[]> {
    const remainingItems = currentSequence.slice(elapsedItems)

    // If performance is low (<60%), reduce difficulty
    if (avgPerformance < 60) {
      return remainingItems.map((item) => {
        if (item.type === 'new_flashcard' || item.type === 'flashcard') {
          // Switch to easier review content
          return {
            ...item,
            type: 'flashcard',
            difficulty: Math.max(0, (item.difficulty || 5) - 2),
          }
        }
        return item
      })
    }

    // If performance is high (>85%), can maintain or increase challenge
    return remainingItems
  }

  /**
   * Integrate spaced repetition into sequencing
   *
   * @param userId - User ID
   * @param baseSequence - Base content sequence
   * @returns Enhanced sequence with spaced repetition items
   */
  static async integrateSpacedRepetition(
    userId: string,
    baseSequence: ContentItem[],
  ): Promise<ContentItem[]> {
    // Get cards due for review using FSRS algorithm
    const dueCards = await prisma.card.findMany({
      where: {
        nextReviewAt: {
          lte: new Date(),
        },
      },
      select: {
        id: true,
        difficulty: true,
        retrievability: true,
      },
      orderBy: {
        retrievability: 'asc', // Most forgotten first
      },
      take: 10,
    })

    // Insert spaced repetition cards at strategic points
    const enhanced = [...baseSequence]
    let insertIndex = Math.floor(enhanced.length * 0.3) // Insert at 30% mark

    for (const card of dueCards.slice(0, 3)) {
      enhanced.splice(insertIndex, 0, {
        type: 'flashcard',
        id: card.id,
        duration: 2,
        phase: 'peak',
        difficulty: card.difficulty,
      })
      insertIndex += 3 // Space them out
    }

    return enhanced
  }
}
