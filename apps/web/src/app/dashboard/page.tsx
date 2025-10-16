/**
 * Dashboard Page
 * Story 2.6 - Task A: Priority 1 Frontend Integration
 *
 * Displays mission analytics dashboard with:
 * - Mission statistics (streak, completion rate, success score)
 * - Completion trend charts
 * - Insights panel
 * - Recommendations panel
 *
 * Maps to Acceptance Criteria #1
 */

'use client';

import { useState, useEffect } from 'react';
import { MissionCompletionChart } from '@/components/analytics/mission-completion-chart';
import { InsightsPanel } from '@/components/analytics/insights-panel';
import { RecommendationsPanel } from '@/components/analytics/recommendations-panel';
import { Trophy, Target, Flame, TrendingUp } from 'lucide-react';

interface MissionSummary {
  completionRate: number;
  streak: {
    current: number;
    longest: number;
  };
  successScore: number;
  missions: {
    completed: number;
    skipped: number;
    total: number;
  };
  insights: string[];
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<MissionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSummary();
  }, []);

  async function fetchSummary() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/analytics/missions/summary?period=7d', {
        headers: {
          'X-User-Email': 'kevy@americano.dev',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch mission summary');
      }

      const result = await response.json();
      setSummary(result.data);
    } catch (err) {
      console.error('Error fetching mission summary:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[oklch(0.97_0_0)] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-white/80 rounded-2xl w-1/3" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-white/80 rounded-2xl" />
              ))}
            </div>
            <div className="h-96 bg-white/80 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="min-h-screen bg-[oklch(0.97_0_0)] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-[0_8px_32px_rgba(31,38,135,0.1)] border border-white/30 p-8 text-center">
            <p className="text-[oklch(0.65_0.15_10)] mb-4">
              {error || 'Failed to load dashboard'}
            </p>
            <button
              onClick={fetchSummary}
              className="px-4 py-2 bg-[oklch(0.7_0.15_230)] text-white rounded-xl hover:bg-[oklch(0.65_0.15_230)] transition-colors min-h-[44px]"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[oklch(0.97_0_0)] p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-heading font-bold text-[oklch(0.145_0_0)] mb-2">
            Mission Analytics
          </h1>
          <p className="text-[oklch(0.556_0_0)]">
            Track your mission performance and get personalized insights
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Current Streak */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-[0_8px_32px_rgba(31,38,135,0.1)] border border-white/30 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="rounded-full bg-[oklch(0.7_0.15_50)]/10 p-3">
                <Flame className="size-6 text-[oklch(0.7_0.15_50)]" />
              </div>
              <div className="text-right">
                <p className="text-xs text-[oklch(0.556_0_0)] mb-1">Best</p>
                <p className="text-sm font-semibold text-[oklch(0.145_0_0)]">
                  {summary.streak.longest} days
                </p>
              </div>
            </div>
            <h3 className="text-sm font-medium text-[oklch(0.556_0_0)] mb-1">
              Current Streak
            </h3>
            <p className="text-3xl font-heading font-bold text-[oklch(0.145_0_0)]">
              {summary.streak.current}
              <span className="text-lg text-[oklch(0.556_0_0)] ml-1">days</span>
            </p>
          </div>

          {/* Completion Rate */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-[0_8px_32px_rgba(31,38,135,0.1)] border border-white/30 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="rounded-full bg-[oklch(0.7_0.15_230)]/10 p-3">
                <Target className="size-6 text-[oklch(0.7_0.15_230)]" />
              </div>
              <div className="text-right">
                <p className="text-xs text-[oklch(0.556_0_0)] mb-1">Target</p>
                <p className="text-sm font-semibold text-[oklch(0.145_0_0)]">80%</p>
              </div>
            </div>
            <h3 className="text-sm font-medium text-[oklch(0.556_0_0)] mb-1">
              Completion Rate
            </h3>
            <p className="text-3xl font-heading font-bold text-[oklch(0.145_0_0)]">
              {(summary.completionRate * 100).toFixed(1)}
              <span className="text-lg text-[oklch(0.556_0_0)] ml-1">%</span>
            </p>
            <p className="text-xs text-[oklch(0.556_0_0)] mt-2">
              {summary.missions.completed}/{summary.missions.total} missions
            </p>
          </div>

          {/* Success Score */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-[0_8px_32px_rgba(31,38,135,0.1)] border border-white/30 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="rounded-full bg-[oklch(0.75_0.15_160)]/10 p-3">
                <Trophy className="size-6 text-[oklch(0.75_0.15_160)]" />
              </div>
              <div className="text-right">
                <p className="text-xs text-[oklch(0.556_0_0)] mb-1">Max</p>
                <p className="text-sm font-semibold text-[oklch(0.145_0_0)]">1.00</p>
              </div>
            </div>
            <h3 className="text-sm font-medium text-[oklch(0.556_0_0)] mb-1">
              Success Score
            </h3>
            <p className="text-3xl font-heading font-bold text-[oklch(0.145_0_0)]">
              {summary.successScore.toFixed(2)}
            </p>
            <p className="text-xs text-[oklch(0.556_0_0)] mt-2">
              Average across all missions
            </p>
          </div>

          {/* Missions Completed */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-[0_8px_32px_rgba(31,38,135,0.1)] border border-white/30 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="rounded-full bg-[oklch(0.7_0.15_280)]/10 p-3">
                <TrendingUp className="size-6 text-[oklch(0.7_0.15_280)]" />
              </div>
              <div className="text-right">
                <p className="text-xs text-[oklch(0.556_0_0)] mb-1">Skipped</p>
                <p className="text-sm font-semibold text-[oklch(0.145_0_0)]">
                  {summary.missions.skipped}
                </p>
              </div>
            </div>
            <h3 className="text-sm font-medium text-[oklch(0.556_0_0)] mb-1">
              Missions Completed
            </h3>
            <p className="text-3xl font-heading font-bold text-[oklch(0.145_0_0)]">
              {summary.missions.completed}
            </p>
            <p className="text-xs text-[oklch(0.556_0_0)] mt-2">
              Last 7 days
            </p>
          </div>
        </div>

        {/* Completion Trends Chart */}
        <MissionCompletionChart period="30d" chartType="line" />

        {/* Two Column Layout: Insights + Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Insights Panel */}
          <InsightsPanel />

          {/* Recommendations Panel */}
          <RecommendationsPanel />
        </div>
      </div>
    </div>
  );
}
