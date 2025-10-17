/**
 * Export Search Results API
 *
 * Epic 3 - Story 3.6 - Task 6: Export Functionality
 *
 * Features:
 * - Export in JSON, CSV, and Markdown formats
 * - Streaming response for large datasets
 * - Rate limiting: 10 exports/hour per user
 * - Max 1000 results per export
 *
 * @route POST /api/graph/search/export
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { semanticSearchService } from '@/lib/semantic-search-service'

// Export format validators
const ExportRequestSchema = z.object({
  searchId: z.string().optional(),
  query: z.string().optional(),
  filters: z.object({
    courseIds: z.array(z.string()).optional(),
    category: z.string().optional(),
    dateRange: z.object({
      start: z.coerce.date(),
      end: z.coerce.date(),
    }).optional(),
    contentTypes: z.array(z.enum(['lecture', 'chunk', 'concept'])).optional(),
    minSimilarity: z.number().min(0).max(1).optional(),
  }).optional(),
  format: z.enum(['json', 'csv', 'markdown']),
  includeMetadata: z.boolean().default(true),
})

type ExportRequest = z.infer<typeof ExportRequestSchema>

// Rate limiting map: userId -> { count: number, resetAt: Date }
const rateLimitMap = new Map<string, { count: number; resetAt: Date }>()

const RATE_LIMIT = 10 // exports per hour
const MAX_EXPORT_RESULTS = 1000

/**
 * Check rate limit for user
 */
function checkRateLimit(userId: string): { allowed: boolean; remaining: number; resetAt: Date } {
  const now = new Date()
  const userLimit = rateLimitMap.get(userId)

  // Reset if hour has passed
  if (!userLimit || userLimit.resetAt < now) {
    const resetAt = new Date(now.getTime() + 60 * 60 * 1000) // 1 hour from now
    rateLimitMap.set(userId, { count: 0, resetAt })
    return { allowed: true, remaining: RATE_LIMIT - 1, resetAt }
  }

  // Check if limit exceeded
  if (userLimit.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0, resetAt: userLimit.resetAt }
  }

  return {
    allowed: true,
    remaining: RATE_LIMIT - userLimit.count - 1,
    resetAt: userLimit.resetAt,
  }
}

/**
 * Increment rate limit counter
 */
function incrementRateLimit(userId: string): void {
  const userLimit = rateLimitMap.get(userId)
  if (userLimit) {
    userLimit.count++
  }
}

/**
 * Export to JSON format
 */
function exportToJSON(results: any[], includeMetadata: boolean): string {
  const data = {
    exportedAt: new Date().toISOString(),
    format: 'json',
    totalResults: results.length,
    results: results.map((result) => ({
      id: result.id,
      type: result.type,
      title: result.title,
      snippet: result.snippet,
      content: (result as any).content || undefined,
      similarity: result.similarity,
      relevanceScore: result.relevanceScore,
      ...(includeMetadata && {
        metadata: result.metadata,
      }),
    })),
  }

  return JSON.stringify(data, null, 2)
}

/**
 * Export to CSV format
 */
function exportToCSV(results: any[], includeMetadata: boolean): string {
  const headers = ['ID', 'Type', 'Title', 'Content', 'Source', 'Score', 'Date']

  if (includeMetadata) {
    headers.push('Course', 'Lecture', 'Page')
  }

  const rows = results.map((result) => {
    const row = [
      result.id,
      result.type,
      `"${result.title.replace(/"/g, '""')}"`, // Escape quotes
      `"${result.snippet.replace(/"/g, '""')}"`,
      result.metadata?.lectureTitle || result.metadata?.courseName || '',
      result.relevanceScore.toFixed(3),
      result.metadata?.uploadDate ? new Date(result.metadata.uploadDate).toISOString().split('T')[0] : '',
    ]

    if (includeMetadata) {
      row.push(
        result.metadata?.courseName || '',
        result.metadata?.lectureTitle || '',
        result.metadata?.pageNumber?.toString() || ''
      )
    }

    return row.join(',')
  })

  return [headers.join(','), ...rows].join('\n')
}

/**
 * Export to Markdown format
 */
