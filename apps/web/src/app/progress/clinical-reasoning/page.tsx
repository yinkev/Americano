'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, TrendingUp, TrendingDown, Minus, Clock } from 'lucide-react';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// Types matching Story 4.2 schema
interface CompetencyScores {
  dataGathering: number;
  diagnosis: number;
  management: number;
  clinicalReasoning: number;
}

interface ScenarioMetric {
  id: string;
  scenarioType: 'DIAGNOSIS' | 'MANAGEMENT' | 'DIFFERENTIAL' | 'COMPLICATIONS';
  score: number;
  competencyScores: CompetencyScores;
  boardExamTopic: string | null;
  respondedAt: string;
  timeSpent: number; // seconds
}

interface AggregatedMetrics {
  avgCompetencyScores: CompetencyScores;
  scenarioTypeBreakdown: Array<{ type: string; count: number }>;
  boardExamCoverage: Array<{ topic: string; count: number }>;
  recentScenarios: ScenarioMetric[];
  weakCompetencies: Array<{ competency: string; avgScore: number }>;
}

/**
 * Clinical Reasoning Analytics Page (Story 4.2 AC#7, AC#8)
 *
 * Displays clinical reasoning performance across scenarios with:
 * - Competency radar chart (4 dimensions)
 * - Scenario type breakdown (bar chart)
 * - Board exam coverage (pie chart)
 * - Weak competencies alert (< 60% avg over 5+ scenarios)
 * - Recent scenarios list with filters
 *
 * Design: Glassmorphism cards with OKLCH colors, no gradients
 */
