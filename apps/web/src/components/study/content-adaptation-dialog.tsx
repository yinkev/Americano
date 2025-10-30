/**
 * Content Adaptation Dialog
 * Story 5.3 Task 4: Content sequence adaptation logic
 *
 * Provides intelligent content recommendations based on performance,
 * learning patterns, and session progress. Supports difficulty adjustments,
 * content type switches, and user choice tracking.
 */

'use client'

import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Brain,
  CheckCircle,
  Clock,
  Lightbulb,
  Target,
  TrendingDown,
  TrendingUp,
  XCircle,
  Zap,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'
import {
  type ContentAdaptation,
  realtimeOrchestrationService,
} from '@/services/realtime-orchestration'

interface ContentAdaptationDialogProps {
  open: boolean
  adaptation: ContentAdaptation | null
  onAccept: (adaptation: ContentAdaptation, selectedOption?: string) => void
  onDecline: (adaptation: ContentAdaptation) => void
  onPostpone: (adaptation: ContentAdaptation, minutes: number) => void
  currentContent?: {
    type: 'basic' | 'intermediate' | 'advanced'
    topic: string
    completedPercentage: number
  }
  sessionContext?: {
    objectivesCompleted: number
    totalObjectives: number
    timeSpent: number // minutes
    currentStreak: number
  }
}

interface AdaptationOption {
  id: string
  title: string
  description: string
  difficulty: 'easier' | 'same' | 'harder'
  estimatedTime: number // minutes
  benefits: string[]
  confidence: number // 0-100
  icon: React.ReactNode
}

