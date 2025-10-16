/**
 * Progress Analytics Page
 * Story 2.2 Task 9
 *
 * Comprehensive performance analytics and progress tracking
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MasteryDistribution } from '@/components/progress/mastery-distribution';
import { PerformanceTrendChart } from '@/components/progress/performance-trend-chart';
import { WeakAreasPanel } from '@/components/dashboard/weak-areas-panel';

interface MasterySummary {
  notStarted: number;
  beginner: number;
  intermediate: number;
  advanced: number;
  mastered: number;
  totalObjectives: number;
  percentages: Record<string, number>;
}

interface Course {
  id: string;
  name: string;
  objectiveCount: number;
  masteryBreakdown: {
    notStarted: number;
    beginner: number;
    intermediate: number;
    advanced: number;
    mastered: number;
  };
}

export default function ProgressPage() {
  const [summary, setSummary] = useState<MasterySummary | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);

      // Fetch mastery summary
      const summaryResponse = await fetch('/api/performance/mastery-summary');
      if (summaryResponse.ok) {
        const result = await summaryResponse.json();
        setSummary(result.data);
      }

      // Fetch courses with mastery breakdown
      // For now, this would need a new API endpoint in production
      // Using mock data for MVP
      setCourses([]);
    } catch (error) {
      console.error('Error fetching progress data:', error);
    } finally {
      setLoading(false);
    }
  }

  function calculateOverallMastery(summary: MasterySummary | null): number {
    if (!summary || summary.totalObjectives === 0) return 0;

    // Weighted scoring: Mastered=100%, Advanced=75%, Intermediate=50%, Beginner=25%, Not Started=0%
    const score =
      (summary.mastered * 100 +
        summary.advanced * 75 +
        summary.intermediate * 50 +
        summary.beginner * 25 +
        summary.notStarted * 0) /
      summary.totalObjectives;

    return Math.round(score);
  }

  const overallMastery = calculateOverallMastery(summary);

  if (loading) {
    return (
      <div className="container mx-auto py-8 max-w-7xl px-4">
        <h1 className="text-3xl font-heading font-bold text-gray-900 mb-8">
          Progress & Analytics
        </h1>
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-7xl px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-gray-900 mb-2">
          Progress & Analytics
        </h1>
        <p className="text-gray-600">
          Track your mastery across all learning objectives and identify areas for improvement
        </p>
      </div>

      {/* Overall Progress Bar */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-[0_8px_32px_rgba(31,38,135,0.1)] p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-heading font-bold text-gray-900">
              Overall Mastery
            </h2>
            <p className="text-sm text-gray-600">
              {summary?.totalObjectives || 0} learning objectives
            </p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-[oklch(0.55_0.22_264)]">
              {overallMastery}%
            </div>
            <div className="text-sm text-gray-500">Mastery Score</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative w-full h-8 bg-gray-100 rounded-xl overflow-hidden">
          {summary && (
            <>
              {/* Mastered */}
              <div
                className="absolute top-0 left-0 h-full bg-[oklch(0.7_0.15_160)]"
                style={{
                  width: `${summary.percentages.MASTERED || 0}%`,
                }}
              />
              {/* Advanced */}
              <div
                className="absolute top-0 h-full bg-[oklch(0.55_0.22_264)]"
                style={{
                  left: `${summary.percentages.MASTERED || 0}%`,
                  width: `${summary.percentages.ADVANCED || 0}%`,
                }}
              />
              {/* Intermediate */}
              <div
                className="absolute top-0 h-full bg-[oklch(0.75_0.15_85)]"
                style={{
                  left: `${(summary.percentages.MASTERED || 0) + (summary.percentages.ADVANCED || 0)}%`,
                  width: `${summary.percentages.INTERMEDIATE || 0}%`,
                }}
              />
              {/* Beginner */}
              <div
                className="absolute top-0 h-full bg-[oklch(0.70_0.20_30)]"
                style={{
                  left: `${(summary.percentages.MASTERED || 0) + (summary.percentages.ADVANCED || 0) + (summary.percentages.INTERMEDIATE || 0)}%`,
                  width: `${summary.percentages.BEGINNER || 0}%`,
                }}
              />
            </>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[oklch(0.7_0.15_160)]" />
            <span className="text-gray-700">Mastered ({summary?.mastered || 0})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[oklch(0.55_0.22_264)]" />
            <span className="text-gray-700">Advanced ({summary?.advanced || 0})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[oklch(0.75_0.15_85)]" />
            <span className="text-gray-700">Intermediate ({summary?.intermediate || 0})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[oklch(0.70_0.20_30)]" />
            <span className="text-gray-700">Beginner ({summary?.beginner || 0})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gray-300" />
            <span className="text-gray-700">Not Started ({summary?.notStarted || 0})</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Mastery Distribution */}
        <MasteryDistribution />

        {/* Weak Areas */}
        <WeakAreasPanel limit={5} />
      </div>

      {/* Insights Panel */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-[0_8px_32px_rgba(31,38,135,0.1)] p-6 mb-8">
        <h3 className="text-lg font-heading font-bold text-gray-900 mb-4">
          📊 Performance Insights
        </h3>
        <div className="space-y-3">
          {summary && summary.mastered > summary.totalObjectives * 0.3 && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-sm text-green-800">
                🎯 <strong>Strong progress!</strong> You've mastered{' '}
                {Math.round((summary.mastered / summary.totalObjectives) * 100)}% of your learning objectives.
              </p>
            </div>
          )}
          {summary && summary.notStarted > summary.totalObjectives * 0.5 && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-sm text-blue-800">
                🚀 <strong>Lots to explore!</strong> You have {summary.notStarted} objectives not yet started. Consider creating missions to tackle new material.
              </p>
            </div>
          )}
          {summary && summary.beginner + summary.intermediate > summary.totalObjectives * 0.4 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-sm text-amber-800">
                💪 <strong>Keep practicing!</strong> Focus on reinforcing beginner and intermediate concepts to reach advanced mastery.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4">
        <Link
          href="/study"
          className="flex-1 min-w-[200px] px-6 py-4 rounded-xl font-medium bg-[oklch(0.55_0.22_264)] text-white hover:bg-[oklch(0.50_0.22_264)] shadow-sm transition-colors text-center min-h-[44px] flex items-center justify-center"
        >
          Start Study Session
        </Link>
        <Link
          href="/settings"
          className="flex-1 min-w-[200px] px-6 py-4 rounded-xl font-medium bg-white/60 text-gray-700 hover:bg-white/80 shadow-sm transition-colors text-center min-h-[44px] flex items-center justify-center"
        >
          Privacy Settings
        </Link>
      </div>
    </div>
  );
}
