/**
 * InsightNotification Component
 * Story 2.6 Task 11.4
 *
 * Toast notifications for major mission insights
 */

'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  Award,
  AlertCircle,
  Sparkles,
  Trophy,
  Flame,
} from 'lucide-react';

export type InsightType =
  | 'PERFORMANCE_TREND'
  | 'COMPLETION_PATTERN'
  | 'TIME_OPTIMIZATION'
  | 'OBJECTIVE_PREFERENCE'
  | 'STREAK_MILESTONE'
  | 'COMPLETION_DROP'
  | 'ANOMALY';

export type InsightSentiment = 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';

interface Insight {
  id: string;
  type: InsightType;
  headline: string;
  detail: string;
  sentiment: InsightSentiment;
  actionUrl?: string;
}

interface InsightNotificationProps {
  insight: Insight;
  onDismiss?: () => void;
}

const INSIGHT_ICONS: Record<InsightType, React.ElementType> = {
  PERFORMANCE_TREND: TrendingUp,
  COMPLETION_PATTERN: Target,
  TIME_OPTIMIZATION: Clock,
  OBJECTIVE_PREFERENCE: Award,
  STREAK_MILESTONE: Flame,
  COMPLETION_DROP: TrendingDown,
  ANOMALY: AlertCircle,
};

const SENTIMENT_COLORS: Record<InsightSentiment, string> = {
  POSITIVE: 'oklch(0.75 0.15 160)',
  NEUTRAL: 'oklch(0.7 0.15 230)',
  NEGATIVE: 'oklch(0.65 0.15 10)',
};

export function showInsightNotification(
  insight: Insight,
  onDismiss?: () => void
) {
  const Icon = INSIGHT_ICONS[insight.type] || Sparkles;
  const sentimentColor = SENTIMENT_COLORS[insight.sentiment];

  toast.custom(
    (_t) => (
      <div
        className="relative overflow-hidden rounded-lg border shadow-lg max-w-md"
        style={{
          borderColor: sentimentColor,
          backgroundColor: 'oklch(0.98 0.01 220)',
          animation: 'slideIn 0.3s ease-out',
        }}
      >
        {/* Sparkle animation for positive insights */}
        {insight.sentiment === 'POSITIVE' && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={`sparkle-${i}-${Math.random()}`}
                className="absolute"
                style={{
                  left: `${10 + Math.random() * 80}%`,
                  top: `${10 + Math.random() * 80}%`,
                  animation: `sparkle ${1 + Math.random()}s ease-in-out infinite`,
                  animationDelay: `${Math.random() * 0.5}s`,
                }}
              >
                <Sparkles
                  className="size-3"
                  style={{ color: sentimentColor, opacity: 0.4 }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Insight content */}
        <div className="relative flex items-start gap-3 p-4">
          {/* Icon with glow effect */}
          <div
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full"
            style={{
              backgroundColor: `${sentimentColor} / 0.15`,
              animation:
                insight.sentiment === 'POSITIVE'
                  ? 'pulse 2s ease-in-out infinite'
                  : 'none',
            }}
          >
            <Icon className="h-6 w-6" style={{ color: sentimentColor }} />
          </div>

          {/* Insight details */}
          <div className="flex-1 space-y-1">
            <p className="text-sm font-semibold text-foreground">
              Mission Insight
            </p>
            <p className="text-base font-bold" style={{ color: sentimentColor }}>
              {insight.headline}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {insight.detail}
            </p>
            {insight.actionUrl && (
              <a
                href={insight.actionUrl}
                className="inline-block text-xs font-medium mt-2 hover:underline"
                style={{ color: sentimentColor }}
                onClick={() => toast.dismiss()}
              >
                View Details →
              </a>
            )}
          </div>

          {/* Sentiment icon */}
          {insight.sentiment === 'POSITIVE' && (
            <Trophy
              className="h-8 w-8 flex-shrink-0"
              style={{
                color: sentimentColor,
                animation: 'bounce 1s ease-in-out infinite',
              }}
            />
          )}
          {insight.sentiment === 'NEGATIVE' && (
            <AlertCircle
              className="h-8 w-8 flex-shrink-0"
              style={{ color: sentimentColor }}
            />
          )}
        </div>

        <style jsx>{`
          @keyframes slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }

          @keyframes sparkle {
            0%,
            100% {
              opacity: 0;
              transform: scale(0);
            }
            50% {
              opacity: 1;
              transform: scale(1);
            }
          }

          @keyframes pulse {
            0%,
            100% {
              transform: scale(1);
              opacity: 1;
            }
            50% {
              transform: scale(1.05);
              opacity: 0.9;
            }
          }

          @keyframes bounce {
            0%,
            100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-5px);
            }
          }
        `}</style>
      </div>
    ),
    {
      duration: 6000,
      onDismiss,
      onAutoClose: onDismiss,
    }
  );
}

// Hook for managing insight notifications
export function useInsightNotifications() {
  const [queue, setQueue] = useState<Insight[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (queue.length > 0 && !isProcessing) {
      setIsProcessing(true);
      const [current, ...rest] = queue;

      showInsightNotification(current, () => {
        setQueue(rest);
        setIsProcessing(false);
      });
    }
  }, [queue, isProcessing]);

  const showInsight = (insight: Insight) => {
    setQueue((prev) => [...prev, insight]);
  };

  const clearQueue = () => {
    setQueue([]);
    setIsProcessing(false);
  };

  return { showInsight, clearQueue, queueLength: queue.length };
}

