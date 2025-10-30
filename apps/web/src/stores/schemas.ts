/**
 * Store Schema Validation
 *
 * Zod schemas for validating store state.
 * Used for runtime validation of persisted state and migrations.
 *
 * Features:
 * - Type-safe validation
 * - Default values
 * - Migration helpers
 * - Error handling
 */

import { z } from 'zod'

// ============================================================================
// Analytics Schemas
// ============================================================================

export const TimeRangeSchema = z.enum(['7d', '30d', '90d', '1y', 'all'])

export const ChartTypeSchema = z.enum(['line', 'bar', 'area', 'scatter'])

export const ChartGranularitySchema = z.enum(['daily', 'weekly', 'monthly'])

export const ExportFormatSchema = z.enum(['csv', 'json', 'pdf', 'png'])

export const ComparisonModeSchema = z.enum(['self', 'peers', 'both'])

export const AnalyticsStateSchema = z.object({
  timeRange: TimeRangeSchema.default('30d'),
  selectedObjectives: z.array(z.string()).default([]),
  comparisonMode: ComparisonModeSchema.default('self'),
  chartType: ChartTypeSchema.default('line'),
  chartGranularity: ChartGranularitySchema.default('daily'),
  exportFormat: ExportFormatSchema.default('csv'),
})

export const AnalyticsPersistedStateSchema = z.object({
  chartType: ChartTypeSchema,
  chartGranularity: ChartGranularitySchema,
  exportFormat: ExportFormatSchema,
})

// ============================================================================
// Study Schemas
// ============================================================================

export const DifficultyLevelSchema = z.enum(['easy', 'medium', 'hard', 'mixed'])

export const QuestionTypeSchema = z.enum(['mcq', 'sba', 'clinical-case', 'mixed'])

export const SessionStatusSchema = z.enum(['idle', 'active', 'paused', 'completed'])

export const StudySessionSchema = z.object({
  id: z.string(),
  startedAt: z.number(),
  pausedAt: z.number().optional(),
  totalPausedTime: z.number(),
  questionIds: z.array(z.string()),
  currentIndex: z.number().min(0),
  answers: z.record(z.string(), z.union([z.string(), z.array(z.string())])),
  timePerQuestion: z.record(z.string(), z.number()),
})

export const StudyPreferencesSchema = z.object({
  difficulty: DifficultyLevelSchema.default('mixed'),
  questionTypes: z.array(QuestionTypeSchema).default(['mixed']),
  questionsPerSession: z.number().min(1).max(100).default(20),
  showExplanations: z.boolean().default(true),
  enableTimer: z.boolean().default(false),
  timerDuration: z.number().min(30).max(600).default(90),
})

export const StudyPersistedStateSchema = z.object({
  activeSession: StudySessionSchema.nullable(),
  lastActiveAt: z.number().nullable(),
  preferences: StudyPreferencesSchema,
})

// ============================================================================
// Mission Schemas
// ============================================================================

export const MissionStatusSchema = z.enum(['not-started', 'in-progress', 'completed', 'failed'])

export const MissionPrioritySchema = z.enum(['low', 'medium', 'high', 'urgent'])

export const CalendarViewSchema = z.enum(['day', 'week', 'month', 'agenda'])

export const MissionSortSchema = z.enum(['due-date', 'priority', 'status', 'created-at'])

export const MissionFiltersSchema = z.object({
  statuses: z.array(MissionStatusSchema).default([]),
  priorities: z.array(MissionPrioritySchema).default([]),
  objectives: z.array(z.string()).default([]),
  searchQuery: z.string().default(''),
  dateRange: z.object({
    start: z.string().nullable(),
    end: z.string().nullable(),
  }),
})

export const MissionPreferencesSchema = z.object({
  calendarView: CalendarViewSchema.default('week'),
  defaultSort: MissionSortSchema.default('due-date'),
  showCompletedMissions: z.boolean().default(false),
  compactView: z.boolean().default(false),
})

