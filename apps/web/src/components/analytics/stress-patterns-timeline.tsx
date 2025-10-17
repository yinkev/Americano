/**
 * StressPatternsTimeline Component
 * Story 5.4 Task 7.3
 *
 * Line chart visualization of cognitive load history with:
 * - 7-day (detailed) and 30-day (trend) view toggles
 * - Color-coded sessions by load level
 * - Annotations for overload episodes and interventions
 * - Interactive hover states with session details
 *
 * Design: Recharts library, glassmorphism, OKLCH colors
 */

'use client';

import { useState, useMemo } from 'react';
import { format, subDays } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area } from 'recharts';
import { Calendar, TrendingUp } from 'lucide-react';

export interface CognitiveLoadDataPoint {
  timestamp: Date;
  loadScore: number;
  sessionId?: string;
  stressIndicators: string[];
  overloadDetected?: boolean;
  interventionApplied?: boolean;
}

interface StressPatternsTimelineProps {
  dataPoints: CognitiveLoadDataPoint[];
  timeRange?: '7day' | '30day';
  onDataPointClick?: (dataPoint: CognitiveLoadDataPoint) => void;
  className?: string;
}

// Load level colors (OKLCH, matching CognitiveLoadMeter)
const LOAD_COLORS = {
  low: 'oklch(0.7 0.15 145)', // <40
  moderate: 'oklch(0.8 0.15 90)', // 40-60
  high: 'oklch(0.7 0.15 50)', // 60-80
  critical: 'oklch(0.6 0.20 30)', // >80
};

