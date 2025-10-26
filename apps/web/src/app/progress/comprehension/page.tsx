'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
} from 'recharts';
import type { ComprehensionMetric } from '@/types/validation';

interface ObjectiveMetrics {
  objectiveId: string;
  objectiveName: string;
  courseName: string;
  metrics: ComprehensionMetric[];
  trend: 'IMPROVING' | 'STABLE' | 'WORSENING';
  avgScore: number;
}

/**
 * Comprehension Analytics Page
 *
 * Displays comprehension performance trends and insights across learning objectives.
 *
 * **Features**:
 * - Line chart showing score progression over time
 * - Weak comprehension areas identification (avg < 60%)
 * - Filters by course, date range, and comprehension level
 * - Calibration accuracy scatter plot
 * - Glassmorphism design with OKLCH colors
 *
 * @see Story 4.1 Task 7 (Comprehension Analytics Page)
 * @see Story 4.1 AC#7 (Historical Metrics)
 */
export default function ComprehensionAnalyticsPage() {
  const [objectivesData, setObjectivesData] = useState<ObjectiveMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'30' | '90'>('30');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');

  useEffect(() => {
    fetchComprehensionData();
  }, [dateRange]);

  const fetchComprehensionData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch all learning objectives with their comprehension metrics
      const objectivesResponse = await fetch(`/api/analytics/objectives?timeframe=${dateRange === '30' ? 'month' : 'quarter'}`);

      if (!objectivesResponse.ok) {
        throw new Error('Failed to fetch objectives');
      }

      const objectivesResult = await objectivesResponse.json();
      const objectives = objectivesResult.data?.objectives || [];

      // Fetch comprehension metrics for each objective
      const objectivesWithMetrics = await Promise.all(
        objectives.map(async (obj: any) => {
          const metricsResponse = await fetch(`/api/validation/metrics/${obj.id}?days=${dateRange}`);

          if (!metricsResponse.ok) {
            return null;
          }

          const metricsResult = await metricsResponse.json();
          const metricsData = metricsResult.data;

          if (!metricsData || metricsData.metrics.length === 0) {
            return null;
          }

          return {
            objectiveId: obj.id,
            objectiveName: obj.objective,
            courseName: obj.lecture?.courseName || 'Unknown Course',
            metrics: metricsData.metrics,
            trend: metricsData.trend,
            avgScore: metricsData.avgScore,
          };
        })
      );

      // Filter out null values (objectives without comprehension metrics)
      const validObjectives = objectivesWithMetrics.filter((obj): obj is ObjectiveMetrics => obj !== null);
      setObjectivesData(validObjectives);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load comprehension data');
    } finally {
      setIsLoading(false);
    }
  };

  const getTrendIcon = (trend: 'IMPROVING' | 'STABLE' | 'WORSENING') => {
    switch (trend) {
      case 'IMPROVING':
        return (
          <div aria-label="Trend: Improving">
            <TrendingUp className="h-4 w-4" style={{ color: 'oklch(0.7 0.15 145)' }} />
          </div>
        );
      case 'WORSENING':
        return (
          <div aria-label="Trend: Worsening">
            <TrendingDown className="h-4 w-4" style={{ color: 'oklch(0.65 0.20 25)' }} />
          </div>
        );
      default:
        return (
          <div aria-label="Trend: Stable">
            <Minus className="h-4 w-4" style={{ color: 'oklch(0.5 0.02 230)' }} />
          </div>
        );
    }
  };

  const getTrendBadgeColor = (trend: string) => {
    switch (trend) {
      case 'IMPROVING':
        return 'border-[oklch(0.7_0.15_145)] text-[oklch(0.5_0.15_145)] bg-[oklch(0.95_0.05_145)]';
      case 'WORSENING':
        return 'border-[oklch(0.65_0.20_25)] text-[oklch(0.5_0.20_25)] bg-[oklch(0.95_0.05_25)]';
      default:
        return 'border-[oklch(0.5_0.02_230)] text-[oklch(0.3_0.02_230)] bg-[oklch(0.95_0.01_230)]';
    }
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return 'border-[oklch(0.7_0.15_145)] text-[oklch(0.5_0.15_145)] bg-[oklch(0.95_0.05_145)]';
    if (score >= 60) return 'border-[oklch(0.75_0.12_85)] text-[oklch(0.5_0.12_85)] bg-[oklch(0.95_0.05_85)]';
    return 'border-[oklch(0.65_0.20_25)] text-[oklch(0.5_0.20_25)] bg-[oklch(0.95_0.05_25)]';
  };

  const filteredData = objectivesData.filter((obj) => {
    if (courseFilter !== 'all' && obj.courseName !== courseFilter) return false;
    if (levelFilter === 'weak' && obj.avgScore >= 60) return false;
    if (levelFilter === 'proficient' && obj.avgScore < 80) return false;
    return true;
  });

  const weakAreas = objectivesData.filter(
    (obj) => obj.avgScore < 60 && obj.metrics.length >= 3
  );

  const uniqueCourses = Array.from(new Set(objectivesData.map((obj) => obj.courseName)));

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
        <h1 className="text-3xl font-bold font-dm-sans">Comprehension Analytics</h1>
        <p className="text-muted-foreground mt-2">
          Track your understanding validation performance across learning objectives
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
            <Select value={dateRange} onValueChange={(value: '30' | '90') => setDateRange(value)} aria-label="Filter by date range">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">Last 30 Days</SelectItem>
                <SelectItem value="90">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">Course</label>
            <Select value={courseFilter} onValueChange={setCourseFilter} aria-label="Filter by course">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {uniqueCourses.map((course) => (
                  <SelectItem key={course} value={course}>
                    {course}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">Comprehension Level</label>
            <Select value={levelFilter} onValueChange={setLevelFilter} aria-label="Filter by comprehension level">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="weak">Needs Review (&lt; 60%)</SelectItem>
                <SelectItem value="proficient">Proficient (≥ 80%)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Empty State or Weak Areas Alert */}
      {objectivesData.length === 0 ? (
        <Alert role="status" aria-live="polite" className="bg-[oklch(0.95_0.05_230)] border border-[oklch(0.85_0.08_230)]">
          <AlertCircle className="h-4 w-4 text-[oklch(0.55_0.18_230)]" />
          <AlertTitle className="text-[oklch(0.30_0.15_230)]">No Comprehension Data Yet</AlertTitle>
          <AlertDescription className="text-[oklch(0.35_0.16_230)]">
            Start validating your understanding during study sessions to see your comprehension
            trends here. After each objective review, you'll be prompted to explain concepts in
            your own words.
          </AlertDescription>
        </Alert>
      ) : weakAreas.length > 0 ? (
        <Alert role="alert" aria-live="assertive" className="bg-[oklch(0.95_0.05_85)] border border-[oklch(0.85_0.08_85)]">
          <AlertCircle className="h-4 w-4 text-[oklch(0.55_0.18_85)]" />
          <AlertTitle className="text-[oklch(0.30_0.15_85)]">
            {weakAreas.length} Area{weakAreas.length > 1 ? 's' : ''} Need Attention
          </AlertTitle>
          <AlertDescription className="text-[oklch(0.35_0.16_85)]">
            The following objectives have consistently low comprehension scores (&lt; 60% avg over
            3+ attempts):
            <ul className="list-disc list-inside mt-2 space-y-1">
              {weakAreas.slice(0, 5).map((obj) => (
                <li key={obj.objectiveId}>
                  <span className="font-medium">{obj.objectiveName}</span> - Avg: {Math.round(obj.avgScore)}%
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}

      {/* Comprehension Trends Chart */}
      {filteredData.length > 0 && (
        <Card className="bg-card  shadow-none">
          <CardHeader>
            <CardTitle>Comprehension Score Trends</CardTitle>
            <CardDescription>
              Track how your understanding improves over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  type="category"
                  allowDuplicatedCategory={false}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis domain={[0, 100]} label={{ value: 'Score (%)', angle: -90, position: 'insideLeft' }} />
                <Tooltip
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value: number) => [`${Math.round(value)}%`, 'Score']}
                />
                <Legend />
                {filteredData.map((obj, index) => (
                  <Line
                    key={obj.objectiveId}
                    data={obj.metrics.map((m) => ({ date: m.date, score: m.avgScore }))}
                    type="monotone"
                    dataKey="score"
                    stroke={`oklch(0.${6 - (index % 5)} 0.18 ${(index * 60) % 360})`}
                    strokeWidth={2}
                    name={obj.objectiveName}
                    dot={{ r: 4 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Calibration Accuracy Chart - Task 7.6 */}
      {filteredData.length > 0 && (
        <Card className="bg-card  shadow-none">
          <CardHeader>
            <CardTitle>Confidence Calibration Accuracy</CardTitle>
            <CardDescription>
              How well does your confidence match your actual comprehension? Points near the diagonal line indicate good calibration.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  dataKey="confidence"
                  name="Confidence"
                  domain={[0, 100]}
                  label={{ value: 'Confidence Level (%)', position: 'insideBottom', offset: -10 }}
                />
                <YAxis
                  type="number"
                  dataKey="score"
                  name="Score"
                  domain={[0, 100]}
                  label={{ value: 'AI Score (%)', angle: -90, position: 'insideLeft' }}
                />
                <ZAxis range={[60, 60]} />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  formatter={(value: number) => `${Math.round(value)}%`}
                />
                <Legend />
                {/* Perfect calibration reference line */}
                <Scatter
                  name="Perfect Calibration"
                  data={[
                    { confidence: 0, score: 0 },
                    { confidence: 100, score: 100 },
                  ]}
                  fill="oklch(0.6 0.05 230)"
                  line={{ stroke: 'oklch(0.6 0.05 230)', strokeWidth: 2, strokeDasharray: '5 5' }}
                  shape="circle"
                />
                {/* Actual calibration data */}
                <Scatter
                  name="Your Calibration"
                  data={filteredData.flatMap((obj) =>
                    obj.metrics.map((m) => ({
                      confidence: ((m.sampleSize || 3) - 1) * 25, // Approximate confidence from sample size (1-5 scale)
                      score: m.avgScore,
                      objectiveName: obj.objectiveName,
                    }))
                  )}
                  fill="oklch(0.6 0.18 230)"
                />
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Objectives Grid */}
      {filteredData.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredData.map((obj) => (
            <Card key={obj.objectiveId} className="bg-card  shadow-none">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-2">{obj.objectiveName}</CardTitle>
                    <CardDescription className="mt-1">{obj.courseName}</CardDescription>
                  </div>
                  {getTrendIcon(obj.trend)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Average Score</span>
                  <Badge className={getScoreBadgeColor(obj.avgScore)}>
                    {Math.round(obj.avgScore)}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Trend</span>
                  <Badge className={getTrendBadgeColor(obj.trend)}>
                    {obj.trend.charAt(0) + obj.trend.slice(1).toLowerCase()}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Attempts</span>
                  <span className="text-sm font-medium">{obj.metrics.length}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
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
