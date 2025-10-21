/**
 * Feedback Loop Integration Example
 * Story 5.2 Task 8 - Usage Example
 *
 * This file demonstrates how to integrate the feedback loop components
 * in a real application context (e.g., analytics dashboard or study session page)
 *
 * File location: docs/examples/feedback-loop-integration-example.tsx
 * Copy relevant parts to your actual pages as needed
 */

'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  PredictionFeedbackDialog,
  InterventionFeedbackCard,
  ModelImprovementNotification,
  showModelImprovementToast,
} from '@/components/analytics';
import { useFeedbackCollection, triggerSessionStartEvent } from '@/hooks/use-feedback-collection';

/**
 * Example 1: Analytics Dashboard Page
 * Shows pending feedback requests in a dedicated section
 */
export function AnalyticsDashboardExample() {
  const {
    pendingFeedback,
    isLoading,
    hasPendingFeedback,
    pendingCount,
    markAsViewed,
    dismissPrediction,
    fetchPendingFeedback,
  } = useFeedbackCollection({
    autoFetch: true,
    pollingInterval: 5 * 60 * 1000, // Check every 5 minutes
  });

  const [selectedPrediction, setSelectedPrediction] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  const handleOpenFeedback = (predictionId: string) => {
    setSelectedPrediction(predictionId);
    setShowDialog(true);
  };

  const handleFeedbackSubmitted = () => {
    if (selectedPrediction) {
      markAsViewed(selectedPrediction);
    }
    setSelectedPrediction(null);
    fetchPendingFeedback(); // Refresh list
  };

  const handleDialogClose = (open: boolean) => {
    if (!open && selectedPrediction) {
      dismissPrediction(selectedPrediction);
      setSelectedPrediction(null);
    }
    setShowDialog(open);
  };

  const activePrediction = pendingFeedback.find((p) => p.id === selectedPrediction);

  return (
    <div className="space-y-6">
      {/* Pending Feedback Section */}
      {hasPendingFeedback && (
        <div className="p-4 rounded-lg bg-[oklch(0.65_0.15_250)]/5 border border-[oklch(0.65_0.15_250)]/20">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading font-semibold text-lg text-foreground">
              Pending Feedback
            </h3>
            <Badge variant="outline" className="bg-[oklch(0.65_0.15_250)]/10">
              {pendingCount} {pendingCount === 1 ? 'prediction' : 'predictions'}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Help us improve by providing feedback on these predictions
          </p>

          <div className="space-y-3">
            {pendingFeedback.slice(0, 3).map((prediction) => (
              <div
                key={prediction.id}
                className="flex items-center justify-between p-3 rounded-lg bg-white/80 border border-white/30"
              >
                <div className="flex-1">
                  <p className="font-medium text-foreground">
                    {prediction.topicName || `Objective ${prediction.learningObjectiveId}`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Predicted: {Math.round(prediction.predictedStruggleProbability * 100)}%
                    probability of struggle
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleOpenFeedback(prediction.id)}
                  className="ml-3 min-h-9 bg-[oklch(0.65_0.15_250)] hover:bg-[oklch(0.60_0.15_250)] text-white"
                >
                  Give Feedback
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feedback Dialog */}
      {activePrediction && (
        <PredictionFeedbackDialog
          prediction={{
            id: activePrediction.id,
            topicName: activePrediction.topicName || 'Unknown Topic',
            predictedFor: activePrediction.predictedFor,
            predictedStruggleProbability: activePrediction.predictedStruggleProbability,
          }}
          open={showDialog}
          onOpenChange={handleDialogClose}
          onFeedbackSubmitted={handleFeedbackSubmitted}
        />
      )}
    </div>
  );
}

/**
 * Example 2: Study Session Page
 * Automatically shows feedback dialog when user starts a session
 */
export function StudySessionExample() {
  const { pendingFeedback, hasPendingFeedback, markAsViewed, dismissPrediction } =
    useFeedbackCollection({
      autoFetch: false, // Don't auto-fetch, we'll trigger manually
    });

  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [currentFeedbackIndex, setCurrentFeedbackIndex] = useState(0);

  // Trigger feedback check when study session starts
  useEffect(() => {
    // Simulate session start
    triggerSessionStartEvent();

    // Show feedback dialog if there are pending predictions
    if (hasPendingFeedback && pendingFeedback.length > 0) {
      // Wait 2 seconds before showing dialog (non-intrusive)
      const timer = setTimeout(() => {
        setShowFeedbackDialog(true);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [hasPendingFeedback, pendingFeedback]);

  const handleFeedbackSubmitted = () => {
    const currentPrediction = pendingFeedback[currentFeedbackIndex];
    if (currentPrediction) {
      markAsViewed(currentPrediction.id);
    }

    // Show next prediction if available
    if (currentFeedbackIndex + 1 < pendingFeedback.length) {
      setCurrentFeedbackIndex(currentFeedbackIndex + 1);
    } else {
      setShowFeedbackDialog(false);
      setCurrentFeedbackIndex(0);
    }
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      const currentPrediction = pendingFeedback[currentFeedbackIndex];
      if (currentPrediction) {
        dismissPrediction(currentPrediction.id);
      }
      setCurrentFeedbackIndex(0);
    }
    setShowFeedbackDialog(open);
  };

  const currentPrediction = pendingFeedback[currentFeedbackIndex];

  return (
    <div>
      {/* Study session content */}
      <h1>Study Session</h1>

      {/* Feedback dialog appears automatically */}
      {currentPrediction && (
        <PredictionFeedbackDialog
          prediction={{
            id: currentPrediction.id,
            topicName: currentPrediction.topicName || 'Unknown Topic',
            predictedFor: currentPrediction.predictedFor,
            predictedStruggleProbability: currentPrediction.predictedStruggleProbability,
          }}
          open={showFeedbackDialog}
          onOpenChange={handleDialogClose}
          onFeedbackSubmitted={handleFeedbackSubmitted}
        />
      )}
    </div>
  );
}

/**
 * Example 3: Intervention Feedback After Mission Completion
 * Shows intervention feedback card after user completes a mission with interventions
 */
export function MissionCompletionExample() {
  const [showInterventionFeedback, setShowInterventionFeedback] = useState(false);
  const [interventions, setInterventions] = useState<any[]>([]);

  // Simulate fetching interventions applied to completed mission
  useEffect(() => {
    const fetchInterventions = async () => {
      try {
        const response = await fetch('/api/analytics/interventions?status=COMPLETED');
        const data = await response.json();
        setInterventions(data.data?.interventions || []);
        setShowInterventionFeedback(data.data?.interventions?.length > 0);
      } catch (error) {
        console.error('Error fetching interventions:', error);
      }
    };

    fetchInterventions();
  }, []);

  const handleFeedbackSubmitted = (interventionId: string) => {
    setInterventions((prev) => prev.filter((i) => i.id !== interventionId));

    if (interventions.length <= 1) {
      setShowInterventionFeedback(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1>Mission Completed!</h1>

      {/* Show intervention feedback cards */}
      {showInterventionFeedback && interventions.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-heading font-semibold text-lg">
            How were the interventions we recommended?
          </h2>
          {interventions.slice(0, 2).map((intervention) => (
            <InterventionFeedbackCard
              key={intervention.id}
              intervention={intervention}
              onFeedbackSubmitted={() => handleFeedbackSubmitted(intervention.id)}
              onDismiss={() => handleFeedbackSubmitted(intervention.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Example 4: Model Improvement Notification
 * Shows toast when model accuracy improves after feedback
 */
export function ModelAccuracyTrackingExample() {
  const [modelImprovement, setModelImprovement] = useState<any>(null);

  // Simulate receiving model improvement data after feedback submission
  const handleFeedbackSubmission = async () => {
    // ... submit feedback ...

    // If API returns model improvement data:
    const mockImprovement = {
      previousAccuracy: 0.72,
      currentAccuracy: 0.78,
      improvementPercent: 0.06,
      feedbackCount: 15,
      timestamp: new Date(),
    };

    // Option 1: Use the component
    setModelImprovement(mockImprovement);

    // Option 2: Use the static toast function (simpler)
    showModelImprovementToast(mockImprovement);
  };

  return (
    <div>
      <Button onClick={handleFeedbackSubmission}>Submit Feedback</Button>

      {/* Model Improvement Notification Component */}
      <ModelImprovementNotification
        improvement={modelImprovement}
        onShown={() => setModelImprovement(null)}
      />
    </div>
  );
}

/**
 * Example 5: Complete Integration in Analytics Dashboard
 * Combines all feedback components in a single page
 */
export function CompleteFeedbackIntegrationExample() {
  const {
    pendingFeedback,
    hasPendingFeedback,
    pendingCount,
    markAsViewed,
    dismissPrediction,
    fetchPendingFeedback,
  } = useFeedbackCollection({
    autoFetch: true,
    pollingInterval: 5 * 60 * 1000,
  });

  const [activePredictionId, setActivePredictionId] = useState<string | null>(null);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [interventions, setInterventions] = useState<any[]>([]);

  // Fetch interventions needing feedback
  useEffect(() => {
    const fetchInterventions = async () => {
      const response = await fetch('/api/analytics/interventions?status=COMPLETED');
      const data = await response.json();
      setInterventions(data.data?.interventions || []);
    };
    fetchInterventions();
  }, []);

  const handleOpenPredictionFeedback = (predictionId: string) => {
    setActivePredictionId(predictionId);
    setShowFeedbackDialog(true);
  };

  const handlePredictionFeedbackSubmitted = () => {
    if (activePredictionId) {
      markAsViewed(activePredictionId);
    }
    setActivePredictionId(null);
    fetchPendingFeedback();
  };

  const activePrediction = pendingFeedback.find((p) => p.id === activePredictionId);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <h1 className="font-heading text-3xl font-bold">Analytics Dashboard</h1>

      {/* Pending Prediction Feedback */}
      {hasPendingFeedback && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-xl font-semibold">
              Prediction Feedback Requests
            </h2>
            <Badge>{pendingCount}</Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pendingFeedback.map((prediction) => (
              <div
                key={prediction.id}
                className="p-4 rounded-lg bg-white/80 backdrop-blur-md border border-white/30"
              >
                <h3 className="font-semibold text-foreground">
                  {prediction.topicName || 'Unknown Topic'}
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                  {Math.round(prediction.predictedStruggleProbability * 100)}% struggle probability
                </p>
                <Button
                  size="sm"
                  onClick={() => handleOpenPredictionFeedback(prediction.id)}
                  className="mt-3 w-full"
                >
                  Provide Feedback
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Intervention Feedback */}
      {interventions.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-heading text-xl font-semibold">Intervention Feedback</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {interventions.map((intervention) => (
              <InterventionFeedbackCard
                key={intervention.id}
                intervention={intervention}
                onFeedbackSubmitted={() =>
                  setInterventions((prev) => prev.filter((i) => i.id !== intervention.id))
                }
                onDismiss={() =>
                  setInterventions((prev) => prev.filter((i) => i.id !== intervention.id))
                }
              />
            ))}
          </div>
        </section>
      )}

      {/* Prediction Feedback Dialog */}
      {activePrediction && (
        <PredictionFeedbackDialog
          prediction={{
            id: activePrediction.id,
            topicName: activePrediction.topicName || 'Unknown Topic',
            predictedFor: activePrediction.predictedFor,
            predictedStruggleProbability: activePrediction.predictedStruggleProbability,
          }}
          open={showFeedbackDialog}
          onOpenChange={(open) => {
            if (!open && activePredictionId) {
              dismissPrediction(activePredictionId);
              setActivePredictionId(null);
            }
            setShowFeedbackDialog(open);
          }}
          onFeedbackSubmitted={handlePredictionFeedbackSubmitted}
        />
      )}
    </div>
  );
}
