'use client';

import { Suspense, lazy } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useUnderstandingAnalyticsStore } from '@/store/understanding-analytics-store';
import { useRefreshAll } from '@/hooks/use-understanding-analytics';

/**
 * Story 4.6 Task 2: Understanding Dashboard Main Layout
 *
 * Comprehensive analytics dashboard with:
 * - 8 tabbed views for different analytics dimensions
 * - Global filters (date range, course, topic)
 * - Progressive loading with Suspense boundaries
 * - Glassmorphism design system
 * - Responsive layout (3 → 2 → 1 columns)
 *
 * Design System (C-7):
 * - Glassmorphism: bg-white/95 backdrop-blur-xl
 * - OKLCH colors: oklch(0.6_0.05_240) for text
 * - Typography: Inter (body), DM Sans (headings)
 * - Touch targets: min 44px
 *
 * Performance (C-12):
 * - Dashboard load < 2 seconds
 * - Lazy load tab components for code splitting
 * - Progressive rendering with skeleton loaders
 */

// Lazy load tab components for optimal performance (code splitting)
const OverviewTab = lazy(() => import('./tabs/OverviewTab'));
const ComparisonTab = lazy(() => import('./tabs/ComparisonTab'));
const PatternsTab = lazy(() => import('./tabs/PatternsTab'));
const ProgressTab = lazy(() => import('./tabs/ProgressTab'));
const PredictionsTab = lazy(() => import('./tabs/PredictionsTab'));
const RelationshipsTab = lazy(() => import('./tabs/RelationshipsTab'));
const BenchmarksTab = lazy(() => import('./tabs/BenchmarksTab'));
const RecommendationsTab = lazy(() => import('./tabs/RecommendationsTab'));

export function UnderstandingDashboard() {
  const {
    activeTab,
    setActiveTab,
    dateRange,
    setDateRange,
    courseId,
    setCourseFilter,
    topic,
    setTopicFilter,
    clearFilters,
    refreshTimestamp,
  } = useUnderstandingAnalyticsStore();

  const refreshAll = useRefreshAll();

  return (
    <div className="w-full space-y-6">
      {/* Header with Global Filters */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold font-['DM_Sans']">
            Understanding Analytics
          </h1>
          <p className="text-sm text-[oklch(0.6_0.05_240)] mt-1">
            Comprehensive validation across all dimensions
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Date Range Filter */}
          <Select
            value={dateRange}
            onValueChange={(value) =>
              setDateRange(value as '7d' | '30d' | '90d')
            }
          >
            <SelectTrigger className="w-[140px] min-h-[44px]">
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>

          {/* Course Filter */}
          <Select
            value={courseId || 'all'}
            onValueChange={(value) =>
              setCourseFilter(value === 'all' ? null : value)
            }
          >
            <SelectTrigger className="w-[180px] min-h-[44px]">
              <SelectValue placeholder="All Courses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {/* TODO: Fetch and map actual courses from database */}
              <SelectItem value="course-1">Introduction to Medicine</SelectItem>
              <SelectItem value="course-2">Advanced Pharmacology</SelectItem>
              <SelectItem value="course-3">Clinical Practice</SelectItem>
            </SelectContent>
          </Select>

          {/* Topic Filter */}
          <Select
            value={topic || 'all'}
            onValueChange={(value) =>
              setTopicFilter(value === 'all' ? null : value)
            }
          >
            <SelectTrigger className="w-[180px] min-h-[44px]">
              <SelectValue placeholder="All Topics" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Topics</SelectItem>
              {/* TODO: Fetch and map actual topics from database */}
              <SelectItem value="topic-1">Cardiovascular System</SelectItem>
              <SelectItem value="topic-2">Respiratory System</SelectItem>
              <SelectItem value="topic-3">Pharmacodynamics</SelectItem>
            </SelectContent>
          </Select>

          {/* Clear Filters Button */}
          <Button
            variant="outline"
            onClick={clearFilters}
            className="min-h-[44px]"
          >
            Clear Filters
          </Button>

          {/* Refresh Button */}
          <Button onClick={refreshAll} className="min-h-[44px]">
            Refresh
          </Button>
        </div>
      </div>

      {/* Last Updated Timestamp */}
      {refreshTimestamp && (
        <p className="text-xs text-[oklch(0.6_0.05_240)]">
          Last updated: {new Date(refreshTimestamp).toLocaleString()}
        </p>
      )}

      {/* Tabbed Analytics Views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white/95 backdrop-blur-xl shadow-[0_8px_32px_rgba(31,38,135,0.1)] p-1 rounded-2xl flex-wrap h-auto">
          <TabsTrigger value="overview" className="min-h-[44px]">
            Overview
          </TabsTrigger>
          <TabsTrigger value="comparison" className="min-h-[44px]">
            Comparison
          </TabsTrigger>
          <TabsTrigger value="patterns" className="min-h-[44px]">
            Patterns
          </TabsTrigger>
          <TabsTrigger value="progress" className="min-h-[44px]">
            Progress
          </TabsTrigger>
          <TabsTrigger value="predictions" className="min-h-[44px]">
            Predictions
          </TabsTrigger>
          <TabsTrigger value="relationships" className="min-h-[44px]">
            Relationships
          </TabsTrigger>
          <TabsTrigger value="benchmarks" className="min-h-[44px]">
            Benchmarks
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="min-h-[44px]">
            Recommendations
          </TabsTrigger>
        </TabsList>

        {/* Tab Content with Lazy Loading and Suspense Boundaries */}
        <TabsContent value="overview" className="mt-6">
          <Suspense fallback={<TabSkeleton />}>
            <OverviewTab />
          </Suspense>
        </TabsContent>

        <TabsContent value="comparison" className="mt-6">
          <Suspense fallback={<TabSkeleton />}>
            <ComparisonTab />
          </Suspense>
        </TabsContent>

        <TabsContent value="patterns" className="mt-6">
          <Suspense fallback={<TabSkeleton />}>
            <PatternsTab />
          </Suspense>
        </TabsContent>

        <TabsContent value="progress" className="mt-6">
          <Suspense fallback={<TabSkeleton />}>
            <ProgressTab />
          </Suspense>
        </TabsContent>

        <TabsContent value="predictions" className="mt-6">
          <Suspense fallback={<TabSkeleton />}>
            <PredictionsTab />
          </Suspense>
        </TabsContent>

        <TabsContent value="relationships" className="mt-6">
          <Suspense fallback={<TabSkeleton />}>
            <RelationshipsTab />
          </Suspense>
        </TabsContent>

        <TabsContent value="benchmarks" className="mt-6">
          <Suspense fallback={<TabSkeleton />}>
            <BenchmarksTab />
          </Suspense>
        </TabsContent>

        <TabsContent value="recommendations" className="mt-6">
          <Suspense fallback={<TabSkeleton />}>
            <RecommendationsTab />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Skeleton Loader for Tab Content
 *
 * Displays while lazy-loaded tab components are being fetched.
 * Uses responsive grid layout matching the tab content structure.
 */
function TabSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card
          key={i}
          className="h-48 bg-white/95 backdrop-blur-xl animate-pulse"
        >
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
              <div className="h-4 bg-gray-200 rounded w-5/6" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
