/**
 * Real-Time Session Orchestration Service
 * Story 5.3 Task 2: Real-time monitoring and adaptation during study sessions
 *
 * Monitors performance metrics, detects trends, and triggers orchestration adjustments
 * Provides intelligent break prompts, content adaptations, and session recommendations
 */

export interface PerformanceMetrics {
  accuracy: number // 0-100
  avgResponseTime: number // milliseconds
  engagementScore: number // 0-100
  fatigueIndicator: number // 0-100 (higher = more fatigued)
  trend: 'improving' | 'stable' | 'declining'
  trendStrength: number // 0-100 (how strong the trend is)
}

export interface RealtimeOrchestrationPlan {
  sessionId: string
  missionId?: string
  currentPhase: 'content' | 'cards' | 'assessment' | 'break'
  timeInCurrentPhase: number // milliseconds
  estimatedPhaseEndTime?: Date
  upcomingBreaks: Array<{
    type: 'scheduled' | 'performance' | 'fatigue'
    estimatedTime: Date
    reason: string
    isRecommended: boolean
  }>
  performanceScore: number // 0-100 overall
  currentPerformance: PerformanceMetrics
  adaptations: {
    contentDifficulty: 'easier' | 'same' | 'harder'
    suggestedBreak: boolean
    sessionExtension: boolean
    earlyCompletion: boolean
    reason: string
  }
}

export interface SessionEvent {
  type: 'answer' | 'pause' | 'resume' | 'objective_complete' | 'card_review'
  timestamp: Date
  data: {
    correct?: boolean
    responseTime?: number
    confidence?: number // 1-5
    objectiveId?: string
    cardRating?: 'AGAIN' | 'HARD' | 'GOOD' | 'EASY'
  }
}

export interface BreakRecommendation {
  type: 'scheduled' | 'performance_drop' | 'fatigue_detected' | 'objectives_completed'
  urgency: 'low' | 'medium' | 'high'
  message: string
  estimatedBreakDuration: number // minutes
  canPostpone: boolean
  canSkip: boolean
  reason: string
}

export interface ContentAdaptation {
  type: 'difficulty_adjust' | 'content_switch' | 'sequence_change'
  recommendation: string
  reason: string
  userChoice: 'accept' | 'decline' | 'postpone'
}

export interface SessionRecommendation {
  type: 'extend' | 'complete_early' | 'continue'
  reason: string
  confidence: number // 0-100
  userChoice?: 'accept' | 'decline'
}

export class RealtimeOrchestrationService {
  private sessionId: string | null = null
  private missionId: string | null = null
  private sessionStartTime: number | null = null
  private currentPhaseStartTime: number | null = null
  private performanceHistory: PerformanceMetrics[] = []
  private sessionEvents: SessionEvent[] = []
  private monitoringInterval: NodeJS.Timeout | null = null
  private lastBreakTime: number | null = null
  private objectivesCompletedInSession = 0

  // Performance tracking windows
  private readonly PERFORMANCE_WINDOW_SIZE = 5 // Last 5 measurements
  private readonly MONITORING_INTERVAL_MS = 60000 // Check every minute
  private readonly BREAK_COOLDOWN_MS = 15 * 60 * 1000 // 15 minutes between breaks

  /**
   * Initialize real-time orchestration for a study session
   */
  async initializeSession(
    sessionId: string,
    missionId?: string | null,
    initialPhase: 'content' | 'cards' | 'assessment' = 'content',
  ): Promise<RealtimeOrchestrationPlan> {
    this.sessionId = sessionId
    this.missionId = missionId || null
    this.sessionStartTime = Date.now()
    this.currentPhaseStartTime = Date.now()
    this.performanceHistory = []
    this.sessionEvents = []
    this.objectivesCompletedInSession = 0
    this.lastBreakTime = null

    // Start monitoring
    this.startRealtimeMonitoring()

    return this.generateCurrentOrchestrationPlan(initialPhase)
  }

