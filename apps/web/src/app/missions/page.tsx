import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, Target, CheckCircle2 } from 'lucide-react'
import { prisma } from '@/lib/db'
import Link from 'next/link'

interface MissionListItem {
  id: string
  date: Date
  status: string
  estimatedMinutes: number
  actualMinutes: number | null
  objectives: string
  completedObjectivesCount: number
}

export default async function MissionsPage() {
  // Fetch recent missions (default user: kevy@americano.dev)
  const user = await prisma.user.findUnique({
    where: { email: 'kevy@americano.dev' }
  })

  if (!user) {
    return <div>User not found</div>
  }

  const missions = await prisma.mission.findMany({
    where: { userId: user.id },
    orderBy: { date: 'desc' },
    take: 30 // Last 30 missions
  }) as MissionListItem[]

  const statusColors = {
    PENDING: 'bg-gray-100 text-gray-800 border-gray-200',
    IN_PROGRESS: 'bg-blue-100 text-blue-800 border-blue-200',
    COMPLETED: 'bg-green-100 text-green-800 border-green-200',
    SKIPPED: 'bg-orange-100 text-orange-800 border-orange-200',
  }

  // Calculate statistics
  const totalMissions = missions.length
  const completedMissions = missions.filter(m => m.status === 'COMPLETED').length
  const completionRate = totalMissions > 0 ? (completedMissions / totalMissions) * 100 : 0
  const avgObjectives = missions.length > 0
    ? missions.reduce((sum, m) => {
        try {
          const objectivesStr = m.objectives as string
          if (!objectivesStr) return sum
          const objs = JSON.parse(objectivesStr) as Array<unknown>
          return sum + (Array.isArray(objs) ? objs.length : 0)
        } catch {
          return sum
        }
      }, 0) / missions.length
    : 0

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <Link href="/" className="hover:text-gray-900">Dashboard</Link>
            <span>/</span>
            <span className="text-gray-900">Missions</span>
          </div>
          <h1 className="text-3xl font-heading font-bold text-gray-900 mb-2">
            Mission History
          </h1>
          <p className="text-gray-600">
            Track your daily study missions and progress over time
          </p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-white/80 backdrop-blur-md border-white/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Missions</p>
                  <p className="text-2xl font-bold text-gray-900">{totalMissions}</p>
                </div>
                <Calendar className="w-8 h-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-md border-white/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Completion Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{Math.round(completionRate)}%</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-md border-white/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Avg Objectives</p>
                  <p className="text-2xl font-bold text-gray-900">{avgObjectives.toFixed(1)}</p>
                </div>
                <Target className="w-8 h-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mission List */}
        <Card className="bg-white/80 backdrop-blur-md border-white/20">
          <CardContent className="pt-6">
            {missions.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 mb-1">No missions yet</p>
                <p className="text-sm text-gray-500">Your daily missions will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {missions.map(mission => {
                  let objectives: Array<{
                    objectiveId: string
                    completed: boolean
                  }> = []

                  try {
                    const objectivesStr = mission.objectives as string
                    if (objectivesStr) {
                      objectives = JSON.parse(objectivesStr) as Array<{
                        objectiveId: string
                        completed: boolean
                      }>
                      if (!Array.isArray(objectives)) {
                        objectives = []
                      }
                    }
                  } catch {
                    objectives = []
                  }

                  const completedCount = mission.completedObjectivesCount || objectives.filter(o => o.completed).length
                  const totalCount = objectives.length
                  const rate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

                  return (
                    <Link
                      key={mission.id}
                      href={`/missions/${mission.id}`}
                      className="block border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-medium text-gray-900">
                              {mission.date.toLocaleDateString('en-US', {
                                weekday: 'short',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </h3>
                            <Badge variant="outline" className={statusColors[mission.status as keyof typeof statusColors]}>
                              {mission.status}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1.5">
                              <Target className="w-4 h-4" />
                              {completedCount}/{totalCount} objectives ({Math.round(rate)}%)
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-4 h-4" />
                              {mission.actualMinutes || mission.estimatedMinutes} min
                            </span>
                          </div>

                          {/* Progress Bar */}
                          <div className="mt-3 bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-primary h-full transition-all duration-300"
                              style={{ width: `${rate}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