export function StressPatternsTimeline({
  dataPoints,
  timeRange: initialTimeRange = '7day',
  onDataPointClick,
  className = '',
}: StressPatternsTimelineProps) {
  const [timeRange, setTimeRange] = useState<'7day' | '30day'>(initialTimeRange);

  // Filter data by time range
  const filteredData = useMemo(() => {
    const cutoffDate = subDays(new Date(), timeRange === '7day' ? 7 : 30);
    return dataPoints
      .filter(point => point.timestamp >= cutoffDate)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      .map(point => ({
        ...point,
        timestampValue: point.timestamp.getTime(),
        formattedDate: format(point.timestamp, timeRange === '7day' ? 'MMM d, h:mm a' : 'MMM d'),
        shortDate: format(point.timestamp, timeRange === '7day' ? 'EEE ha' : 'MMM d'),
      }));
  }, [dataPoints, timeRange]);

  // Calculate summary stats
  const stats = useMemo(() => {
    if (filteredData.length === 0) {
      return { avgLoad: 0, maxLoad: 0, overloadCount: 0, trend: 'stable' as const };
    }

    const loads = filteredData.map(d => d.loadScore);
    const avgLoad = loads.reduce((sum, load) => sum + load, 0) / loads.length;
    const maxLoad = Math.max(...loads);
    const overloadCount = filteredData.filter(d => d.overloadDetected).length;

    // Calculate trend (compare first half vs second half)
    const midpoint = Math.floor(filteredData.length / 2);
    const firstHalfAvg = loads.slice(0, midpoint).reduce((sum, load) => sum + load, 0) / midpoint;
    const secondHalfAvg = loads.slice(midpoint).reduce((sum, load) => sum + load, 0) / (loads.length - midpoint);
    const trend = secondHalfAvg > firstHalfAvg + 5 ? 'up' : secondHalfAvg < firstHalfAvg - 5 ? 'down' : 'stable';

    return { avgLoad, maxLoad, overloadCount, trend };
  }, [filteredData]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload[0]) return null;

    const data = payload[0].payload as CognitiveLoadDataPoint & { formattedDate: string };
    const loadLevel = data.loadScore < 40 ? 'Low' : data.loadScore < 60 ? 'Moderate' : data.loadScore < 80 ? 'High' : 'Critical';

    return (
      <div className="bg-white/95 backdrop-blur-md border border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.15)] rounded-lg p-4 max-w-xs">
        <div className="text-sm font-semibold text-foreground mb-2">
          {data.formattedDate}
        </div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Load Score:</span>
            <span className="font-semibold text-foreground">{Math.round(data.loadScore)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Level:</span>
            <span className="font-semibold text-foreground">{loadLevel}</span>
          </div>
          {data.stressIndicators.length > 0 && (
            <div className="pt-2 mt-2 border-t border-muted">
              <div className="text-muted-foreground mb-1">Stress Indicators:</div>
              <ul className="list-disc list-inside space-y-0.5">
                {data.stressIndicators.slice(0, 3).map((indicator, i) => (
                  <li key={i} className="text-foreground">{indicator}</li>
                ))}
              </ul>
            </div>
          )}
          {data.overloadDetected && (
            <div className="pt-2 mt-2 border-t border-muted text-critical font-semibold">
              ⚠️ Overload Detected
            </div>
          )}
          {data.interventionApplied && (
            <div className="pt-2 mt-2 border-t border-muted text-success">
              ✓ Intervention Applied
            </div>
          )}
        </div>
      </div>
    );
  };

  if (filteredData.length === 0) {
    return (
      <div className={`bg-white/80 backdrop-blur-md border border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-xl p-6 ${className}`}>
        <div className="flex items-center justify-center py-12 text-center">
          <div>
            <Calendar className="size-12 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-sm text-muted-foreground">No cognitive load data available for this time range</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white/80 backdrop-blur-md border border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-xl p-6 ${className}`}>
      {/* Header with time range toggle */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-heading font-semibold text-foreground text-lg">
            Load Patterns
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {timeRange === '7day' ? 'Past 7 days' : 'Past 30 days'}
          </p>
        </div>

        {/* Time range toggle */}
        <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
          <button
            onClick={() => setTimeRange('7day')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              timeRange === '7day'
                ? 'bg-white shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => setTimeRange('30day')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              timeRange === '30day'
                ? 'bg-white shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            30 Days
          </button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-muted/30 rounded-lg p-3">
          <div className="text-xs text-muted-foreground mb-1">Average Load</div>
          <div className="text-xl font-bold font-heading text-foreground">
            {Math.round(stats.avgLoad)}
          </div>
        </div>
        <div className="bg-muted/30 rounded-lg p-3">
          <div className="text-xs text-muted-foreground mb-1">Peak Load</div>
          <div className="text-xl font-bold font-heading text-foreground">
            {Math.round(stats.maxLoad)}
          </div>
        </div>
        <div className="bg-muted/30 rounded-lg p-3">
          <div className="text-xs text-muted-foreground mb-1">Overload Events</div>
          <div className="text-xl font-bold font-heading text-foreground">
            {stats.overloadCount}
          </div>
        </div>
      </div>

      {/* Line chart */}
      <div className="w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={filteredData}
            onClick={(e) => {
              if (e && e.activePayload && e.activePayload[0] && onDataPointClick) {
                onDataPointClick(e.activePayload[0].payload);
              }
            }}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0 0)" opacity={0.3} />

            <XAxis
              dataKey="shortDate"
              tick={{ fontSize: 12, fill: 'oklch(0.5 0 0)' }}
              tickLine={false}
              axisLine={{ stroke: 'oklch(0.85 0 0)' }}
            />

            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 12, fill: 'oklch(0.5 0 0)' }}
              tickLine={false}
              axisLine={{ stroke: 'oklch(0.85 0 0)' }}
              label={{ value: 'Load Score', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: 'oklch(0.5 0 0)' } }}
            />

            {/* Reference lines for load zones */}
            <ReferenceLine y={40} stroke={LOAD_COLORS.moderate} strokeDasharray="3 3" opacity={0.3} />
            <ReferenceLine y={60} stroke={LOAD_COLORS.high} strokeDasharray="3 3" opacity={0.3} />
            <ReferenceLine y={80} stroke={LOAD_COLORS.critical} strokeDasharray="3 3" opacity={0.3} />

            <Tooltip content={<CustomTooltip />} />

            {/* Main load line */}
            <Line
              type="monotone"
              dataKey="loadScore"
              stroke="oklch(0.6 0.15 240)" // Blue
              strokeWidth={3}
              dot={(props: any) => {
                const { cx, cy, payload } = props;
                const color = payload.loadScore < 40 ? LOAD_COLORS.low :
                             payload.loadScore < 60 ? LOAD_COLORS.moderate :
                             payload.loadScore < 80 ? LOAD_COLORS.high :
                             LOAD_COLORS.critical;

                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={payload.overloadDetected ? 6 : 4}
                    fill={color}
                    stroke="white"
                    strokeWidth={2}
                  />
                );
              }}
              activeDot={{ r: 6, strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Trend indicator */}
      {stats.trend !== 'stable' && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm">
          <TrendingUp className={`size-4 ${stats.trend === 'down' ? 'rotate-180' : ''}`} />
          <span className="text-muted-foreground">
            Load is trending {stats.trend === 'up' ? 'upward' : 'downward'} over this period
          </span>
        </div>
      )}
    </div>
  );
}
