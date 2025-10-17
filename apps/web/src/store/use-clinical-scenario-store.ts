/**
 * Clinical Scenario Store - Story 4.2
 *
 * Zustand store for managing clinical reasoning scenario workflow state.
 * Handles stage progression, user choices, timing, and submission.
 */

import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type {
  ClinicalScenario,
  UserChoices,
  ClinicalReasoningEvaluation,
  ClinicalScenarioStore as IClinicalScenarioStore,
  StageInfo,
  TimerInfo,
  ScenarioProgress,
} from '@/types/clinical-scenarios'

// Store state interface
interface ClinicalScenarioStoreState extends IClinicalScenarioStore {
  // Additional computed state for UI components
  currentStageInfo: StageInfo | null
  timerInfo: TimerInfo
  progressInfo: ScenarioProgress | null
  canGoNext: boolean
  canGoPrevious: boolean
  canSubmit: boolean
}

// Create the store
export const useClinicalScenarioStore = create<ClinicalScenarioStoreState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentScenario: null,
      userChoices: {},
      currentStage: 0,
      timeSpent: 0,
      stageStartTime: 0,
      isCompleted: false,
      evaluation: null,
      isLoading: false,
      error: null,

      // Computed state
      currentStageInfo: null,
      timerInfo: {
        elapsed: 0,
        stageElapsed: 0,
        formattedTime: '00:00',
        formattedStageTime: '00:00',
      },
      progressInfo: null,
      canGoNext: false,
      canGoPrevious: false,
      canSubmit: false,

      // Actions
      setCurrentScenario: (scenario: ClinicalScenario) => {
        const now = Date.now()
        set({
          currentScenario: scenario,
          userChoices: {},
          currentStage: 0,
          timeSpent: 0,
          stageStartTime: now,
          isCompleted: false,
          evaluation: null,
          error: null,
        })
        get().updateComputedState()
      },

      addChoice: (stageId: string, choice: any) => {
        const { userChoices, stageStartTime } = get()
        const now = Date.now()
        const stageTimeSpent = stageStartTime ? now - stageStartTime : 0

        set({
          userChoices: {
            ...userChoices,
            [stageId]: {
              ...userChoices[stageId],
              ...choice,
              timeSpent: (userChoices[stageId]?.timeSpent || 0) + stageTimeSpent,
            },
          },
          stageStartTime: now,
        })
        get().updateComputedState()
      },

      nextStage: () => {
        const { currentStage, currentScenario, stageStartTime } = get()
        if (!currentScenario) return

        const totalStages = currentScenario.caseText.questions.length
        if (currentStage < totalStages - 1) {
          const now = Date.now()
          const stageTimeSpent = stageStartTime ? now - stageStartTime : 0

          set({
            currentStage: currentStage + 1,
            timeSpent: get().timeSpent + stageTimeSpent,
            stageStartTime: now,
          })
          get().updateComputedState()
        }
      },

      previousStage: () => {
        const { currentStage, stageStartTime } = get()
        if (currentStage > 0) {
          const now = Date.now()
          const stageTimeSpent = stageStartTime ? now - stageStartTime : 0

          set({
            currentStage: currentStage - 1,
            timeSpent: get().timeSpent + stageTimeSpent,
            stageStartTime: now,
          })
          get().updateComputedState()
        }
      },

      requestInfo: (info: string) => {
        const { currentStage, currentScenario, userChoices } = get()
        if (!currentScenario) return

        const currentQuestion = currentScenario.caseText.questions[currentStage]
        const stageId = currentQuestion.id

        const existingRequestedInfo = userChoices[stageId]?.requestedInfo || []
        if (!existingRequestedInfo.includes(info)) {
          get().addChoice(stageId, {
            requestedInfo: [...existingRequestedInfo, info],
          })
        }
      },

      submitScenario: async (reasoning: string) => {
        const {
          currentScenario,
          userChoices,
          timeSpent,
          stageStartTime,
          sessionId
        } = get()

        if (!currentScenario) {
          set({ error: 'No scenario to submit' })
          return
        }

        set({ isLoading: true, error: null })

        try {
          // Calculate final time including current stage
          const finalTimeSpent = timeSpent + (stageStartTime ? Date.now() - stageStartTime : 0)

          // Call the submit API endpoint
          const response = await fetch('/api/validation/scenarios/submit', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-User-Email': 'kevy@americano.dev', // TODO: Get from auth
            },
            body: JSON.stringify({
              scenarioId: currentScenario.id,
              sessionId,
              userChoices,
              userReasoning: reasoning,
              timeSpent: Math.floor(finalTimeSpent / 1000), // Convert to seconds
            }),
          })

          if (!response.ok) {
            throw new Error('Failed to submit scenario')
          }

          const result = await response.json()

          set({
            evaluation: result.evaluation,
            isCompleted: true,
            timeSpent: finalTimeSpent,
            isLoading: false,
          })
          get().updateComputedState()

        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to submit scenario',
            isLoading: false,
          })
        }
      },

      reset: () => {
        set({
          currentScenario: null,
          userChoices: {},
          currentStage: 0,
          timeSpent: 0,
          stageStartTime: 0,
          isCompleted: false,
          evaluation: null,
          error: null,
          isLoading: false,
        })
        get().updateComputedState()
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },

      setError: (error: string | null) => {
        set({ error })
      },

      // Internal method to update computed state
      updateComputedState: () => {
        const state = get()
        const {
          currentScenario,
          currentStage,
          userChoices,
          timeSpent,
          stageStartTime,
          isCompleted,
        } = state

        if (!currentScenario) {
          set({
            currentStageInfo: null,
            progressInfo: null,
            canGoNext: false,
            canGoPrevious: false,
            canSubmit: false,
          })
          return
        }

        // Update timer info
        const now = Date.now()
        const totalElapsed = timeSpent + (stageStartTime ? now - stageStartTime : 0)
        const stageElapsed = stageStartTime ? now - stageStartTime : 0

        const formatTime = (ms: number) => {
          const seconds = Math.floor(ms / 1000)
          const minutes = Math.floor(seconds / 60)
          const remainingSeconds = seconds % 60
          return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
        }

        const timerInfo: TimerInfo = {
          elapsed: Math.floor(totalElapsed / 1000),
          stageElapsed: Math.floor(stageElapsed / 1000),
          formattedTime: formatTime(totalElapsed),
          formattedStageTime: formatTime(stageElapsed),
        }

        // Update stage info
        const currentQuestion = currentScenario.caseText.questions[currentStage]
        const stageInfo: StageInfo = {
          id: currentQuestion.id,
          title: getStageTitle(currentQuestion.stage),
          description: getStageDescription(currentQuestion.stage),
          isCompleted: !!userChoices[currentQuestion.id]?.selectedAnswer,
          isCurrent: true,
          timeSpent: userChoices[currentQuestion.id]?.timeSpent || 0,
        }

        // Update progress info
        const totalStages = currentScenario.caseText.questions.length
        const completedStages = Object.keys(userChoices).filter(
          stageId => userChoices[stageId]?.selectedAnswer
        ).length

        const progressInfo: ScenarioProgress = {
          currentStage,
          totalStages,
          completedStages,
          percentageComplete: Math.round((completedStages / totalStages) * 100),
          estimatedTimeRemaining: Math.max(0, (totalStages - currentStage - 1) * 2 * 60 * 1000), // 2 min per remaining stage
        }

        // Update navigation state
        const canGoNext = currentStage < totalStages - 1 && !isCompleted
        const canGoPrevious = currentStage > 0 && !isCompleted
        const canSubmit = completedStages === totalStages && !isCompleted

        set({
          timerInfo,
          currentStageInfo: stageInfo,
          progressInfo,
          canGoNext,
          canGoPrevious,
          canSubmit,
        })
      },
    }),
    {
      name: 'clinical-scenario-storage',
      storage: createJSONStorage(() => sessionStorage), // Use sessionStorage for scenario state
      partialize: (state) => ({
        // Only persist essential state, exclude computed values
        currentScenario: state.currentScenario,
        userChoices: state.userChoices,
        currentStage: state.currentStage,
        timeSpent: state.timeSpent,
        stageStartTime: state.stageStartTime,
        isCompleted: state.isCompleted,
        evaluation: state.evaluation,
      }),
    }
  )
)

