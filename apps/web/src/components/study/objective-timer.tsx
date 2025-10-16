'use client';

import { useState, useEffect } from 'react';
import { Clock, AlertCircle } from 'lucide-react';

// Timer configuration constants
const ALERT_THRESHOLD_80 = 80;
const ALERT_THRESHOLD_100 = 100;
const TIMER_UPDATE_INTERVAL_MS = 100;

interface ObjectiveTimerProps {
  startedAt: Date | null;
  estimatedMinutes: number;
  onAlertThreshold?: (percent: number) => void;
}

/**
 * Objective timer component using Date.now() for drift-free accuracy.
 *
 * This implementation calculates elapsed time by comparing current time (Date.now())
 * against the start time on each interval tick, rather than incrementing a counter.
 * This prevents timer drift that occurs with setInterval accumulation errors,
 * ensuring accurate time tracking even during extended study sessions or when
 * the browser tab is backgrounded.
 *
 * The timer updates every 100ms for smooth visual feedback while maintaining
 * millisecond-precision in the underlying calculations.
 */
export function ObjectiveTimer({
  startedAt,
  estimatedMinutes,
  onAlertThreshold,
}: ObjectiveTimerProps) {
  const [elapsed, setElapsed] = useState(0);
  const [alertFired80, setAlertFired80] = useState(false);
  const [alertFired100, setAlertFired100] = useState(false);

  useEffect(() => {
    if (!startedAt) {
      setElapsed(0);
      setAlertFired80(false);
      setAlertFired100(false);
      return;
    }

    // Use Date.now() for accuracy (no setInterval drift)
    const interval = setInterval(() => {
      const now = Date.now();
      const startTime = new Date(startedAt).getTime();
      const elapsedMs = now - startTime;
      setElapsed(elapsedMs);

      // Check thresholds
      const estimatedMs = estimatedMinutes * 60 * 1000;
      const percent = (elapsedMs / estimatedMs) * 100;

      if (percent >= ALERT_THRESHOLD_100 && !alertFired100) {
        onAlertThreshold?.(ALERT_THRESHOLD_100);
        setAlertFired100(true);
      } else if (percent >= ALERT_THRESHOLD_80 && !alertFired80) {
        onAlertThreshold?.(ALERT_THRESHOLD_80);
        setAlertFired80(true);
      }
    }, TIMER_UPDATE_INTERVAL_MS); // Update every 100ms for smooth display

    return () => clearInterval(interval);
  }, [startedAt, estimatedMinutes, alertFired80, alertFired100, onAlertThreshold]);

  if (!startedAt) {
    return (
      <div className="flex items-center gap-2 text-sm" style={{ color: 'oklch(0.5 0.1 250)' }}>
        <Clock className="w-4 h-4" />
        <span>Timer not started</span>
      </div>
    );
  }

  // Format elapsed time as MM:SS
  const totalSeconds = Math.floor(elapsed / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  // Calculate progress percentage
  const estimatedMs = estimatedMinutes * 60 * 1000;
  const percent = Math.min((elapsed / estimatedMs) * 100, 100);

  // Determine color based on threshold
  let timerColor = 'oklch(0.55 0.2 250)'; // Blue - normal
  let iconColor = 'oklch(0.55 0.2 250)';
  let showWarning = false;

  if (percent >= ALERT_THRESHOLD_100) {
    timerColor = 'oklch(0.5 0.2 0)'; // Red
    iconColor = 'oklch(0.5 0.2 0)';
    showWarning = true;
  } else if (percent >= ALERT_THRESHOLD_80) {
    timerColor = 'oklch(0.65 0.15 80)'; // Yellow/Orange
    iconColor = 'oklch(0.65 0.15 80)';
    showWarning = true;
  }

  return (
    <div className="flex items-center gap-3">
      {showWarning && <AlertCircle className="w-5 h-5" style={{ color: iconColor }} />}
      <Clock className="w-5 h-5" style={{ color: iconColor }} />
      <div className="flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold tabular-nums" style={{ color: timerColor }}>
            {timeString}
          </span>
          <span className="text-sm" style={{ color: 'oklch(0.5 0.1 250)' }}>
            / {estimatedMinutes}m estimated
          </span>
        </div>
        {/* Progress bar */}
        <div className="w-full mt-2 bg-gray-200 rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all duration-300"
            style={{
              width: `${percent}%`,
              background: timerColor,
            }}
          />
        </div>
      </div>
    </div>
  );
}
