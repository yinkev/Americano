'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import {
  AlertTriangle,
  BookOpen,
  Target,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

/**
 * Failure pattern type
 */
interface FailurePattern {
  id: string;
  patternType: string; // e.g., "Category confusion", "Systematic error"
  description: string; // e.g., "Confuses ACE inhibitors vs ARBs"
  frequency: number; // Number of occurrences
  affectedConcepts: ConceptSummary[];
  remediation: string[]; // Recommendations
  status: 'DETECTED' | 'REMEDIATION' | 'MASTERY';
  lastOccurred: string; // ISO date string
}

/**
 * Affected concept summary
 */
interface ConceptSummary {
  id: string;
  name: string;
  failureCount: number;
}

/**
 * Remediation resource
 */
interface RemediationResource {
  title: string;
  type: 'VIDEO' | 'ARTICLE' | 'PRACTICE' | 'GUIDELINE';
  url?: string;
}

/**
 * Common Pitfalls Dashboard
 *
 * Displays user's failure patterns and provides remediation resources.
 *
 * **Features**:
 * - Top 5 failure patterns (bar chart)
 * - Affected concepts list per pattern
 * - Remediation recommendations
 * - "Address This Gap" button (generates focused mission)
 * - Pattern resolution tracking (detected → remediation → mastery)
 * - Orange theme for pitfalls (not red - growth mindset)
 * - OKLCH colors, glassmorphism design (NO gradients)
 *
 * @see Story 4.3 Task 9 (Common Pitfalls Dashboard)
 * @see Story 4.3 AC#6 (Performance Pattern Analysis)
 */
