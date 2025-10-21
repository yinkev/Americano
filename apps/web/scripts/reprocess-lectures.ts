#!/usr/bin/env tsx
/**
 * Reprocess existing lectures to extract learning objectives
 * Run with: npx tsx scripts/reprocess-lectures.ts
 */

import { prisma } from '../src/lib/db'
import { ProcessingOrchestrator } from '../src/subsystems/content-processing/processing-orchestrator'

async function reprocessLectures() {
  console.log('🔄 Starting lecture reprocessing...\n')

  // Get all completed lectures without learning objectives
  const lectures = await prisma.lecture.findMany({
    where: {
      processingStatus: 'COMPLETED',
    },
    include: {
      _count: {
        select: {
          learningObjectives: true,
        },
      },
    },
  })

  const lecturesNeedingReprocess = lectures.filter((l) => l._count.learningObjectives === 0)

  console.log(`Found ${lecturesNeedingReprocess.length} lectures needing reprocessing:\n`)

  for (const lecture of lecturesNeedingReprocess) {
    console.log(`📄 ${lecture.title}`)
  }

  console.log('\n🚀 Starting reprocessing...\n')

  const orchestrator = new ProcessingOrchestrator()

  for (const lecture of lecturesNeedingReprocess) {
    console.log(`\n⏳ Processing: ${lecture.title}`)

    try {
      const result = await orchestrator.processLecture(lecture.id)

      if (result.success) {
        console.log(`✅ Success: ${lecture.title}`)
      } else {
        console.log(`❌ Failed: ${lecture.title} - ${result.error}`)
      }
    } catch (error) {
      console.error(`❌ Error processing ${lecture.title}:`, error)
    }
  }

  console.log('\n✨ Reprocessing complete!\n')

  // Show results
  const updatedLectures = await prisma.lecture.findMany({
    include: {
      _count: {
        select: {
          learningObjectives: true,
        },
      },
    },
  })

  console.log('📊 Final results:')
  for (const lecture of updatedLectures) {
    console.log(`  - ${lecture.title}: ${lecture._count.learningObjectives} objectives`)
  }

  await prisma.$disconnect()
}

reprocessLectures().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
