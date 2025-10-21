import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Story 4.6: Understanding Analytics Store
 *
 * Manages global state for the understanding analytics dashboard:
 * - Date range filter (7d, 30d, 90d)
 * - Course filter (optional)
 * - Topic filter (optional)
 * - Active tab selection
 *
 * Persisted to localStorage for filter persistence across sessions.
 */

export type DateRange = '7d' | '30d' | '90d'

export type Tab =
  | 'overview'
  | 'comparison'
  | 'patterns'
  | 'progress'
  | 'predictions'
  | 'relationships'
  | 'benchmarks'
  | 'recommendations'

interface UnderstandingAnalyticsState {
  // Filters
  dateRange: DateRange
  courseId: string | null
  topic: string | null

  // UI state
  activeTab: Tab
  refreshTimestamp: number | null

  // Actions
  setDateRange: (range: DateRange) => void
  setCourseFilter: (courseId: string | null) => void
  setTopicFilter: (topic: string | null) => void
  setActiveTab: (tab: Tab) => void
  refreshData: () => void
  clearFilters: () => void
}

export const useUnderstandingAnalyticsStore = create<UnderstandingAnalyticsState>()(
  persist(
    (set) => ({
      // Initial state
      dateRange: '30d',
      courseId: null,
      topic: null,
      activeTab: 'overview',
      refreshTimestamp: null,

      // Actions
      setDateRange: (range) =>
        set({ dateRange: range, refreshTimestamp: Date.now() }),

      setCourseFilter: (courseId) =>
        set({ courseId, refreshTimestamp: Date.now() }),

      setTopicFilter: (topic) =>
        set({ topic, refreshTimestamp: Date.now() }),

      setActiveTab: (tab) =>
        set({ activeTab: tab }),

      refreshData: () =>
        set({ refreshTimestamp: Date.now() }),

      clearFilters: () =>
        set({
          courseId: null,
          topic: null,
          dateRange: '30d',
          refreshTimestamp: Date.now(),
        }),
    }),
    {
      name: 'understanding-analytics-storage',
      partialize: (state) => ({
        dateRange: state.dateRange,
        courseId: state.courseId,
        topic: state.topic,
        activeTab: state.activeTab,
      }),
    }
  )
)
