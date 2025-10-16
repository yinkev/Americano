/**
 * PerformanceCorrelationPanel Component
 * Story 2.6 Task 3.3
 *
 * Visualizes correlation between mission completion and performance improvement
 */

'use client';

import { useState, useEffect } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { TrendingUp, Info } from 'lucide-react';

interface CorrelationData {
  correlationCoefficient: number;
  pValue: number;
  sampleSize: number;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  dataPoints: Array<{
    completionRate: number;
    masteryImprovement: number;
  }>;
  insight: string;
}

export function PerformanceCorrelationPanel() {
  const [data, setData] = useState<CorrelationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const response = await fetch('/api/analytics/missions/correlation', {
        headers: {
          'X-User-Email': 'kevy@americano.dev',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch correlation data');

      const result = await response.json();
      setData(result.data);
    } catch (error) {
      console.error('Error fetching correlation data:', error);
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-white/80 backdrop-blur-md rounded-2xl shadow-[0_8px_32px_rgba(31,38,135,0.1)] border border-white/30">
        <div className="text-sm text-[oklch(0.556_0_0)]">
          Loading correlation analysis...
        </div>
      </div>
    );
  }

  if (!data || data.sampleSize < 7) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-white/80 backdrop-blur-md rounded-2xl shadow-[0_8px_32px_rgba(31,38,135,0.1)] border border-white/30 p-6">
        <TrendingUp className="size-12 text-[oklch(0.556_0_0)] mb-4" />
        <div className="text-sm text-[oklch(0.556_0_0)] text-center">
          Not enough data for correlation analysis
        </div>
        <p className="text-xs text-[oklch(0.556_0_0)] mt-2 text-center">
          Complete at least 7 missions to see performance insights
        </p>
      </div>
    );
  }

  // Transform data for scatter plot (convert to percentages for display)
  const scatterData = data.dataPoints.map((point) => ({
    completionRate: point.completionRate * 100,
    masteryImprovement: point.masteryImprovement * 100,
  }));

  // Determine correlation strength
  const getCorrelationStrength = (r: number): string => {
    const abs = Math.abs(r);
    if (abs >= 0.7) return 'Strong';
    if (abs >= 0.4) return 'Moderate';
    if (abs >= 0.2) return 'Weak';
    return 'Very Weak';
  };

  const correlationStrength = getCorrelationStrength(
    data.correlationCoefficient
  );
  const correlationDirection =
    data.correlationCoefficient > 0 ? 'positive' : 'negative';

  // Get confidence indicator color
  const getConfidenceColor = (confidence: string): string => {
    switch (confidence) {
      case 'HIGH':
        return 'oklch(0.75 0.15 160)'; // Green
      case 'MEDIUM':
        return 'oklch(0.7 0.15 50)'; // Orange
      case 'LOW':
        return 'oklch(0.65 0.15 10)'; // Red
      default:
        return 'oklch(0.556 0 0)'; // Gray
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-[0_8px_32px_rgba(31,38,135,0.1)] border border-white/30 p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <h3 className="text-lg font-heading font-semibold text-[oklch(0.145_0_0)] mb-2">
            Performance Correlation
          </h3>
          <p className="text-sm text-[oklch(0.556_0_0)]">
            Mission completion vs. mastery improvement
          </p>
        </div>
        <button
          onClick={() => setShowExplanation(!showExplanation)}
          className="p-2 rounded-lg bg-white/60 text-[oklch(0.556_0_0)] hover:bg-white/80 transition-colors"
          aria-label="Show explanation"
          title="Show explanation"
        >
          <Info className="size-4" />
        </button>
      </div>

      {/* Explanation Panel */}
      {showExplanation && (
        <div className="mb-6 p-4 bg-[oklch(0.7_0.15_230)]/10 rounded-xl border border-[oklch(0.7_0.15_230)]/20">
          <h4 className="text-sm font-semibold text-[oklch(0.145_0_0)] mb-2">
            Understanding Correlation
          </h4>
          <p className="text-xs text-[oklch(0.556_0_0)] leading-relaxed">
            This chart shows the relationship between how often you complete
            missions and how much your mastery improves. Each dot represents a
            time period. A strong positive correlation means completing more
            missions typically leads to better learning outcomes.
          </p>
          <p className="text-xs text-[oklch(0.556_0_0)] mt-2 leading-relaxed">
            <strong>Note:</strong> Correlation does not imply causation.
            Statistical significance (p-value) indicates confidence in the
            relationship.
          </p>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-white/60 rounded-xl">
          <p className="text-xs text-[oklch(0.556_0_0)] mb-1">Correlation</p>
          <p className="text-2xl font-bold text-[oklch(0.145_0_0)]">
            {data.correlationCoefficient.toFixed(2)}
          </p>
          <p className="text-xs text-[oklch(0.556_0_0)] mt-1">
            {correlationStrength} {correlationDirection}
          </p>
        </div>

        <div className="p-4 bg-white/60 rounded-xl">
          <p className="text-xs text-[oklch(0.556_0_0)] mb-1">Confidence</p>
          <p
            className="text-2xl font-bold"
            style={{ color: getConfidenceColor(data.confidence) }}
          >
            {data.confidence}
          </p>
          <p className="text-xs text-[oklch(0.556_0_0)] mt-1">
            p = {data.pValue.toFixed(3)}
          </p>
        </div>

        <div className="p-4 bg-white/60 rounded-xl">
          <p className="text-xs text-[oklch(0.556_0_0)] mb-1">Sample Size</p>
          <p className="text-2xl font-bold text-[oklch(0.145_0_0)]">
            {data.sampleSize}
          </p>
          <p className="text-xs text-[oklch(0.556_0_0)] mt-1">data points</p>
        </div>
      </div>

      {/* Scatter Plot */}
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="oklch(0.9 0 0)"
            vertical={false}
          />
          <XAxis
            type="number"
            dataKey="completionRate"
            name="Completion Rate"
            unit="%"
            domain={[0, 100]}
            stroke="oklch(0.556 0 0)"
            style={{ fontSize: '12px' }}
            tick={{ fill: 'oklch(0.556 0 0)' }}
            label={{
              value: 'Mission Completion Rate (%)',
              position: 'insideBottom',
              offset: -10,
              style: { fontSize: '12px', fill: 'oklch(0.556 0 0)' },
            }}
          />
          <YAxis
            type="number"
            dataKey="masteryImprovement"
            name="Mastery Improvement"
            unit="%"
            domain={[0, 'auto']}
            stroke="oklch(0.556 0 0)"
            style={{ fontSize: '12px' }}
            tick={{ fill: 'oklch(0.556 0 0)' }}
            label={{
              value: 'Mastery Improvement (%)',
              angle: -90,
              position: 'insideLeft',
              style: { fontSize: '12px', fill: 'oklch(0.556 0 0)' },
            }}
          />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            contentStyle={{
              backgroundColor: 'oklch(1 0 0 / 0.95)',
              backdropFilter: 'blur(12px)',
              border: 'none',
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
              padding: '12px',
            }}
            labelStyle={{
              color: 'oklch(0.145 0 0)',
              fontWeight: 600,
              marginBottom: '4px',
            }}
            formatter={(value: number, name: string) => [
              `${value.toFixed(1)}%`,
              name === 'completionRate' ? 'Completion' : 'Improvement',
            ]}
          />
          {/* Trend line approximation */}
          {data.correlationCoefficient > 0.3 && (
            <ReferenceLine
              segment={[
                { x: 0, y: 0 },
                { x: 100, y: 100 * Math.abs(data.correlationCoefficient) },
              ]}
              stroke="oklch(0.7 0.15 230)"
              strokeDasharray="5 5"
              strokeWidth={2}
            />
          )}
          <Scatter
            name="Data Points"
            data={scatterData}
            fill="oklch(0.7 0.15 230)"
            fillOpacity={0.6}
          />
        </ScatterChart>
      </ResponsiveContainer>

      {/* Insight Card */}
      <div className="mt-6 p-4 bg-[oklch(0.75_0.15_160)]/10 rounded-xl border border-[oklch(0.75_0.15_160)]/20">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            <TrendingUp className="size-5 text-[oklch(0.75_0.15_160)]" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-[oklch(0.145_0_0)] mb-1">
              Key Insight
            </h4>
            <p className="text-sm text-[oklch(0.556_0_0)] leading-relaxed">
              {data.insight}
            </p>
          </div>
        </div>
      </div>

      {/* Statistical Note */}
      <div className="mt-4 pt-4 border-t border-[oklch(0.922_0_0)]">
        <p className="text-xs text-[oklch(0.556_0_0)] leading-relaxed">
          <strong>Statistical Note:</strong> Pearson correlation coefficient (r
          = {data.correlationCoefficient.toFixed(2)}) with{' '}
          {data.pValue < 0.05 ? 'statistical significance' : 'low significance'}{' '}
          (p = {data.pValue.toFixed(3)}). {data.confidence} confidence based on
          sample size of {data.sampleSize}.
        </p>
      </div>
    </div>
  );
}