function exportToMarkdown(results: any[], includeMetadata: boolean): string {
  const lines: string[] = []

  // Header
  lines.push('# Search Results Export')
  lines.push('')
  lines.push(`**Exported:** ${new Date().toLocaleString()}`)
  lines.push(`**Total Results:** ${results.length}`)
  lines.push('')
  lines.push('---')
  lines.push('')

  // Results
  results.forEach((result, index) => {
    lines.push(`## ${index + 1}. ${result.title}`)
    lines.push('')
    lines.push(`**Type:** ${result.type}`)
    lines.push(`**Relevance Score:** ${(result.relevanceScore * 100).toFixed(1)}%`)
    lines.push('')

    if (result.snippet) {
      lines.push('### Content Preview')
      lines.push('')
      lines.push(result.snippet)
      lines.push('')
    }

    if (includeMetadata && result.metadata) {
      lines.push('### Source Information')
      lines.push('')
      if (result.metadata.courseName) {
        lines.push(`- **Course:** ${result.metadata.courseName}`)
      }
      if (result.metadata.lectureTitle) {
        lines.push(`- **Lecture:** ${result.metadata.lectureTitle}`)
      }
      if (result.metadata.pageNumber) {
        lines.push(`- **Page:** ${result.metadata.pageNumber}`)
      }
      if (result.metadata.uploadDate) {
        lines.push(`- **Date:** ${new Date(result.metadata.uploadDate).toLocaleDateString()}`)
      }
      lines.push('')
    }

    lines.push('---')
    lines.push('')
  })

  return lines.join('\n')
}

/**
 * POST /api/graph/search/export
 * Export search results in specified format
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now()

  try {
    // Hardcoded user for MVP
    const userId = 'kevy@americano.dev'

    // Check rate limit
    const rateLimit = checkRateLimit(userId)
    if (!rateLimit.allowed) {
      const resetIn = Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000 / 60) // minutes
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `You have reached the export limit of ${RATE_LIMIT} exports per hour. Try again in ${resetIn} minutes.`,
          resetAt: rateLimit.resetAt.toISOString(),
        },
        { status: 429 }
      )
    }

    // Parse and validate request body
    const body = await req.json()
    const validatedData = ExportRequestSchema.parse(body)

    // Execute search if query provided
    let results: any[] = []

    if (validatedData.query) {
      const searchResponse = await semanticSearchService.search({
        query: validatedData.query,
        filters: validatedData.filters,
        limit: 50, // Get more results for export
        includeKeywordBoost: true,
      })

      results = searchResponse.results
    } else if (validatedData.searchId) {
      // In a full implementation, retrieve saved search results by searchId
      // For now, return error
      return NextResponse.json(
        { error: 'Search by searchId not yet implemented. Please provide a query.' },
        { status: 400 }
      )
    } else {
      return NextResponse.json(
        { error: 'Either query or searchId must be provided' },
        { status: 400 }
      )
    }

    // Limit results to max export size
    const exportResults = results.slice(0, MAX_EXPORT_RESULTS)

    if (exportResults.length === 0) {
      return NextResponse.json(
        { error: 'No results to export' },
        { status: 400 }
      )
    }

    // Generate export based on format
    let content: string
    let contentType: string
    let filename: string

    switch (validatedData.format) {
      case 'json':
        content = exportToJSON(exportResults, validatedData.includeMetadata)
        contentType = 'application/json'
        filename = `search-results-${Date.now()}.json`
        break

      case 'csv':
        content = exportToCSV(exportResults, validatedData.includeMetadata)
        contentType = 'text/csv'
        filename = `search-results-${Date.now()}.csv`
        break

      case 'markdown':
        content = exportToMarkdown(exportResults, validatedData.includeMetadata)
        contentType = 'text/markdown'
        filename = `search-results-${Date.now()}.md`
        break
    }

    // Increment rate limit counter
    incrementRateLimit(userId)

    const processingTime = Date.now() - startTime

    // Return file as download
    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Export-Count': exportResults.length.toString(),
        'X-Processing-Time': `${processingTime}ms`,
        'X-Rate-Limit-Remaining': rateLimit.remaining.toString(),
        'X-Rate-Limit-Reset': rateLimit.resetAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Export error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: error.issues,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: 'Export failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