  /**
   * Record a session event for performance tracking
   */
  recordEvent(event: SessionEvent): void {
    this.sessionEvents.push(event)

    // Process different event types
    switch (event.type) {
      case 'answer':
        this.processAnswerEvent(event)
        break
      case 'objective_complete':
        this.processObjectiveComplete(event)
        break
      case 'card_review':
        this.processCardReview(event)
        break
      case 'pause':
      case 'resume':
        this.processPhaseChangeEvent(event)
        break
    }

    // Keep only recent events (last 50)
    if (this.sessionEvents.length > 50) {
      this.sessionEvents = this.sessionEvents.slice(-50)
    }
  }

  /**
   * Process answer events for performance calculation
   */
  private processAnswerEvent(event: SessionEvent): void {
    if (event.data.correct !== undefined && event.data.responseTime) {
      // Update performance metrics
      const recentEvents = this.sessionEvents
        .filter((e) => e.type === 'answer' && Date.now() - e.timestamp.getTime() < 10 * 60 * 1000) // Last 10 minutes
        .slice(-10) // Last 10 answers

      if (recentEvents.length > 0) {
        const accuracy =
          (recentEvents.filter((e) => e.data.correct).length / recentEvents.length) * 100
        const avgResponseTime =
          recentEvents.reduce((sum, e) => sum + (e.data.responseTime || 0), 0) / recentEvents.length
        const engagementScore = this.calculateEngagementScore(recentEvents)

        const metrics: PerformanceMetrics = {
          accuracy: Math.round(accuracy),
          avgResponseTime: Math.round(avgResponseTime),
          engagementScore,
          fatigueIndicator: this.calculateFatigueIndicator(),
          trend: this.calculatePerformanceTrend(),
          trendStrength: this.calculateTrendStrength(),
        }

        this.updatePerformanceHistory(metrics)
      }
    }
  }

  /**
   * Process objective completion events
   */
  private processObjectiveComplete(event: SessionEvent): void {
    this.objectivesCompletedInSession++

    // Check if break is recommended after objective completion
    const breakRecommendation = this.evaluateObjectiveCompletionBreak()
    if (breakRecommendation) {
      this.triggerBreakNotification(breakRecommendation)
    }
  }

  /**
   * Process card review events for spaced repetition performance
   */
  private processCardReview(event: SessionEvent): void {
    // Card reviews are good indicators of retention and difficulty
    const recentCardEvents = this.sessionEvents
      .filter(
        (e) => e.type === 'card_review' && Date.now() - e.timestamp.getTime() < 15 * 60 * 1000,
      ) // Last 15 minutes
      .slice(-20) // Last 20 cards

    if (recentCardEvents.length > 0) {
      const goodCards = recentCardEvents.filter((e) =>
        ['GOOD', 'EASY'].includes(e.data.cardRating || ''),
      ).length

      const cardAccuracy = (goodCards / recentCardEvents.length) * 100

      // Update performance based on card performance
      if (cardAccuracy < 60) {
        this.triggerContentAdaptation({
          type: 'difficulty_adjust',
          recommendation: 'Consider reviewing easier content first',
          reason: 'Card review performance suggests current content is too challenging',
          userChoice: 'postpone',
        })
      }
    }
  }

  /**
   * Process pause/resume events
   */
  private processPhaseChangeEvent(event: SessionEvent): void {
    this.currentPhaseStartTime = Date.now()

    if (event.type === 'resume') {
      // After returning from break, check performance recovery
      this.evaluatePostBreakPerformance()
    }
  }

