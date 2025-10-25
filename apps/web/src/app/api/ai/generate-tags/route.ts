// /api/ai/generate-tags
// POST: Generate topic tags for a lecture using GPT-5

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { ChatMockClient } from '@/lib/ai/chatmock-client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { lectureId } = body

    if (!lectureId) {
      return Response.json(
        {
          success: false,
          error: { code: 'MISSING_LECTURE_ID', message: 'Lecture ID is required' },
        },
        { status: 400 },
      )
    }

    // Fetch lecture with content
    const lecture = await prisma.lecture.findUnique({
      where: { id: lectureId },
      include: {
        course: {
          select: {
            name: true,
            code: true,
          },
        },
        contentChunks: {
          select: {
            content: true,
          },
          orderBy: { chunkIndex: 'asc' },
          take: 5, // Sample first 5 chunks to avoid token limits
        },
        learningObjectives: {
          select: {
            objective: true,
          },
          take: 10, // Sample first 10 objectives
        },
      },
    })

    if (!lecture) {
      return Response.json(
        { success: false, error: { code: 'LECTURE_NOT_FOUND', message: 'Lecture not found' } },
        { status: 404 },
      )
    }

    // Prepare context
    const contentSample = lecture.contentChunks
      .map((chunk: { content: string }) => chunk.content)
      .join('\n\n')
      .substring(0, 4000) // Limit to ~4000 chars

    const objectivesSample = lecture.learningObjectives
      .map((obj: { objective: string }) => obj.objective)
      .join('\n')

    // Generate tags using GPT-5
    const client = new ChatMockClient()
    const tags = await generateTopicTags(client, {
      lectureTitle: lecture.title,
      courseName: lecture.course.name,
      courseCode: lecture.course.code || '',
      contentSample,
      objectivesSample,
    })

    return Response.json({
      success: true,
      data: {
        tags,
      },
    })
  } catch (error) {
    console.error('Failed to generate tags:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

    return Response.json(
      {
        success: false,
        error: {
          code: 'GENERATION_FAILED',
          message: 'Failed to generate topic tags',
          details: { error: errorMessage },
        },
      },
      { status: 500 },
    )
  }
}

interface TagGenerationContext {
  lectureTitle: string
  courseName: string
  courseCode: string
  contentSample: string
  objectivesSample: string
}

async function generateTopicTags(
  client: ChatMockClient,
  context: TagGenerationContext,
): Promise<string[]> {
  const systemPrompt = `You are a medical education expert specializing in content categorization and taxonomy.

Your task is to generate concise, relevant topic tags for medical lecture content.

GUIDELINES:
1. Generate 3-8 topic tags (aim for 5-6)
2. Each tag should be 1-3 words maximum
3. Use standard medical terminology
4. Focus on:
   - Anatomical systems (e.g., "Cardiovascular", "Musculoskeletal")
   - Body regions (e.g., "Lower Limb", "Thorax")
   - Medical specialties (e.g., "Anatomy", "Physiology")
   - Key clinical concepts (e.g., "Venous System", "Lymphatic Drainage")
5. Avoid:
   - Generic tags like "Medicine" or "Medical"
   - Redundant tags
   - Tags that are too specific or too broad
6. Prioritize board-exam relevant topics

Return ONLY a JSON array of strings, no other text.

Example: ["Cardiovascular", "Lower Limb", "Anatomy", "Venous Return", "Clinical Correlations"]`

  const userContent = `Course: ${context.courseCode ? `${context.courseCode} - ` : ''}${context.courseName}
Lecture: ${context.lectureTitle}

${context.objectivesSample ? `Learning Objectives:\n${context.objectivesSample}\n\n` : ''}Content Sample:
${context.contentSample}

Generate topic tags for this lecture.`

  const response = await (client as any).client.chat.completions.create({
    model: 'gpt-5',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
    temperature: 0.3,
    max_tokens: 500,
  })

  const content = response.choices[0]?.message?.content

  if (!content) {
    throw new Error('No response from GPT-5')
  }

  // Strip thinking tags if present
  let jsonContent = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()

  // Extract JSON array
  const jsonStart = jsonContent.indexOf('[')
  const jsonEnd = jsonContent.lastIndexOf(']') + 1

  if (jsonStart === -1 || jsonEnd === 0) {
    throw new Error('No JSON array found in response')
  }

  jsonContent = jsonContent.substring(jsonStart, jsonEnd)

  // Parse JSON response
  const tags = JSON.parse(jsonContent)

  if (!Array.isArray(tags)) {
    throw new Error('Response is not an array')
  }

  // Validate and clean tags
  return tags
    .filter((tag: any) => typeof tag === 'string' && tag.length > 0 && tag.length <= 30)
    .map((tag: string) => tag.trim())
    .slice(0, 8) // Max 8 tags
}
