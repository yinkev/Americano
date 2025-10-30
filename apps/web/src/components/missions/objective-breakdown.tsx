'use client'

import { CheckCircle2, Clock, XCircle, Star, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface Objective {
  objectiveId: string
  objective?: {
    objective: string
    complexity: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED'
    isHighYield: boolean
    bloomLevel?: string
    estimatedDifficultyMinutes?: number
  }
  estimatedMinutes: number
  completed: boolean
  completedAt?: string
  notes?: string
}

interface ObjectiveBreakdownProps {
  objectives: Objective[]
  completedCount: number
  showProgress?: boolean
}

const complexityColors = {
  BASIC: 'bg-green-100 text-green-800 border-green-200',
  INTERMEDIATE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  ADVANCED: 'bg-red-100 text-red-800 border-red-200',
}

export function ObjectiveBreakdown({
  objectives,
  completedCount,
  showProgress = true,
}: ObjectiveBreakdownProps) {
  const completionRate = objectives.length > 0 ? (completedCount / objectives.length) * 100 : 0
  const totalEstimatedTime = objectives.reduce((sum, obj) => sum + obj.estimatedMinutes, 0)
  const completedTime = objectives
    .filter((obj) => obj.completed)
    .reduce((sum, obj) => sum + obj.estimatedMinutes, 0)

  // Group by complexity
  const byComplexity = {
    BASIC: objectives.filter((o) => o.objective?.complexity === 'BASIC'),
    INTERMEDIATE: objectives.filter((o) => o.objective?.complexity === 'INTERMEDIATE'),
    ADVANCED: objectives.filter((o) => o.objective?.complexity === 'ADVANCED'),
  }

  const highYieldCount = objectives.filter((o) => o.objective?.isHighYield).length

  return (
    <Card className="bg-white/80 backdrop-blur-md border-white/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            Objectives Breakdown
          </CardTitle>
          <Badge variant="outline" className="text-sm">
            {completedCount}/{objectives.length} Completed
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        {showProgress && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Overall Progress</span>
              <span className="font-medium text-gray-900">{Math.round(completionRate)}%</span>
            </div>
            <Progress value={completionRate} className="h-3" />
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                {completedTime}min / {totalEstimatedTime}min
              </span>
              <span>{objectives.length - completedCount} remaining</span>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-600 mb-1">Total</p>
            <p className="text-xl font-bold text-gray-900">{objectives.length}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <p className="text-xs text-green-600 mb-1">Completed</p>
            <p className="text-xl font-bold text-green-900">{completedCount}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3">
            <p className="text-xs text-yellow-600 mb-1 flex items-center gap-1">
              <Star className="w-3 h-3" />
              High-Yield
            </p>
            <p className="text-xl font-bold text-yellow-900">{highYieldCount}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-xs text-blue-600 mb-1 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Est. Time
            </p>
            <p className="text-xl font-bold text-blue-900">{totalEstimatedTime}m</p>
          </div>
        </div>

        {/* Complexity Breakdown */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700 mb-3">By Complexity</p>
          <div className="grid grid-cols-3 gap-2">
            {(['BASIC', 'INTERMEDIATE', 'ADVANCED'] as const).map((complexity) => {
              const items = byComplexity[complexity]
              const completed = items.filter((i) => i.completed).length
              const rate = items.length > 0 ? (completed / items.length) * 100 : 0

              return (
                <div key={complexity} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <Badge variant="outline" className={cn('text-xs', complexityColors[complexity])}>
                      {complexity}
                    </Badge>
                    <span className="text-gray-600">
                      {completed}/{items.length}
                    </span>
                  </div>
                  <Progress value={rate} className="h-1.5" />
                </div>
              )
            })}
          </div>
        </div>

        {/* Objectives List */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">All Objectives</p>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {objectives.map((obj, index) => (
              <div
                key={obj.objectiveId}
                className={cn(
                  'border rounded-lg p-4 transition-all duration-200',
                  obj.completed
                    ? 'border-green-200 bg-green-50/50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Status Icon */}
                  <div className="flex-shrink-0 mt-0.5">
                    {obj.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center">
                        <span className="text-xs text-gray-500">{index + 1}</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3
                          className={cn(
                            'font-medium leading-relaxed',
                            obj.completed ? 'text-gray-600 line-through' : 'text-gray-900'
                          )}
                        >
                          {obj.objective?.objective || 'Unknown Objective'}
                        </h3>

                        {/* Tags */}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {obj.objective?.complexity && (
                            <Badge
                              variant="outline"
                              className={cn('text-xs', complexityColors[obj.objective.complexity])}
                            >
                              {obj.objective.complexity}
                            </Badge>
                          )}
                          {obj.objective?.isHighYield && (
                            <Badge
                              variant="outline"
                              className="text-xs bg-yellow-50 text-yellow-800 border-yellow-200"
                            >
                              ⭐ High-Yield
                            </Badge>
                          )}
                          {obj.objective?.bloomLevel && (
                            <Badge variant="outline" className="text-xs">
                              {obj.objective.bloomLevel}
                            </Badge>
                          )}
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {obj.estimatedMinutes} min
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    {obj.notes && (
                      <div className="text-sm bg-gray-50 rounded p-2 mt-2">
                        <span className="font-medium text-gray-700">Notes:</span> {obj.notes}
                      </div>
                    )}

                    {/* Completion Time */}
                    {obj.completedAt && (
                      <div className="text-xs text-gray-500">
                        Completed: {new Date(obj.completedAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