  /**
   * Start real-time monitoring interval
   */
  private startRealtimeMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
    }

    this.monitoringInterval = setInterval(() => {
      this.performRealtimeCheck()
    }, this.MONITORING_INTERVAL_MS)
  }

  /**
   * Perform real-time check for adaptations
   */
  private performRealtimeCheck(): void {
    if (!this.sessionStartTime) return

    const currentMetrics = this.getCurrentPerformanceMetrics()
    const adaptations = this.evaluateRequiredAdaptations(currentMetrics)

    // Trigger notifications based on adaptations
    if (adaptations.suggestedBreak && this.shouldSuggestBreak()) {
      this.triggerBreakNotification(this.createBreakRecommendation('performance_drop'))
    }

    if (adaptations.contentDifficulty !== 'same') {
      this.triggerContentAdaptation({
        type: 'difficulty_adjust',
        recommendation: `Try ${adaptations.contentDifficulty} content`,
        reason: adaptations.reason,
        userChoice: 'postpone',
      })
    }

    // Check for session recommendations
    const sessionRec = this.evaluateSessionRecommendations(currentMetrics)
    if (sessionRec.type !== 'continue') {
      this.triggerSessionRecommendation(sessionRec)
    }
  }

  /**
   * Generate current orchestration plan
   */
  generateCurrentOrchestrationPlan(
    currentPhase: 'content' | 'cards' | 'assessment' | 'break' = 'content',
  ): RealtimeOrchestrationPlan {
    const currentMetrics = this.getCurrentPerformanceMetrics()
    const adaptations = this.evaluateRequiredAdaptations(currentMetrics)
    const upcomingBreaks = this.calculateUpcomingBreaks()

    return {
      sessionId: this.sessionId!,
      missionId: this.missionId || undefined,
      currentPhase,
      timeInCurrentPhase: this.currentPhaseStartTime ? Date.now() - this.currentPhaseStartTime : 0,
      estimatedPhaseEndTime: this.calculatePhaseEndTime(currentPhase),
      upcomingBreaks,
      performanceScore: this.calculateOverallPerformanceScore(currentMetrics),
      currentPerformance: currentMetrics,
      adaptations,
    }
  }

  /**
   * Get current performance metrics
   */
  getCurrentPerformanceMetrics(): PerformanceMetrics {
    if (this.performanceHistory.length === 0) {
      return {
        accuracy: 0,
        avgResponseTime: 0,
        engagementScore: 100,
        fatigueIndicator: 0,
        trend: 'stable',
        trendStrength: 0,
      }
    }

    return this.performanceHistory[this.performanceHistory.length - 1]
  }

  /**
   * Update performance history
   */
  private updatePerformanceHistory(metrics: PerformanceMetrics): void {
    this.performanceHistory.push(metrics)

    // Keep only recent measurements
    if (this.performanceHistory.length > this.PERFORMANCE_WINDOW_SIZE) {
      this.performanceHistory = this.performanceHistory.slice(-this.PERFORMANCE_WINDOW_SIZE)
    }
  }

  /**
   * Calculate engagement score based on interaction patterns
   */
  private calculateEngagementScore(recentEvents: SessionEvent[]): number {
    const now = Date.now()
    const recentInteractions = recentEvents.filter(
      (e) => now - e.timestamp.getTime() < 5 * 60 * 1000, // Last 5 minutes
    ).length

    // Higher score for more consistent interactions
    const baseScore = Math.min(100, recentInteractions * 10)

    // Penalty for long periods of inactivity
    const lastInteraction = recentEvents[recentEvents.length - 1]?.timestamp.getTime() || now
    const inactivityPenalty = Math.max(0, (now - lastInteraction - 2 * 60 * 1000) / 1000) // Penalty after 2 minutes

    return Math.max(0, Math.round(baseScore - inactivityPenalty))
  }

  /**
   * Calculate fatigue indicator based on session duration and performance patterns
   */
  private calculateFatigueIndicator(): number {
    if (!this.sessionStartTime) return 0

    const sessionDuration = Date.now() - this.sessionStartTime
    const baseFatigue = Math.min(100, (sessionDuration / (90 * 60 * 1000)) * 100) // 90 minutes = full fatigue

    // Increase fatigue if performance is declining
    const currentMetrics = this.getCurrentPerformanceMetrics()
    const performanceFatigue =
      currentMetrics.trend === 'declining' ? currentMetrics.trendStrength * 0.5 : 0

    return Math.min(100, Math.round(baseFatigue + performanceFatigue))
  }

  /**
   * Calculate performance trend
   */
  private calculatePerformanceTrend(): 'improving' | 'stable' | 'declining' {
    if (this.performanceHistory.length < 3) return 'stable'

    const recent = this.performanceHistory.slice(-3)
    const accuracyTrend = recent[2].accuracy - recent[0].accuracy
    const engagementTrend = recent[2].engagementScore - recent[0].engagementScore

    const overallTrend = (accuracyTrend + engagementTrend) / 2

    if (overallTrend > 10) return 'improving'
    if (overallTrend < -10) return 'declining'
    return 'stable'
  }

  /**
   * Calculate trend strength
   */
  private calculateTrendStrength(): number {
    if (this.performanceHistory.length < 3) return 0

    const recent = this.performanceHistory.slice(-3)
    const accuracyChange = Math.abs(recent[2].accuracy - recent[0].accuracy)
    const engagementChange = Math.abs(recent[2].engagementScore - recent[0].engagementScore)

    return Math.min(100, Math.round((accuracyChange + engagementChange) / 2))
  }

  /**
   * Calculate overall performance score
   */
  private calculateOverallPerformanceScore(metrics: PerformanceMetrics): number {
    const weights = {
      accuracy: 0.4,
      engagement: 0.3,
      speed: 0.2, // Inverse of response time
      fatigue: 0.1, // Inverse of fatigue
    }

    const speedScore = Math.max(0, 100 - (metrics.avgResponseTime / 30000) * 100) // 30s = 0 score
    const fatigueScore = Math.max(0, 100 - metrics.fatigueIndicator)

    return Math.round(
      metrics.accuracy * weights.accuracy +
        metrics.engagementScore * weights.engagement +
        speedScore * weights.speed +
        fatigueScore * weights.fatigue,
    )
  }

  /**
   * Evaluate required adaptations based on current performance
   */
  private evaluateRequiredAdaptations(
    metrics: PerformanceMetrics,
  ): RealtimeOrchestrationPlan['adaptations'] {
    const adaptations = {
      contentDifficulty: 'same' as 'easier' | 'same' | 'harder',
      suggestedBreak: false,
      sessionExtension: false,
      earlyCompletion: false,
      reason: '',
    }

    // Performance-based adaptations
    if (metrics.accuracy < 60) {
      adaptations.contentDifficulty = 'easier'
      adaptations.reason = 'Low accuracy detected - suggest easier content'
    } else if (metrics.accuracy > 90 && metrics.trend === 'improving') {
      adaptations.contentDifficulty = 'harder'
      adaptations.reason = 'High performance and improving - ready for challenge'
    }

    // Fatigue-based break suggestions
    if (metrics.fatigueIndicator > 70 || metrics.trend === 'declining') {
      adaptations.suggestedBreak = true
      adaptations.reason +=
        (adaptations.reason ? ' ' : '') + 'Fatigue or performance decline detected'
    }

    // Session recommendations based on performance and time
    const sessionDuration = this.sessionStartTime ? Date.now() - this.sessionStartTime : 0
    const performanceScore = this.calculateOverallPerformanceScore(metrics)
    if (sessionDuration > 60 * 60 * 1000 && performanceScore > 80) {
      // 1 hour + good performance
      adaptations.sessionExtension = true
      adaptations.reason +=
        (adaptations.reason ? ' ' : '') + 'Strong performance suggests session extension'
    }

    return adaptations
  }

  /**
   * Calculate upcoming breaks
   */
  private calculateUpcomingBreaks(): RealtimeOrchestrationPlan['upcomingBreaks'] {
    const breaks: RealtimeOrchestrationPlan['upcomingBreaks'] = []
    const now = Date.now()

    // Scheduled break (every 45 minutes)
    const sessionDuration = now - (this.sessionStartTime || now)
    const nextScheduledBreak = 45 * 60 * 1000 - (sessionDuration % (45 * 60 * 1000))

    if (nextScheduledBreak < 10 * 60 * 1000) {
      // Within 10 minutes
      breaks.push({
        type: 'scheduled',
        estimatedTime: new Date(now + nextScheduledBreak),
        reason: 'Regularly scheduled break',
        isRecommended: false,
      })
    }

    // Performance-based break if trending down
    const metrics = this.getCurrentPerformanceMetrics()
    if (metrics.trend === 'declining' && metrics.trendStrength > 30) {
      breaks.push({
        type: 'performance',
        estimatedTime: new Date(now + 5 * 60 * 1000), // 5 minutes from now
        reason: 'Performance decline detected',
        isRecommended: true,
      })
    }

    return breaks
  }

  /**
   * Calculate phase end time
   */
  private calculatePhaseEndTime(phase: string): Date | undefined {
    if (!this.currentPhaseStartTime) return undefined

    const avgPhaseDurations = {
      content: 25 * 60 * 1000, // 25 minutes
      cards: 15 * 60 * 1000, // 15 minutes
      assessment: 10 * 60 * 1000, // 10 minutes
      break: 5 * 60 * 1000, // 5 minutes
    }

    return new Date(
      this.currentPhaseStartTime +
        (avgPhaseDurations[phase as keyof typeof avgPhaseDurations] || 20 * 60 * 1000),
    )
  }

  /**
   * Check if break should be suggested
   */
  private shouldSuggestBreak(): boolean {
    if (!this.lastBreakTime) return true

    const timeSinceLastBreak = Date.now() - this.lastBreakTime
    return timeSinceLastBreak > this.BREAK_COOLDOWN_MS
  }

  /**
   * Create break recommendation
   */
  private createBreakRecommendation(type: BreakRecommendation['type']): BreakRecommendation {
    const metrics = this.getCurrentPerformanceMetrics()

    switch (type) {
      case 'performance_drop':
        return {
          type: 'performance_drop',
          urgency: metrics.trendStrength > 50 ? 'high' : 'medium',
          message: `Your accuracy has dropped ${Math.round(metrics.trendStrength)}%. Take a break to recharge?`,
          estimatedBreakDuration: 5,
          canPostpone: true,
          canSkip: true,
          reason: 'Performance decline detected',
        }

      case 'fatigue_detected':
        return {
          type: 'fatigue_detected',
          urgency: metrics.fatigueIndicator > 80 ? 'high' : 'medium',
          message: `Fatigue level at ${Math.round(metrics.fatigueIndicator)}%. A short break could help maintain focus.`,
          estimatedBreakDuration: 10,
          canPostpone: true,
          canSkip: false,
          reason: 'High fatigue detected',
        }

      case 'objectives_completed':
        return {
          type: 'objectives_completed',
          urgency: 'low',
          message: `Great job completing ${this.objectivesCompletedInSession} objectives! Ready for a quick break?`,
          estimatedBreakDuration: 5,
          canPostpone: true,
          canSkip: true,
          reason: 'Objective milestone reached',
        }

      default:
        return {
          type: 'scheduled',
          urgency: 'low',
          message: 'Time for a scheduled break to maintain optimal performance.',
          estimatedBreakDuration: 5,
          canPostpone: true,
          canSkip: true,
          reason: 'Scheduled break time',
        }
    }
  }

  /**
   * Evaluate break recommendation after objective completion
   */
  private evaluateObjectiveCompletionBreak(): BreakRecommendation | null {
    const metrics = this.getCurrentPerformanceMetrics()

    // Suggest break every 2-3 objectives or if performance is declining
    if (this.objectivesCompletedInSession % 2 === 0 || metrics.trend === 'declining') {
      return this.createBreakRecommendation('objectives_completed')
    }

    return null
  }

  /**
   * Evaluate session recommendations
   */
  private evaluateSessionRecommendations(metrics: PerformanceMetrics): SessionRecommendation {
    const sessionDuration = this.sessionStartTime ? Date.now() - this.sessionStartTime : 0
    const objectivesRemaining = this.objectivesCompletedInSession < 3 // Placeholder logic
    const performanceScore = this.calculateOverallPerformanceScore(metrics)

    // High performance + time available = suggest extension
    if (performanceScore > 85 && sessionDuration > 45 * 60 * 1000 && objectivesRemaining) {
      return {
        type: 'extend',
        reason: `Strong performance (${performanceScore}/100). Consider extending session to master more content.`,
        confidence: 80,
      }
    }

    // Objectives complete + high performance = suggest early completion
    if (!objectivesRemaining && performanceScore > 75) {
      return {
        type: 'complete_early',
        reason: 'All objectives mastered with strong performance. Session complete!',
        confidence: 90,
      }
    }

    // High fatigue + poor performance = suggest wrapping up
    if (metrics.fatigueIndicator > 80 && performanceScore < 60) {
      return {
        type: 'complete_early',
        reason: 'High fatigue detected and performance declining. Best to stop for today.',
        confidence: 70,
      }
    }

    return {
      type: 'continue',
      reason: 'Continue with current plan',
      confidence: 100,
    }
  }

  /**
   * Evaluate post-break performance recovery
   */
  private evaluatePostBreakPerformance(): void {
    // Compare performance before and after break
    const beforeBreak = this.performanceHistory.slice(-3, -1)
    const afterBreak = this.performanceHistory.slice(-1)

    if (beforeBreak.length > 0 && afterBreak.length > 0) {
      const beforeAvg = beforeBreak.reduce((sum, m) => sum + m.accuracy, 0) / beforeBreak.length
      const afterAvg = afterBreak[0].accuracy

      const recovery = afterAvg - beforeAvg
      if (recovery > 15) {
        console.log(`Effective break: ${Math.round(recovery)}% accuracy improvement`)
      }
    }
  }

  /**
   * Trigger break notification (to be handled by UI)
   */
  private triggerBreakNotification(recommendation: BreakRecommendation): void {
    // This would emit an event or call a callback provided by the UI
    console.log('Break recommendation:', recommendation)
    // TODO: Implement event emitter or callback mechanism
  }

  /**
   * Trigger content adaptation (to be handled by UI)
   */
  private triggerContentAdaptation(adaptation: ContentAdaptation): void {
    console.log('Content adaptation:', adaptation)
    // TODO: Implement event emitter or callback mechanism
  }

  /**
   * Trigger session recommendation (to be handled by UI)
   */
  private triggerSessionRecommendation(recommendation: SessionRecommendation): void {
    console.log('Session recommendation:', recommendation)
    // TODO: Implement event emitter or callback mechanism
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }

    this.sessionId = null
    this.missionId = null
    this.sessionStartTime = null
    this.currentPhaseStartTime = null
    this.performanceHistory = []
    this.sessionEvents = []
    this.lastBreakTime = null
    this.objectivesCompletedInSession = 0
  }

  /**
   * Get session summary for analytics
   */
  getSessionSummary(): {
    sessionId: string
    duration: number
    totalEvents: number
    objectivesCompleted: number
    averagePerformance: number
    breaksTaken: number
    adaptationsTriggered: number
  } {
    const duration = this.sessionStartTime ? Date.now() - this.sessionStartTime : 0
    const averagePerformance =
      this.performanceHistory.length > 0
        ? this.performanceHistory.reduce(
            (sum, m) => sum + this.calculateOverallPerformanceScore(m),
            0,
          ) / this.performanceHistory.length
        : 0

    return {
      sessionId: this.sessionId!,
      duration,
      totalEvents: this.sessionEvents.length,
      objectivesCompleted: this.objectivesCompletedInSession,
      averagePerformance: Math.round(averagePerformance),
      breaksTaken: this.sessionEvents.filter((e) => e.type === 'pause').length,
      adaptationsTriggered: 0, // TODO: Track adaptations triggered
    }
  }
}

// Singleton instance for the application
export const realtimeOrchestrationService = new RealtimeOrchestrationService()
