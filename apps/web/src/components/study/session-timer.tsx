'use client';

import { useEffect, useState } from 'react';
import { useSessionStore } from '@/store/use-session-store';
import { formatDuration } from '@/lib/format-time';

interface SessionTimerProps {
  className?: string;
}

export function SessionTimer({ className = '' }: SessionTimerProps) {
  const { sessionId, getElapsedTime, pausedAt } = useSessionStore();
  const [displayTime, setDisplayTime] = useState('00:00:00');

  useEffect(() => {
    if (!sessionId) {
      setDisplayTime('00:00:00');
      return;
    }

    // Update timer every second
    const interval = setInterval(() => {
      const elapsedMs = getElapsedTime();
      setDisplayTime(formatDuration(elapsedMs));
    }, 1000);

    // Initial update
    const elapsedMs = getElapsedTime();
    setDisplayTime(formatDuration(elapsedMs));

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [sessionId, pausedAt, getElapsedTime]);

  const isPaused = !!pausedAt;
  const isRunning = !!sessionId && !isPaused;

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div
        className="font-mono text-6xl font-bold tabular-nums"
        style={{ color: 'oklch(0.45 0.15 250)' }}
      >
        {displayTime}
      </div>
      <div className="text-sm font-medium" style={{ color: 'oklch(0.6 0.1 250)' }}>
        {isPaused && 'Paused'}
        {isRunning && 'Running'}
        {!sessionId && 'Not Started'}
      </div>
    </div>
  );
}
