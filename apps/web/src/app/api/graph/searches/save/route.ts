/**
 * Save Search API Route
 * Story 3.6 Task 3.2: Build saved search API endpoints
 *
 * POST /api/graph/searches/save
 * Body: { name, query, filters, alertEnabled, alertFrequency }
 *
 * Creates or updates a saved search with optional alert configuration
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { AlertFrequency } from '@/generated/prisma'

/**
 * Request body validation schema
 */
const SaveSearchSchema = z.object({
  name: z.string().min(1).max(200),
  query: z.string().min(1).max(500),
  filters: z.object({
    courseIds: z.array(z.string()).optional(),
    dateRange: z.object({
      start: z.string(),
      end: z.string(),
    }).optional(),
    contentTypes: z.array(z.string()).optional(),
    minSimilarity: z.number().min(0).max(1).optional(),
  }).optional(),
  alertEnabled: z.boolean().default(false),
  alertFrequency: z.enum(['IMMEDIATE', 'DAILY', 'WEEKLY']).default('IMMEDIATE'),
})

/**
 * POST handler - Save a new search
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()

    // Validate input
    const validation = SaveSearchSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request body',
          details: validation.error.issues,
        },
        { status: 400 }
      )
    }

    const { name, query, filters, alertEnabled, alertFrequency } = validation.data

    // TODO: Get userId from auth session
    // For MVP, using hardcoded user
    const userId = 'kevy@americano.dev'

    // Create saved search
    const savedSearch = await prisma.savedSearch.create({
      data: {
        userId,
        name,
        query,
        filters: filters || {},
        alertEnabled,
        alertFrequency: alertFrequency as AlertFrequency,
      },
    })

    return NextResponse.json(
      {
        success: true,
        savedSearch: {
          id: savedSearch.id,
          name: savedSearch.name,
          query: savedSearch.query,
          filters: savedSearch.filters,
          alertEnabled: savedSearch.alertEnabled,
          alertFrequency: savedSearch.alertFrequency,
          createdAt: savedSearch.createdAt,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Save search API error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save search',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
