/**
 * Real-Time Orchestration Panel
 * Story 5.3 Task 2: Real-time session orchestration display
 *
 * Displays session timeline, current phase, upcoming breaks, performance metrics,
 * and intelligent orchestration recommendations during study sessions
 */

'use client'

import { useState, useEffect } from 'react'
import {
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  Coffee,
  Brain,
  Target,
  AlertTriangle,
  Lightbulb,
  ChevronRight,
  Pause,
  Play,
  BarChart3,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  realtimeOrchestrationService,
  type RealtimeOrchestrationPlan,
  type PerformanceMetrics,
  type BreakRecommendation,
  type ContentAdaptation,
  type SessionRecommendation,
} from '@/services/realtime-orchestration'
import { cn } from '@/lib/utils'

interface RealtimeOrchestrationPanelProps {
  sessionId: string
  missionId?: string
  currentPhase: 'content' | 'cards' | 'assessment'
  onBreakRecommendation?: (recommendation: BreakRecommendation) => void
  onContentAdaptation?: (adaptation: ContentAdaptation) => void
  onSessionRecommendation?: (recommendation: SessionRecommendation) => void
  compact?: boolean
}

export function RealtimeOrchestrationPanel({
  sessionId,
  missionId,
  currentPhase,
  onBreakRecommendation,
  onContentAdaptation,
  onSessionRecommendation,
  compact = false,
}: RealtimeOrchestrationPanelProps) {
  const [orchestrationPlan, setOrchestrationPlan] = useState<RealtimeOrchestrationPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  // Initialize orchestration when session starts
  useEffect(() => {
    const initializeOrchestration = async () => {
      try {
        setLoading(true)
        const plan = await realtimeOrchestrationService.initializeSession(
          sessionId,
          missionId,
          currentPhase,
        )
        setOrchestrationPlan(plan)
      } catch (error) {
        console.error('Failed to initialize real-time orchestration:', error)
      } finally {
        setLoading(false)
      }
    }

    initializeOrchestration()

    return () => {
      realtimeOrchestrationService.cleanup()
    }
  }, [sessionId, missionId, currentPhase])

  // Update orchestration plan every 30 seconds
  useEffect(() => {
    const updateInterval = setInterval(() => {
      if (sessionId) {
        const plan = realtimeOrchestrationService.generateCurrentOrchestrationPlan(currentPhase)
        setOrchestrationPlan(plan)
        setLastUpdate(new Date())
      }
    }, 30000) // Update every 30 seconds

    return () => clearInterval(updateInterval)
  }, [sessionId, currentPhase])

  // Handle user interactions
  const handleBreakAction = (action: 'take' | 'postpone' | 'skip') => {
    if (!orchestrationPlan?.upcomingBreaks[0]) return

    const breakRecommendation: BreakRecommendation = {
      type: orchestrationPlan.upcomingBreaks[0].type as any,
      urgency: orchestrationPlan.upcomingBreaks[0].isRecommended ? 'medium' : 'low',
      message: orchestrationPlan.upcomingBreaks[0].reason,
      estimatedBreakDuration: 5,
      canPostpone: true,
      canSkip: true,
      reason: orchestrationPlan.upcomingBreaks[0].reason,
    }

    if (action === 'take') {
      onBreakRecommendation?.(breakRecommendation)
    }
    // TODO: Handle postpone and skip actions
  }

  const handleContentAdaptation = (action: 'accept' | 'decline') => {
    if (!orchestrationPlan?.adaptations) return

    const adaptation: ContentAdaptation = {
      type: 'difficulty_adjust',
      recommendation: orchestrationPlan.adaptations.reason,
      reason: orchestrationPlan.adaptations.reason,
      userChoice: action,
    }

    onContentAdaptation?.(adaptation)
  }

  const handleSessionRecommendation = (action: 'accept' | 'decline') => {
    if (!orchestrationPlan) return

    const recommendation: SessionRecommendation = {
      type: orchestrationPlan.adaptations.sessionExtension
        ? 'extend'
        : orchestrationPlan.adaptations.earlyCompletion
          ? 'complete_early'
          : 'continue',
      reason: orchestrationPlan.adaptations.reason,
      confidence: 80,
      userChoice: action,
    }

    onSessionRecommendation?.(recommendation)
  }

  const formatTimeRemaining = (date?: Date) => {
    if (!date) return '--'
    const now = new Date()
    const diff = date.getTime() - now.getTime()
    const minutes = Math.floor(diff / 60000)
    return minutes > 0 ? `${minutes}m` : 'Now'
  }

  const getTrendIcon = (trend: PerformanceMetrics['trend']) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-500" />
      default:
        return <Minus className="h-4 w-4 text-gray-500" />
    }
  }

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50'
    if (score >= 60) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  const getFatigueColor = (level: number) => {
    if (level >= 80) return 'text-red-600 bg-red-50'
    if (level >= 60) return 'text-yellow-600 bg-yellow-50'
    return 'text-green-600 bg-green-50'
  }

  if (loading) {
    return (
      <Card className="rounded-2xl bg-white/80 backdrop-blur-md border border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)]">
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-gray-600">Initializing orchestration...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!orchestrationPlan) {
    return null
  }

  if (compact) {
    // Compact version for minimal UI
    return (
      <Card className="rounded-2xl bg-white/80 backdrop-blur-md border border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)]">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Performance</span>
              </div>
              <Badge
                variant="outline"
                className={getPerformanceColor(orchestrationPlan.performanceScore)}
              >
                {orchestrationPlan.performanceScore}%
              </Badge>
              {getTrendIcon(orchestrationPlan.currentPerformance.trend)}
            </div>

            <div className="flex items-center gap-2">
              {orchestrationPlan.upcomingBreaks.length > 0 && (
                <Badge variant="outline" className="text-orange-600 bg-orange-50">
                  <Coffee className="h-3 w-3 mr-1" />
                  {formatTimeRemaining(orchestrationPlan.upcomingBreaks[0].estimatedTime)}
                </Badge>
              )}
              <Badge variant="outline" className="text-gray-500">
                <Clock className="h-3 w-3 mr-1" />
                {Math.round(orchestrationPlan.timeInCurrentPhase / 60000)}m
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Full orchestration panel
  return (
    <div className="space-y-4">
      {/* Session Timeline Header */}
      <Card className="rounded-2xl bg-white/80 backdrop-blur-md border border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)]">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5 text-blue-600" />
            Session Orchestration
            <Badge variant="outline" className="text-xs ml-auto">
              Updated {formatTimeRemaining(lastUpdate)} ago
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Phase & Timeline */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'w-3 h-3 rounded-full',
                  currentPhase === 'content'
                    ? 'bg-blue-500'
                    : currentPhase === 'cards'
                      ? 'bg-purple-500'
                      : currentPhase === 'assessment'
                        ? 'bg-green-500'
                        : 'bg-orange-500',
                )}
              />
              <div>
                <div className="font-medium capitalize">{currentPhase} Phase</div>
                <div className="text-sm text-gray-600">
                  {Math.round(orchestrationPlan.timeInCurrentPhase / 60000)} minutes
                  {orchestrationPlan.estimatedPhaseEndTime &&
                    ` • ${formatTimeRemaining(orchestrationPlan.estimatedPhaseEndTime)} remaining`}
                </div>
              </div>
            </div>
            <Progress
              value={(orchestrationPlan.timeInCurrentPhase / 1500000) * 100} // 25 min = 100%
              className="w-24 h-2"
            />
          </div>

          {/* Upcoming Breaks */}
          {orchestrationPlan.upcomingBreaks.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-700">Upcoming Breaks</h4>
              {orchestrationPlan.upcomingBreaks.map((breakInfo, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-orange-50 border border-orange-200"
                >
                  <div className="flex items-center gap-2">
                    <Coffee className="h-4 w-4 text-orange-600" />
                    <div>
                      <div className="font-medium text-sm capitalize">{breakInfo.type} Break</div>
                      <div className="text-xs text-gray-600">{breakInfo.reason}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-orange-600 bg-orange-50">
                      {formatTimeRemaining(breakInfo.estimatedTime)}
                    </Badge>
                    {breakInfo.isRecommended && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBreakAction('take')}
                        className="text-orange-600 border-orange-600"
                      >
                        Take Now
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card className="rounded-2xl bg-white/80 backdrop-blur-md border border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)]">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5 text-purple-600" />
            Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Overall Performance */}
            <div className="p-3 rounded-lg bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Overall Score</span>
                <Badge
                  variant="outline"
                  className={getPerformanceColor(orchestrationPlan.performanceScore)}
                >
                  {orchestrationPlan.performanceScore}%
                </Badge>
              </div>
              <Progress value={orchestrationPlan.performanceScore} className="h-2" />
            </div>

            {/* Accuracy */}
            <div className="p-3 rounded-lg bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Accuracy</span>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium">
                    {orchestrationPlan.currentPerformance.accuracy}%
                  </span>
                  {getTrendIcon(orchestrationPlan.currentPerformance.trend)}
                </div>
              </div>
              <Progress value={orchestrationPlan.currentPerformance.accuracy} className="h-2" />
            </div>

            {/* Engagement */}
            <div className="p-3 rounded-lg bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Engagement</span>
                <span className="text-sm font-medium">
                  {orchestrationPlan.currentPerformance.engagementScore}%
                </span>
              </div>
              <Progress
                value={orchestrationPlan.currentPerformance.engagementScore}
                className="h-2"
              />
            </div>

            {/* Fatigue */}
            <div className="p-3 rounded-lg bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Fatigue Level</span>
                <Badge
                  variant="outline"
                  className={getFatigueColor(orchestrationPlan.currentPerformance.fatigueIndicator)}
                >
                  {orchestrationPlan.currentPerformance.fatigueIndicator}%
                </Badge>
              </div>
              <Progress
                value={orchestrationPlan.currentPerformance.fatigueIndicator}
                className="h-2"
              />
            </div>
          </div>

          {/* Response Time */}
          <div className="p-3 rounded-lg bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Avg Response Time</span>
              <span className="text-sm font-medium">
                {Math.round(orchestrationPlan.currentPerformance.avgResponseTime / 1000)}s
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orchestration Adaptations */}
      {orchestrationPlan.adaptations && (
        <Card className="rounded-2xl bg-white/80 backdrop-blur-md border border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)]">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lightbulb className="h-5 w-5 text-yellow-600" />
              Intelligent Adaptations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Content Difficulty Adjustment */}
            {orchestrationPlan.adaptations.contentDifficulty !== 'same' && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-200">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-blue-600" />
                  <div>
                    <div className="font-medium text-sm">
                      Try {orchestrationPlan.adaptations.contentDifficulty} content
                    </div>
                    <div className="text-xs text-gray-600">
                      {orchestrationPlan.adaptations.reason}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleContentAdaptation('accept')}
                    className="text-blue-600 border-blue-600"
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleContentAdaptation('decline')}
                  >
                    Decline
                  </Button>
                </div>
              </div>
            )}

            {/* Break Suggestion */}
            {orchestrationPlan.adaptations.suggestedBreak && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-orange-50 border border-orange-200">
                <div className="flex items-center gap-2">
                  <Coffee className="h-4 w-4 text-orange-600" />
                  <div>
                    <div className="font-medium text-sm">Recommended Break</div>
                    <div className="text-xs text-gray-600">
                      {orchestrationPlan.adaptations.reason}
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBreakAction('take')}
                  className="text-orange-600 border-orange-600"
                >
                  Take Break
                </Button>
              </div>
            )}

            {/* Session Recommendations */}
            {(orchestrationPlan.adaptations.sessionExtension ||
              orchestrationPlan.adaptations.earlyCompletion) && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-green-600" />
                  <div>
                    <div className="font-medium text-sm">
                      {orchestrationPlan.adaptations.sessionExtension
                        ? 'Extend Session'
                        : 'Complete Early'}
                    </div>
                    <div className="text-xs text-gray-600">
                      {orchestrationPlan.adaptations.reason}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSessionRecommendation('accept')}
                    className="text-green-600 border-green-600"
                  >
                    {orchestrationPlan.adaptations.sessionExtension ? 'Extend' : 'Complete'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleSessionRecommendation('decline')}
                  >
                    Continue
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
