/**
 * GET /api/first-aid/sections
 *
 * Epic 3 - Story 3.3 - Task 4.2: List First Aid sections with filtering
 */

import { type NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/generated/prisma'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const edition = searchParams.get('edition')
    const system = searchParams.get('system')
    const isHighYieldStr = searchParams.get('isHighYield')
    const limitStr = searchParams.get('limit') || '50'
    const offsetStr = searchParams.get('offset') || '0'

    const limit = parseInt(limitStr, 10)
    const offset = parseInt(offsetStr, 10)
    const isHighYield =
      isHighYieldStr === 'true' ? true : isHighYieldStr === 'false' ? false : undefined

    // Build where clause
    const where: any = {
      userId: 'kevy@americano.dev', // Hardcoded for development
    }

    if (edition) {
      where.edition = edition
    }

    if (system) {
      where.system = system
    }

    if (isHighYield !== undefined) {
      where.isHighYield = isHighYield
    }

    // Get sections with pagination
    const [sections, total] = await Promise.all([
      prisma.firstAidSection.findMany({
        where,
        select: {
          id: true,
          edition: true,
          year: true,
          system: true,
          section: true,
          subsection: true,
          pageNumber: true,
          content: true,
          isHighYield: true,
          mnemonics: true,
          clinicalCorrelations: true,
          createdAt: true,
        },
        orderBy: [{ system: 'asc' }, { pageNumber: 'asc' }],
        skip: offset,
        take: limit,
      }),
      prisma.firstAidSection.count({ where }),
    ])

    return NextResponse.json({
      sections,
      total,
      pagination: {
        limit,
        offset,
        hasNext: offset + limit < total,
        hasPrevious: offset > 0,
      },
    })
  } catch (error) {
    console.error('Error fetching First Aid sections:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch sections',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
