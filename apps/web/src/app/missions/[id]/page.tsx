import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, Target, TrendingUp, CheckCircle2, XCircle, BarChart3 } from 'lucide-react'
import { prisma } from '@/lib/db'
import Link from 'next/link'

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
        take: 10
      }
    }
  })

  if (!mission) {
    notFound()
  }

  // Parse objectives from JSON
  const objectives = JSON.parse(mission.objectives as string) as Array<{
    objectiveId: string
    estimatedMinutes: number
    completed: boolean
    completedAt?: string
    notes?: string
  }>

  // Fetch full objective details
  const objectiveIds = objectives.map(obj => obj.objectiveId)
  const fullObjectives = await prisma.learningObjective.findMany({
    where: { id: { in: objectiveIds } },
    include: {
      lecture: {
        include: {
          course: true
        }
      },
      prerequisites: {
        include: {
          prerequisite: true
        }
      }
    }
  })

  // Merge objective data
  const enrichedObjectives = objectives.map(obj => {
    const full = fullObjectives.find(f => f.id === obj.objectiveId)
    return {
      ...obj,
      objective: full
    }
  })

  // Calculate metrics
  const completedCount = objectives.filter(o => o.completed).length
  const completionRate = objectives.length > 0 ? (completedCount / objectives.length) * 100 : 0
  const timeAccuracy = mission.actualMinutes && mission.estimatedMinutes
    ? (mission.actualMinutes / mission.estimatedMinutes) * 100
    : null

  const statusColors = {
    PENDING: 'bg-gray-100 text-gray-800 border-gray-200',
    IN_PROGRESS: 'bg-blue-100 text-blue-800 border-blue-200',
    COMPLETED: 'bg-green-100 text-green-800 border-green-200',
    SKIPPED: 'bg-orange-100 text-orange-800 border-orange-200',
  }

  const complexityColors = {
    BASIC: 'bg-green-100 text-green-800 border-green-200',
    INTERMEDIATE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    ADVANCED: 'bg-red-100 text-red-800 border-red-200',
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <Link href="/" className="hover:text-gray-900">Dashboard</Link>
            <span>/</span>
            <Link href="/missions" className="hover:text-gray-900">Missions</Link>
            <span>/</span>
            <span className="text-gray-900">{mission.date.toLocaleDateString()}</span>
          </div>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-heading font-bold text-gray-900 mb-2">
                Mission: {mission.date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </h1>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className={statusColors[mission.status]}>
                  {mission.status}
                </Badge>
                <span className="text-sm text-gray-600">
                  {completedCount}/{objectives.length} objectives completed
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-white/80 backdrop-blur-md border-white/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Completion Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{Math.round(completionRate)}%</p>
                </div>
                <Target className="w-8 h-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-md border-white/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Time Spent</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {mission.actualMinutes || mission.estimatedMinutes} min
                  </p>
                </div>
                <Clock className="w-8 h-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-md border-white/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Time Accuracy</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {timeAccuracy ? `${Math.round(timeAccuracy)}%` : 'N/A'}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Objectives Section */}
        <Card className="bg-white/80 backdrop-blur-md border-white/20 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Objectives
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {enrichedObjectives.map((obj, index) => (
                <div key={obj.objectiveId} className="border border-gray-100 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      {obj.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 mb-1">
                            {index + 1}. {obj.objective?.objective || 'Unknown Objective'}
                          </h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            {obj.objective?.complexity && (
                              <Badge variant="outline" className={`text-xs ${complexityColors[obj.objective.complexity]}`}>
                                {obj.objective.complexity}
                              </Badge>
                            )}
                            {obj.objective?.isHighYield && (
                              <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-800 border-yellow-200">
                                ⭐ High-Yield
                              </Badge>
                            )}
                            <span className="text-xs text-gray-500">{obj.estimatedMinutes} minutes</span>
                          </div>
                        </div>
                      </div>

                      {/* Objective Details */}
                      {obj.objective && (
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>
                            <span className="font-medium">Source:</span>{' '}
                            {obj.objective.lecture?.course?.name} - {obj.objective.lecture ? 'Lecture' : 'Unknown'}
                          </p>
                          {obj.objective.prerequisites.length > 0 && (
                            <p>
                              <span className="font-medium">Prerequisites:</span>{' '}
                              {obj.objective.prerequisites.map(p => p.prerequisite.objective).join(', ')}
                            </p>
                          )}
                        </div>
                      )}

                      {obj.notes && (
                        <div className="text-sm bg-gray-50 rounded p-2 mt-2">
                          <span className="font-medium text-gray-700">Notes:</span> {obj.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Study Sessions Section */}
        {mission.studySessions.length > 0 && (
          <Card className="bg-white/80 backdrop-blur-md border-white/20 mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Study Sessions ({mission.studySessions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mission.studySessions.map(session => (
                  <Link
                    key={session.id}
                    href={`/study/sessions/${session.id}`}
                    className="block border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {session.startedAt.toLocaleTimeString()} - {session.completedAt?.toLocaleTimeString() || 'In Progress'}
                        </p>
                        <p className="text-sm text-gray-600">
                          Duration: {session.durationMs ? Math.round(session.durationMs / 60000) : 0} minutes
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
                        {session.completedAt ? 'COMPLETED' : 'IN_PROGRESS'}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mission Insights */}
        <Card className="bg-white/80 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Mission Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {timeAccuracy && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700">Time Estimation Accuracy</span>
                  <span className="font-medium text-gray-900">
                    Estimated {mission.estimatedMinutes}min, actual {mission.actualMinutes}min ({Math.round(timeAccuracy)}% accurate)
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">Completion Rate</span>
                <span className="font-medium text-gray-900">
                  {Math.round(completionRate)}% ({completedCount}/{objectives.length} objectives completed)
                </span>
              </div>

              {completionRate < 100 && mission.status !== 'SKIPPED' && (
                <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                  💡 <span className="font-medium">Recommendation:</span>{' '}
                  {completionRate < 50
                    ? 'Consider shorter missions or extending study time for better completion rates.'
                    : 'Great progress! Complete the remaining objectives when time allows.'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <Button asChild variant="outline">
            <Link href="/">Back to Dashboard</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/missions">View All Missions</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
