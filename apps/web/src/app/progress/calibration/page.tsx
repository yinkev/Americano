'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import {
  ScatterChart,
  Scatter,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Label,
  Legend,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  CheckCircle2,
  Target,
  Lightbulb,
  Filter,
  ArrowUpCircle,
  ArrowDownCircle,
} from 'lucide-react';

/**
 * Calibration data point
 */
interface CalibrationPoint {
  confidence: number; // 1-5 scale (normalized to 0-100 for chart)
  score: number; // 0-100 scale
  conceptName: string;
  date: string;
  isOverconfident: boolean;
  isUnderconfident: boolean;
}

/**
 * Calibration metrics
 */
interface CalibrationMetrics {
  meanAbsoluteError: number; // Average |confidence - score|
  correlationCoefficient: number; // -1 to 1
  overconfidentCount: number;
  underconfidentCount: number;
  calibratedCount: number;
  trend: 'IMPROVING' | 'STABLE' | 'WORSENING';
}

/**
 * Example calibration issue
 */
interface CalibrationExample {
  conceptName: string;
  confidence: string; // e.g., "Very Confident"
  score: number;
  type: 'OVERCONFIDENT' | 'UNDERCONFIDENT';
}

/**
 * Trend data point for line chart
 */
interface TrendPoint {
  date: string;
  calibrationAccuracy: number; // 0-100 (100 = perfect calibration)
}

/**
 * Calibration Trends Dashboard (Story 4.4 Task 7)
 *
 * Comprehensive confidence calibration analytics dashboard with:
 * - Line chart: Confidence vs. Actual Score over time (dual lines)
 * - Scatter plot: Calibration accuracy with ideal line (y=x)
 * - Correlation coefficient with interpretation (Strong/Moderate/Weak)
 * - Calibration category breakdown (bar chart)
 * - Overconfident topics list (delta > 15 across 3+ assessments)
 * - Underconfident topics list (delta < -15 across 3+ assessments)
 * - Filters: date range (7/30/90 days), course, topic, assessment type
 * - Glassmorphism design with OKLCH colors (NO gradients)
 * - Responsive layout, accessibility-first (ARIA labels, keyboard navigation)
 *
 * @see Story 4.4 Task 7 (Calibration Trends Dashboard)
 * @see Story 4.4 AC#6 (Calibration Trends Dashboard)
 */
