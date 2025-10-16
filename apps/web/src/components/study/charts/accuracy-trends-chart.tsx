'use client';

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface AccuracyTrendsData {
  objectiveName: string;
  confidenceRating: number; // 1-5
  selfAssessment: number; // 1-5
}

interface AccuracyTrendsChartProps {
  data: AccuracyTrendsData[];
}

export function AccuracyTrendsChart({ data }: AccuracyTrendsChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
      >
        <CartesianGrid
          strokeDasharray="5 5"
          stroke="oklch(0.9 0.01 250)"
        />
        <XAxis
          dataKey="objectiveName"
          angle={-45}
          textAnchor="end"
          height={100}
          tick={{ fill: 'oklch(0.5 0.1 250)', fontSize: 12 }}
        />
        <YAxis
          domain={[0, 5]}
          label={{
            value: 'Rating (1-5)',
            angle: -90,
            position: 'insideLeft',
            style: { fill: 'oklch(0.5 0.1 250)', fontSize: 12 },
          }}
          tick={{ fill: 'oklch(0.5 0.1 250)' }}
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
        />
        <Legend
          wrapperStyle={{ paddingTop: '20px' }}
          iconType="line"
        />
        <Line
          type="monotone"
          dataKey="selfAssessment"
          stroke="oklch(0.55 0.2 250)"
          strokeWidth={2}
          name="Self-Assessment"
          dot={{ fill: 'oklch(0.55 0.2 250)', r: 4 }}
          activeDot={{ r: 6 }}
        />
        <Line
          type="monotone"
          dataKey="confidenceRating"
          stroke="oklch(0.65 0.2 140)"
          strokeWidth={2}
          name="Confidence"
          dot={{ fill: 'oklch(0.65 0.2 140)', r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
