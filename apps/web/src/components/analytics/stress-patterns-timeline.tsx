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

'use client'

import { useState, useMemo } from 'react'
import { format, subDays } from 'date-fns'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
} from 'recharts'
import { Calendar, TrendingUp } from 'lucide-react'
import { chartTheme, chartColors } from '@/lib/chart-theme'
import { Card, CardHeader, CardContent } from '@/components/ui/card'

export interface CognitiveLoadDataPoint {
  timestamp: Date
  loadScore: number
  sessionId?: string
  stressIndicators: string[]
  overloadDetected?: boolean
  interventionApplied?: boolean
}

interface StressPatternsTimelineProps {
  dataPoints: CognitiveLoadDataPoint[]
  timeRange?: '7day' | '30day'
  onDataPointClick?: (dataPoint: CognitiveLoadDataPoint) => void
  className?: string
}

// Load level colors (OKLCH, matching CognitiveLoadMeter)
const LOAD_COLORS = {
  low: 'oklch(0.7 0.15 145)', // <40
  moderate: 'oklch(0.8 0.15 90)', // 40-60
  high: 'oklch(0.7 0.15 50)', // 60-80
  critical: 'oklch(0.6 0.20 30)', // >80
}

export function StressPatternsTimeline({
  dataPoints,
  timeRange: initialTimeRange = '7day',
  onDataPointClick,
  className = '',
}: StressPatternsTimelineProps) {
  const [timeRange, setTimeRange] = useState<'7day' | '30day'>(initialTimeRange)

  // Filter data by time range
  const filteredData = useMemo(() => {
    const cutoffDate = subDays(new Date(), timeRange === '7day' ? 7 : 30)
    return dataPoints
      .filter((point) => point.timestamp >= cutoffDate)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      .map((point) => ({
        ...point,
        timestampValue: point.timestamp.getTime(),
        formattedDate: format(point.timestamp, timeRange === '7day' ? 'MMM d, h:mm a' : 'MMM d'),
        shortDate: format(point.timestamp, timeRange === '7day' ? 'EEE ha' : 'MMM d'),
      }))
  }, [dataPoints, timeRange])

  // Calculate summary stats
  const stats = useMemo(() => {
    if (filteredData.length === 0) {
      return { avgLoad: 0, maxLoad: 0, overloadCount: 0, trend: 'stable' as const }
    }

    const loads = filteredData.map((d) => d.loadScore)
    const avgLoad = loads.reduce((sum, load) => sum + load, 0) / loads.length
    const maxLoad = Math.max(...loads)
    const overloadCount = filteredData.filter((d) => d.overloadDetected).length

    // Calculate trend (compare first half vs second half)
    const midpoint = Math.floor(filteredData.length / 2)
    const firstHalfAvg = loads.slice(0, midpoint).reduce((sum, load) => sum + load, 0) / midpoint
    const secondHalfAvg =
      loads.slice(midpoint).reduce((sum, load) => sum + load, 0) / (loads.length - midpoint)
    const trend =
      secondHalfAvg > firstHalfAvg + 5 ? 'up' : secondHalfAvg < firstHalfAvg - 5 ? 'down' : 'stable'

    return { avgLoad, maxLoad, overloadCount, trend }
  }, [filteredData])

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload[0]) return null

    const data = payload[0].payload as CognitiveLoadDataPoint & { formattedDate: string }
    const loadLevel =
      data.loadScore < 40
        ? 'Low'
        : data.loadScore < 60
          ? 'Moderate'
          : data.loadScore < 80
            ? 'High'
            : 'Critical'

    return (
      <div className="bg-card border border-border shadow-none rounded-lg p-4 max-w-xs">
        <div className="text-[13px] font-semibold text-foreground mb-2">{data.formattedDate}</div>
        <div className="space-y-1 text-[11px]">
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
                  <li key={i} className="text-foreground">
                    {indicator}
                  </li>
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
    )
  }

  if (filteredData.length === 0) {
    return (
      <Card className={`shadow-none ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-center py-12 text-center">
            <div>
              <Calendar className="size-12 text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="text-[13px] text-muted-foreground">
                No cognitive load data available for this time range
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`shadow-none hover:shadow-none transition-shadow-none ${className}`}>
      <CardHeader className="p-4 pb-0">
        {/* Header with time range toggle */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-heading font-semibold text-foreground text-[16px]">Load Patterns</h3>
            <p className="text-[13px] text-muted-foreground mt-1">
              {timeRange === '7day' ? 'Past 7 days' : 'Past 30 days'}
            </p>
          </div>

          {/* Time range toggle with Wave 3 micro-interactions */}
          <div className="flex items-center gap-1 bg-card rounded-lg p-1">
            <button
              onClick={() => setTimeRange('7day')}
              className={`px-3 py-1.5 text-[13px] font-medium rounded-md transition-all duration-200 ${
                timeRange === '7day'
                  ? 'bg-white shadow-none text-foreground scale-100'
                  : 'text-muted-foreground hover:text-foreground hover:bg-card active:scale-95'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setTimeRange('30day')}
              className={`px-3 py-1.5 text-[13px] font-medium rounded-md transition-all duration-200 ${
                timeRange === '30day'
                  ? 'bg-white shadow-none text-foreground scale-100'
                  : 'text-muted-foreground hover:text-foreground hover:bg-card active:scale-95'
              }`}
            >
              30 Days
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-4 space-y-4">
        {/* Summary stats with Wave 3 micro-interactions */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card rounded-lg p-3 transition-all duration-200 hover:bg-card hover:scale-[1.02]">
            <div className="text-[11px] text-muted-foreground mb-1">Average Load</div>
            <div className="text-[20px] font-bold font-heading text-foreground">
              {Math.round(stats.avgLoad)}
            </div>
          </div>
          <div className="bg-card rounded-lg p-3 transition-all duration-200 hover:bg-card hover:scale-[1.02]">
            <div className="text-[11px] text-muted-foreground mb-1">Peak Load</div>
            <div className="text-[20px] font-bold font-heading text-foreground">
              {Math.round(stats.maxLoad)}
            </div>
          </div>
          <div className="bg-card rounded-lg p-3 transition-all duration-200 hover:bg-card hover:scale-[1.02]">
            <div className="text-[11px] text-muted-foreground mb-1">Overload Events</div>
            <div className="text-[20px] font-bold font-heading text-foreground">
              {stats.overloadCount}
            </div>
          </div>
        </div>

        {/* Line chart with Wave 3 theme */}
        <div className="w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={filteredData}
            onClick={(e: any) => {
              if (e && e.activePayload && e.activePayload[0] && onDataPointClick) {
                onDataPointClick(e.activePayload[0].payload)
              }
            }}
            margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
          >
            {/* Grid with Wave 3 theme */}
            <CartesianGrid {...chartTheme.grid} />

            {/* X-Axis with Wave 3 theme */}
            <XAxis
              dataKey="shortDate"
              {...chartTheme.axis}
              tick={{ fontSize: 11, fill: chartColors.text }}
            />

            {/* Y-Axis with Wave 3 theme */}
            <YAxis
              domain={[0, 100]}
              {...chartTheme.axis}
              tick={{ fontSize: 11, fill: chartColors.text }}
              label={{
                value: 'Cognitive Load',
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: 11, fill: chartColors.text, fontWeight: 500 },
              }}
            />

            {/* Reference lines for load zones with enhanced styling */}
            <ReferenceLine
              y={40}
              stroke={LOAD_COLORS.moderate}
              strokeDasharray="5 5"
              strokeWidth={1.5}
              opacity={0.4}
              label={{
                value: 'Moderate',
                position: 'right',
                style: { fontSize: 9, fill: LOAD_COLORS.moderate, fontWeight: 600 },
              }}
            />
            <ReferenceLine
              y={60}
              stroke={LOAD_COLORS.high}
              strokeDasharray="5 5"
              strokeWidth={1.5}
              opacity={0.4}
              label={{
                value: 'High',
                position: 'right',
                style: { fontSize: 9, fill: LOAD_COLORS.high, fontWeight: 600 },
              }}
            />
            <ReferenceLine
              y={80}
              stroke={LOAD_COLORS.critical}
              strokeDasharray="5 5"
              strokeWidth={2}
              opacity={0.5}
              label={{
                value: 'Critical',
                position: 'right',
                style: { fontSize: 9, fill: LOAD_COLORS.critical, fontWeight: 700 },
              }}
            />

            {/* Enhanced tooltip with Wave 3 theme */}
            <Tooltip content={<CustomTooltip />} cursor={chartTheme.tooltip.cursor} />

            {/* Main load line with smooth animation */}
            <Line
              type="monotone"
              dataKey="loadScore"
              stroke={chartColors.primary}
              strokeWidth={3}
              dot={(props: any) => {
                const { cx, cy, payload } = props
                const color =
                  payload.loadScore < 40
                    ? LOAD_COLORS.low
                    : payload.loadScore < 60
                      ? LOAD_COLORS.moderate
                      : payload.loadScore < 80
                        ? LOAD_COLORS.high
                        : LOAD_COLORS.critical

                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={payload.overloadDetected ? 7 : 5}
                    fill={color}
                    stroke="white"
                    strokeWidth={2.5}
                    className="transition-all duration-200 hover:r-8"
                  />
                )
              }}
              activeDot={{
                r: 8,
                strokeWidth: 3,
                stroke: chartColors.primary,
                fill: 'white',
              }}
              isAnimationActive={true}
              animationDuration={800}
              animationEasing="ease-out"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

        {/* Trend indicator */}
        {stats.trend !== 'stable' && (
          <div className="flex items-center justify-center gap-2 text-[13px]">
            <TrendingUp className={`size-4 text-info ${stats.trend === 'down' ? 'rotate-180' : ''}`} />
            <span className="text-muted-foreground">
              Load is trending {stats.trend === 'up' ? 'upward' : 'downward'} over this period
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
