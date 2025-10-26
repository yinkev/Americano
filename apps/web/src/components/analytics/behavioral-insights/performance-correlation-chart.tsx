'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Target } from 'lucide-react'
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

// This is a placeholder for the new component.
// The actual implementation will be done in the next steps.

const mockData = [
    { x: 0.8, y: 12, z: 200, name: 'Morning Study', significant: true },
    { x: 0.6, y: 8, z: 150, name: 'Session Duration', significant: true },
    { x: 0.4, y: -5, z: 100, name: 'Content Type', significant: false },
    { x: 0.7, y: 15, z: 180, name: 'Performance Peak', significant: true },
    { x: 0.5, y: 2, z: 120, name: 'Attention Cycle', significant: false },
];

export function PerformanceCorrelationChart() {
    return (
        <Card className="p-6 bg-card  border-border/50 shadow-none rounded-xl">
            <CardHeader className="flex items-center gap-4">
                <div className="p-3 bg-card rounded-xl">
                    <Target className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl font-heading font-bold">Performance Correlation</CardTitle>
            </CardHeader>
            <CardContent className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <XAxis type="number" dataKey="x" name="Pattern Strength" unit="" stroke="oklch(0.8 0.05 230)" style={{ fontSize: '14px', fontWeight: '600' }} />
                        <YAxis type="number" dataKey="y" name="Performance Impact" unit="%" stroke="oklch(0.8 0.05 230)" style={{ fontSize: '14px', fontWeight: '600' }} />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{
                            backgroundColor: 'oklch(1 0 0 / 0.9)',
                            backdropFilter: 'blur(10px)',
                            border: 'none',
                            borderRadius: '16px',
                            boxShadow: '0 8px 32px rgba(31, 38, 135, 0.15)',
                            padding: '12px',
                            fontSize: '16px',
                            fontWeight: '600',
                        }} />
                        <Scatter name="Correlations" data={mockData} fill="oklch(0.75 0.12 240)">
                            {mockData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.significant ? 'oklch(0.70 0.15 150)' : 'oklch(0.8 0.05 230)'} />
                            ))}
                        </Scatter>
                    </ScatterChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
