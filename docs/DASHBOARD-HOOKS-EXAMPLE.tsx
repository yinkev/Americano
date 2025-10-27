/**
 * Example: Figma Dashboard Component using React Query Hooks
 *
 * This example demonstrates how to integrate the three dashboard hooks
 * into a real dashboard component with proper loading, error, and data states.
 *
 * File Location: apps/web/src/components/dashboard/FigmaDashboard.tsx
 */

import React from 'react'
import { useDashboard, hasCompleteMissionData } from '@/hooks/use-dashboard'

// Mock UI components (replace with your design system components)
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { CheckCircle2, Circle, TrendingUp, Trophy, Clock, Target } from 'lucide-react'

interface FigmaDashboardProps {
  /**
   * User ID to load dashboard for
   * Use 'dumpling' for instant demo mode
   */
  userId: string
}

/**
 * Main Figma Dashboard Component
 *
 * Features:
 * - Real-time dashboard metrics
 * - Mission tasks and progress
 * - Graceful loading states
 * - Error handling with retry
 * - Demo mode support
 */
export function FigmaDashboard({ userId }: FigmaDashboardProps) {
  // Fetch all dashboard data with unified states
  const { data, isLoading, error, refetch } = useDashboard(userId)

  // Loading state: Show skeleton UI
  if (isLoading) {
    return <DashboardSkeleton />
  }

  // Error state: Show error with retry button
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load dashboard: {error.message}
        </AlertDescription>
        <Button onClick={() => refetch()} variant="outline" size="sm" className="mt-2">
          Retry
        </Button>
      </Alert>
    )
  }

  // No data state (shouldn't happen, but TypeScript requires check)
  if (!data) {
    return (
      <Alert>
        <AlertDescription>No data available. Please try again.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Demo Mode Badge */}
      {userId === 'dumpling' && (
        <div className="bg-yellow-100 border-yellow-400 text-yellow-800 px-4 py-2 rounded-lg text-sm">
          🎯 Demo Mode: Viewing sample data for "dumpling"
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Trophy className="h-5 w-5 text-yellow-500" />}
          label="Current Streak"
          value={`${data.streak_days} days`}
          trend="+2 from last week"
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5 text-blue-500" />}
          label="XP Today"
          value={data.xp_today.toString()}
          subtitle={`${data.xp_this_week} this week`}
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5 text-green-500" />}
          label="Cards Mastered"
          value={data.cards_mastered.toString()}
          trend="+12 from yesterday"
        />
        <StatCard
          icon={<Clock className="h-5 w-5 text-purple-500" />}
          label="Study Time"
          value={`${data.study_time_hours.toFixed(1)}h`}
          subtitle="Today"
        />
      </div>

      {/* Exam Readiness */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Exam Readiness
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Progress</span>
              <span className="font-medium">{Math.round(data.exam_readiness * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all"
                style={{ width: `${data.exam_readiness * 100}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Last study session: {new Date(data.last_study_date).toLocaleDateString()}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Mission Card (conditional - only if mission data exists) */}
      {hasCompleteMissionData(data) && (
        <Card>
          <CardHeader>
            <CardTitle>{data.mission.title}</CardTitle>
            <p className="text-sm text-gray-600">
              {data.mission.duration} minutes • {Math.round(data.mission.readiness * 100)}% ready
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.mission.tasks.map((task) => (
                <div key={task.id} className="flex items-start gap-3">
                  {task.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-300 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p
                      className={`text-sm ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}
                    >
                      {task.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Mission Stats */}
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {data.mission.streak.current}
                </div>
                <div className="text-xs text-gray-600">Current Streak</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(data.mission.completionRate * 100)}%
                </div>
                <div className="text-xs text-gray-600">Completion</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(data.mission.successScore * 100)}%
                </div>
                <div className="text-xs text-gray-600">Success Score</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

/**
 * Reusable Stat Card Component
 */
interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string
  subtitle?: string
  trend?: string
}

function StatCard({ icon, label, value, subtitle, trend }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          {icon}
          {trend && <span className="text-xs text-green-600">{trend}</span>}
        </div>
        <div className="space-y-1">
          <p className="text-sm text-gray-600">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Loading Skeleton UI
 */
function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-5 w-5 mb-2" />
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Exam Readiness Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-3 w-full mb-2" />
          <Skeleton className="h-4 w-32" />
        </CardContent>
      </Card>

      {/* Mission Card Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Example: Using individual hooks for custom layout
 */
export function CustomDashboard({ userId }: { userId: string }) {
  const { data: dashboardData, isLoading: dashboardLoading } = useDashboard(userId)

  if (dashboardLoading) return <div>Loading...</div>

  return (
    <div>
      {/* Custom layout using individual data points */}
      <h1>Welcome back!</h1>
      <p>
        You're on a {dashboardData?.streak_days} day streak with{' '}
        {dashboardData?.xp_today} XP earned today
      </p>
    </div>
  )
}

/**
 * Example: Granular error handling
 */
export function RobustDashboard({ userId }: { userId: string }) {
  const { data, errors, loadingStates } = useDashboard(userId)

  return (
    <div>
      {/* Show dashboard even if mission fails */}
      {errors.mission && (
        <Alert variant="warning">
          <AlertDescription>
            Mission data unavailable. Showing other metrics.
          </AlertDescription>
        </Alert>
      )}

      {data && (
        <>
          <div>Dashboard metrics: {data.xp_today} XP</div>
          {!errors.mission && data.mission && (
            <div>Mission: {data.mission.title}</div>
          )}
        </>
      )}
    </div>
  )
}

/**
 * Example: Demo mode toggle
 */
export function DemoToggle() {
  const [isDemoMode, setIsDemoMode] = React.useState(false)
  const userId = isDemoMode ? 'dumpling' : 'kevy@americano.dev'

  return (
    <div>
      <Button onClick={() => setIsDemoMode(!isDemoMode)}>
        {isDemoMode ? 'Switch to Real Data' : 'Switch to Demo Mode'}
      </Button>
      <FigmaDashboard userId={userId} />
    </div>
  )
}
