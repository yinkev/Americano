import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ChatMockClient, type ExtractedObjective } from '@/lib/ai/chatmock-client'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse, ErrorCodes } from '@/lib/api-response'

// Zod validation schema for extraction request
const ExtractionRequestSchema = z.object({
  lectureId: z.string().cuid(),
})

/**
 * POST /api/ai/extract/objectives
 *
 * Extract learning objectives from a lecture's content using ChatMock (GPT-5)
 *
 * Request body:
 * {
 *   "lectureId": "string"  // cuid of the lecture
 * }
 *
 * Response:
 * {
 *   "objectives": LearningObjective[]  // Array of extracted and saved objectives
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const validatedData = ExtractionRequestSchema.parse(body)

    // Fetch lecture with related data
    const lecture = await prisma.lecture.findUnique({
      where: { id: validatedData.lectureId },
      include: {
        course: true,
        contentChunks: {
          orderBy: { chunkIndex: 'asc' },
        },
      },
    })

    if (!lecture) {
      return Response.json(errorResponse(ErrorCodes.NOT_FOUND, 'Lecture not found'), {
        status: 404,
      })
    }

    // Aggregate content from all chunks
    const fullText = lecture.contentChunks.map((chunk) => chunk.content).join('\n\n')

    if (!fullText || fullText.trim().length === 0) {
      return Response.json(
        errorResponse(
          ErrorCodes.VALIDATION_ERROR,
          'No content available for extraction. Please ensure the lecture has been processed.',
        ),
        { status: 400 },
      )
    }

    // Extract page numbers from content chunks
    const pageNumbers = lecture.contentChunks
      .map((chunk) => chunk.pageNumber)
      .filter((page): page is number => page !== null)

    // Initialize ChatMock client and extract objectives
    const chatMockClient = new ChatMockClient()
    const extractionResult = await chatMockClient.extractLearningObjectives(fullText, {
      courseName: lecture.course.name,
      lectureName: lecture.title,
      pageNumbers: pageNumbers.length > 0 ? pageNumbers : undefined,
    })

    if (extractionResult.error) {
      return Response.json(
        errorResponse(
          ErrorCodes.EXTERNAL_SERVICE_ERROR,
          `ChatMock extraction failed: ${extractionResult.error}`,
        ),
        { status: 500 },
      )
    }

    if (extractionResult.objectives.length === 0) {
      console.warn(`No objectives extracted for lecture ${lecture.id}`)
    }

    // Process prerequisites: match prerequisite strings to existing objectives
    const existingObjectives = await prisma.learningObjective.findMany({
      where: { lectureId: lecture.id },
      select: { id: true, objective: true },
    })

    // Create learning objectives in database
    const createdObjectives = await Promise.all(
      extractionResult.objectives.map(async (extracted: ExtractedObjective) => {
        // Create the objective first
        const objective = await prisma.learningObjective.create({
          data: {
            lectureId: lecture.id,
            objective: extracted.objective,
            complexity: extracted.complexity,
            pageStart: extracted.pageStart,
            pageEnd: extracted.pageEnd,
            isHighYield: extracted.isHighYield,
            boardExamTags: extracted.boardExamTags,
            extractedBy: 'gpt-5',
          },
        })

        // Map prerequisites using fuzzy text matching (80% threshold)
        const prerequisiteLinks = extracted.prerequisites
          .map((prereqText) => {
            // Find best matching existing objective
            const matches = existingObjectives
              .map((existing) => ({
                id: existing.id,
                similarity: calculateSimilarity(
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

        return objective
      }),
    )

    // Update lecture processing status
    await prisma.lecture.update({
      where: { id: lecture.id },
      data: {
        processingStatus: 'COMPLETED',
        processedAt: new Date(),
      },
    })

    return Response.json(
      successResponse({
        objectives: createdObjectives,
        stats: {
          extracted: createdObjectives.length,
          highYield: createdObjectives.filter((obj) => obj.isHighYield).length,
          complexityBreakdown: {
            basic: createdObjectives.filter((obj) => obj.complexity === 'BASIC').length,
            intermediate: createdObjectives.filter((obj) => obj.complexity === 'INTERMEDIATE')
              .length,
            advanced: createdObjectives.filter((obj) => obj.complexity === 'ADVANCED').length,
          },
        },
      }),
    )
  } catch (error) {
    console.error('Objective extraction error:', error)

    if (error instanceof z.ZodError) {
      return Response.json(
        errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid request data', error.issues),
        { status: 400 },
      )
    }

    return Response.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to extract learning objectives'),
      { status: 500 },
    )
  }
}

/**
 * Calculate string similarity using Levenshtein distance
 * Returns a value between 0 (no similarity) and 1 (identical)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1

  if (longer.length === 0) {
    return 1.0
  }

  const distance = levenshteinDistance(longer, shorter)
  return (longer.length - distance) / longer.length
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
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
