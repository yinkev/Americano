#!/usr/bin/env tsx

/**
 * Backfill Embeddings Script
 *
 * Generates embeddings for existing ContentChunk records that don't have embeddings.
 * Useful for migrating existing content after embedding feature is deployed.
 *
 * Usage:
 *   pnpm tsx scripts/backfill-embeddings.ts [options]
 *
 * Options:
 *   --dry-run              Show what would be processed without making changes
 *   --lecture-id <id>      Process only a specific lecture
 *   --batch-size <num>     Number of embeddings to process at once (default: 10)
 *   --parallel <num>       Number of lectures to process in parallel (default: 3)
 *   --rate-limit <num>     Max embeddings per minute (default: 50)
 *
 * Epic 3 - Story 3.1 - Task 2.3
 */

import { Prisma } from '../src/generated/prisma'
import { prisma } from '../src/lib/db'
import { EmbeddingBatchJob } from '../src/subsystems/content-processing/embedding-batch-job'

/**
 * CLI options
 */
interface BackfillOptions {
  dryRun: boolean
  lectureId?: string
  batchSize: number
  parallel: number
  rateLimit: number
}

/**
 * Parse command-line arguments
 */
function parseArgs(): BackfillOptions {
  const args = process.argv.slice(2)
  const options: BackfillOptions = {
    dryRun: false,
    batchSize: 10,
    parallel: 3,
    rateLimit: 50,
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]

    switch (arg) {
      case '--dry-run':
        options.dryRun = true
        break
      case '--lecture-id':
        options.lectureId = args[++i]
        break
      case '--batch-size':
        options.batchSize = parseInt(args[++i], 10)
        break
      case '--parallel':
        options.parallel = parseInt(args[++i], 10)
        break
      case '--rate-limit':
        options.rateLimit = parseInt(args[++i], 10)
        break
      case '--help':
      case '-h':
        printHelp()
        process.exit(0)
      default:
        console.error(`Unknown option: ${arg}`)
        printHelp()
        process.exit(1)
    }
  }

  return options
}

/**
 * Print help message
 */
function printHelp(): void {
  console.log(`
Backfill Embeddings Script

Generates embeddings for existing ContentChunk records that don't have embeddings.

Usage:
  pnpm tsx scripts/backfill-embeddings.ts [options]

Options:
  --dry-run              Show what would be processed without making changes
  --lecture-id <id>      Process only a specific lecture
  --batch-size <num>     Number of embeddings to process at once (default: 10)
  --parallel <num>       Number of lectures to process in parallel (default: 3)
  --rate-limit <num>     Max embeddings per minute (default: 50)
  --help, -h             Show this help message

Examples:
  # Dry run to see what would be processed
  pnpm tsx scripts/backfill-embeddings.ts --dry-run

  # Process a specific lecture
  pnpm tsx scripts/backfill-embeddings.ts --lecture-id lec-123

  # Process all lectures with custom batch size
  pnpm tsx scripts/backfill-embeddings.ts --batch-size 20 --parallel 5

  # Conservative rate limiting for production
  pnpm tsx scripts/backfill-embeddings.ts --rate-limit 30
  `)
}

/**
 * Get statistics about missing embeddings
 */
async function getStatistics(lectureId?: string): Promise<{
  totalLectures: number
  totalChunks: number
  lectureDetails: Array<{
    id: string
    title: string
    chunksWithoutEmbeddings: number
  }>
}> {
  const whereClause = lectureId ? { lectureId } : {}

  // Get total chunks without embeddings
  const totalChunks = await prisma.contentChunk.count({
    where: {
      ...whereClause,
      embedding: null,
    } as any, // Type assertion: embedding is Unsupported vector type in Prisma schema
  })

  // Get detailed breakdown by lecture
  const lectureDetails = await prisma.$queryRaw<
    Array<{ id: string; title: string; chunksWithoutEmbeddings: bigint }>
  >`
    SELECT
      l.id,
      l.title,
      COUNT(cc.id) as "chunksWithoutEmbeddings"
    FROM lectures l
    INNER JOIN content_chunks cc ON cc."lectureId" = l.id
    WHERE cc.embedding IS NULL
    ${lectureId ? Prisma.sql`AND l.id = ${lectureId}` : Prisma.empty}
    GROUP BY l.id, l.title
    ORDER BY "chunksWithoutEmbeddings" DESC
  `

  return {
    totalLectures: lectureDetails.length,
    totalChunks,
    lectureDetails: lectureDetails.map((l) => ({
      id: l.id,
      title: l.title,
      chunksWithoutEmbeddings: Number(l.chunksWithoutEmbeddings),
    })),
  }
}