export const MissionPersistedStateSchema = z.object({
  preferences: MissionPreferencesSchema,
})

// ============================================================================
// Preferences Schemas
// ============================================================================

export const ThemeSchema = z.enum(['light', 'dark', 'system'])

export const NotificationFrequencySchema = z.enum(['realtime', 'hourly', 'daily', 'never'])

export const EmailDigestSchema = z.enum(['daily', 'weekly', 'monthly', 'never'])

export const DashboardLayoutSchema = z.enum(['comfortable', 'compact', 'spacious'])

export const NotificationPreferencesSchema = z.object({
  enabled: z.boolean().default(true),
  frequency: NotificationFrequencySchema.default('realtime'),
  studyReminders: z.boolean().default(true),
  missionDeadlines: z.boolean().default(true),
  achievementAlerts: z.boolean().default(true),
  weeklyInsights: z.boolean().default(true),
  soundEnabled: z.boolean().default(true),
})

export const EmailPreferencesSchema = z.object({
  digestFrequency: EmailDigestSchema.default('weekly'),
  studyProgress: z.boolean().default(true),
  missionUpdates: z.boolean().default(true),
  newContent: z.boolean().default(false),
  recommendations: z.boolean().default(true),
})

export const DashboardPreferencesSchema = z.object({
  layout: DashboardLayoutSchema.default('comfortable'),
  showRecentActivity: z.boolean().default(true),
  showUpcomingMissions: z.boolean().default(true),
  showProgressCharts: z.boolean().default(true),
  showRecommendations: z.boolean().default(true),
  widgetOrder: z
    .array(z.string())
    .default(['upcoming-missions', 'progress-charts', 'recent-activity', 'recommendations']),
})

export const ChartStylePreferencesSchema = z.object({
  colorScheme: z.enum(['default', 'colorblind', 'monochrome']).default('default'),
  animationsEnabled: z.boolean().default(true),
  showDataLabels: z.boolean().default(false),
  showLegend: z.boolean().default(true),
  showGridLines: z.boolean().default(true),
})

export const AccessibilityPreferencesSchema = z.object({
  reduceMotion: z.boolean().default(false),
  highContrast: z.boolean().default(false),
  largeText: z.boolean().default(false),
  screenReaderOptimized: z.boolean().default(false),
})

export const PreferencesStateSchema = z.object({
  theme: ThemeSchema.default('system'),
  notifications: NotificationPreferencesSchema,
  email: EmailPreferencesSchema,
  dashboard: DashboardPreferencesSchema,
  chartStyle: ChartStylePreferencesSchema,
  accessibility: AccessibilityPreferencesSchema,
})

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Validates persisted analytics state
 */
export function validateAnalyticsState(data: unknown) {
  return AnalyticsPersistedStateSchema.safeParse(data)
}

/**
 * Validates persisted study state
 */
export function validateStudyState(data: unknown) {
  return StudyPersistedStateSchema.safeParse(data)
}

/**
 * Validates persisted mission state
 */
export function validateMissionState(data: unknown) {
  return MissionPersistedStateSchema.safeParse(data)
}

/**
 * Validates persisted preferences state
 */
export function validatePreferencesState(data: unknown) {
  return PreferencesStateSchema.safeParse(data)
}

/**
 * Generic state validator with error logging
 */
export function validateState<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  storeName: string,
): T | null {
  const result = schema.safeParse(data)

  if (!result.success) {
    console.error(`[${storeName}] State validation failed:`, result.error)
    return null
  }

  return result.data
}

// ============================================================================
// Type Exports
// ============================================================================

export type AnalyticsState = z.infer<typeof AnalyticsStateSchema>
export type StudyPreferences = z.infer<typeof StudyPreferencesSchema>
export type MissionFilters = z.infer<typeof MissionFiltersSchema>
export type PreferencesState = z.infer<typeof PreferencesStateSchema>
