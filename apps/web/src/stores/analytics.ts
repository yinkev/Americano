/**
 * Analytics Store
 *
 * Manages analytics dashboard state including:
 * - Time range filtering (7d, 30d, 90d, 1y, all)
 * - Selected objectives (multi-select)
 * - Chart preferences (type, granularity)
 * - Export format preferences
 * - Comparison mode (self vs peers)
 *
 * Features:
 * - localStorage persistence with versioning
 * - Redux DevTools integration (dev only)
 * - Partial state persistence (only preferences)
 */

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

export type TimeRange = '7d' | '30d' | '90d' | '1y' | 'all'
export type ChartType = 'line' | 'bar' | 'area' | 'scatter'
export type ChartGranularity = 'daily' | 'weekly' | 'monthly'
export type ExportFormat = 'csv' | 'json' | 'pdf' | 'png'
export type ComparisonMode = 'self' | 'peers' | 'both'

interface AnalyticsState {
  // Filters (session state - not persisted)
  timeRange: TimeRange
  selectedObjectives: string[]
  comparisonMode: ComparisonMode

  // Preferences (persisted)
  chartType: ChartType
  chartGranularity: ChartGranularity
  exportFormat: ExportFormat

  // Actions
  setTimeRange: (range: TimeRange) => void
  setSelectedObjectives: (objectives: string[]) => void
  addObjective: (objectiveId: string) => void
  removeObjective: (objectiveId: string) => void
  toggleObjective: (objectiveId: string) => void
  clearObjectives: () => void
  setComparisonMode: (mode: ComparisonMode) => void
  setChartType: (type: ChartType) => void
  setChartGranularity: (granularity: ChartGranularity) => void
  setExportFormat: (format: ExportFormat) => void
  resetFilters: () => void
}

const initialState = {
  // Filters
  timeRange: '30d' as TimeRange,
  selectedObjectives: [],
  comparisonMode: 'self' as ComparisonMode,

  // Preferences
  chartType: 'line' as ChartType,
  chartGranularity: 'daily' as ChartGranularity,
  exportFormat: 'csv' as ExportFormat,
}

export const useAnalyticsStore = create<AnalyticsState>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        // Filter actions
        setTimeRange: (timeRange) => set({ timeRange }, false, 'analytics/setTimeRange'),

        setSelectedObjectives: (selectedObjectives) =>
          set({ selectedObjectives }, false, 'analytics/setSelectedObjectives'),

        addObjective: (objectiveId) =>
          set(
            (state) => ({
              selectedObjectives: state.selectedObjectives.includes(objectiveId)
                ? state.selectedObjectives
                : [...state.selectedObjectives, objectiveId],
            }),
            false,
            'analytics/addObjective',
          ),

        removeObjective: (objectiveId) =>
          set(
            (state) => ({
              selectedObjectives: state.selectedObjectives.filter((id) => id !== objectiveId),
            }),
            false,
            'analytics/removeObjective',
          ),

        toggleObjective: (objectiveId) =>
          set(
            (state) => ({
              selectedObjectives: state.selectedObjectives.includes(objectiveId)
                ? state.selectedObjectives.filter((id) => id !== objectiveId)
                : [...state.selectedObjectives, objectiveId],
            }),
            false,
            'analytics/toggleObjective',
          ),

        clearObjectives: () => set({ selectedObjectives: [] }, false, 'analytics/clearObjectives'),

        setComparisonMode: (comparisonMode) =>
          set({ comparisonMode }, false, 'analytics/setComparisonMode'),

        // Preference actions
        setChartType: (chartType) => set({ chartType }, false, 'analytics/setChartType'),

        setChartGranularity: (chartGranularity) =>
          set({ chartGranularity }, false, 'analytics/setChartGranularity'),

        setExportFormat: (exportFormat) =>
          set({ exportFormat }, false, 'analytics/setExportFormat'),

        // Reset
        resetFilters: () =>
          set(
            {
              timeRange: initialState.timeRange,
              selectedObjectives: initialState.selectedObjectives,
              comparisonMode: initialState.comparisonMode,
            },
            false,
            'analytics/resetFilters',
          ),
      }),
      {
        name: 'analytics-storage',
        version: 1,
        // Only persist preferences, not filters
        partialize: (state) => ({
          chartType: state.chartType,
          chartGranularity: state.chartGranularity,
          exportFormat: state.exportFormat,
        }),
        // Handle version migrations
        migrate: (persistedState: any, version) => {
          if (version === 0) {
            // Migration from v0 to v1
            return {
              ...persistedState,
              chartGranularity: persistedState.chartGranularity || 'daily',
            }
          }
          return persistedState
        },
      },
    ),
    {
      name: 'AnalyticsStore',
      enabled: process.env.NODE_ENV === 'development',
    },
  ),
)

// Selectors for performance optimization
export const selectTimeRange = (state: AnalyticsState) => state.timeRange
export const selectSelectedObjectives = (state: AnalyticsState) => state.selectedObjectives
export const selectChartPreferences = (state: AnalyticsState) => ({
  type: state.chartType,
  granularity: state.chartGranularity,
})
export const selectExportFormat = (state: AnalyticsState) => state.exportFormat
export const selectComparisonMode = (state: AnalyticsState) => state.comparisonMode