/**
 * Format time duration
 */
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  } else {
    return `${seconds}s`
  }
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  const options = parseArgs()

  console.log('='.repeat(60))
  console.log('Backfill Embeddings Script')
  console.log('='.repeat(60))
  console.log()

  // Display configuration
  console.log('Configuration:')
  console.log(`  Dry run: ${options.dryRun}`)
  console.log(`  Lecture ID: ${options.lectureId || 'all'}`)
  console.log(`  Batch size: ${options.batchSize}`)
  console.log(`  Parallel lectures: ${options.parallel}`)
  console.log(`  Rate limit: ${options.rateLimit} embeddings/minute`)
  console.log()

  // Get statistics
  console.log('Fetching statistics...')
  const stats = await getStatistics(options.lectureId)

  if (stats.totalChunks === 0) {
    console.log(' No chunks missing embeddings. All done!')
    return
  }

  console.log()
  console.log('Statistics:')
  console.log(`  Total lectures: ${stats.totalLectures}`)
  console.log(`  Total chunks without embeddings: ${stats.totalChunks}`)
  console.log()

  // Display lecture breakdown
  if (stats.lectureDetails.length > 0) {
    console.log('Lecture breakdown:')
    stats.lectureDetails.forEach((lecture, index) => {
      console.log(`  ${index + 1}. ${lecture.title} (${lecture.chunksWithoutEmbeddings} chunks)`)
      if (index >= 9 && stats.lectureDetails.length > 10) {
        console.log(`  ... and ${stats.lectureDetails.length - 10} more lectures`)
        return
      }
    })
    console.log()
  }

  // Estimate time
  const estimatedMinutes = Math.ceil(stats.totalChunks / options.rateLimit)
  console.log(`Estimated time: ~${estimatedMinutes} minutes`)
  console.log()

  // Dry run mode
  if (options.dryRun) {
    console.log('DRY RUN MODE: No changes will be made')
    console.log()
    console.log('Would process:')
    console.log(`  ${stats.totalLectures} lectures`)
    console.log(`  ${stats.totalChunks} chunks`)
    console.log()
    console.log('Run without --dry-run to actually process embeddings')
    return
  }

  // Confirmation prompt
  console.log('Press Ctrl+C to cancel, or press Enter to continue...')
  await new Promise<void>((resolve) => {
    process.stdin.once('data', () => resolve())
  })

  console.log()
  console.log('Starting embedding generation...')
  console.log()

  // Run the batch job
  const startTime = Date.now()
  const batchJob = new EmbeddingBatchJob({
    maxParallelLectures: options.parallel,
    embeddingBatchSize: options.batchSize,
  })

  const result = await batchJob.processLecturesWithMissingEmbeddings()

  // Display results
  console.log()
  console.log('='.repeat(60))
  console.log('Results')
  console.log('='.repeat(60))
  console.log()
  console.log(`Lectures processed: ${result.lecturesProcessed}`)
  console.log(`   Success: ${result.successCount}`)
  console.log(`   Failed: ${result.failureCount}`)
  console.log()
  console.log(`Embeddings generated: ${result.embeddingsGenerated}`)
  console.log(`Total time: ${formatDuration(result.totalTimeMs)}`)
  console.log(
    `Average: ${(result.totalTimeMs / result.lecturesProcessed / 1000).toFixed(1)}s per lecture`,
  )
  console.log()

  // Display failures if any
  if (result.failureCount > 0) {
    console.log('Failed lectures:')
    result.lectureResults
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`   ${r.title}: ${r.error}`)
      })
    console.log()
  }

  // Display successes
  if (result.successCount > 0) {
    console.log('Successful lectures:')
    result.lectureResults
      .filter((r) => r.success)
      .slice(0, 10)
      .forEach((r) => {
        console.log(
          `   ${r.title}: ${r.embeddingsGenerated} embeddings (${(r.processingTimeMs / 1000).toFixed(1)}s)`,
        )
      })

    if (result.successCount > 10) {
      console.log(`  ... and ${result.successCount - 10} more`)
    }
    console.log()
  }

  console.log(' Backfill complete!')
}

/**
 * Run the script
 */
main()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error()
    console.error('Error:', error)
    console.error()
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
