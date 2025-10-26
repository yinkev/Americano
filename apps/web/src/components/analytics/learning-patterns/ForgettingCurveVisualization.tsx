'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts'

interface ForgettingCurveProps {
  curve: {
    R0: number
    k: number
    halfLife: number
  }
}

export function ForgettingCurveVisualization({ curve }: ForgettingCurveProps) {
  // Standard Ebbinghaus curve parameters
  const standardR0 = 1.0
  const standardK = 0.14

  // Generate data points for both curves
  const days = Array.from({ length: 31 }, (_, i) => i) // 0 to 30 days
  const chartData = days.map((day) => ({
    day,
    personalRetention: Math.round(curve.R0 * Math.exp(-curve.k * day) * 100),
    standardRetention: Math.round(standardR0 * Math.exp(-standardK * day) * 100),
  }))

  // Calculate deviation percentage
  const standardHalfLife = Math.log(2) / standardK
  const deviationPercent = Math.round(
    ((standardHalfLife - curve.halfLife) / standardHalfLife) * 100,
  )
  const isFaster = curve.k > standardK

  // Calculate recommended review frequency
  const recommendedDays = Math.max(1, Math.round(curve.halfLife * 0.6)) // Review before 60% of half-life

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          className="px-3 py-2 rounded-md shadow-none"
          style={{
            backgroundColor: 'oklch(0.95 0.01 230)',
            border: '1px solid oklch(0.85 0.02 230)',
          }}
        >
          <p className="text-[13px] font-medium" style={{ color: 'oklch(0.3 0.08 230)' }}>
            Day {payload[0].payload.day}
          </p>
          <p className="text-[13px] mt-1 text-info">
            Your retention: {payload[0].value}%
          </p>
          <p className="text-[13px]" style={{ color: 'oklch(0.7 0.05 230)' }}>
            Standard: {payload[1].value}%
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.02 230)" />
          <XAxis
            dataKey="day"
            label={{
              value: 'Days Since Review',
              position: 'insideBottom',
              offset: -10,
              style: { fill: 'oklch(0.5 0.05 230)', fontSize: 12 },
            }}
            stroke="oklch(0.6 0.03 230)"
          />
          <YAxis
            domain={[0, 100]}
            label={{
              value: 'Retention Probability (%)',
              angle: -90,
              position: 'insideLeft',
              style: { fill: 'oklch(0.5 0.05 230)', fontSize: 12 },
            }}
            stroke="oklch(0.6 0.03 230)"
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{
              paddingTop: '10px',
              fontSize: '12px',
            }}
          />

          {/* Personal forgetting curve (solid line) */}
          <Line
            type="monotone"
            dataKey="personalRetention"
            stroke="oklch(0.5 0.2 230)"
            strokeWidth={2}
            name="Your Retention"
            dot={false}
          />

          {/* Standard Ebbinghaus curve (dashed line) */}
          <Line
            type="monotone"
            dataKey="standardRetention"
            stroke="oklch(0.7 0.05 230)"
            strokeWidth={2}
            strokeDasharray="5 5"
            name="Standard (Ebbinghaus)"
            dot={false}
          />

          {/* Half-life reference line */}
          <ReferenceLine
            x={Math.round(curve.halfLife)}
            stroke="oklch(0.5 0.15 60)"
            strokeDasharray="3 3"
            label={{
              value: `Half-life: ${curve.halfLife.toFixed(1)} days`,
              position: 'top',
              style: { fill: 'oklch(0.5 0.15 60)', fontSize: 11 },
            }}
          />

          {/* Recommended review point */}
          <ReferenceLine
            x={recommendedDays}
            stroke="oklch(0.4 0.15 145)"
            strokeWidth={2}
            label={{
              value: `Review at ${recommendedDays}d`,
              position: 'top',
              style: { fill: 'oklch(0.4 0.15 145)', fontSize: 11, fontWeight: 600 },
            }}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Curve Parameters */}
      <div className="grid grid-cols-3 gap-4 text-[13px]">
        <div className="p-3 rounded-md" style={{ backgroundColor: 'oklch(0.97 0.01 230)' }}>
          <p style={{ color: 'oklch(0.6 0.03 230)' }} className="text-[13px] mb-1">
            Initial Retention (R₀)
          </p>
          <p className="text-[16px] font-semibold text-info">
            {Math.round(curve.R0 * 100)}%
          </p>
        </div>
        <div className="p-3 rounded-md" style={{ backgroundColor: 'oklch(0.97 0.01 230)' }}>
          <p style={{ color: 'oklch(0.6 0.03 230)' }} className="text-[13px] mb-1">
            Decay Rate (k)
          </p>
          <p className="text-[16px] font-semibold text-warning">
            {curve.k.toFixed(3)}
          </p>
        </div>
        <div className="p-3 rounded-md" style={{ backgroundColor: 'oklch(0.97 0.01 230)' }}>
          <p style={{ color: 'oklch(0.6 0.03 230)' }} className="text-[13px] mb-1">
            Half-Life
          </p>
          <p className="text-[16px] font-semibold text-success">
            {curve.halfLife.toFixed(1)} days
          </p>
        </div>
      </div>

      {/* Insight Annotation */}
      <div
        className="p-3 rounded-md"
        style={{
          backgroundColor: isFaster ? 'oklch(0.97 0.01 60)' : 'oklch(0.97 0.01 145)',
        }}
      >
        <p
          className="text-[13px] font-medium mb-2"
          style={{
            color: isFaster ? 'oklch(0.4 0.15 60)' : 'oklch(0.4 0.15 145)',
          }}
        >
          Personalized Retention Analysis
        </p>
        <p className="text-[13px]" style={{ color: 'oklch(0.5 0.05 230)' }}>
          Your retention decays{' '}
          <span
            className="font-semibold"
            style={{
              color: isFaster ? 'oklch(0.4 0.15 60)' : 'oklch(0.4 0.15 145)',
            }}
          >
            {Math.abs(deviationPercent)}% {isFaster ? 'faster' : 'slower'}
          </span>{' '}
          than average. Plan reviews every{' '}
          <span
            className="font-semibold"
            style={{
              color: isFaster ? 'oklch(0.4 0.15 60)' : 'oklch(0.4 0.15 145)',
            }}
          >
            {recommendedDays} days
          </span>{' '}
          {isFaster
            ? 'for optimal retention instead of the standard 5-day interval.'
            : 'to maintain strong retention while maximizing efficiency.'}
        </p>
      </div>
    </div>
  )
}