// Helper functions for stage information
function getStageTitle(stage: string): string {
  const titles = {
    history: 'History Taking',
    physical: 'Physical Examination',
    workup: 'Diagnostic Workup',
    diagnosis: 'Diagnosis',
    management: 'Management',
  }
  return titles[stage as keyof typeof titles] || stage
}

function getStageDescription(stage: string): string {
  const descriptions = {
    history: 'Gather relevant patient history',
    physical: 'Perform focused physical exam',
    workup: 'Order appropriate tests and imaging',
    diagnosis: 'Formulate differential and final diagnosis',
    management: 'Plan treatment and follow-up',
  }
  return descriptions[stage as keyof typeof descriptions] || ''
}

// Export hooks for specific use cases
export const useScenarioTimer = () => {
  const timerInfo = useClinicalScenarioStore(state => state.timerInfo)
  return timerInfo
}

export const useScenarioProgress = () => {
  const progressInfo = useClinicalScenarioStore(state => state.progressInfo)
  const currentStageInfo = useClinicalScenarioStore(state => state.currentStageInfo)
  return { progressInfo, currentStageInfo }
}

export const useScenarioNavigation = () => {
  const canGoNext = useClinicalScenarioStore(state => state.canGoNext)
  const canGoPrevious = useClinicalScenarioStore(state => state.canGoPrevious)
  const canSubmit = useClinicalScenarioStore(state => state.canSubmit)
  const nextStage = useClinicalScenarioStore(state => state.nextStage)
  const previousStage = useClinicalScenarioStore(state => state.previousStage)
  const submitScenario = useClinicalScenarioStore(state => state.submitScenario)

  return {
    canGoNext,
    canGoPrevious,
    canSubmit,
    nextStage,
    previousStage,
    submitScenario,
  }
}