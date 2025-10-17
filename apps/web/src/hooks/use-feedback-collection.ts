/**
 * useFeedbackCollection Hook
 * Story 5.2 Task 8.3
 *
 * Manages feedback collection workflow:
 * - Fetches predictions needing feedback
 * - Handles timing logic (24 hours after or next session)
 * - Tracks pending feedback requests
 * - Non-intrusive presentation
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { PredictionStatus } from '@/generated/prisma';

interface Prediction {
  id: string;
  topicName: string;
  learningObjectiveId: string | null;
  topicId: string | null;
  predictionDate: string;
  predictedFor: string;
  predictedStruggleProbability: number;
  predictionConfidence: number;
  predictionStatus: PredictionStatus;
  actualOutcome: boolean | null;
  outcomeRecordedAt: string | null;
  featureVector: Record<string, number>;
}

interface UseFeedbackCollectionOptions {
  userId?: string;
  autoFetch?: boolean;
  pollingInterval?: number; // in milliseconds
}

interface UseFeedbackCollectionReturn {
  pendingFeedback: Prediction[];
  isLoading: boolean;
  error: string | null;
  fetchPendingFeedback: () => Promise<void>;
  markAsViewed: (predictionId: string) => void;
  dismissPrediction: (predictionId: string) => void;
  hasPendingFeedback: boolean;
  pendingCount: number;
}

export function useFeedbackCollection(
  options: UseFeedbackCollectionOptions = {}
): UseFeedbackCollectionReturn {
  const { userId = 'kevy@americano.dev', autoFetch = true, pollingInterval } = options;

  const [pendingFeedback, setPendingFeedback] = useState<Prediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewedPredictions, setViewedPredictions] = useState<Set<string>>(new Set());

  /**
   * Fetch predictions that need user feedback
   * Criteria:
   * 1. Status = PENDING (user hasn't studied yet)
   * 2. Prediction is 24+ hours old OR user has started a new session
   * 3. High probability predictions (>0.5) prioritized
   */
  const fetchPendingFeedback = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch predictions that need feedback
      // Status = PENDING and prediction is old enough for feedback
      const response = await fetch(
        `/api/analytics/predictions?status=PENDING&minProbability=0.5&userId=${userId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch pending feedback');
      }

      const data = await response.json();
      const predictions = data.data?.predictions || [];

      // Filter predictions that are ready for feedback:
      // - Predicted for date is in the past (topic should have been studied)
      // - OR prediction was made 24+ hours ago
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const readyForFeedback = predictions.filter((prediction: Prediction) => {
        const predictionDate = new Date(prediction.predictionDate);
        const predictedFor = new Date(prediction.predictedFor);

        // Ready if:
        // 1. Predicted study date has passed
        const isPastDue = predictedFor < now;

        // 2. OR prediction is 24+ hours old
        const isOldEnough = predictionDate < twentyFourHoursAgo;

        // 3. AND hasn't been viewed/dismissed in this session
        const notViewed = !viewedPredictions.has(prediction.id);

        return (isPastDue || isOldEnough) && notViewed;
      });

      // Sort by probability (highest first) and then by date (oldest first)
      const sorted = readyForFeedback.sort((a: Prediction, b: Prediction) => {
        // First sort by probability (descending)
        const probDiff = b.predictedStruggleProbability - a.predictedStruggleProbability;
        if (probDiff !== 0) return probDiff;

        // Then by date (ascending - oldest first)
        return new Date(a.predictionDate).getTime() - new Date(b.predictionDate).getTime();
      });

      setPendingFeedback(sorted);
    } catch (err) {
      console.error('Error fetching pending feedback:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [userId, viewedPredictions]);

  /**
   * Mark prediction as viewed (user saw the feedback request)
   * Prevents showing again in this session
   */
  const markAsViewed = useCallback((predictionId: string) => {
    setViewedPredictions((prev) => new Set(prev).add(predictionId));
    setPendingFeedback((prev) => prev.filter((p) => p.id !== predictionId));
  }, []);

  /**
   * Dismiss a prediction feedback request
   * User chose "Not now" or closed the dialog
   */
  const dismissPrediction = useCallback((predictionId: string) => {
    setViewedPredictions((prev) => new Set(prev).add(predictionId));
    setPendingFeedback((prev) => prev.filter((p) => p.id !== predictionId));
  }, []);

  /**
   * Auto-fetch on mount if enabled
   */
  useEffect(() => {
    if (autoFetch) {
      fetchPendingFeedback();
    }
  }, [autoFetch, fetchPendingFeedback]);

  /**
   * Set up polling if interval is specified
   */
  useEffect(() => {
    if (!pollingInterval) return;

    const intervalId = setInterval(() => {
      fetchPendingFeedback();
    }, pollingInterval);

    return () => clearInterval(intervalId);
  }, [pollingInterval, fetchPendingFeedback]);

  /**
   * Listen for session start events to trigger feedback collection
   * This allows showing feedback at next session start (even before 24 hours)
   */
  useEffect(() => {
    const handleSessionStart = () => {
      // When user starts a new study session, check for pending feedback
      fetchPendingFeedback();
    };

    // Listen for custom session start event
    window.addEventListener('study-session-started', handleSessionStart);

    return () => {
      window.removeEventListener('study-session-started', handleSessionStart);
    };
  }, [fetchPendingFeedback]);

  return {
    pendingFeedback,
    isLoading,
    error,
    fetchPendingFeedback,
    markAsViewed,
    dismissPrediction,
    hasPendingFeedback: pendingFeedback.length > 0,
    pendingCount: pendingFeedback.length,
  };
}

/**
 * Utility function to trigger session start event
 * Call this when user starts a study session to check for pending feedback
 */
export function triggerSessionStartEvent() {
  const event = new CustomEvent('study-session-started');
  window.dispatchEvent(event);
}
