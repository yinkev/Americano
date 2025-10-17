/**
 * Story 3.5: Recommendation Panel Component
 * Collapsible sidebar showing related content recommendations
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RecommendationCard, RecommendationCardProps } from './recommendation-card';

interface RecommendationPanelProps {
  contextType: 'session' | 'objective' | 'mission';
  contextId: string;
  className?: string;
}

interface Recommendation {
  id: string;
  content: {
    id: string;
    title: string;
    type: string;
    pageNumber?: number;
    lectureTitle?: string;
    preview: string;
  };
  score: number;
  reasoning: string;
  source: string;
  createdAt: Date;
  actions: {
    view: string;
    dismiss: boolean;
    rate: boolean;
  };
}

export function RecommendationPanel({
  contextType,
  contextId,
  className = '',
}: RecommendationPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch recommendations
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!contextId) return;

      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          contextType,
          contextId,
          limit: '5',
          excludeRecent: 'true',
        });

        const response = await fetch(`/api/recommendations?${params}`);
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error?.message || 'Failed to fetch recommendations');
        }

        setRecommendations(data.data.recommendations || []);
      } catch (err) {
        console.error('[RecommendationPanel] Error fetching recommendations:', err);
        setError(err instanceof Error ? err.message : 'Failed to load recommendations');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, [contextType, contextId]);

  const handleView = async (id: string) => {
    try {
      await fetch(`/api/recommendations/${id}/view`, { method: 'POST' });
      // Open content in modal or new tab (placeholder)
      console.log('View recommendation:', id);
    } catch (err) {
      console.error('Failed to track view:', err);
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      await fetch(`/api/recommendations/${id}/dismiss`, { method: 'POST' });
      setRecommendations(prev => prev.filter(rec => rec.id !== id));
    } catch (err) {
      console.error('Failed to dismiss recommendation:', err);
    }
  };

  const handleRate = async (id: string, rating: number) => {
    try {
      await fetch(`/api/recommendations/${id}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          helpful: rating >= 4,
        }),
      });
    } catch (err) {
      console.error('Failed to submit rating:', err);
    }
  };

  return (
    <div className={`bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm rounded-lg border border-neutral-200 dark:border-neutral-800 ${className}`}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors rounded-t-lg"
      >
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-neutral-600 dark:text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">
            Related Content
            {recommendations.length > 0 && ` (${recommendations.length})`}
          </h2>
        </div>
        <svg
          className="w-5 h-5 text-neutral-600 dark:text-neutral-400 transition-transform duration-200"
          style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Content */}
        {isExpanded && (
          <div
            className="overflow-hidden transition-all duration-200"
          >
            <div className="p-4 pt-0">
              {isLoading && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900 dark:border-neutral-100" />
                </div>
              )}

              {error && (
                <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                  {error}
                </div>
              )}

              {!isLoading && !error && recommendations.length === 0 && (
                <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
                  <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm">No recommendations available yet</p>
                  <p className="text-xs mt-1">Keep studying to discover related content!</p>
                </div>
              )}

              {!isLoading && !error && recommendations.length > 0 && (
                <div className="space-y-2">
                    {recommendations.map((rec) => (
                      <RecommendationCard
                        key={rec.id}
                        id={rec.id}
                        content={rec.content}
                        score={rec.score}
                        reasoning={rec.reasoning}
                        source={rec.source}
                        onView={handleView}
                        onDismiss={handleDismiss}
                        onRate={handleRate}
                      />
                    ))}
                </div>
              )}
            </div>
          </div>
        )}
    </div>
  );
}
