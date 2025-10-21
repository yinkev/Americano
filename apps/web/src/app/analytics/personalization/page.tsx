/**
 * Personalization Dashboard Page
 * Story 5.5 Task 13.1
 *
 * Complete personalization analytics dashboard with overview, effectiveness metrics,
 * active personalizations, history timeline, and settings
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { PersonalizationEffectivenessChart } from '@/components/analytics/PersonalizationEffectivenessChart'
import { ActivePersonalizationsPanel } from '@/components/analytics/ActivePersonalizationsPanel'
import { PersonalizationHistoryTimeline } from '@/components/analytics/PersonalizationHistoryTimeline'
import { PersonalizationSettings } from '@/components/settings/PersonalizationSettings'
import {
  Sparkles,
  TrendingUp,
  Activity,
  Clock,
  BookOpen,
  Target,
  Brain,
  Settings,
  Info,
} from 'lucide-react'
import Link from 'next/link'

interface PersonalizationPreferences {
  personalizationLevel: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH'
  missionPersonalizationEnabled: boolean
  contentPersonalizationEnabled: boolean
  assessmentPersonalizationEnabled: boolean
  sessionPersonalizationEnabled: boolean
  autoAdaptEnabled: boolean
}

const LEVEL_COLORS = {
  NONE: 'oklch(0.556 0 0)',
  LOW: 'oklch(0.8 0.15 85)',
  MEDIUM: 'oklch(0.7 0.15 145)',
  HIGH: 'oklch(0.7 0.15 230)',
}

export default function PersonalizationDashboardPage() {
  const [preferences, setPreferences] = useState<PersonalizationPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    fetchPreferences()
  }, [])

  async function fetchPreferences() {
    try {
      setLoading(true)
      const response = await fetch('/api/personalization/preferences')
      const data = await response.json()

      if (data.success && data.data.preferences) {
        setPreferences(data.data.preferences)
      } else {
        // Default to MEDIUM
        setPreferences({
          personalizationLevel: 'MEDIUM',
          missionPersonalizationEnabled: true,
          contentPersonalizationEnabled: true,
          assessmentPersonalizationEnabled: true,
          sessionPersonalizationEnabled: true,
          autoAdaptEnabled: true,
        })
      }
    } catch (error) {
      console.error('Error fetching preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 max-w-7xl">
        <div className="flex items-center justify-center h-96">
          <p className="text-sm text-muted-foreground">Loading personalization dashboard...</p>
        </div>
      </div>
    )
  }

  const activeFeatures = preferences
    ? [
        preferences.missionPersonalizationEnabled,
        preferences.contentPersonalizationEnabled,
        preferences.assessmentPersonalizationEnabled,
        preferences.sessionPersonalizationEnabled,
      ].filter(Boolean).length
    : 0

  const levelColor = preferences ? LEVEL_COLORS[preferences.personalizationLevel] : LEVEL_COLORS.MEDIUM

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div>
            <h1 className="text-[28px] md:text-[32px] font-heading font-bold tracking-tight text-foreground flex items-center gap-3 mb-2">
              <Sparkles className="size-8" style={{ color: 'oklch(0.7 0.15 230)' }} />
              Personalization Dashboard
            </h1>
            <p className="text-[15px] text-muted-foreground leading-relaxed">
              Track how personalization is adapting to your learning patterns and improving outcomes
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setShowSettings(!showSettings)}
              className="gap-2"
            >
              <Settings className="size-4" />
              {showSettings ? 'Hide' : 'Show'} Settings
            </Button>
            <Link href="/settings">
              <Button variant="outline">Full Settings</Button>
            </Link>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Personalization Level */}
          <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-xl hover:shadow-[0_12px_40px_rgba(31,38,135,0.15)] transition-all">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="p-2 rounded-xl" style={{ backgroundColor: `${levelColor}/0.15` }}>
                  <Sparkles className="size-5" style={{ color: levelColor }} />
                </div>
                <Badge
                  variant="outline"
                  className="px-2 py-1"
                  style={{
                    backgroundColor: `${levelColor}/0.1`,
                    borderColor: levelColor,
                    color: levelColor,
                  }}
                >
                  {preferences?.personalizationLevel}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground font-medium mb-1">Personalization Level</p>
              <p className="text-[24px] font-heading font-bold text-foreground">
                {preferences?.personalizationLevel}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                {preferences?.personalizationLevel === 'NONE' && 'No personalization'}
                {preferences?.personalizationLevel === 'LOW' && 'Basic adaptations'}
                {preferences?.personalizationLevel === 'MEDIUM' && 'Standard personalization'}
                {preferences?.personalizationLevel === 'HIGH' && 'Full adaptive experience'}
              </p>
            </CardContent>
          </Card>

          {/* Active Features */}
          <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-xl hover:shadow-[0_12px_40px_rgba(31,38,135,0.15)] transition-all">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div
                  className="p-2 rounded-xl"
                  style={{ backgroundColor: 'oklch(0.7 0.15 145 / 0.15)' }}
                >
                  <Activity className="size-5" style={{ color: 'oklch(0.7 0.15 145)' }} />
                </div>
                <Badge
                  variant="outline"
                  className="px-2 py-1"
                  style={{
                    backgroundColor: 'oklch(0.7 0.15 145 / 0.1)',
                    borderColor: 'oklch(0.7 0.15 145)',
                    color: 'oklch(0.7 0.15 145)',
                  }}
                >
                  Active
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground font-medium mb-1">Active Features</p>
              <p className="text-[24px] font-heading font-bold text-foreground">{activeFeatures} of 4</p>
              <p className="text-[11px] text-muted-foreground mt-1">Personalization features enabled</p>
            </CardContent>
          </Card>

          {/* These insight cards would be populated from PersonalizationConfig data in production */}
          {/* For now, they serve as placeholders showing potential personalization insights */}
          {preferences?.missionPersonalizationEnabled && (
            <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: 'oklch(0.7 0.15 230)/0.15' }}
                  >
                    <Clock className="size-5 text-[oklch(0.7_0.15_230)]" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-1">Mission Timing</p>
                <p className="text-2xl font-bold text-foreground">Analyzing...</p>
                <p className="text-xs text-muted-foreground mt-1">Detecting optimal study windows</p>
              </CardContent>
            </Card>
          )}

          {/* Content Style */}
          {preferences?.contentPersonalizationEnabled && (
            <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: 'oklch(0.8 0.15 85)/0.15' }}
                  >
                    <BookOpen className="size-5 text-[oklch(0.8_0.15_85)]" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-1">Learning Style</p>
                <p className="text-2xl font-bold text-foreground">Analyzing...</p>
                <p className="text-xs text-muted-foreground mt-1">Detecting content preferences</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Settings (Collapsible) */}
      {showSettings && (
        <div className="mb-8 animate-in slide-in-from-top-4 duration-300">
          <PersonalizationSettings />
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column: Effectiveness Chart + History */}
        <div className="xl:col-span-2 space-y-6">
          {/* Effectiveness Chart */}
          <PersonalizationEffectivenessChart />

          {/* History Timeline */}
          <PersonalizationHistoryTimeline />
        </div>

        {/* Right Column: Active Personalizations */}
        <div className="xl:col-span-1">
          <ActivePersonalizationsPanel />
        </div>
      </div>

      {/* Footer: Info Panel */}
      <div className="mt-8">
        <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div
                className="p-3 rounded-xl shrink-0"
                style={{ backgroundColor: 'oklch(0.7 0.15 230)/0.15' }}
              >
                <Info className="size-6 text-[oklch(0.7_0.15_230)]" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-foreground mb-2">
                  How Personalization Works
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div>
                    <p className="font-medium text-foreground mb-1">Data Collection</p>
                    <p>
                      We analyze your study sessions, performance metrics, and learning patterns over
                      6+ weeks to build your behavioral profile.
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground mb-1">Adaptive Recommendations</p>
                    <p>
                      Based on your patterns, we optimize mission timing, content recommendations,
                      assessment difficulty, and session structure.
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground mb-1">Continuous Improvement</p>
                    <p>
                      Your feedback helps refine personalization accuracy. We track effectiveness and
                      adjust strategies to maximize learning outcomes.
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground mb-1">Full Transparency</p>
                    <p>
                      You see exactly what data drives each decision and have complete control to
                      enable/disable features at any time.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
