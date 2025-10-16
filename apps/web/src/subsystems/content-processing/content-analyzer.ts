import { ChatMockClient } from '@/lib/ai/chatmock-client'
import { prisma } from '@/lib/db'

interface AnalysisResult {
  success: boolean
  objectivesCount?: number
  error?: string
}

export class ContentAnalyzer {
  private chatMockClient: ChatMockClient
  private readonly MAX_TEXT_LENGTH = 30000 // Max chars to send to GPT-5

  constructor() {
    this.chatMockClient = new ChatMockClient()
  }

  /**
   * Parse page number from ChatMock response
   * Returns null if not a valid number
   */
  private parsePageNumber(pageNumber: any): number | null {
    if (pageNumber === null || pageNumber === undefined) {
      return null
    }

    // If it's already a number, return it
    if (typeof pageNumber === 'number') {
      return pageNumber
    }

    // If it's a string, parse it as an integer
    if (typeof pageNumber === 'string') {
      const parsed = parseInt(pageNumber, 10)
      return isNaN(parsed) ? null : parsed
    }

    return null
  }

  /**
   * Extract learning objectives from lecture content and save to database
   */
  async extractLearningObjectives(lectureId: string): Promise<AnalysisResult> {
    try {
      // Get lecture with content chunks and course
      const lecture = await prisma.lecture.findUnique({
        where: { id: lectureId },
        include: {
          course: true,
          contentChunks: {
            orderBy: { chunkIndex: 'asc' },
          },
        },
      })

      if (!lecture) {
        throw new Error(`Lecture ${lectureId} not found`)
      }

      if (!lecture.contentChunks || lecture.contentChunks.length === 0) {
        throw new Error('No content chunks found for lecture')
      }

      // Combine chunks into full text (truncate if too long)
      const fullText = lecture.contentChunks
        .map((chunk) => chunk.content)
        .join('\n\n')
        .slice(0, this.MAX_TEXT_LENGTH)

      // Extract page numbers from content chunks
      const pageNumbers = lecture.contentChunks
        .map((chunk) => chunk.pageNumber)
        .filter((page): page is number => page !== null)

      // Call ChatMock to extract objectives
      const result = await this.chatMockClient.extractLearningObjectives(fullText, {
        courseName: lecture.course.name,
        lectureName: lecture.title,
        pageNumbers: pageNumbers.length > 0 ? pageNumbers : undefined,
      })

      if (result.error) {
        console.warn('ChatMock extraction had error, skipping objectives:', result.error)
        // Don't throw - continue processing without objectives
        return {
          success: true,
          objectivesCount: 0,
        }
      }

      // Save objectives to database with prerequisite mapping
      if (result.objectives && result.objectives.length > 0) {
        // Get existing objectives for prerequisite matching
        const existingObjectives = await prisma.learningObjective.findMany({
          where: { lectureId },
          select: { id: true, objective: true },
        })

        // Create objectives and map prerequisites
        for (const extracted of result.objectives) {
          // Create the objective first
          const objective = await prisma.learningObjective.create({
            data: {
              lectureId,
              objective: extracted.objective,
              complexity: extracted.complexity,
              pageStart: this.parsePageNumber(extracted.pageStart),
              pageEnd: this.parsePageNumber(extracted.pageEnd),
              isHighYield: extracted.isHighYield,
              boardExamTags: extracted.boardExamTags,
              extractedBy: 'gpt-5',
            },
          })

          // Map prerequisites using fuzzy text matching (80% threshold)
          if (extracted.prerequisites && extracted.prerequisites.length > 0) {
            const prerequisiteLinks = extracted.prerequisites
              .map((prereqText) => {
                // Find best matching existing objective
                const matches = existingObjectives
                  .map((existing) => ({
                    id: existing.id,
                    similarity: this.calculateSimilarity(
                      prereqText.toLowerCase(),
                      existing.objective.toLowerCase(),
                    ),
                  }))
                  .filter((match) => match.similarity >= 0.8)
                  .sort((a, b) => b.similarity - a.similarity)

                return matches.length > 0
                  ? {
                      objectiveId: objective.id,
                      prerequisiteId: matches[0].id,
                      strength: matches[0].similarity,
                    }
                  : null
              })
              .filter((link): link is NonNullable<typeof link> => link !== null)

            // Create prerequisite relationships
            if (prerequisiteLinks.length > 0) {
              await prisma.objectivePrerequisite.createMany({
                data: prerequisiteLinks,
                skipDuplicates: true,
              })
            }
          }
        }
      }

      return {
        success: true,
        objectivesCount: result.objectives?.length || 0,
      }
    } catch (error) {
      console.error('Content analysis error:', error)
      // Don't fail the entire processing pipeline if objectives fail
      return {
        success: true, // Continue processing
        objectivesCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Calculate string similarity using Levenshtein distance
   * Returns a value between 0 (no similarity) and 1 (identical)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1

    if (longer.length === 0) {
      return 1.0
    }

    const distance = this.levenshteinDistance(longer, shorter)
    return (longer.length - distance) / longer.length
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = []

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1, // deletion
          )
        }
      }
    }

    return matrix[str2.length][str1.length]
  }
}
