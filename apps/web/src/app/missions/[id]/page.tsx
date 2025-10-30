import { Calendar, ArrowLeft, BarChart3, Users } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ObjectiveBreakdown } from '@/components/missions/objective-breakdown'
import { PerformanceMetrics } from '@/components/missions/performance-metrics'
import { prisma } from '@/lib/db'
import { parseObjectives } from '@/lib/mission-utils'

// Force dynamic rendering since this page requires database access
export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function MissionDetailPage({ params }: PageProps) {
  const { id } = await params

  // Fetch mission with related data
  const mission = await prisma.mission.findUnique({
    where: { id },
    include: {
      studySessions: {
        orderBy: { startedAt: 'desc' },
        take: 10,
      },
    },
  })

  if (!mission) {
    notFound()
  }

  // Parse objectives from JSON with error handling
  const objectives = parseObjectives(mission.objectives as string)

  // Fetch full objective details
  const objectiveIds = objectives.map((obj) => obj.objectiveId)
  const fullObjectives = await prisma.learningObjective.findMany({
    where: { id: { in: objectiveIds } },
    include: {
      lecture: {
        include: {
          course: true,
        },
      },
      prerequisites: {
        include: {
          prerequisite: true,
        },
      },
    },
  })

  // Merge objective data
  const enrichedObjectives = objectives.map((obj) => {
    const full = fullObjectives.find((f) => f.id === obj.objectiveId)
    return {
      ...obj,
      objective: full,
    }
  })

  // Calculate metrics
  const completedCount = objectives.filter((o) => o.completed).length

  const statusColors = {
    PENDING: 'bg-gray-100 text-gray-800 border-gray-200',
    IN_PROGRESS: 'bg-blue-100 text-blue-800 border-blue-200',
    COMPLETED: 'bg-green-100 text-green-800 border-green-200',
    SKIPPED: 'bg-orange-100 text-orange-800 border-orange-200',
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-7xl">
        {/* Header with Breadcrumbs */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <Link href="/" className="hover:text-gray-900 transition-colors">
              Dashboard
            </Link>
            <span>/</span>
            <Link href="/missions" className="hover:text-gray-900 transition-colors">
              Missions
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">{mission.date.toLocaleDateString()}</span>
          </div>

          {/* Back Button */}
          <Link href="/missions">
            <Button variant="outline" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Missions
            </Button>
          </Link>

          {/* Title Section */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-heading font-bold text-gray-900 mb-2">
                {mission.date.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </h1>
              <div className="flex items-center gap-3 flex-wrap">
                <Badge variant="outline" className={statusColors[mission.status]}>
                  {mission.status}
                </Badge>
                <span className="text-sm text-gray-600">
                  {completedCount}/{objectives.length} objectives
                </span>
                {mission.successScore && mission.successScore > 0.8 && (
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                    ⭐ High Performance
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="mb-6">
          <PerformanceMetrics
            mission={{
              estimatedMinutes: mission.estimatedMinutes,
              actualMinutes: mission.actualMinutes,
              completedObjectivesCount: completedCount,
              totalObjectives: objectives.length,
              successScore: mission.successScore,
              difficultyRating: mission.difficultyRating,
            }}
            showRecommendations={true}
          />
        </div>

        {/* Objectives Breakdown */}
        <div className="mb-6">
          <ObjectiveBreakdown
            objectives={enrichedObjectives as any}
            completedCount={completedCount}
            showProgress={true}
          />
        </div>

        {/* Study Sessions Section */}
        {mission.studySessions.length > 0 && (
          <Card className="bg-white/80 backdrop-blur-md border-white/20 mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Study Sessions ({mission.studySessions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mission.studySessions.map((session) => (
                  <Link
                    key={session.id}
                    href={`/study/sessions/${session.id}`}
                    className="block border border-gray-100 rounded-lg p-4 hover:bg-gray-50 hover:border-primary/20 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {session.startedAt.toLocaleTimeString()} -{' '}
                          {session.completedAt?.toLocaleTimeString() || 'In Progress'}
                        </p>
                        <p className="text-sm text-gray-600">
                          Duration:{' '}
                          {session.durationMs ? Math.round(session.durationMs / 60000) : 0} minutes
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          session.completedAt
                            ? 'bg-green-100 text-green-800 border-green-200'
                            : 'bg-blue-100 text-blue-800 border-blue-200'
                        }
                      >
                        {session.completedAt ? 'COMPLETED' : 'IN_PROGRESS'}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Link href="/missions" className="flex-1">
            <Button variant="outline" className="w-full">
              View All Missions
            </Button>
          </Link>
          <Link href="/missions/history" className="flex-1">
            <Button variant="outline" className="w-full">
              <Calendar className="w-4 h-4 mr-2" />
              Mission History
            </Button>
          </Link>
          <Link href="/" className="flex-1">
            <Button variant="default" className="w-full">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
