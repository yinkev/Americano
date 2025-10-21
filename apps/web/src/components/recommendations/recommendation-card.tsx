/**
 * Story 3.5: Recommendation Card Component
 * Individual recommendation card with view/dismiss/rate actions
 */

'use client';

import { useState } from 'react';

export interface RecommendationCardProps {
  id: string;
  content: {
    title: string;
    type: string;
    pageNumber?: number;
    lectureTitle?: string;
    preview: string;
  };
  score: number;
  reasoning: string;
  source: string;
  onView: (id: string) => void;
  onDismiss: (id: string) => void;
  onRate: (id: string, rating: number) => void;
}

export function RecommendationCard({
  id,
  content,
  score,
  reasoning,
  source,
  onView,
  onDismiss,
  onRate,
}: RecommendationCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);

  const handleView = () => {
    onView(id);
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    setTimeout(() => {
      onDismiss(id);
    }, 300);
  };

  const handleRate = (rating: number) => {
    setUserRating(rating);
    onRate(id, rating);
  };

  if (isDismissed) {
    return null;
  }

  const sourceColorMap: Record<string, string> = {
    LECTURE: 'oklch(0.7 0.15 230)',
    FIRST_AID: 'oklch(0.7 0.15 120)',
    CONCEPT_NOTE: 'oklch(0.7 0.15 50)',
    EXTERNAL_ARTICLE: 'oklch(0.7 0.15 300)',
    USER_NOTE: 'oklch(0.7 0.15 180)',
  };

  const sourceColor = sourceColorMap[source] || 'oklch(0.7 0.15 200)';

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative rounded-lg border border-neutral-200 dark:border-neutral-800 p-4 mb-3 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm hover:shadow-lg transition-all duration-200 cursor-pointer"
      style={{
        borderLeftWidth: '4px',
        borderLeftColor: sourceColor,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-xs font-medium px-2 py-0.5 rounded"
              style={{
                backgroundColor: `${sourceColor}20`,
                color: sourceColor,
              }}
            >
              {source.replace('_', ' ')}
            </span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {Math.round(score * 100)}% match
            </span>
          </div>
          <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
            {content.title}
          </h3>
          {content.lectureTitle && (
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
              {content.lectureTitle}
              {content.pageNumber && ` • Page ${content.pageNumber}`}
            </p>
          )}
        </div>

        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          aria-label="Dismiss recommendation"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Reasoning */}
      <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-3">
        {reasoning}
      </p>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleView}
          className="text-xs font-medium px-3 py-1.5 rounded-md transition-colors"
          style={{
            backgroundColor: `${sourceColor}20`,
            color: sourceColor,
          }}
        >
          View Content
        </button>

        {/* Rating buttons */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-neutral-500 dark:text-neutral-400 mr-1">
            Helpful?
          </span>
          <button
            onClick={() => handleRate(5)}
            className={`p-1 rounded transition-colors ${
              userRating === 5
                ? 'text-green-600 bg-green-50 dark:bg-green-900/20'
                : 'text-neutral-400 hover:text-green-600'
            }`}
            aria-label="Thumbs up"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
            </svg>
          </button>
          <button
            onClick={() => handleRate(1)}
            className={`p-1 rounded transition-colors ${
              userRating === 1
                ? 'text-red-600 bg-red-50 dark:bg-red-900/20'
                : 'text-neutral-400 hover:text-red-600'
            }`}
            aria-label="Thumbs down"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 113 0v6zM14 9.667v-5.43a2 2 0 00-1.105-1.79l-.05-.025A4 4 0 0011.055 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
