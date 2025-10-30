/**
 * Preferences Store
 *
 * Manages user preferences including:
 * - Theme settings
 * - Notification preferences
 * - Email digest settings
 * - Dashboard layout preferences
 * - Chart style preferences
 *
 * Features:
 * - Full persistence to localStorage
 * - Type-safe preference management
 * - Default values for all settings
 */

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark' | 'system'
export type NotificationFrequency = 'realtime' | 'hourly' | 'daily' | 'never'
export type EmailDigest = 'daily' | 'weekly' | 'monthly' | 'never'
export type DashboardLayout = 'comfortable' | 'compact' | 'spacious'

interface NotificationPreferences {
  enabled: boolean
  frequency: NotificationFrequency
  studyReminders: boolean
  missionDeadlines: boolean
  achievementAlerts: boolean
  weeklyInsights: boolean
  soundEnabled: boolean
}

interface EmailPreferences {
  digestFrequency: EmailDigest
  studyProgress: boolean
  missionUpdates: boolean
  newContent: boolean
  recommendations: boolean
}

interface DashboardPreferences {
  layout: DashboardLayout
  showRecentActivity: boolean
  showUpcomingMissions: boolean
  showProgressCharts: boolean
  showRecommendations: boolean
  widgetOrder: string[]
}

interface ChartStylePreferences {
  colorScheme: 'default' | 'colorblind' | 'monochrome'
  animationsEnabled: boolean
  showDataLabels: boolean
  showLegend: boolean
  showGridLines: boolean
}

interface AccessibilityPreferences {
  reduceMotion: boolean
  highContrast: boolean
  largeText: boolean
  screenReaderOptimized: boolean
}

interface PreferencesState {
  // Theme
  theme: Theme

  // Notifications
  notifications: NotificationPreferences

  // Email
  email: EmailPreferences

  // Dashboard
  dashboard: DashboardPreferences

  // Charts
  chartStyle: ChartStylePreferences

  // Accessibility
  accessibility: AccessibilityPreferences

  // Actions
  setTheme: (theme: Theme) => void
  updateNotifications: (notifications: Partial<NotificationPreferences>) => void
  updateEmail: (email: Partial<EmailPreferences>) => void
  updateDashboard: (dashboard: Partial<DashboardPreferences>) => void
  updateChartStyle: (chartStyle: Partial<ChartStylePreferences>) => void
  updateAccessibility: (accessibility: Partial<AccessibilityPreferences>) => void
  setWidgetOrder: (widgetOrder: string[]) => void
  resetToDefaults: () => void
}

const defaultNotifications: NotificationPreferences = {
  enabled: true,
  frequency: 'realtime',
  studyReminders: true,
  missionDeadlines: true,
  achievementAlerts: true,
  weeklyInsights: true,
  soundEnabled: true,
}

const defaultEmail: EmailPreferences = {
  digestFrequency: 'weekly',
  studyProgress: true,
  missionUpdates: true,
  newContent: false,
  recommendations: true,
}

const defaultDashboard: DashboardPreferences = {
  layout: 'comfortable',
  showRecentActivity: true,
  showUpcomingMissions: true,
  showProgressCharts: true,
  showRecommendations: true,
  widgetOrder: ['upcoming-missions', 'progress-charts', 'recent-activity', 'recommendations'],
}

const defaultChartStyle: ChartStylePreferences = {
  colorScheme: 'default',
  animationsEnabled: true,
  showDataLabels: false,
  showLegend: true,
  showGridLines: true,
}

const defaultAccessibility: AccessibilityPreferences = {
  reduceMotion: false,
  highContrast: false,
  largeText: false,
  screenReaderOptimized: false,
}

export const usePreferencesStore = create<PreferencesState>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        theme: 'system',
        notifications: defaultNotifications,
        email: defaultEmail,
        dashboard: defaultDashboard,
        chartStyle: defaultChartStyle,
        accessibility: defaultAccessibility,

        // Actions
        setTheme: (theme) => set({ theme }, false, 'preferences/setTheme'),

        updateNotifications: (notifications) =>
          set(
            (state) => ({
              notifications: { ...state.notifications, ...notifications },
            }),
            false,
            'preferences/updateNotifications',
          ),

        updateEmail: (email) =>
          set(
            (state) => ({
              email: { ...state.email, ...email },
            }),
            false,
            'preferences/updateEmail',
          ),

        updateDashboard: (dashboard) =>
          set(
            (state) => ({
              dashboard: { ...state.dashboard, ...dashboard },
            }),
            false,
            'preferences/updateDashboard',
          ),

        updateChartStyle: (chartStyle) =>
          set(
            (state) => ({
              chartStyle: { ...state.chartStyle, ...chartStyle },
            }),
            false,
            'preferences/updateChartStyle',
          ),

        updateAccessibility: (accessibility) =>
          set(
            (state) => ({
              accessibility: { ...state.accessibility, ...accessibility },
            }),
            false,
            'preferences/updateAccessibility',
          ),

        setWidgetOrder: (widgetOrder) =>
          set(
            (state) => ({
              dashboard: { ...state.dashboard, widgetOrder },
            }),
            false,
            'preferences/setWidgetOrder',
          ),

        resetToDefaults: () =>
          set(
            {
              theme: 'system',
              notifications: defaultNotifications,
              email: defaultEmail,
              dashboard: defaultDashboard,
              chartStyle: defaultChartStyle,
              accessibility: defaultAccessibility,
            },
            false,
            'preferences/resetToDefaults',
          ),
      }),
      {
        name: 'preferences-storage',
        version: 1,
        // Persist all preferences
      },
    ),
    {
      name: 'PreferencesStore',
      enabled: process.env.NODE_ENV === 'development',
    },
  ),
)

// Selectors
export const selectTheme = (state: PreferencesState) => state.theme
export const selectNotifications = (state: PreferencesState) => state.notifications
export const selectEmail = (state: PreferencesState) => state.email
export const selectDashboard = (state: PreferencesState) => state.dashboard
export const selectChartStyle = (state: PreferencesState) => state.chartStyle
export const selectAccessibility = (state: PreferencesState) => state.accessibility
export const selectWidgetOrder = (state: PreferencesState) => state.dashboard.widgetOrder
