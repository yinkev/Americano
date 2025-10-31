/**
 * Store Exports
 *
 * Centralized export for all Zustand stores and related utilities.
 * Import stores from this file to maintain consistency.
 */

// Analytics Store
export {
  type ChartGranularity,
  type ChartType,
  type ComparisonMode,
  type ExportFormat,
  selectChartPreferences,
  selectComparisonMode,
  selectExportFormat,
  selectSelectedObjectives,
  selectTimeRange,
  type TimeRange,
  useAnalyticsStore,
} from './analytics'
// Mission Store
export {
  type CalendarView,
  type MissionPriority,
  type MissionSort,
  type MissionStatus,
  selectActiveFiltersCount,
  selectActiveMissionId,
  selectCalendarView,
  selectFilters,
  selectPreferences as selectMissionPreferences,
  useMissionStore,
} from './mission'
// Personal Store (existing)
export { usePersonalStore } from './personal'

// Preferences Store
export {
  type DashboardLayout,
  type EmailDigest,
  type NotificationFrequency,
  selectAccessibility,
  selectChartStyle,
  selectDashboard,
  selectEmail,
  selectNotifications,
  selectTheme,
  selectWidgetOrder,
  type Theme,
  usePreferencesStore,
} from './preferences'
// Study Store
export {
  type DifficultyLevel,
  type QuestionType,
  type SessionStatus,
  selectActiveSession,
  selectCurrentQuestion,
  selectElapsedTime,
  selectPreferences,
  selectProgress,
  selectSessionStatus,
  useStudyStore,
} from './study'

// Graph Store
export {
  type GraphExportFormat,
  type GraphLayout,
  type GraphPreferences,
  type GraphViewMode,
  type NodeCategoryFilter,
  type RelationshipFilter,
  type SavedSearch,
  type ZoomState,
  selectActiveCategoryFilters,
  selectActiveRelationshipFilters,
  selectCategoryFilters,
  selectFocusedNodes,
  selectGraphLayout,
  selectGraphPreferences,
  selectGraphViewMode,
  selectRelationshipFilters,
  // Alias to avoid collision with search store selector
  selectSavedSearches as selectGraphSavedSearches,
  selectSearchHistory,
  selectSearchQuery,
  selectSelectedNode,
  selectZoomState,
  useGraphStore,
} from './graph'

// Search Store
export {
  type RecentSearch,
  type SavedSearchEntry,
  type SearchFilters,
  type SearchPreferences,
  type SearchResultType,
  type SearchSortOption,
  selectIsSearching,
  selectPopularSavedSearches,
  selectRecentSearches,
  selectSavedSearches,
  selectSearchFilters,
  selectSearchPreferences,
  selectSearchQuery as selectSearchStoreQuery,
  selectTopRecentSearches,
  useSearchStore,
} from './search'

// Library Store
export {
  type LibraryFilters,
  type LibraryPreferences,
  type LibrarySortOption,
  type LibrarySortOrder,
  type LibraryViewMode,
  selectIsLectureSelected,
  selectLibraryFilters,
  selectLibraryPreferences,
  selectSearchQuery as selectLibrarySearchQuery,
  selectSelectedCount,
  selectSelectedLectureIds,
  selectSortBy,
  selectSortOrder,
  selectViewMode,
  useLibraryStore,
} from './library'
