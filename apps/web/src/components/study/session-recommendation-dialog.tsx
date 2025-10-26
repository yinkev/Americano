/**
 * Session Recommendation Dialog
 * Story 5.3 Task 5: Session extension/early completion logic
 *
 * Provides intelligent session recommendations based on performance,
    fatigue, and progress. Supports session extensions, early completion,
    and continued study with personalized suggestions.
 */

'use client'

import { useState } from 'react'
import {
  Clock,
  TrendingUp,
  Brain,
  Target,
  Battery,
  CheckCircle,
  XCircle,
  PlusCircle,
  Flag,
  BarChart3,
  Calendar,
  Zap,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  type SessionRecommendation,
  realtimeOrchestrationService,
} from '@/services/realtime-orchestration'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface SessionRecommendationDialogProps {
  open: boolean
  recommendation: SessionRecommendation | null
  onAccept: (recommendation: SessionRecommendation, selectedOption?: string) => void
  onDecline: (recommendation: SessionRecommendation) => void
  sessionContext?: {
    objectivesCompleted: number
    totalObjectives: number
    sessionDuration: number // minutes
    plannedDuration: number // minutes
    performanceScore: number
    fatigueLevel: number
    streakCount: number
  }
  availableObjectives?: Array<{
    id: string
    title: string
    estimatedMinutes: number
    difficulty: 'basic' | 'intermediate' | 'advanced'
    priority: 'high' | 'medium' | 'low'
  }>
}

interface RecommendationOption {
  id: string
  title: string
  description: string
  type: 'extend' | 'complete_early' | 'continue'
  estimatedDuration: number // minutes
  benefits: string[]
  confidence: number // 0-100
  icon: React.ReactNode
  color: string
}

