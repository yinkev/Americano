'use client'

/**
 * Priorities Client Component
 * Story 2.3: Intelligent Content Prioritization Algorithm
 *
 * Interactive list of prioritized learning objectives
 */

import { BookOpen, Clock, Info, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

interface PriorityObjective {
  id: string
  title: string
  description: string
  complexity: string
  estimatedMinutes: number
  courseId: string
  course: {
    id: string
    name: string
    code: string
  }
  priorityScore: number
  priorityExplanation: {
    objectiveId: string
    priorityScore: number
    factors: Array<{
      name: string
      value: number
      weight: number
      contribution: number
      explanation: string
    }>
    reasoning: string
    recommendations: string[]
    visualIndicator: string
  }
}

interface PrioritiesClientProps {
  priorities: PriorityObjective[]
}

export function PrioritiesClient({ priorities }: PrioritiesClientProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (priorities.length === 0) {
    return (
      <Card className="bg-white/80 backdrop-blur-md border-white/20 shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-2xl">
        <CardContent className="p-12 text-center">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No prioritized objectives available</p>
          <p className="text-gray-500 text-sm mt-2">
            Add some exams and complete assessments to see personalized recommendations
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {priorities.map((item, index) => {
        const isExpanded = expandedId === item.id
        const priorityPercent = Math.round(item.priorityScore * 100)

        return (
          <Card
            key={item.id}
            className="bg-white/80 backdrop-blur-md border-white/20 shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-2xl transition-all duration-200 hover:shadow-[0_12px_40px_rgba(31,38,135,0.15)]"
          >
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/60 text-sm font-bold text-gray-700">
                      {index + 1}
                    </div>
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      {item.title}
                    </CardTitle>
                  </div>
                  <CardDescription className="text-sm text-gray-600">
                    {item.course.code} - {item.course.name}
                  </CardDescription>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant="secondary" className="bg-white/60 text-gray-700 border-gray-200">
                    {item.priorityExplanation.visualIndicator}
                  </Badge>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">{priorityPercent}%</div>
                    <div className="text-xs text-gray-500">Priority</div>
                  </div>
                </div>
              </div>

              {/* Priority Progress Bar */}
              <div className="mt-4">
                <Progress value={priorityPercent} className="h-2" />
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Metadata */}
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>{item.estimatedMinutes} min</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <TrendingUp className="h-4 w-4" />
                  <span className="capitalize">{item.complexity.toLowerCase()}</span>
                </div>
              </div>

              {/* Reasoning */}
              <div className="bg-white/40 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                <div className="flex items-start gap-2">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-1">Why this matters:</p>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {item.priorityExplanation.reasoning}
                    </p>
                  </div>
                </div>
              </div>

              {/* Expand/Collapse for Details */}
              {isExpanded && (
                <div className="space-y-3 pt-2">
                  {/* Priority Factors */}
                  <div className="bg-white/40 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Priority Breakdown</h4>
                    <div className="space-y-2">
                      {item.priorityExplanation.factors.map((factor) => (
                        <div key={factor.name} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-700 font-medium">{factor.name}</span>
                            <span className="text-gray-600">
                              {Math.round(factor.contribution * 100)}%
                            </span>
                          </div>
                          <Progress value={factor.contribution * 100} className="h-1.5" />
                          <p className="text-xs text-gray-600 mt-1">{factor.explanation}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommendations */}
                  {item.priorityExplanation.recommendations.length > 0 && (
                    <div className="bg-white/40 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Recommendations</h4>
                      <ul className="space-y-1">
                        {item.priorityExplanation.recommendations.map((rec, idx) => (
                          <li key={idx} className="text-xs text-gray-700 flex items-start gap-2">
                            <span className="text-blue-600 mt-0.5">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Toggle Button */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
                className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium py-2 rounded-lg hover:bg-white/40 transition-all duration-200"
              >
                {isExpanded ? 'Show Less' : 'Show Details'}
              </button>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
