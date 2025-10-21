/**
 * GET /api/first-aid/mappings/[lectureId]
 *
 * Epic 3 - Story 3.3 - Task 3.2: Get First Aid mappings for a lecture
 * AC#3: Caching layer to avoid re-fetching First Aid references on scroll
 */

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/generated/prisma'
import { firstAidCache, type ConceptReference } from '@/lib/first-aid-cache'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lectureId: string }> }
) {
  try {
    const { lectureId } = await params
    const { searchParams } = new URL(request.url)
    const section = searchParams.get('section')
    const position = searchParams.get('position')

    // Generate cache key based on request type
    let cacheKey: string
    if (position) {
      // Position-based caching for scroll optimization
      cacheKey = firstAidCache.generateKey({
        type: 'scroll',
        guidelineId: lectureId,
        position: parseInt(position),
      })
    } else if (section) {
      // Section-specific caching
      cacheKey = firstAidCache.generateKey({
        type: 'guideline',
        guidelineId: lectureId,
        section,
      })
    } else {
      // Full lecture mapping cache
      cacheKey = firstAidCache.generateKey({
        type: 'guideline',
        guidelineId: lectureId,
      })
    }

    // Try to get from cache
    const startTime = performance.now()
    const cachedReferences = firstAidCache.get(cacheKey)

    if (cachedReferences) {
      const cacheHitTime = performance.now() - startTime
      console.log(`✓ Cache hit for ${cacheKey} (${cacheHitTime.toFixed(2)}ms)`)

      // Transform cached references back to API response format
      return NextResponse.json({
        mappings: cachedReferences.map(ref => ({
          id: ref.id,
          confidence: ref.confidence,
          priority: ref.priority,
          rationale: ref.rationale,
          firstAidSection: {
            id: ref.firstAidSectionId,
            edition: ref.edition,
            system: ref.system,
            section: ref.section,
            subsection: ref.subsection,
            pageNumber: ref.pageNumber,
            content: ref.content,
            isHighYield: ref.isHighYield,
            mnemonics: ref.mnemonics,
            clinicalCorrelations: ref.clinicalCorrelations,
          },
          userFeedback: null,
        })),
        confidence: calculateConfidenceLevel(cachedReferences),
        priority: cachedReferences.some(r => r.priority === 'HIGH_YIELD') ? 'high_yield' : 'standard',
        summary: {
          totalMappings: cachedReferences.length,
          avgConfidence: (
            cachedReferences.reduce((sum, r) => sum + r.confidence, 0) / cachedReferences.length
          ).toFixed(3),
          highYieldCount: cachedReferences.filter(r => r.priority === 'HIGH_YIELD').length,
        },
        cached: true,
        cacheHitTime: cacheHitTime.toFixed(2),
      })
    }

    // Cache miss - fetch from database
    console.log(`× Cache miss for ${cacheKey}, fetching from database...`)
    const dbStartTime = performance.now()

    // Get mappings for this lecture
    const mappings = await prisma.lectureFirstAidMapping.findMany({
      where: { lectureId },
      include: {
        firstAidSection: {
          select: {
            id: true,
            edition: true,
            system: true,
            section: true,
            subsection: true,
            pageNumber: true,
            content: true,
            isHighYield: true,
            mnemonics: true,
            clinicalCorrelations: true,
          },
        },
      },
      orderBy: { confidence: 'desc' },
    })

    // Calculate overall confidence level
    const avgConfidence =
      mappings.length > 0
        ? mappings.reduce((sum, m) => sum + m.confidence, 0) / mappings.length
        : 0

    const confidenceLevel: 'high' | 'medium' | 'low' =
      avgConfidence >= 0.75 ? 'high' : avgConfidence >= 0.65 ? 'medium' : 'low'

    const dbFetchTime = performance.now() - dbStartTime

    // Transform to ConceptReference format for caching
    const conceptReferences: ConceptReference[] = mappings.map(m => ({
      id: m.id,
      firstAidSectionId: m.firstAidSection.id,
      edition: m.firstAidSection.edition,
      system: m.firstAidSection.system,
      section: m.firstAidSection.section,
      subsection: m.firstAidSection.subsection,
      pageNumber: m.firstAidSection.pageNumber,
      content: m.firstAidSection.content,
      similarity: m.confidence,
      confidence: m.confidence,
      priority: m.priority as 'HIGH_YIELD' | 'STANDARD' | 'SUGGESTED',
      rationale: m.rationale,
      isHighYield: m.firstAidSection.isHighYield,
      mnemonics: m.firstAidSection.mnemonics,
      clinicalCorrelations: m.firstAidSection.clinicalCorrelations,
    }))

    // Store in cache
    firstAidCache.set(cacheKey, conceptReferences, {
      ttl: position
        ? 30 * 60 * 1000 // 30 min for scroll-based
        : 60 * 60 * 1000, // 1 hour for section/full
      edition: conceptReferences[0]?.edition,
    })

    console.log(`✓ Cached ${conceptReferences.length} references for ${cacheKey} (DB: ${dbFetchTime.toFixed(2)}ms)`)

    // Determine if this lecture has high-yield content
    const hasHighYield = mappings.some(m => m.priority === 'HIGH_YIELD')

    return NextResponse.json({
      mappings: mappings.map(m => ({
        id: m.id,
        confidence: m.confidence,
        priority: m.priority,
        rationale: m.rationale,
        firstAidSection: m.firstAidSection,
        userFeedback: m.userFeedback,
      })),
      confidence: confidenceLevel,
      priority: hasHighYield ? 'high_yield' : 'standard',
      summary: {
        totalMappings: mappings.length,
        avgConfidence: avgConfidence.toFixed(3),
        highYieldCount: mappings.filter(m => m.priority === 'HIGH_YIELD').length,
      },
      cached: false,
      dbFetchTime: dbFetchTime.toFixed(2),
    })
  } catch (error) {
    console.error('Error fetching lecture mappings:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch mappings',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * Calculate confidence level from references
 */
function calculateConfidenceLevel(references: ConceptReference[]): 'high' | 'medium' | 'low' {
  if (references.length === 0) return 'low'

  const avgConfidence =
    references.reduce((sum, r) => sum + r.confidence, 0) / references.length

  return avgConfidence >= 0.75 ? 'high' : avgConfidence >= 0.65 ? 'medium' : 'low'
}
