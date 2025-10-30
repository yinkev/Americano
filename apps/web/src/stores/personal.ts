import { create } from 'zustand'

type TimeRange = '7d' | '30d' | '90d' | '1y' | 'all'

interface PersonalState {
  timeRange: TimeRange
  objectiveId: string | null
  setTimeRange: (r: TimeRange) => void
  setObjectiveId: (id: string | null) => void
}

export const usePersonalStore = create<PersonalState>((set) => ({
  timeRange: '7d',
  objectiveId: null,
  setTimeRange: (timeRange) => set({ timeRange }),
  setObjectiveId: (objectiveId) => set({ objectiveId }),
}))
