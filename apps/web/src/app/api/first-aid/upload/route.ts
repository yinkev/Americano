/**
 * POST /api/first-aid/upload
 *
 * Epic 3 - Story 3.3 - Task 1.1: First Aid PDF Upload API
 *
 * Handles First Aid PDF upload, processing, and copyright validation
 */

import { NextRequest, NextResponse } from 'next/server'
import { firstAidProcessor } from '@/subsystems/content-processing/first-aid-processor'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(request: NextRequest) {
  try {
    // Get form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const edition = formData.get('edition') as string
    const yearStr = formData.get('year') as string

    // Validation
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!edition || !yearStr) {
      return NextResponse.json(
        { error: 'Edition and year are required' },
        { status: 400 }
      )
    }

    const year = parseInt(yearStr, 10)
    if (isNaN(year) || year < 2020 || year > 2030) {
      return NextResponse.json({ error: 'Invalid year' }, { status: 400 })
    }

    // Copyright validation (Task 7.1)
    // For MVP, we trust the user owns the content
    // Production: Add explicit checkbox confirmation
    const userId = 'kevy@americano.dev' // Hardcoded for development (constraint from story context)

    console.log(`\n📚 Receiving First Aid upload:`)
    console.log(`   Edition: ${edition}`)
    console.log(`   Year: ${year}`)
    console.log(`   File: ${file.name} (${file.size} bytes)`)
    console.log(`   User: ${userId}`)

    // Save uploaded file to disk
    const uploadDir = join(process.cwd(), 'uploads', 'first-aid')
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    const fileName = `first-aid-${edition}-${Date.now()}.pdf`
    const filePath = join(uploadDir, fileName)

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    console.log(`✓ File saved to: ${filePath}`)

    // Process First Aid PDF
    const result = await firstAidProcessor.processFirstAidPDF({
      userId,
      edition,
      year,
      pdfPath: filePath,
      generateEmbeddings: true,
      validateCopyright: true,
    })

    if (result.processingStatus === 'FAILED') {
      return NextResponse.json(
        {
          error: 'Processing failed',
          details: result.errors,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      firstAidId: result.firstAidEditionId,
      processingStatus: result.processingStatus,
      sectionsCount: result.sectionCount,
      highYieldCount: result.highYieldCount,
      errors: result.errors,
    })
  } catch (error) {
    console.error('First Aid upload error:', error)
    return NextResponse.json(
      {
        error: 'Upload failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
