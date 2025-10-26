/**
 * Exams Management Page
 * Story 2.3: Intelligent Content Prioritization Algorithm
 *
 * Manage upcoming exams and their coverage topics
 */

import { Calendar } from 'lucide-react'

// This page fetches dynamic data at request time
export const dynamic = 'force-dynamic'
import { ExamsClient } from './exams-client'

interface Course {
  id: string
  name: string
  code: string
}

interface Exam {
  id: string
  name: string
  date: string
  courseId: string
  coverageTopics: string[]
  course: Course
}

async function getExams(): Promise<Exam[]> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  try {
    const res = await fetch(`${baseUrl}/api/exams`, {
      cache: 'no-store',
    })

    if (!res.ok) {
      throw new Error('Failed to fetch exams')
    }

    const data = await res.json()
    return data.data || []
  } catch (error) {
    console.error('Error fetching exams:', error)
    return []
  }
}

async function getCourses(): Promise<Course[]> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  try {
    const res = await fetch(`${baseUrl}/api/content/courses`, {
      cache: 'no-store',
    })

    if (!res.ok) {
      throw new Error('Failed to fetch courses')
    }

    const data = await res.json()
    return data.data || []
  } catch (error) {
    console.error('Error fetching courses:', error)
    return []
  }
}

export default async function ExamsPage() {
  const [exams, courses] = await Promise.all([getExams(), getCourses()])

  return (
    <div className="min-h-screen bg-card p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-card  rounded-xl shadow-none p-8 border border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-card rounded-xl">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Exam Management</h1>
          </div>
          <p className="text-gray-600 mt-2">
            Track your upcoming exams and coverage topics to help prioritize your learning.
          </p>
        </div>

        {/* Client Component for Interactive List */}
        <ExamsClient exams={exams} courses={courses} />
      </div>
    </div>
  )
}