export default function PitfallsDashboardPage() {
  const [patterns, setPatterns] = useState<FailurePattern[]>([]);
  const [selectedPattern, setSelectedPattern] = useState<FailurePattern | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingMission, setIsGeneratingMission] = useState(false);

  useEffect(() => {
    fetchFailurePatterns();
  }, []);

  const fetchFailurePatterns = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/validation/patterns');
      if (!response.ok) {
        throw new Error('Failed to fetch failure patterns');
      }
      const data = await response.json();

      setPatterns(data.patterns || []);
      if (data.patterns && data.patterns.length > 0) {
        setSelectedPattern(data.patterns[0]); // Select first pattern by default
      }
    } catch (error) {
      console.error('Error fetching failure patterns:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddressGap = async (patternId: string) => {
    setIsGeneratingMission(true);
    try {
      const response = await fetch('/api/validation/patterns/remediate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ patternId }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate remediation mission');
      }

      const data = await response.json();
      // Redirect to the new mission
      if (data.missionId) {
        window.location.href = `/study?missionId=${data.missionId}`;
      }
    } catch (error) {
      console.error('Error generating remediation mission:', error);
    } finally {
      setIsGeneratingMission(false);
    }
  };

  // Prepare bar chart data
  const chartData = patterns.slice(0, 5).map((pattern) => ({
    name: pattern.description.length > 30
      ? pattern.description.substring(0, 30) + '...'
      : pattern.description,
    frequency: pattern.frequency,
    fullDescription: pattern.description,
    id: pattern.id,
  }));

  // Get status badge color
  const getStatusColor = (status: FailurePattern['status']) => {
    switch (status) {
      case 'DETECTED':
        return 'oklch(0.72 0.16 45)'; // Orange
      case 'REMEDIATION':
        return 'oklch(0.75 0.12 85)'; // Yellow
      case 'MASTERY':
        return 'oklch(0.7 0.15 145)'; // Green
      default:
        return 'oklch(0.556 0 0)'; // Gray
    }
  };

  const getStatusLabel = (status: FailurePattern['status']) => {
    switch (status) {
      case 'DETECTED':
        return 'Needs Work';
      case 'REMEDIATION':
        return 'In Progress';
      case 'MASTERY':
        return 'Mastered';
      default:
        return 'Unknown';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading failure patterns...</p>
          </div>
        </div>
      </div>
    );
  }

  if (patterns.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-2 mb-8">
          <h1 className="text-3xl font-heading font-bold text-foreground">
            Common Pitfalls
          </h1>
          <p className="text-base text-muted-foreground">
            Track and address your recurring knowledge gaps
          </p>
        </div>

        <Card className="p-12 bg-white/95 backdrop-blur-xl border border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] text-center">
          <CheckCircle2
            className="w-16 h-16 mx-auto mb-4"
            style={{ color: 'oklch(0.7 0.15 145)' }}
          />
          <h3 className="text-xl font-heading font-semibold mb-2">
            No Patterns Detected Yet
          </h3>
          <p className="text-muted-foreground">
            Keep practicing! We'll identify patterns as you complete more challenges.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-heading font-bold text-foreground">
          Common Pitfalls
        </h1>
        <p className="text-base text-muted-foreground">
          Identify and address your recurring knowledge gaps
        </p>
      </div>

      {/* Top 5 Failure Patterns Bar Chart */}
      <Card className="p-6 bg-white/95 backdrop-blur-xl border border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)]">
        <h2 className="text-xl font-heading font-semibold mb-6">
          Top 5 Failure Patterns
        </h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 20, bottom: 80, left: 60 }}
            onClick={(data: any) => {
              if (data && data.activePayload && data.activePayload[0]) {
                const clickedPattern = patterns.find(
                  (p) => p.id === data.activePayload[0].payload.id
                );
                if (clickedPattern) {
                  setSelectedPattern(clickedPattern);
                }
              }
            }}
          >
            <CartesianGrid stroke="oklch(0.9 0.02 240)" strokeDasharray="5 5" />
            <XAxis
              dataKey="name"
              angle={-45}
              textAnchor="end"
              height={120}
              tick={{ fill: 'oklch(0.556 0 0)', fontSize: 12 }}
            />
            <YAxis
              tick={{ fill: 'oklch(0.556 0 0)', fontSize: 12 }}
              label={{
                value: 'Frequency',
                angle: -90,
                position: 'insideLeft',
                style: { fill: 'oklch(0.556 0 0)', fontSize: 14 }
              }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length > 0) {
                  return (
                    <div className="bg-white/95 backdrop-blur-xl border border-white/30 shadow-lg p-3 rounded-lg max-w-xs">
                      <p className="font-semibold text-sm mb-1">
                        {payload[0].payload.fullDescription}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Occurred {payload[0].value} times
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="frequency" radius={[8, 8, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill="oklch(0.72 0.16 45)"
                  style={{ cursor: 'pointer' }}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <p className="text-xs text-muted-foreground text-center mt-4">
          Click on a bar to see detailed information
        </p>
      </Card>

      {/* Selected Pattern Details */}
      {selectedPattern && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pattern Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 bg-white/95 backdrop-blur-xl border border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)]">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3 flex-1">
                  <AlertTriangle
                    className="w-6 h-6 flex-shrink-0 mt-1"
                    style={{ color: 'oklch(0.72 0.16 45)' }}
                  />
                  <div className="flex-1">
                    <h3 className="text-xl font-heading font-semibold mb-2">
                      {selectedPattern.description}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>
                        Occurred <strong>{selectedPattern.frequency}</strong> times
                      </span>
                      <span>•</span>
                      <span>
                        Last: {new Date(selectedPattern.lastOccurred).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <span
                  className="px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap"
                  style={{
                    backgroundColor: `${getStatusColor(selectedPattern.status)}/10`,
                    color: getStatusColor(selectedPattern.status),
                  }}
                >
                  {getStatusLabel(selectedPattern.status)}
                </span>
              </div>

              {/* Affected Concepts */}
              <div className="space-y-3 mt-6">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Affected Concepts
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedPattern.affectedConcepts.map((concept) => (
                    <div
                      key={concept.id}
                      className="p-3 rounded-lg border border-border bg-background/50"
                    >
                      <p className="text-sm font-medium">{concept.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {concept.failureCount} failures
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Remediation Recommendations */}
            <Card
              className="p-6 border"
              style={{
                backgroundColor: 'oklch(0.95 0.05 280)',
                borderColor: 'oklch(0.85 0.08 280)',
              }}
            >
              <div className="flex items-start gap-3">
                <BookOpen
                  className="w-5 h-5 flex-shrink-0 mt-1"
                  style={{ color: 'oklch(0.68 0.16 280)' }}
                />
                <div className="flex-1">
                  <h4 className="font-semibold mb-3">Remediation Plan</h4>
                  <ul className="space-y-2">
                    {selectedPattern.remediation.map((item, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-sm"
                        style={{ color: 'oklch(0.35 0.16 280)' }}
                      >
                        <span
                          className="flex-shrink-0"
                          style={{ color: 'oklch(0.68 0.16 280)' }}
                        >
                          {idx + 1}.
                        </span>
                        <span className="flex-1">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          </div>

          {/* Action Panel */}
          <div className="lg:col-span-1">
            <Card
              className="p-6 border sticky top-4"
              style={{
                backgroundColor: 'oklch(0.98 0.03 45)',
                borderColor: 'oklch(0.90 0.06 45)',
              }}
            >
              <h4 className="font-semibold mb-4">Take Action</h4>

              <div className="space-y-4">
                <p className="text-sm text-foreground">
                  Ready to address this gap? We'll create a focused study mission targeting
                  these concepts.
                </p>

                <Button
                  onClick={() => handleAddressGap(selectedPattern.id)}
                  disabled={isGeneratingMission || selectedPattern.status === 'MASTERY'}
                  className="w-full min-h-[44px]"
                  style={{
                    backgroundColor: 'oklch(0.72 0.16 45)',
                    color: 'white',
                  }}
                >
                  {isGeneratingMission ? (
                    'Generating Mission...'
                  ) : selectedPattern.status === 'MASTERY' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Mastered!
                    </>
                  ) : (
                    <>
                      Address This Gap
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>

                {selectedPattern.status === 'REMEDIATION' && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-white/50">
                    <TrendingUp
                      className="w-4 h-4 flex-shrink-0 mt-0.5"
                      style={{ color: 'oklch(0.75 0.12 85)' }}
                    />
                    <p className="text-xs text-foreground">
                      You're making progress on this pattern! Keep practicing to reach mastery.
                    </p>
                  </div>
                )}

                {selectedPattern.status === 'MASTERY' && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-white/50">
                    <CheckCircle2
                      className="w-4 h-4 flex-shrink-0 mt-0.5"
                      style={{ color: 'oklch(0.7 0.15 145)' }}
                    />
                    <p className="text-xs text-foreground">
                      Great work! You've mastered this pattern.
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Pattern Resolution Tracker */}
      <Card className="p-6 bg-white/95 backdrop-blur-xl border border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)]">
        <h2 className="text-xl font-heading font-semibold mb-6">
          Resolution Progress
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Detected</span>
              <AlertTriangle
                className="w-4 h-4"
                style={{ color: 'oklch(0.72 0.16 45)' }}
              />
            </div>
            <p className="text-3xl font-heading font-bold">
              {patterns.filter((p) => p.status === 'DETECTED').length}
            </p>
          </div>

          <div className="p-4 rounded-lg border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">In Progress</span>
              <TrendingUp
                className="w-4 h-4"
                style={{ color: 'oklch(0.75 0.12 85)' }}
              />
            </div>
            <p className="text-3xl font-heading font-bold">
              {patterns.filter((p) => p.status === 'REMEDIATION').length}
            </p>
          </div>

          <div className="p-4 rounded-lg border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Mastered</span>
              <CheckCircle2
                className="w-4 h-4"
                style={{ color: 'oklch(0.7 0.15 145)' }}
              />
            </div>
            <p className="text-3xl font-heading font-bold">
              {patterns.filter((p) => p.status === 'MASTERY').length}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
