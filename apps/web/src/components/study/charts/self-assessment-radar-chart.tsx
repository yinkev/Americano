'use client'

import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from 'recharts'

interface SelfAssessmentData {
  objective: string
  score: number // 1-5
}

interface SelfAssessmentRadarChartProps {
  data: SelfAssessmentData[]
}

export function SelfAssessmentRadarChart({ data }: SelfAssessmentRadarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <RadarChart data={data}>
        <PolarGrid stroke="oklch(0.9 0.01 250)" />
        <PolarAngleAxis
          dataKey="objective"
          tick={{ fill: 'oklch(0.5 0.1 250)', fontSize: 11 }}
          style={{ maxWidth: '100px' }}
        />
        <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fill: 'oklch(0.5 0.1 250)' }} />
        <Radar
          name="Self-Assessment"
          dataKey="score"
          stroke="oklch(0.55 0.2 250)"
          fill="oklch(0.55 0.2 250 / 0.5)"
          fillOpacity={0.6}
        />
        <Tooltip
          contentStyle={{
            background: 'oklch(1 0 0 / 0.95)',
            border: '1px solid oklch(0.9 0.01 250)',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          }}
          labelStyle={{ color: 'oklch(0.3 0.15 250)', fontWeight: 600 }}
          itemStyle={{ color: 'oklch(0.5 0.1 250)' }}
          formatter={(value: number) => [`${value}/5`, 'Score']}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}
