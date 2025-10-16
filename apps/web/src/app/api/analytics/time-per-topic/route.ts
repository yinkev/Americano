import type { NextRequest } from 'next/server'
import { withErrorHandler } from '@/lib/api-error'
import { successResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db'

// GET /api/analytics/time-per-topic - Get study time aggregated by topic
export const GET = withErrorHandler(async (request: NextRequest) => {
  // Get user from header (MVP: no auth, user selected in sidebar)
  const userEmail = request.headers.get('X-User-Email') || 'kevy@americano.dev'
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
  })

  if (!user) {
    throw new Error('User not found')
  }

  const userId = user.id

  // Get all completed sessions with their reviews
  const sessions = await prisma.studySession.findMany({
    where: {
      userId,
      completedAt: {
        not: null,
      },
    },
    include: {
      reviews: {
        include: {
          card: {
            include: {
              course: {
                select: {
                  id: true,
                  name: true,
                },
              },
              lecture: {
                select: {
                  id: true,
                  title: true,
                  topicTags: true,
                },
              },
            },
          },
        },
      },
    },
  })

  // Aggregate time by course
  const byCourse: { [key: string]: { name: string; minutes: number; sessions: number } } = {}

  // Aggregate time by lecture
  const byLecture: {
    [key: string]: { title: string; courseName: string; minutes: number; sessions: number }
  } = {}

  // Aggregate time by tag
  const byTag: { [key: string]: { minutes: number; sessions: number } } = {}

  sessions.forEach((session) => {
    const sessionMinutes = Math.round((session.durationMs || 0) / 60000)

    // If session has reviews, distribute time proportionally
    if (session.reviews.length > 0) {
      const timePerReview = sessionMinutes / session.reviews.length

      session.reviews.forEach((review) => {
        const course = review.card.course
        const lecture = review.card.lecture

        // Aggregate by course
        if (course) {
          if (!byCourse[course.id]) {
            byCourse[course.id] = { name: course.name, minutes: 0, sessions: 0 }
          }
          byCourse[course.id].minutes += timePerReview
        }

        // Aggregate by lecture
        if (lecture) {
          if (!byLecture[lecture.id]) {
            byLecture[lecture.id] = {
              title: lecture.title,
              courseName: course?.name || 'Unknown',
              minutes: 0,
              sessions: 0,
            }
          }
          byLecture[lecture.id].minutes += timePerReview

          // Aggregate by topic tags
          lecture.topicTags.forEach((tag) => {
            if (!byTag[tag]) {
              byTag[tag] = { minutes: 0, sessions: 0 }
            }
            byTag[tag].minutes += timePerReview / lecture.topicTags.length
          })
        }
      })
    }
  })

  // Mark sessions counted per course/lecture
  Object.keys(byCourse).forEach((courseId) => {
    const courseSessions = sessions.filter((s) =>
      s.reviews.some((r) => r.card.courseId === courseId),
    )
    byCourse[courseId].sessions = courseSessions.length
  })

  Object.keys(byLecture).forEach((lectureId) => {
    const lectureSessions = sessions.filter((s) =>
      s.reviews.some((r) => r.card.lectureId === lectureId),
    )
    byLecture[lectureId].sessions = lectureSessions.length
  })

  Object.keys(byTag).forEach((tag) => {
    const tagSessions = sessions.filter((s) =>
      s.reviews.some((r) => r.card.lecture?.topicTags.includes(tag)),
    )
    byTag[tag].sessions = tagSessions.length
  })

  // Convert to arrays and round minutes
  const byCourseArray = Object.entries(byCourse).map(([id, data]) => ({
    id,
    name: data.name,
    minutes: Math.round(data.minutes),
    sessions: data.sessions,
  }))

  const byLectureArray = Object.entries(byLecture).map(([id, data]) => ({
    id,
    title: data.title,
    courseName: data.courseName,
    minutes: Math.round(data.minutes),
    sessions: data.sessions,
  }))

  const byTagArray = Object.entries(byTag).map(([tag, data]) => ({
    tag,
    minutes: Math.round(data.minutes),
    sessions: data.sessions,
  }))

  // Sort by time descending
  byCourseArray.sort((a, b) => b.minutes - a.minutes)
  byLectureArray.sort((a, b) => b.minutes - a.minutes)
  byTagArray.sort((a, b) => b.minutes - a.minutes)

  return Response.json(
    successResponse({
      byCourse: byCourseArray,
      byLecture: byLectureArray,
      byTag: byTagArray,
    }),
  )
})