export default function ClinicalReasoningAnalyticsPage() {
  const [metrics, setMetrics] = useState<AggregatedMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'7' | '30' | '90'>('30');
  const [scenarioTypeFilter, setScenarioTypeFilter] = useState<string>('all');

  useEffect(() => {
    fetchMetrics();
  }, [dateRange]);

  const fetchMetrics = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/validation/scenarios/metrics?dateRange=${dateRange}days`);

      if (!response.ok) {
        throw new Error('Failed to fetch clinical reasoning metrics');
      }

      const result = await response.json();
      setMetrics(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load clinical reasoning data');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter scenarios by type
  const filteredScenarios = metrics?.recentScenarios.filter((scenario) => {
    if (scenarioTypeFilter === 'all') return true;
    return scenario.scenarioType === scenarioTypeFilter;
  }) || [];

  // Prepare radar chart data (4 competencies)
  const radarData = metrics ? [
    { competency: 'Data Gathering', score: metrics.avgCompetencyScores.dataGathering, fullMark: 100 },
    { competency: 'Diagnosis', score: metrics.avgCompetencyScores.diagnosis, fullMark: 100 },
    { competency: 'Management', score: metrics.avgCompetencyScores.management, fullMark: 100 },
    { competency: 'Clinical Reasoning', score: metrics.avgCompetencyScores.clinicalReasoning, fullMark: 100 },
  ] : [];

  // Prepare bar chart data (scenario types)
  const barData = metrics?.scenarioTypeBreakdown.map((item) => ({
    type: item.type,
    count: item.count,
  })) || [];

  // Prepare pie chart data (board exam topics)
  const pieData = metrics?.boardExamCoverage.map((item) => ({
    name: item.topic,
    value: item.count,
  })) || [];

  // Colors for pie chart (rotate through competency colors)
  const COLORS = [
    'oklch(0.65 0.18 200)', // Blue
    'oklch(0.7 0.15 145)',  // Green
    'oklch(0.75 0.12 85)',  // Yellow
    'oklch(0.68 0.16 280)', // Purple
    'oklch(0.65 0.20 25)',  // Red
    'oklch(0.7 0.15 330)',  // Pink
  ];

  // Helper functions
  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'oklch(0.7 0.15 145)'; // Green - Proficient
    if (score >= 60) return 'oklch(0.75 0.12 85)';  // Yellow - Developing
    return 'oklch(0.65 0.20 25)'; // Red - Needs Improvement
  };

  const getScoreBadgeColor = (score: number): string => {
    if (score >= 80) return 'border-[oklch(0.7_0.15_145)] text-[oklch(0.5_0.15_145)] bg-[oklch(0.95_0.05_145)]';
    if (score >= 60) return 'border-[oklch(0.75_0.12_85)] text-[oklch(0.5_0.12_85)] bg-[oklch(0.95_0.05_85)]';
    return 'border-[oklch(0.65_0.20_25)] text-[oklch(0.5_0.20_25)] bg-[oklch(0.95_0.05_25)]';
  };

  const formatScenarioType = (type: string): string => {
    return type.charAt(0) + type.slice(1).toLowerCase();
  };

  const formatTimeSpent = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-dm-sans">Clinical Reasoning Analytics</h1>
        <p className="text-muted-foreground mt-2">
          Track your clinical reasoning performance across multi-stage diagnostic scenarios
        </p>
      </div>

      {/* Filters */}
      <Card className="bg-card  shadow-none">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">Date Range</label>
            <Select value={dateRange} onValueChange={(value: '7' | '30' | '90') => setDateRange(value)} aria-label="Filter by date range">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 Days</SelectItem>
                <SelectItem value="30">Last 30 Days</SelectItem>
                <SelectItem value="90">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">Scenario Type</label>
            <Select value={scenarioTypeFilter} onValueChange={setScenarioTypeFilter} aria-label="Filter by scenario type">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="DIAGNOSIS">Diagnosis</SelectItem>
                <SelectItem value="MANAGEMENT">Management</SelectItem>
                <SelectItem value="DIFFERENTIAL">Differential</SelectItem>
                <SelectItem value="COMPLICATIONS">Complications</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Empty State or Weak Competencies Alert */}
      {!metrics || metrics.recentScenarios.length === 0 ? (
        <Alert role="status" aria-live="polite" className="bg-[oklch(0.95_0.05_230)] border border-[oklch(0.85_0.08_230)]">
          <AlertCircle className="h-4 w-4 text-[oklch(0.55_0.18_230)]" />
          <AlertTitle className="text-[oklch(0.30_0.15_230)]">No Clinical Reasoning Data Yet</AlertTitle>
          <AlertDescription className="text-[oklch(0.35_0.16_230)]">
            Complete clinical reasoning scenarios during study sessions to see your performance
            trends here. Each scenario evaluates your data gathering, diagnosis, management, and
            clinical reasoning skills.
          </AlertDescription>
        </Alert>
      ) : metrics.weakCompetencies.length > 0 ? (
        <Alert role="alert" aria-live="assertive" className="bg-[oklch(0.95_0.05_25)] border border-[oklch(0.85_0.08_25)]">
          <AlertCircle className="h-4 w-4 text-[oklch(0.65_0.20_25)]" />
          <AlertTitle className="text-[oklch(0.30_0.15_25)]">
            {metrics.weakCompetencies.length} Competenc{metrics.weakCompetencies.length > 1 ? 'ies' : 'y'} Need Attention
          </AlertTitle>
          <AlertDescription className="text-[oklch(0.35_0.16_25)]">
            The following competencies have consistently low scores (&lt; 60% avg over 5+ scenarios):
            <ul className="list-disc list-inside mt-2 space-y-1">
              {metrics.weakCompetencies.map((item, idx) => (
                <li key={idx}>
                  <span className="font-medium">{item.competency}</span> - Avg: {Math.round(item.avgScore)}%
                </li>
              ))}
            </ul>
            <p className="mt-3 font-medium">
              Recommendation: Focus on scenarios targeting these weak areas during your next study session.
            </p>
          </AlertDescription>
        </Alert>
      ) : null}

      {/* Competency Radar Chart */}
      {metrics && metrics.recentScenarios.length > 0 && (
        <Card className="bg-card  shadow-none">
          <CardHeader>
            <CardTitle>Clinical Competency Profile</CardTitle>
            <CardDescription>
              Average performance across 4 clinical reasoning dimensions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="oklch(0.8 0.02 230)" />
                <PolarAngleAxis
                  dataKey="competency"
                  tick={{ fill: 'oklch(0.556 0 0)', fontSize: 14 }}
                />
                <PolarRadiusAxis
                  domain={[0, 100]}
                  tick={{ fill: 'oklch(0.556 0 0)', fontSize: 12 }}
                />
                <Radar
                  dataKey="score"
                  stroke="oklch(0.65 0.18 200)"
                  fill="oklch(0.65 0.18 200 / 0.3)"
                  strokeWidth={2}
                />
                <Tooltip formatter={(value: number) => [`${Math.round(value)}%`, 'Score']} />
              </RadarChart>
            </ResponsiveContainer>

            {/* Competency Score Details */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              {radarData.map((item) => (
                <div key={item.competency} className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">{item.competency}</p>
                  <p className="text-2xl font-bold" style={{ color: getScoreColor(item.score) }}>
                    {Math.round(item.score)}%
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scenario Type Breakdown (Bar Chart) */}
      {metrics && barData.length > 0 && (
        <Card className="bg-card  shadow-none">
          <CardHeader>
            <CardTitle>Scenario Type Distribution</CardTitle>
            <CardDescription>
              Number of scenarios completed by type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.02 230)" />
                <XAxis
                  dataKey="type"
                  tickFormatter={formatScenarioType}
                  tick={{ fill: 'oklch(0.556 0 0)', fontSize: 12 }}
                />
                <YAxis
                  tick={{ fill: 'oklch(0.556 0 0)', fontSize: 12 }}
                  label={{ value: 'Count', angle: -90, position: 'insideLeft', fill: 'oklch(0.556 0 0)' }}
                />
                <Tooltip
                  formatter={(value: number) => [value, 'Scenarios']}
                  labelFormatter={formatScenarioType}
                />
                <Bar dataKey="count" fill="oklch(0.65 0.18 200)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Board Exam Coverage (Pie Chart) */}
      {metrics && pieData.length > 0 && (
        <Card className="bg-card  shadow-none">
          <CardHeader>
            <CardTitle>Board Exam Coverage</CardTitle>
            <CardDescription>
              Distribution of scenarios by board exam topic
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) => `${entry.name}: ${(entry.percent * 100).toFixed(0)}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [value, 'Scenarios']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Recent Scenarios List */}
      {filteredScenarios.length > 0 && (
        <Card className="bg-card  shadow-none">
          <CardHeader>
            <CardTitle>Recent Scenarios</CardTitle>
            <CardDescription>
              Your last {filteredScenarios.length} clinical reasoning scenarios
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredScenarios.slice(0, 10).map((scenario) => (
                <div
                  key={scenario.id}
                  className="p-4 rounded-lg border border-[oklch(0.9_0.02_230)] bg-card hover:bg-card transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className="bg-[oklch(0.65_0.18_200)] text-white border-none">
                          {formatScenarioType(scenario.scenarioType)}
                        </Badge>
                        {scenario.boardExamTopic && (
                          <Badge variant="outline" className="text-xs">
                            {scenario.boardExamTopic}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTimeSpent(scenario.timeSpent)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(scenario.respondedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Data Gathering</p>
                          <p className="text-sm font-semibold">{scenario.competencyScores.dataGathering}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Diagnosis</p>
                          <p className="text-sm font-semibold">{scenario.competencyScores.diagnosis}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Management</p>
                          <p className="text-sm font-semibold">{scenario.competencyScores.management}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Clinical Reasoning</p>
                          <p className="text-sm font-semibold">{scenario.competencyScores.clinicalReasoning}%</p>
                        </div>
                      </div>
                    </div>

                    <Badge className={getScoreBadgeColor(scenario.score)}>
                      {scenario.score}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
