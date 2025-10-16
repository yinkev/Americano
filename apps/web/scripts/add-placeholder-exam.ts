/**
 * Script to add a placeholder exam for testing
 * Run with: npx tsx scripts/add-placeholder-exam.ts
 */

import { prisma } from '../src/lib/db'

async function main() {
  console.log('🔍 Checking for existing courses...')

  const courses = await prisma.course.findMany({
    select: { id: true, name: true, code: true },
    take: 1,
  })

  if (courses.length === 0) {
    console.error('❌ No courses found in database')
    process.exit(1)
  }

  const course = courses[0]
  console.log(`✅ Found course: ${course.name} (${course.code})`)

  // Create placeholder exam
  const exam = await prisma.exam.create({
    data: {
      userId: 'cmgrl1wtd0000v1cloq21m9cg', // kevy@americano.dev
      name: 'PLACEHOLDER - Test Exam (DELETE ME)',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      courseId: course.id,
      coverageTopics: ['test-topic-1', 'test-topic-2', 'placeholder'],
    },
  })

  console.log('✅ Placeholder exam created:')
  console.log(`   ID: ${exam.id}`)
  console.log(`   Name: ${exam.name}`)
  console.log(`   Date: ${exam.date.toLocaleDateString()}`)
  console.log(`   Course: ${course.name}`)
  console.log('\n📝 You can delete this exam from the /settings/exams page')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e.message)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
