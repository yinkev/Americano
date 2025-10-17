/**
 * ModelImprovementNotification Component
 * Story 5.2 Task 8.4
 *
 * Toast notification shown when model accuracy improves after user feedback
 * Displays success message with updated accuracy percentage
 */

'use client';

import { useEffect, useRef } from 'react';
import { TrendingUp, CheckCircle2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface ModelImprovement {
  previousAccuracy: number;
  currentAccuracy: number;
  improvementPercent: number;
  feedbackCount: number;
  timestamp: Date;
}

interface Props {
  improvement: ModelImprovement | null;
  onShown?: () => void;
}

/**
 * Component that displays a toast notification when model accuracy improves
 * Uses sonner toast library for consistent toast styling
 */
export function ModelImprovementNotification({ improvement, onShown }: Props) {
  const shownRef = useRef(false);

  useEffect(() => {
    // Only show once per improvement
    if (!improvement || shownRef.current) return;

    const { currentAccuracy, improvementPercent, previousAccuracy } = improvement;

    // Only show if there's a meaningful improvement (>1%)
    if (improvementPercent < 0.01) return;

    // Calculate percentage values
    const currentPercent = Math.round(currentAccuracy * 100);
    const previousPercent = Math.round(previousAccuracy * 100);
    const improvementPoints = currentPercent - previousPercent;

    // Show success toast
    toast.success(
      <div className="flex items-start gap-3">
        <div className="shrink-0 p-2 rounded-lg bg-[oklch(0.7_0.12_145)]/10">
          <Sparkles className="size-5 text-[oklch(0.7_0.12_145)]" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-foreground">Prediction accuracy improved!</p>
          <p className="text-sm text-muted-foreground mt-1">
            Thanks to your feedback, our predictions are now{' '}
            <span className="font-semibold text-[oklch(0.7_0.12_145)]">
              {currentPercent}% accurate
            </span>
            {improvementPoints > 0 && (
              <span className="text-muted-foreground">
                {' '}
                (up {improvementPoints} {improvementPoints === 1 ? 'point' : 'points'})
              </span>
            )}
          </p>
        </div>
      </div>,
      {
        duration: 5000,
        icon: <CheckCircle2 className="size-5 text-[oklch(0.7_0.12_145)]" />,
        className: 'bg-white/95 backdrop-blur-md border-[oklch(0.7_0.12_145)]/20',
      }
    );

    shownRef.current = true;

    if (onShown) {
      onShown();
    }
  }, [improvement, onShown]);

  // This component doesn't render anything directly - it uses sonner toasts
  return null;
}

/**
 * Alternative static method to show improvement toast
 * Use this when you don't need the component lifecycle
 */
export function showModelImprovementToast(improvement: ModelImprovement) {
  const { currentAccuracy, improvementPercent, previousAccuracy } = improvement;

  // Only show if there's a meaningful improvement (>1%)
  if (improvementPercent < 0.01) return;

  const currentPercent = Math.round(currentAccuracy * 100);
  const previousPercent = Math.round(previousAccuracy * 100);
  const improvementPoints = currentPercent - previousPercent;

  toast.success(
    <div className="flex items-start gap-3">
      <div className="shrink-0 p-2 rounded-lg bg-[oklch(0.7_0.12_145)]/10">
        <TrendingUp className="size-5 text-[oklch(0.7_0.12_145)]" />
      </div>
      <div className="flex-1">
        <p className="font-semibold text-foreground">Prediction accuracy improved!</p>
        <p className="text-sm text-muted-foreground mt-1">
          Thanks to your feedback, our predictions are now{' '}
          <span className="font-semibold text-[oklch(0.7_0.12_145)]">{currentPercent}% accurate</span>
          {improvementPoints > 0 && (
            <span className="text-muted-foreground">
              {' '}
              (up {improvementPoints} {improvementPoints === 1 ? 'point' : 'points'})
            </span>
          )}
        </p>
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <span>Previous:</span>
            <span className="font-medium">{previousPercent}%</span>
          </div>
          <span>→</span>
          <div className="flex items-center gap-1">
            <span>Current:</span>
            <span className="font-medium text-[oklch(0.7_0.12_145)]">{currentPercent}%</span>
          </div>
        </div>
      </div>
    </div>,
    {
      duration: 6000,
      icon: <Sparkles className="size-5 text-[oklch(0.7_0.12_145)]" />,
      className: 'bg-white/95 backdrop-blur-md border-[oklch(0.7_0.12_145)]/20',
    }
  );
}

/**
 * Simplified version for quick success messages
 */
export function showAccuracyUpdateToast(accuracy: number) {
  const accuracyPercent = Math.round(accuracy * 100);

  toast.success(`Prediction accuracy: ${accuracyPercent}%`, {
    description: 'Thanks for your feedback!',
    duration: 4000,
    icon: <CheckCircle2 className="size-5 text-[oklch(0.7_0.12_145)]" />,
  });
}