// Component version (for direct usage)
export function InsightNotification({
  insight,
  onDismiss,
}: InsightNotificationProps) {
  useEffect(() => {
    showInsightNotification(insight, onDismiss);
  }, [insight, onDismiss]);

  return null;
}

// Predefined insight templates for common scenarios
export const INSIGHT_TEMPLATES = {
  streakMilestone: (days: number): Insight => ({
    id: `streak-${days}`,
    type: 'STREAK_MILESTONE',
    headline: `${days}-Day Streak!`,
    detail: `You've completed missions for ${days} days in a row. Keep up the amazing consistency!`,
    sentiment: 'POSITIVE',
    actionUrl: '/analytics/missions',
  }),

  performanceImprovement: (percentage: number): Insight => ({
    id: `perf-${Date.now()}`,
    type: 'PERFORMANCE_TREND',
    headline: 'Performance Improving',
    detail: `Your mastery has improved ${percentage}% this week. Mission-guided study is working!`,
    sentiment: 'POSITIVE',
    actionUrl: '/analytics/missions',
  }),

  completionDrop: (percentage: number): Insight => ({
    id: `drop-${Date.now()}`,
    type: 'COMPLETION_DROP',
    headline: 'Completion Rate Dropped',
    detail: `Your completion rate decreased ${percentage}% this week. Consider adjusting mission difficulty?`,
    sentiment: 'NEGATIVE',
    actionUrl: '/settings',
  }),

  timeOptimization: (minutes: number): Insight => ({
    id: `time-${Date.now()}`,
    type: 'TIME_OPTIMIZATION',
    headline: 'Optimal Mission Duration Found',
    detail: `Your best performance occurs with ${minutes}-minute missions. Try this duration more often!`,
    sentiment: 'POSITIVE',
    actionUrl: '/settings',
  }),

  objectivePreference: (objectiveType: string, rating: number): Insight => ({
    id: `pref-${Date.now()}`,
    type: 'OBJECTIVE_PREFERENCE',
    headline: `Excelling at ${objectiveType}`,
    detail: `You're averaging ${rating.toFixed(1)}/5 on ${objectiveType} objectives. Great work in this area!`,
    sentiment: 'POSITIVE',
    actionUrl: '/analytics/missions',
  }),
};