export default function CalibrationDashboardPage() {
  const [calibrationData, setCalibrationData] = useState<CalibrationPoint[]>([]);
  const [metrics, setMetrics] = useState<CalibrationMetrics | null>(null);
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  const [examples, setExamples] = useState<CalibrationExample[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7days' | '30days' | '90days'>('30days');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchCalibrationData();
  }, [dateRange]);

  const fetchCalibrationData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/validation/calibration?dateRange=${dateRange}`);
      if (!response.ok) {
        throw new Error('Failed to fetch calibration data');
      }
      const result = await response.json();
      const data = result.data;

      setCalibrationData(data.calibrationPoints || []);
      setMetrics(data.metrics || null);
      setTrendData(data.trendData || []);
      setExamples(data.examples || []);
    } catch (error) {
      console.error('Error fetching calibration data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Convert confidence (1-5) to 0-100 scale for charting
  const normalizeConfidence = (confidence: number) => (confidence - 1) * 25;

  // Prepare scatter plot data
  const scatterData = calibrationData.map((point) => ({
    x: normalizeConfidence(point.confidence),
    y: point.score,
    name: point.conceptName,
    fill: point.isOverconfident
      ? 'oklch(0.65 0.20 25)' // Red for overconfidence
      : point.isUnderconfident
      ? 'oklch(0.65 0.18 230)' // Blue for underconfidence
      : 'oklch(0.7 0.15 145)', // Green for calibrated
  }));

  // Interpret correlation coefficient (constraint #4)
  const interpretCorrelation = (r: number): { label: string; color: string } => {
    if (r > 0.7) return { label: 'Strong', color: 'oklch(0.7 0.15 145)' };
    if (r >= 0.4) return { label: 'Moderate', color: 'oklch(0.75 0.12 85)' };
    return { label: 'Weak', color: 'oklch(0.65 0.20 25)' };
  };

  const correlation = metrics ? interpretCorrelation(metrics.correlationCoefficient) : null;

  // Calculate category breakdown for bar chart
  const categoryBreakdown = metrics
    ? [
        {
          name: 'Calibrated',
          value: metrics.calibratedCount,
          percentage: Math.round(
            (metrics.calibratedCount /
              (metrics.calibratedCount + metrics.overconfidentCount + metrics.underconfidentCount)) *
              100
          ),
        },
        {
          name: 'Overconfident',
          value: metrics.overconfidentCount,
          percentage: Math.round(
            (metrics.overconfidentCount /
              (metrics.calibratedCount + metrics.overconfidentCount + metrics.underconfidentCount)) *
              100
          ),
        },
        {
          name: 'Underconfident',
          value: metrics.underconfidentCount,
          percentage: Math.round(
            (metrics.underconfidentCount /
              (metrics.calibratedCount + metrics.overconfidentCount + metrics.underconfidentCount)) *
              100
          ),
        },
      ]
    : [];

  // Determine trend icon and color
  const getTrendIndicator = () => {
    if (!metrics) return null;

    switch (metrics.trend) {
      case 'IMPROVING':
        return {
          icon: <TrendingUp className="w-5 h-5" />,
          color: 'oklch(0.7 0.15 145)',
          text: 'Improving',
        };
      case 'WORSENING':
        return {
          icon: <TrendingDown className="w-5 h-5" />,
          color: 'oklch(0.65 0.20 25)',
          text: 'Declining',
        };
      default:
        return {
          icon: <Minus className="w-5 h-5" />,
          color: 'oklch(0.75 0.12 85)',
          text: 'Stable',
        };
    }
  };

  const trendIndicator = getTrendIndicator();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading calibration data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-heading font-bold text-foreground">
            Calibration Trends
          </h1>
          <p className="text-base text-muted-foreground">
            Track how well your confidence matches your actual performance
          </p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium bg-card text-gray-700 hover:bg-card shadow-none transition-colors min-h-[44px]"
          aria-label="Toggle filters"
          aria-expanded={showFilters}
        >
          <Filter className="w-4 h-4" />
          Filters
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="p-6 bg-card  border border-border shadow-none mb-6">
          <h3 className="text-lg font-heading font-bold text-foreground mb-4">Date Range</h3>
          <div className="flex gap-3 flex-wrap">
            {(['7days', '30days', '90days'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 rounded-xl font-medium transition-colors min-h-[44px] ${
                  dateRange === range
                    ? 'bg-[oklch(0.55_0.22_264)] text-white'
                    : 'bg-card text-gray-700 hover:bg-card'
                }`}
                aria-pressed={dateRange === range}
              >
                {range === '7days' ? '7 Days' : range === '30days' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Metrics Overview */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Mean Absolute Error */}
          <Card className="p-6 bg-card  border border-border shadow-none">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Calibration Error</span>
                <Target className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-3xl font-heading font-bold text-foreground">
                {metrics.meanAbsoluteError.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground">
                Lower is better (0% = perfect calibration)
              </p>
            </div>
          </Card>

          {/* Correlation Coefficient with Interpretation */}
          <Card className="p-6 bg-card  border border-border shadow-none">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Correlation</span>
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: correlation?.color }}
                  aria-label={`${correlation?.label} correlation`}
                />
              </div>
              <p className="text-3xl font-heading font-bold text-foreground">
                {metrics.correlationCoefficient.toFixed(2)}
              </p>
              <p className="text-xs font-medium" style={{ color: correlation?.color }}>
                {correlation?.label} calibration accuracy
              </p>
            </div>
          </Card>

          {/* Trend */}
          {trendIndicator && (
            <Card className="p-6 bg-card  border border-border shadow-none">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Trend</span>
                  <span style={{ color: trendIndicator.color }}>
                    {trendIndicator.icon}
                  </span>
                </div>
                <p
                  className="text-3xl font-heading font-bold"
                  style={{ color: trendIndicator.color }}
                >
                  {trendIndicator.text}
                </p>
                <p className="text-xs text-muted-foreground">
                  {metrics.calibratedCount} well-calibrated attempts
                </p>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Dual Line Chart: Confidence vs Score Over Time */}
      {trendData.length > 0 && (
        <Card className="p-6 bg-card  border border-border shadow-none">
          <h2 className="text-xl font-heading font-semibold mb-6">
            Confidence vs. Score Over Time
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={calibrationData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
              <XAxis
                dataKey="date"
                stroke="#666"
                tick={{ fill: '#666', fontSize: 12 }}
                aria-label="Date"
              />
              <YAxis
                domain={[0, 100]}
                stroke="#666"
                tick={{ fill: '#666', fontSize: 12 }}
                aria-label="Score (0-100)"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(12px)',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 8px 32px rgba(31,38,135,0.1)',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="confidence"
                stroke="oklch(0.55 0.22 264)"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Confidence"
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="oklch(0.7 0.15 160)"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Actual Score"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Calibration Scatter Plot */}
      <Card className="p-6 bg-card  border border-border shadow-none">
        <h2 className="text-xl font-heading font-semibold mb-6">
          Calibration Accuracy
        </h2>
        <ResponsiveContainer width="100%" height={500}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 60 }}>
            <CartesianGrid stroke="oklch(0.9 0.02 240)" strokeDasharray="5 5" />
            <XAxis
              type="number"
              dataKey="x"
              name="Confidence"
              domain={[0, 100]}
              tick={{ fill: 'oklch(0.556 0 0)', fontSize: 12 }}
            >
              <Label
                value="Confidence Level"
                position="bottom"
                offset={40}
                style={{ fill: 'oklch(0.556 0 0)', fontSize: 14 }}
              />
            </XAxis>
            <YAxis
              type="number"
              dataKey="y"
              name="Score"
              domain={[0, 100]}
              tick={{ fill: 'oklch(0.556 0 0)', fontSize: 12 }}
            >
              <Label
                value="Actual Score"
                angle={-90}
                position="left"
                offset={40}
                style={{ fill: 'oklch(0.556 0 0)', fontSize: 14 }}
              />
            </YAxis>
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length > 0) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-card  border border-border shadow-none p-3 rounded-lg">
                      <p className="font-semibold text-sm mb-1">{data.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Confidence: {data.x}% | Score: {data.y}%
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            {/* Perfect calibration line (diagonal) */}
            <ReferenceLine
              segment={[{ x: 0, y: 0 }, { x: 100, y: 100 }]}
              stroke="oklch(0.556 0 0)"
              strokeDasharray="3 3"
              strokeWidth={2}
            />
            {/* Overconfidence zone (above diagonal) - subtle background */}
            <ReferenceLine
              y={80}
              stroke="oklch(0.65 0.20 25 / 0.3)"
              strokeWidth={0}
              label={{
                value: 'Overconfidence Zone',
                position: 'insideTopRight',
                fill: 'oklch(0.65 0.20 25)',
                fontSize: 11
              }}
            />
            {/* Underconfidence zone (below diagonal) */}
            <ReferenceLine
              y={20}
              stroke="oklch(0.65 0.18 230 / 0.3)"
              strokeWidth={0}
              label={{
                value: 'Underconfidence Zone',
                position: 'insideBottomRight',
                fill: 'oklch(0.65 0.18 230)',
                fontSize: 11
              }}
            />
            <Scatter
              name="Attempts"
              data={scatterData}
              fill="oklch(0.7 0.15 145)"
            />
          </ScatterChart>
        </ResponsiveContainer>
        <div className="mt-4 flex items-center justify-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: 'oklch(0.65 0.20 25)' }}
            ></div>
            <span>Overconfident</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: 'oklch(0.7 0.15 145)' }}
            ></div>
            <span>Well Calibrated</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: 'oklch(0.65 0.18 230)' }}
            ></div>
            <span>Underconfident</span>
          </div>
        </div>
      </Card>

      {/* Category Breakdown Bar Chart */}
      {categoryBreakdown.length > 0 && (
        <Card className="p-6 bg-card  border border-border shadow-none">
          <h2 className="text-xl font-heading font-semibold mb-6">
            Calibration Category Breakdown
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={categoryBreakdown} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <CartesianGrid stroke="oklch(0.9 0.02 240)" strokeDasharray="5 5" />
              <XAxis
                dataKey="name"
                stroke="#666"
                tick={{ fill: '#666', fontSize: 12 }}
              />
              <YAxis
                stroke="#666"
                tick={{ fill: '#666', fontSize: 12 }}
                aria-label="Count"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(12px)',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 8px 32px rgba(31,38,135,0.1)',
                }}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                <Cell fill="oklch(0.7 0.15 145)" />
                <Cell fill="oklch(0.65 0.20 25)" />
                <Cell fill="oklch(0.65 0.18 230)" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex justify-around mt-4 text-sm">
            {categoryBreakdown.map((cat) => (
              <div key={cat.name} className="text-center">
                <div className="font-bold text-xl text-gray-900">{cat.percentage}%</div>
                <div className="text-gray-600">{cat.name}</div>
                <div className="text-gray-500 text-xs">{cat.value} assessments</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Overconfident and Underconfident Topics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Overconfident Topics */}
        <Card className="p-6 bg-card  border border-border shadow-none">
          <div className="flex items-center gap-3 mb-4">
            <ArrowUpCircle className="w-6 h-6" style={{ color: 'oklch(0.65 0.20 25)' }} />
            <h2 className="text-xl font-heading font-semibold">Overconfident Topics</h2>
          </div>
          {examples.filter((ex) => ex.type === 'OVERCONFIDENT').length === 0 ? (
            <p className="text-gray-600 text-sm">
              No overconfident patterns detected. Great calibration!
            </p>
          ) : (
            <div className="space-y-3">
              {examples
                .filter((ex) => ex.type === 'OVERCONFIDENT')
                .map((ex, idx) => (
                  <div
                    key={idx}
                    className="p-3 border rounded-xl"
                    style={{
                      backgroundColor: 'oklch(0.95 0.05 25)',
                      borderColor: 'oklch(0.85 0.08 25)',
                    }}
                  >
                    <div className="font-medium text-gray-900 mb-1">{ex.conceptName}</div>
                    <div className="flex items-center gap-4 text-sm text-gray-700">
                      <span>
                        Confidence: <strong>{ex.confidence}</strong>
                      </span>
                      <span>
                        Score: <strong>{ex.score}%</strong>
                      </span>
                      <span className="text-red-700 font-medium">High gap</span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </Card>

        {/* Underconfident Topics */}
        <Card className="p-6 bg-card  border border-border shadow-none">
          <div className="flex items-center gap-3 mb-4">
            <ArrowDownCircle className="w-6 h-6" style={{ color: 'oklch(0.65 0.18 230)' }} />
            <h2 className="text-xl font-heading font-semibold">Underconfident Topics</h2>
          </div>
          {examples.filter((ex) => ex.type === 'UNDERCONFIDENT').length === 0 ? (
            <p className="text-gray-600 text-sm">
              No underconfident patterns detected. Trust your knowledge!
            </p>
          ) : (
            <div className="space-y-3">
              {examples
                .filter((ex) => ex.type === 'UNDERCONFIDENT')
                .map((ex, idx) => (
                  <div
                    key={idx}
                    className="p-3 border rounded-xl"
                    style={{
                      backgroundColor: 'oklch(0.95 0.05 230)',
                      borderColor: 'oklch(0.85 0.08 230)',
                    }}
                  >
                    <div className="font-medium text-gray-900 mb-1">{ex.conceptName}</div>
                    <div className="flex items-center gap-4 text-sm text-gray-700">
                      <span>
                        Confidence: <strong>{ex.confidence}</strong>
                      </span>
                      <span>
                        Score: <strong>{ex.score}%</strong>
                      </span>
                      <span className="text-blue-700 font-medium">Stronger than expected</span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </Card>
      </div>


      {/* Recalibration Tips */}
      <Card
        className="p-6 border"
        style={{
          backgroundColor: 'oklch(0.95 0.05 280)',
          borderColor: 'oklch(0.85 0.08 280)',
        }}
      >
        <div className="flex items-start gap-4">
          <Lightbulb
            className="w-6 h-6 flex-shrink-0 mt-1"
            style={{ color: 'oklch(0.68 0.16 280)' }}
          />
          <div className="flex-1">
            <h3 className="text-lg font-heading font-semibold mb-3">
              Tips for Better Calibration
            </h3>
            <ul className="space-y-2 text-sm text-foreground">
              <li className="flex items-start gap-2">
                <span style={{ color: 'oklch(0.68 0.16 280)' }}>•</span>
                <span>
                  <strong>If overconfident:</strong> Take more time to review concepts
                  before answering. Ask yourself "What am I missing?"
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: 'oklch(0.68 0.16 280)' }}>•</span>
                <span>
                  <strong>If underconfident:</strong> Trust your preparation! You likely
                  know more than you think.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: 'oklch(0.68 0.16 280)' }}>•</span>
                <span>
                  <strong>Track your gut feeling:</strong> After each question, note whether
                  you felt confident or uncertain. Compare with actual results.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: 'oklch(0.68 0.16 280)' }}>•</span>
                <span>
                  <strong>Perfect calibration (diagonal line):</strong> Your confidence
                  matches your performance. This is the goal!
                </span>
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
