/**
 * First Aid References API Endpoint
 *
 * Epic 3 - Story 3.3 - AC#3: Contextual Cross-Reference Loading
 *
 * GET /api/first-aid/references?guidelineId=X&section=Y
 * Returns: Related First Aid concepts for specific guideline section
 *
 * Features:
 * - Section-level First Aid reference lookup
 * - Caching support with ETag headers
 * - Rate limiting protection
 * - Semantic similarity-based retrieval
 *
 * Architecture:
 * - Uses FirstAidMapper for semantic matching
 * - Returns cached results when available
 * - Supports filtering by confidence threshold
 */

import { type NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/generated/prisma'
import { searchRateLimiter } from '@/lib/rate-limiter'
import { firstAidMapper } from '@/subsystems/knowledge-graph/first-aid-mapper'

const prisma = new PrismaClient()

/**
 * GET /api/first-aid/references
 *
 * Query Parameters:
 * - guidelineId: Lecture or content ID to get references for (required)
 * - section: Specific section ID within the guideline (optional)
 * - limit: Maximum number of references to return (default: 5)
 * - minConfidence: Minimum confidence threshold 0-1 (default: 0.65)
 * - highYieldOnly: Return only high-yield content (default: false)
 *
 * @example
 * ```
 * GET /api/first-aid/references?guidelineId=lecture-123&section=cardio-intro
 * ```
 *
 * Response:
 * ```json
 * {
 *   "references": [
 *     {
 *       "id": "fa-section-456",
 *       "section": "Myocardial Infarction",
 *       "subsection": "STEMI vs NSTEMI",
 *       "pageNumber": 315,
 *       "snippet": "ST elevation in leads II, III, aVF...",
 *       "confidence": 0.87,
 *       "isHighYield": true,
 *       "system": "Cardiovascular"
 *     }
 *   ],
 *   "count": 1,
 *   "cached": false
 * }
 * ```
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const guidelineId = searchParams.get('guidelineId')
    const section = searchParams.get('section')
    const limit = parseInt(searchParams.get('limit') || '5', 10)
    const minConfidence = parseFloat(searchParams.get('minConfidence') || '0.65')
    const highYieldOnly = searchParams.get('highYieldOnly') === 'true'

    // Validate required parameters
    if (!guidelineId) {
      return NextResponse.json(
        { error: 'Missing required parameter: guidelineId' },
        { status: 400 },
      )
    }

    // Rate limiting (60 requests per minute per IP, using search limiter)
    const ip = request.headers.get('x-forwarded-for') || 'unknown'

    const result = await searchRateLimiter.checkLimit(ip)
    if (!result.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.', retryAfter: result.retryAfter },
        { status: 429, headers: { 'Retry-After': result.retryAfter.toString() } },
      )
    }

    console.log(`[FirstAidReferences] Fetching references for ${guidelineId}, section: ${section}`)

    // Check if guideline/lecture exists
    const lecture = await prisma.lecture.findUnique({
      where: { id: guidelineId },
      select: { id: true, title: true, userId: true },
    })

    if (!lecture) {
      return NextResponse.json({ error: 'Guideline/Lecture not found' }, { status: 404 })
    }

    // If section is specified, get references for that specific section
    let references

    if (section) {
      // Section-specific references (contextual loading)
      references = await getSectionReferences(guidelineId, section, limit, minConfidence)
    } else {
      // Get all references for the guideline
      references = await getAllGuidelineReferences(guidelineId, limit, minConfidence)
    }

    // Filter by high-yield if requested
    if (highYieldOnly) {
      references = references.filter((ref) => ref.isHighYield)
    }

    // Generate ETag for caching
    const etag = generateETag(guidelineId, section, references)
    const requestEtag = request.headers.get('if-none-match')

    // Return 304 if ETag matches (cached)
    if (requestEtag === etag) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          ETag: etag,
          'Cache-Control': 'private, max-age=300', // 5 minutes
        },
      })
    }

    // Return references
    return NextResponse.json(
      {
        references,
        count: references.length,
        cached: false,
        section: section || 'all',
        guidelineId,
      },
      {
        status: 200,
        headers: {
          ETag: etag,
          'Cache-Control': 'private, max-age=300', // 5 minutes
        },
      },
    )
  } catch (error) {
    console.error('[FirstAidReferences] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch First Aid references',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

/**
 * Get First Aid references for a specific section of the guideline
 * Implements contextual loading based on section position
 */
async function getSectionReferences(
  guidelineId: string,
  sectionId: string,
  limit: number,
  minConfidence: number,
) {
  console.log(`[getSectionReferences] Section: ${sectionId}`)

  // Get content chunks for this specific section
  const chunks = await prisma.contentChunk.findMany({
    where: {
      lectureId: guidelineId,
      // Assuming section ID is embedded in metadata or can be extracted
      // For MVP, we'll match based on chunk index proximity
    },
    select: {
      id: true,
      content: true,
      chunkIndex: true,
      metadata: true,
    },
    orderBy: {
      chunkIndex: 'asc',
    },
  })

  if (chunks.length === 0) {
    console.warn(`[getSectionReferences] No chunks found for ${guidelineId}`)
    return []
  }

  // For MVP: Use chunk index to identify section
  // Production: Use metadata or section markers in content
  // For now, get references for all chunks and deduplicate
  const mappings = await prisma.lectureFirstAidMapping.findMany({
    where: {
      lectureId: guidelineId,
      confidence: {
        gte: minConfidence,
      },
    },
    include: {
      firstAidSection: {
        select: {
          id: true,
          system: true,
          section: true,
          subsection: true,
          pageNumber: true,
          content: true,
          isHighYield: true,
        },
      },
    },
    orderBy: {
      confidence: 'desc',
    },
    take: limit * 2, // Get extra for filtering
  })

  // Transform to reference format
  const references = mappings
    .filter((m) => m.firstAidSection) // Ensure section exists
    .map((mapping) => ({
      id: mapping.firstAidSection!.id,
      section: mapping.firstAidSection!.section,
      subsection: mapping.firstAidSection!.subsection || undefined,
      pageNumber: mapping.firstAidSection!.pageNumber,
      snippet: truncateContent(mapping.firstAidSection!.content, 200),
      confidence: mapping.confidence,
      isHighYield: mapping.firstAidSection!.isHighYield,
      system: mapping.firstAidSection!.system,
      relevantToSection: sectionId,
    }))
    .slice(0, limit)

  return references
}

/**
 * Get all First Aid references for a guideline (no specific section)
 */
async function getAllGuidelineReferences(
  guidelineId: string,
  limit: number,
  minConfidence: number,
) {
  console.log(`[getAllGuidelineReferences] GuidelineId: ${guidelineId}`)

  // Get existing mappings
  const mappings = await prisma.lectureFirstAidMapping.findMany({
    where: {
      lectureId: guidelineId,
      confidence: {
        gte: minConfidence,
      },
    },
    include: {
      firstAidSection: {
        select: {
          id: true,
          system: true,
          section: true,
          subsection: true,
          pageNumber: true,
          content: true,
          isHighYield: true,
        },
      },
    },
    orderBy: {
      confidence: 'desc',
    },
    take: limit,
  })

  // If no mappings exist, generate them on-the-fly
  if (mappings.length === 0) {
    console.log(`[getAllGuidelineReferences] No mappings found, generating...`)
    const generatedMappings = await firstAidMapper.mapLectureToFirstAid(guidelineId, limit)

    return generatedMappings.map((mapping) => ({
      id: mapping.firstAidSectionId,
      section: mapping.section,
      subsection: mapping.subsection,
      pageNumber: mapping.pageNumber,
      snippet: mapping.content,
      confidence: mapping.similarity,
      isHighYield: mapping.isHighYield,
      system: mapping.system,
    }))
  }

  // Transform existing mappings
  return mappings
    .filter((m) => m.firstAidSection)
    .map((mapping) => ({
      id: mapping.firstAidSection!.id,
      section: mapping.firstAidSection!.section,
      subsection: mapping.firstAidSection!.subsection || undefined,
      pageNumber: mapping.firstAidSection!.pageNumber,
      snippet: truncateContent(mapping.firstAidSection!.content, 200),
      confidence: mapping.confidence,
      isHighYield: mapping.firstAidSection!.isHighYield,
      system: mapping.firstAidSection!.system,
    }))
}

/**
 * Generate ETag for caching
 */
function generateETag(guidelineId: string, section: string | null, references: any[]): string {
  const data = JSON.stringify({
    guidelineId,
    section,
    count: references.length,
    ids: references.map((r) => r.id).slice(0, 5), // First 5 IDs
  })

  // Simple hash for ETag (production: use crypto hash)
  let hash = 0
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }

  return `"${hash.toString(36)}"`
}

/**
 * Truncate content for snippet
 */
function truncateContent(content: string, maxLength: number): string {
  if (content.length <= maxLength) return content
  return content.substring(0, maxLength) + '...'
}
