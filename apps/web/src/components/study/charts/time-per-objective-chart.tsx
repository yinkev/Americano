'use client';

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface TimePerObjectiveData {
  objective: string;
  timeSpentMinutes: number;
  estimatedMinutes: number;
}

interface TimePerObjectiveChartProps {
  data: TimePerObjectiveData[];
}

export function TimePerObjectiveChart({ data }: TimePerObjectiveChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
      >
        <CartesianGrid
          strokeDasharray="5 5"
          stroke="oklch(0.9 0.01 250)"
        />
        <XAxis
          dataKey="objective"
          angle={-45}
          textAnchor="end"
          height={100}
          tick={{ fill: 'oklch(0.5 0.1 250)', fontSize: 12 }}
        />
        <YAxis
          label={{
            value: 'Minutes',
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
        <Bar
          dataKey="timeSpentMinutes"
          fill="oklch(0.55 0.2 250)"
          name="Actual Time"
          radius={[8, 8, 0, 0]}
        />
        <Bar
          dataKey="estimatedMinutes"
          fill="oklch(0.7 0.1 250)"
          name="Estimated Time"
          radius={[8, 8, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