export function ContentAdaptationDialog({
  open,
  adaptation,
  onAccept,
  onDecline,
  onPostpone,
  currentContent,
  sessionContext,
}: ContentAdaptationDialogProps) {
  const [selectedOption, setSelectedOption] = useState<string>('')
  const [postponeMinutes, setPostponeMinutes] = useState(10)
  const [rememberChoice, setRememberChoice] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  // Generate adaptation options based on type and performance
  const generateAdaptationOptions = (): AdaptationOption[] => {
    if (!adaptation) return []

    const baseOptions: AdaptationOption[] = []

    switch (adaptation.type) {
      case 'difficulty_adjust':
        baseOptions.push(
          {
            id: 'easier',
            title: 'Try Easier Content',
            description: 'Focus on building foundational understanding',
            difficulty: 'easier',
            estimatedTime: 15,
            benefits: ['Higher success rate', 'Build confidence', 'Reduce frustration'],
            confidence: 85,
            icon: <TrendingDown className="h-5 w-5 text-green-600" />,
          },
          {
            id: 'same',
            title: 'Continue Current Level',
            description: 'Stay with current difficulty level',
            difficulty: 'same',
            estimatedTime: 20,
            benefits: ['Maintain momentum', 'Consistent challenge', 'Steady progress'],
            confidence: 60,
            icon: <Target className="h-5 w-5 text-blue-600" />,
          },
          {
            id: 'harder',
            title: 'Challenge Yourself',
            description: 'Try more advanced material',
            difficulty: 'harder',
            estimatedTime: 25,
            benefits: ['Accelerated learning', 'Deeper understanding', 'Skill growth'],
            confidence: 40,
            icon: <TrendingUp className="h-5 w-5 text-purple-600" />,
          },
        )
        break

      case 'content_switch':
        baseOptions.push(
          {
            id: 'visual',
            title: 'Switch to Visual Content',
            description: 'Try diagrams, charts, and visual explanations',
            difficulty: 'same',
            estimatedTime: 18,
            benefits: ['Better retention', 'Visual learning', 'Alternative perspective'],
            confidence: 75,
            icon: <BookOpen className="h-5 w-5 text-orange-600" />,
          },
          {
            id: 'interactive',
            title: 'Interactive Practice',
            description: 'Hands-on exercises and problem solving',
            difficulty: 'same',
            estimatedTime: 22,
            benefits: ['Active learning', 'Practical skills', 'Immediate feedback'],
            confidence: 80,
            icon: <Zap className="h-5 w-5 text-yellow-600" />,
          },
          {
            id: 'review',
            title: 'Review Fundamentals',
            description: 'Strengthen foundational concepts',
            difficulty: 'easier',
            estimatedTime: 15,
            benefits: ['Fill knowledge gaps', 'Build strong foundation', 'Improve confidence'],
            confidence: 90,
            icon: <Brain className="h-5 w-5 text-green-600" />,
          },
        )
        break

      case 'sequence_change':
        baseOptions.push(
          {
            id: 'skip-ahead',
            title: 'Skip to Next Topic',
            description: 'Move ahead if current content is mastered',
            difficulty: 'same',
            estimatedTime: 20,
            benefits: ['Save time', 'Maintain engagement', 'Focus on challenges'],
            confidence: adaptation.reason.includes('excelling') ? 85 : 50,
            icon: <ArrowRight className="h-5 w-5 text-purple-600" />,
          },
          {
            id: 'switch-topic',
            title: 'Switch Learning Topic',
            description: 'Try a different subject area',
            difficulty: 'same',
            estimatedTime: 25,
            benefits: ['Fresh perspective', 'Cross-learning', 'Maintain interest'],
            confidence: 70,
            icon: <BookOpen className="h-5 w-5 text-blue-600" />,
          },
        )
        break
    }

    return baseOptions
  }

  const options = generateAdaptationOptions()
  const selectedOptionData = options.find((opt) => opt.id === selectedOption)

  const handleAccept = () => {
    if (!adaptation || !selectedOption) return

    const updatedAdaptation: ContentAdaptation = {
      ...adaptation,
      userChoice: 'accept',
      recommendation: selectedOptionData?.title || adaptation.recommendation,
    }

    onAccept(updatedAdaptation, selectedOption)

    // Track user preference if remember choice is enabled
    if (rememberChoice) {
      // TODO: Save user preference to profile
      console.log('Remembering user preference for:', selectedOption)
    }

    toast.success(`Content adapted: ${selectedOptionData?.title}`)
  }

  const handleDecline = () => {
    if (!adaptation) return

    onDecline({ ...adaptation, userChoice: 'decline' })
    toast.info('Content adaptation declined')
  }

  const handlePostpone = () => {
    if (!adaptation) return

    onPostpone({ ...adaptation, userChoice: 'postpone' }, postponeMinutes)
    toast.info(`Content adaptation postponed by ${postponeMinutes} minutes`)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easier':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'harder':
        return 'text-purple-600 bg-purple-50 border-purple-200'
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200'
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600'
    if (confidence >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (!adaptation) return null

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-100 p-3">
              <Lightbulb className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl">Content Adaptation Recommendation</DialogTitle>
              <Badge variant="outline" className="mt-1 capitalize">
                {adaptation.type.replace('_', ' ')}
              </Badge>
            </div>
          </div>
          <DialogDescription className="text-base leading-relaxed">
            {adaptation.recommendation}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Performance Context */}
          {sessionContext && (
            <Card className="border border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Current Session Context
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Objectives</span>
                    <span className="text-sm font-medium">
                      {sessionContext.objectivesCompleted}/{sessionContext.totalObjectives}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Time Spent</span>
                    <span className="text-sm font-medium">{sessionContext.timeSpent}m</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Current Streak</span>
                    <Badge variant="outline" className="text-green-600">
                      {sessionContext.currentStreak} 🔥
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Performance</span>
                    <span className="text-sm font-medium">Good</span>
                  </div>
                </div>

                {currentContent && (
                  <div className="pt-2 border-t">
                    <div className="text-sm text-gray-600 mb-2">Current Progress</div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <Progress value={currentContent.completedPercentage} className="h-2" />
                      </div>
                      <span className="text-sm font-medium">
                        {currentContent.completedPercentage}%
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {currentContent.topic} • {currentContent.type} level
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Adaptation Options */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Choose Your Path</Label>
            <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
              {options.map((option) => (
                <div
                  key={option.id}
                  className={cn(
                    'rounded-lg border-2 p-4 cursor-pointer transition-all hover:shadow-md',
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
                        <Badge
                          variant="outline"
                          className={cn('text-xs', getDifficultyColor(option.difficulty))}
                        >
                          {option.difficulty}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{option.description}</p>

                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-500">
                            {option.estimatedTime} minutes
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-sm text-gray-500">Confidence:</span>
                          <span
                            className={cn(
                              'text-sm font-medium',
                              getConfidenceColor(option.confidence),
                            )}
                          >
                            {option.confidence}%
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

          {/* Selected Option Details */}
          {selectedOptionData && (
            <Card className="border border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Selected: {selectedOptionData.title}</span>
                </div>
                <p className="text-sm text-gray-700">{selectedOptionData.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Postpone Options */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Postpone Adaptation</Label>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="postpone" className="text-sm">
                  Remind me in:
                </Label>
                <select
                  id="postpone"
                  value={postponeMinutes}
                  onChange={(e) => setPostponeMinutes(Number(e.target.value))}
                  className="rounded border border-gray-300 px-2 py-1 text-sm"
                >
                  <option value={5}>5 minutes</option>
                  <option value={10}>10 minutes</option>
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={rememberChoice}
                  onCheckedChange={(checked) => setRememberChoice(checked as boolean)}
                />
                <Label htmlFor="remember" className="text-sm">
                  Remember my preference
                </Label>
              </div>
            </div>
          </div>

          {/* Additional Details Toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium">Show detailed analysis</span>
            <Button variant="ghost" size="sm" onClick={() => setShowDetails(!showDetails)}>
              {showDetails ? 'Hide' : 'Show'}
            </Button>
          </div>

          {showDetails && (
            <Card className="border border-gray-200">
              <CardContent className="p-4 space-y-3">
                <div>
                  <div className="text-sm font-medium mb-1">Adaptation Rationale</div>
                  <div className="text-sm text-gray-600">{adaptation.reason}</div>
                </div>

                <div>
                  <div className="text-sm font-medium mb-1">Expected Impact</div>
                  <div className="text-sm text-gray-600">
                    This adaptation is designed to improve your learning efficiency based on current
                    performance patterns and cognitive load indicators.
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium mb-1">Alternative Options</div>
                  <div className="text-sm text-gray-600">
                    You can always return to current content or request different adaptations as
                    your needs change during the session.
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handlePostpone} className="flex-1">
            Postpone {postponeMinutes}m
          </Button>

          <Button variant="outline" onClick={handleDecline}>
            <XCircle className="h-4 w-4 mr-2" />
            Decline
          </Button>

          <Button onClick={handleAccept} disabled={!selectedOption} className="flex-1">
            <CheckCircle className="h-4 w-4 mr-2" />
            Accept Adaptation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Content adaptation history tracker
export class ContentAdaptationTracker {
  private static instance: ContentAdaptationTracker
  private adaptationHistory: Map<
    string,
    {
      sessionId: string
      adaptation: ContentAdaptation
      timestamp: Date
      effectiveness?: number // 0-100, measured after completion
    }[]
  > = new Map()

  static getInstance(): ContentAdaptationTracker {
    if (!ContentAdaptationTracker.instance) {
      ContentAdaptationTracker.instance = new ContentAdaptationTracker()
    }
    return ContentAdaptationTracker.instance
  }

  recordAdaptation(sessionId: string, adaptation: ContentAdaptation): void {
    const record = {
      sessionId,
      adaptation,
      timestamp: new Date(),
    }

    if (!this.adaptationHistory.has(sessionId)) {
      this.adaptationHistory.set(sessionId, [])
    }

    const sessionHistory = this.adaptationHistory.get(sessionId)!
    sessionHistory.push(record)

    // Keep only last 20 adaptations per session
    if (sessionHistory.length > 20) {
      sessionHistory.shift()
    }
  }

  recordEffectiveness(sessionId: string, adaptationId: string, effectiveness: number): void {
    const sessionHistory = this.adaptationHistory.get(sessionId) || []
    const adaptationRecord = sessionHistory.find(
      (r) => r.adaptation.recommendation === adaptationId,
    )

    if (adaptationRecord) {
      adaptationRecord.effectiveness = effectiveness
    }
  }

  getUserPreferences(): {
    preferredDifficulty: 'easier' | 'same' | 'harder'
    preferredContentType: 'visual' | 'interactive' | 'review'
    adaptationAcceptanceRate: number
  } {
    // Analyze all adaptation history to determine preferences
    const allAdaptations = Array.from(this.adaptationHistory.values()).flat()

    const difficultyCounts = { easier: 0, same: 0, harder: 0 }
    const contentTypeCounts = { visual: 0, interactive: 0, review: 0 }
    let acceptedCount = 0

    allAdaptations.forEach((record) => {
      if (record.adaptation.userChoice === 'accept') {
        acceptedCount++

        // Extract preferences from the recommendation
        const rec = record.adaptation.recommendation.toLowerCase()
        if (rec.includes('easier')) difficultyCounts.easier++
        if (rec.includes('harder') || rec.includes('challenge')) difficultyCounts.harder++
        if (rec.includes('visual')) contentTypeCounts.visual++
        if (rec.includes('interactive')) contentTypeCounts.interactive++
        if (rec.includes('review') || rec.includes('fundamental')) contentTypeCounts.review++
      }
    })

    const totalAdaptations = allAdaptations.length
    const preferredDifficulty = Object.entries(difficultyCounts).sort(
      ([, a], [, b]) => b - a,
    )[0][0] as 'easier' | 'same' | 'harder'
    const preferredContentType = Object.entries(contentTypeCounts).sort(
      ([, a], [, b]) => b - a,
    )[0][0] as 'visual' | 'interactive' | 'review'
    const adaptationAcceptanceRate =
      totalAdaptations > 0 ? (acceptedCount / totalAdaptations) * 100 : 0

    return {
      preferredDifficulty,
      preferredContentType,
      adaptationAcceptanceRate,
    }
  }
}

export const contentAdaptationTracker = ContentAdaptationTracker.getInstance()