export function SessionRecommendationDialog({
  open,
  recommendation,
  onAccept,
  onDecline,
  sessionContext,
  availableObjectives = [],
}: SessionRecommendationDialogProps) {
  const [selectedOption, setSelectedOption] = useState<string>('')
  const [additionalObjectives, setAdditionalObjectives] = useState<string[]>([])
  const [rememberPreference, setRememberPreference] = useState(false)
  const [showAnalysis, setShowAnalysis] = useState(false)

  // Generate detailed options based on recommendation type
  const generateRecommendationOptions = (): RecommendationOption[] => {
    if (!recommendation || !sessionContext) return []

    const options: RecommendationOption[] = []

    switch (recommendation.type) {
      case 'extend':
        options.push(
          {
            id: 'extend_15',
            title: 'Extend 15 Minutes',
            description: 'Continue with focused study for additional objectives',
            type: 'extend',
            estimatedDuration: 15,
            benefits: ['Cover 1-2 more objectives', 'Build momentum', 'Strengthen learning'],
            confidence: 85,
            icon: <PlusCircle className="h-5 w-5" />,
            color: 'text-green-600 bg-green-50 border-green-200',
          },
          {
            id: 'extend_30',
            title: 'Extend 30 Minutes',
            description: 'Comprehensive session to master remaining content',
            type: 'extend',
            estimatedDuration: 30,
            benefits: ['Deep learning', 'Complete topic mastery', 'High retention'],
            confidence: 75,
            icon: <Clock className="h-5 w-5" />,
            color: 'text-blue-600 bg-blue-50 border-blue-200',
          },
        )
        break

      case 'complete_early':
        options.push(
          {
            id: 'complete_now',
            title: 'Complete Session Now',
            description: 'End session with strong performance achieved',
            type: 'complete_early',
            estimatedDuration: 0,
            benefits: ['End on high note', 'Prevent burnout', 'Save energy for next session'],
            confidence: 90,
            icon: <CheckCircle className="h-5 w-5" />,
            color: 'text-green-600 bg-green-50 border-green-200',
          },
          {
            id: 'quick_review',
            title: 'Quick Review (5 min)',
            description: 'Brief review before completing the session',
            type: 'complete_early',
            estimatedDuration: 5,
            benefits: ['Reinforce learning', 'Identify knowledge gaps', 'Better retention'],
            confidence: 80,
            icon: <Brain className="h-5 w-5" />,
            color: 'text-purple-600 bg-purple-50 border-purple-200',
          },
        )
        break

      default: // continue
        options.push({
          id: 'continue_normal',
          title: 'Continue as Planned',
          description: 'Follow original session plan without changes',
          type: 'continue',
          estimatedDuration: sessionContext.plannedDuration - sessionContext.sessionDuration,
          benefits: ['Maintain schedule', 'Consistent routine', 'Predictable outcomes'],
          confidence: 70,
          icon: <Target className="h-5 w-5" />,
          color: 'text-gray-600 bg-gray-50 border-gray-200',
        })
    }

    return options
  }

  const options = generateRecommendationOptions()
  const selectedOptionData = options.find((opt) => opt.id === selectedOption)

  const handleAccept = () => {
    if (!recommendation) return

    const updatedRecommendation: SessionRecommendation = {
      ...recommendation,
      userChoice: 'accept',
      confidence: selectedOptionData?.confidence || recommendation.confidence,
    }

    onAccept(updatedRecommendation, selectedOption)

    // Track additional objectives if extending
    if (recommendation.type === 'extend' && additionalObjectives.length > 0) {
      console.log('Adding objectives to extended session:', additionalObjectives)
    }

    // Remember user preference if enabled
    if (rememberPreference) {
      // TODO: Save user preference to profile
      console.log('Remembering session preference:', recommendation.type)
    }

    toast.success(
      `Session ${recommendation.type}: ${selectedOptionData?.title || recommendation.reason}`,
    )
  }

  const handleDecline = () => {
    if (!recommendation) return

    onDecline({ ...recommendation, userChoice: 'decline' })
    toast.info('Session recommendation declined - continuing as planned')
  }

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getFatigueColor = (level: number) => {
    if (level >= 80) return 'text-red-600 bg-red-50'
    if (level >= 60) return 'text-yellow-600 bg-yellow-50'
    return 'text-green-600 bg-green-50'
  }

  const getRecommendationIcon = (type: SessionRecommendation['type']) => {
    switch (type) {
      case 'extend':
        return <PlusCircle className="h-6 w-6 text-green-600" />
      case 'complete_early':
        return <Flag className="h-6 w-6 text-blue-600" />
      default:
        return <Target className="h-6 w-6 text-gray-600" />
    }
  }

  const getRecommendationTitle = (type: SessionRecommendation['type']) => {
    switch (type) {
      case 'extend':
        return 'Session Extension Recommended'
      case 'complete_early':
        return 'Early Completion Available'
      default:
        return 'Session Continuation'
    }
  }

  if (!recommendation || !sessionContext) return null

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-3xl rounded-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-100 p-3">
              {getRecommendationIcon(recommendation.type)}
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl">
                {getRecommendationTitle(recommendation.type)}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="capitalize">
                  {recommendation.type.replace('_', ' ')}
                </Badge>
                <Badge variant="secondary">{recommendation.confidence}% confidence</Badge>
              </div>
            </div>
          </div>
          <DialogDescription className="text-base leading-relaxed">
            {recommendation.reason}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Session Performance Summary */}
          <Card className="border border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Session Performance Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {sessionContext.objectivesCompleted}/{sessionContext.totalObjectives}
                  </div>
                  <div className="text-sm text-gray-600">Objectives</div>
                  <Progress
                    value={
                      (sessionContext.objectivesCompleted / sessionContext.totalObjectives) * 100
                    }
                    className="mt-2 h-2"
                  />
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {sessionContext.sessionDuration}m
                  </div>
                  <div className="text-sm text-gray-600">Duration</div>
                  <div className="text-xs text-gray-500 mt-1">
                    of {sessionContext.plannedDuration}m planned
                  </div>
                </div>

                <div className="text-center">
                  <div
                    className={cn(
                      'text-2xl font-bold',
                      getPerformanceColor(sessionContext.performanceScore),
                    )}
                  >
                    {sessionContext.performanceScore}%
                  </div>
                  <div className="text-sm text-gray-600">Performance</div>
                  <Badge
                    variant="outline"
                    className={cn('mt-1', getPerformanceColor(sessionContext.performanceScore))}
                  >
                    {sessionContext.performanceScore >= 80
                      ? 'Excellent'
                      : sessionContext.performanceScore >= 60
                        ? 'Good'
                        : 'Needs Improvement'}
                  </Badge>
                </div>

                <div className="text-center">
                  <div
                    className={cn(
                      'text-2xl font-bold',
                      getFatigueColor(sessionContext.fatigueLevel),
                    )}
                  >
                    {sessionContext.fatigueLevel}%
                  </div>
                  <div className="text-sm text-gray-600">Fatigue</div>
                  <Badge
                    variant="outline"
                    className={cn('mt-1', getFatigueColor(sessionContext.fatigueLevel))}
                  >
                    {sessionContext.fatigueLevel >= 80
                      ? 'High'
                      : sessionContext.fatigueLevel >= 60
                        ? 'Medium'
                        : 'Low'}
                  </Badge>
                </div>
              </div>

              {/* Streak and Momentum */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium">Current Streak</span>
                </div>
                <Badge variant="outline" className="text-orange-600">
                  {sessionContext.streakCount} days 🔥
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Recommendation Options */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Choose Your Action</Label>
            <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
              {options.map((option) => (
                <div
                  key={option.id}
                  className={cn(
                    'rounded-lg border-2 p-4 cursor-pointer transition-all hover:shadow-none',
                    selectedOption === option.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300',
                  )}
                  onClick={() => setSelectedOption(option.id)}
                >
                  <div className="flex items-start gap-3">
                    <RadioGroupItem value={option.id} id={option.id} className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {option.icon}
                        <Label htmlFor={option.id} className="font-medium cursor-pointer">
                          {option.title}
                        </Label>
                        <Badge variant="outline" className="text-xs">
                          {option.confidence}% confident
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{option.description}</p>

                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-500">
                            {option.estimatedDuration > 0
                              ? `${option.estimatedDuration} minutes`
                              : 'Immediate'}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="text-xs font-medium text-gray-700">Benefits:</div>
                        <div className="flex flex-wrap gap-1">
                          {option.benefits.map((benefit, index) => (
                            <Badge key={index} variant="secondary" className="text-xs px-2 py-0">
                              {benefit}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Additional Objectives for Extension */}
          {recommendation.type === 'extend' && availableObjectives.length > 0 && (
            <Card className="border border-green-200 bg-green-50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Target className="h-5 w-5 text-green-600" />
                  Available Objectives for Extended Session
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {availableObjectives.slice(0, 3).map((objective) => (
                  <div key={objective.id} className="flex items-center gap-3">
                    <Checkbox
                      id={objective.id}
                      checked={additionalObjectives.includes(objective.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setAdditionalObjectives([...additionalObjectives, objective.id])
                        } else {
                          setAdditionalObjectives(
                            additionalObjectives.filter((id) => id !== objective.id),
                          )
                        }
                      }}
                    />
                    <div className="flex-1">
                      <Label htmlFor={objective.id} className="text-sm font-medium cursor-pointer">
                        {objective.title}
                      </Label>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Badge variant="outline" className="text-xs">
                          {objective.estimatedMinutes}m
                        </Badge>
                        <Badge variant="outline" className="text-xs capitalize">
                          {objective.difficulty}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs',
                            objective.priority === 'high'
                              ? 'text-red-600'
                              : objective.priority === 'medium'
                                ? 'text-yellow-600'
                                : 'text-green-600',
                          )}
                        >
                          {objective.priority} priority
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* User Preferences */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Checkbox
                id="remember"
                checked={rememberPreference}
                onCheckedChange={(checked) => setRememberPreference(checked as boolean)}
              />
              <Label htmlFor="remember" className="text-sm">
                Remember my preference for future sessions
              </Label>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowAnalysis(!showAnalysis)}>
              <Lightbulb className="h-4 w-4 mr-1" />
              {showAnalysis ? 'Hide' : 'Show'} Analysis
            </Button>
          </div>

          {/* Detailed Analysis */}
          {showAnalysis && (
            <Card className="border border-gray-200">
              <CardContent className="p-4 space-y-3">
                <div>
                  <div className="text-sm font-medium mb-1">Why This Recommendation?</div>
                  <div className="text-sm text-gray-600">
                    {recommendation.type === 'extend' &&
                      sessionContext.performanceScore >= 80 &&
                      'Your strong performance and engagement suggest you can effectively continue learning without burnout.'}
                    {recommendation.type === 'extend' &&
                      sessionContext.sessionDuration < 30 &&
                      'You have ample cognitive capacity remaining for additional study time.'}
                    {recommendation.type === 'complete_early' &&
                      sessionContext.fatigueLevel >= 80 &&
                      "High fatigue levels indicate it's better to end now to maintain long-term learning consistency."}
                    {recommendation.type === 'complete_early' &&
                      sessionContext.objectivesCompleted >= sessionContext.totalObjectives &&
                      'All objectives completed successfully - excellent work!'}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium mb-1">Impact on Learning Goals</div>
                  <div className="text-sm text-gray-600">
                    This decision affects your weekly progress and learning momentum. The AI has
                    analyzed your historical patterns to optimize for long-term retention.
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium mb-1">Alternative Options</div>
                  <div className="text-sm text-gray-600">
                    You can always adjust your approach based on how you feel. The recommendation is
                    based on data, but your intuition about your learning state is valuable too.
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleDecline} className="flex-1">
            <XCircle className="h-4 w-4 mr-2" />
            Decline Recommendation
          </Button>

          <Button onClick={handleAccept} disabled={!selectedOption} className="flex-1">
            <CheckCircle className="h-4 w-4 mr-2" />
            Accept {selectedOptionData?.title || 'Recommendation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Session recommendation tracker for analytics
export class SessionRecommendationTracker {
  private static instance: SessionRecommendationTracker
  private recommendationHistory: Map<
    string,
    {
      sessionId: string
      recommendation: SessionRecommendation
      sessionContext: any
      timestamp: Date
      userChoice: 'accept' | 'decline'
      outcome?: {
        finalPerformanceScore: number
        actualDuration: number
        effectivenessRating: number // 1-5 stars
      }
    }[]
  > = new Map()

  static getInstance(): SessionRecommendationTracker {
    if (!SessionRecommendationTracker.instance) {
      SessionRecommendationTracker.instance = new SessionRecommendationTracker()
    }
    return SessionRecommendationTracker.instance
  }

  recordRecommendation(
    sessionId: string,
    recommendation: SessionRecommendation,
    sessionContext: any,
  ): void {
    // This is called when a recommendation is made
    // The actual user choice will be recorded when they accept/decline
    console.log('Recommendation made for session:', sessionId, recommendation.type)
  }

  recordUserChoice(
    sessionId: string,
    recommendation: SessionRecommendation,
    sessionContext: any,
    userChoice: 'accept' | 'decline',
  ): void {
    const record = {
      sessionId,
      recommendation,
      sessionContext,
      timestamp: new Date(),
      userChoice,
    }

    if (!this.recommendationHistory.has(sessionId)) {
      this.recommendationHistory.set(sessionId, [])
    }

    const sessionHistory = this.recommendationHistory.get(sessionId)!
    sessionHistory.push(record)

    // Keep only last 50 recommendations per session
    if (sessionHistory.length > 50) {
      sessionHistory.shift()
    }
  }

  recordOutcome(
    sessionId: string,
    finalPerformanceScore: number,
    actualDuration: number,
    effectivenessRating: number,
  ): void {
    const sessionHistory = this.recommendationHistory.get(sessionId) || []
    const lastRecommendation = sessionHistory[sessionHistory.length - 1]

    if (lastRecommendation && lastRecommendation.userChoice === 'accept') {
      lastRecommendation.outcome = {
        finalPerformanceScore,
        actualDuration,
        effectivenessRating,
      }
    }
  }

  getRecommendationEffectiveness(): {
    extensionEffectiveness: number
    earlyCompletionEffectiveness: number
    overallAccuracy: number
    userAcceptanceRate: number
  } {
    const allRecommendations = Array.from(this.recommendationHistory.values()).flat()
    const acceptedRecommendations = allRecommendations.filter((r) => r.userChoice === 'accept')

    const extensionOutcomes = acceptedRecommendations
      .filter((r) => r.recommendation.type === 'extend' && r.outcome)
      .map((r) => r.outcome!.effectivenessRating)

    const earlyCompletionOutcomes = acceptedRecommendations
      .filter((r) => r.recommendation.type === 'complete_early' && r.outcome)
      .map((r) => r.outcome!.effectivenessRating)

    const extensionEffectiveness =
      extensionOutcomes.length > 0
        ? extensionOutcomes.reduce((sum, rating) => sum + rating, 0) / extensionOutcomes.length
        : 0

    const earlyCompletionEffectiveness =
      earlyCompletionOutcomes.length > 0
        ? earlyCompletionOutcomes.reduce((sum, rating) => sum + rating, 0) /
          earlyCompletionOutcomes.length
        : 0

    const overallAccuracy = (extensionEffectiveness + earlyCompletionEffectiveness) / 2

    const userAcceptanceRate =
      allRecommendations.length > 0
        ? (acceptedRecommendations.length / allRecommendations.length) * 100
        : 0

    return {
      extensionEffectiveness: Math.round(extensionEffectiveness * 20) / 20, // Convert to 0-5 scale
      earlyCompletionEffectiveness: Math.round(earlyCompletionEffectiveness * 20) / 20,
      overallAccuracy: Math.round(overallAccuracy * 20) / 20,
      userAcceptanceRate: Math.round(userAcceptanceRate),
    }
  }
}

export const sessionRecommendationTracker = SessionRecommendationTracker.getInstance()
