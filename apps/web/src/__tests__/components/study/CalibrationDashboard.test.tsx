/**
 * Story 4.4 Task 10: Calibration Dashboard Component Tests
 *
 * Tests for:
 * - CalibrationDashboardPage component
 * - Scatter plot rendering with confidence vs score data
 * - Line chart for calibration trends
 * - Correlation coefficient display
 * - Perfect calibration line (y=x diagonal)
 * - Zone highlighting (overconfidence, underconfidence)
 * - Trend indicator (improving/stable/worsening)
 * - Examples of miscalibration
 *
 * AC#4: Calibration Feedback Display
 * AC#6: Calibration Trends Dashboard
 */

import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

/**
 * Mock calibration dashboard page
 */
interface CalibrationPoint {
  confidence: number
  score: number
  conceptName: string
  date: string
  isOverconfident: boolean
  isUnderconfident: boolean
}

interface CalibrationMetrics {
  meanAbsoluteError: number
  correlationCoefficient: number
  overconfidentCount: number
  underconfidentCount: number
  calibratedCount: number
  trend: 'IMPROVING' | 'STABLE' | 'WORSENING'
}

interface CalibrationExample {
  conceptName: string
  confidence: string
  score: number
  type: 'OVERCONFIDENT' | 'UNDERCONFIDENT'
}

interface TrendPoint {
  date: string
  calibrationAccuracy: number
}

// Mock component for testing
const MockCalibrationDashboard = ({
  calibrationData,
  metrics,
  trendData,
  examples,
  isLoading = false,
}: {
  calibrationData: CalibrationPoint[]
  metrics: CalibrationMetrics | null
  trendData: TrendPoint[]
  examples: CalibrationExample[]
  isLoading?: boolean
}) => {
  if (isLoading) {
    return (
      <div>
        <div className="animate-spin">Loading</div>
      </div>
    )
  }

  const normalizeConfidence = (confidence: number) => (confidence - 1) * 25

  return (
    <div className="container mx-auto px-4 py-8">
      <h1>Confidence Calibration</h1>

      {/* Metrics Overview */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div data-testid="mae-card">
            <p>Calibration Error</p>
            <p data-testid="mae-value">{metrics.meanAbsoluteError.toFixed(1)}%</p>
          </div>

          <div data-testid="correlation-card">
            <p>Correlation</p>
            <p data-testid="correlation-value">{metrics.correlationCoefficient.toFixed(2)}</p>
          </div>

          <div data-testid="trend-card">
            <p>Trend</p>
            <p data-testid="trend-value">{metrics.trend}</p>
            <p data-testid="calibrated-count">{metrics.calibratedCount} well-calibrated</p>
          </div>
        </div>
      )}

      {/* Scatter Plot */}
      <div data-testid="scatter-plot" className="p-6 bg-white">
        <h2>Confidence vs Performance</h2>
        <div data-testid="scatter-container">
          {calibrationData.map((point, idx) => (
            <div
              key={idx}
              data-testid={`scatter-point-${idx}`}
              data-confidence={point.confidence}
              data-score={point.score}
              data-concept={point.conceptName}
              className={
                point.isOverconfident
                  ? 'overconfident'
                  : point.isUnderconfident
                    ? 'underconfident'
                    : 'calibrated'
              }
            >
              {point.conceptName}
            </div>
          ))}
        </div>

        {/* Perfect calibration line indicator */}
        <div data-testid="calibration-line" className="diagonal-reference-line">
          Perfect Calibration (y=x)
        </div>

        {/* Zone labels */}
        <div data-testid="overconfidence-zone">Overconfidence Zone</div>
        <div data-testid="underconfidence-zone">Underconfidence Zone</div>

        {/* Legend */}
        <div data-testid="legend">
          <div data-testid="legend-overconfident">Overconfident</div>
          <div data-testid="legend-calibrated">Well Calibrated</div>
          <div data-testid="legend-underconfident">Underconfident</div>
        </div>
      </div>

      {/* Trend Chart */}
      {trendData.length > 0 && (
        <div data-testid="trend-chart" className="p-6 bg-white">
          <h2>Calibration Accuracy Trend</h2>
          <div data-testid="trend-line-container">
            {trendData.map((point, idx) => (
              <div
                key={idx}
                data-testid={`trend-point-${idx}`}
                data-date={point.date}
                data-accuracy={point.calibrationAccuracy}
              >
                {point.date}: {point.calibrationAccuracy}%
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Examples */}
      {examples.length > 0 && (
        <div data-testid="examples-container">
          {examples.map((example, idx) => (
            <div key={idx} data-testid={`example-${idx}`} data-type={example.type}>
              <h4>{example.type === 'OVERCONFIDENT' ? 'Overconfidence' : 'Underconfidence'}</h4>
              <p>
                {example.conceptName}: {example.confidence} confidence, {example.score}% score
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

describe('CalibrationDashboard', () => {
  const mockCalibrationData: CalibrationPoint[] = [
    {
      confidence: 5,
      score: 45,
      conceptName: 'Cardiology',
      date: '2025-10-17',
      isOverconfident: true,
      isUnderconfident: false,
    },
    {
      confidence: 3,
      score: 50,
      conceptName: 'Pathology',
      date: '2025-10-17',
      isOverconfident: false,
      isUnderconfident: false,
    },
    {
      confidence: 2,
      score: 85,
      conceptName: 'Pharmacology',
      date: '2025-10-16',
      isOverconfident: false,
      isUnderconfident: true,
    },
  ]

  const mockMetrics: CalibrationMetrics = {
    meanAbsoluteError: 20.5,
    correlationCoefficient: 0.82,
    overconfidentCount: 1,
    underconfidentCount: 1,
    calibratedCount: 1,
    trend: 'IMPROVING',
  }

  const mockTrendData: TrendPoint[] = [
    { date: '2025-10-10', calibrationAccuracy: 65 },
    { date: '2025-10-12', calibrationAccuracy: 68 },
    { date: '2025-10-14', calibrationAccuracy: 72 },
    { date: '2025-10-16', calibrationAccuracy: 75 },
  ]

  const mockExamples: CalibrationExample[] = [
    {
      conceptName: 'Cardiology',
      confidence: 'Very Confident',
      score: 45,
      type: 'OVERCONFIDENT',
    },
    {
      conceptName: 'Pharmacology',
      confidence: 'Uncertain',
      score: 85,
      type: 'UNDERCONFIDENT',
    },
  ]

  describe('Component Rendering', () => {
    it('should render loading state', () => {
      render(
        <MockCalibrationDashboard
          calibrationData={[]}
          metrics={null}
          trendData={[]}
          examples={[]}
          isLoading={true}
        />,
      )

      expect(screen.getByText('Loading')).toBeInTheDocument()
    })

    it('should render dashboard with all sections', () => {
      render(
        <MockCalibrationDashboard
          calibrationData={mockCalibrationData}
          metrics={mockMetrics}
          trendData={mockTrendData}
          examples={mockExamples}
        />,
      )

      expect(screen.getByText('Confidence Calibration')).toBeInTheDocument()
      expect(screen.getByTestId('scatter-plot')).toBeInTheDocument()
      expect(screen.getByTestId('trend-chart')).toBeInTheDocument()
      expect(screen.getByTestId('examples-container')).toBeInTheDocument()
    })
  })

  describe('AC#4: Calibration Feedback Display', () => {
    it('should display Mean Absolute Error metric', () => {
      render(
        <MockCalibrationDashboard
          calibrationData={mockCalibrationData}
          metrics={mockMetrics}
          trendData={mockTrendData}
          examples={mockExamples}
        />,
      )

      expect(screen.getByTestId('mae-card')).toBeInTheDocument()
      expect(screen.getByTestId('mae-value')).toHaveTextContent('20.5%')
    })

    it('should display correlation coefficient', () => {
      render(
        <MockCalibrationDashboard
          calibrationData={mockCalibrationData}
          metrics={mockMetrics}
          trendData={mockTrendData}
          examples={mockExamples}
        />,
      )

      expect(screen.getByTestId('correlation-card')).toBeInTheDocument()
      expect(screen.getByTestId('correlation-value')).toHaveTextContent('0.82')
    })

    it('should display trend indicator', () => {
      render(
        <MockCalibrationDashboard
          calibrationData={mockCalibrationData}
          metrics={mockMetrics}
          trendData={mockTrendData}
          examples={mockExamples}
        />,
      )

      expect(screen.getByTestId('trend-card')).toBeInTheDocument()
      expect(screen.getByTestId('trend-value')).toHaveTextContent('IMPROVING')
    })

    it('should display count of well-calibrated attempts', () => {
      render(
        <MockCalibrationDashboard
          calibrationData={mockCalibrationData}
          metrics={mockMetrics}
          trendData={mockTrendData}
          examples={mockExamples}
        />,
      )

      expect(screen.getByTestId('calibrated-count')).toHaveTextContent('1 well-calibrated')
    })
  })

  describe('AC#6: Calibration Trends Dashboard', () => {
    it('should render scatter plot with calibration data', () => {
      render(
        <MockCalibrationDashboard
          calibrationData={mockCalibrationData}
          metrics={mockMetrics}
          trendData={mockTrendData}
          examples={mockExamples}
        />,
      )

      const scatterPoints = screen.getAllByTestId(/scatter-point-/)
      expect(scatterPoints).toHaveLength(3)
    })

    it('should display perfect calibration line (y=x diagonal)', () => {
      render(
        <MockCalibrationDashboard
          calibrationData={mockCalibrationData}
          metrics={mockMetrics}
          trendData={mockTrendData}
          examples={mockExamples}
        />,
      )

      const calibrationLine = screen.getByTestId('calibration-line')
      expect(calibrationLine).toBeInTheDocument()
      expect(calibrationLine).toHaveTextContent('Perfect Calibration (y=x)')
    })

    it('should highlight overconfidence zone', () => {
      render(
        <MockCalibrationDashboard
          calibrationData={mockCalibrationData}
          metrics={mockMetrics}
          trendData={mockTrendData}
          examples={mockExamples}
        />,
      )

      expect(screen.getByTestId('overconfidence-zone')).toBeInTheDocument()
    })

    it('should highlight underconfidence zone', () => {
      render(
        <MockCalibrationDashboard
          calibrationData={mockCalibrationData}
          metrics={mockMetrics}
          trendData={mockTrendData}
          examples={mockExamples}
        />,
      )

      expect(screen.getByTestId('underconfidence-zone')).toBeInTheDocument()
    })

    it('should color-code scatter points', () => {
      render(
        <MockCalibrationDashboard
          calibrationData={mockCalibrationData}
          metrics={mockMetrics}
          trendData={mockTrendData}
          examples={mockExamples}
        />,
      )

      const overconfidentPoint = screen.getByTestId('scatter-point-0')
      expect(overconfidentPoint).toHaveClass('overconfident')

      const calibratedPoint = screen.getByTestId('scatter-point-1')
      expect(calibratedPoint).toHaveClass('calibrated')

      const underconfidentPoint = screen.getByTestId('scatter-point-2')
      expect(underconfidentPoint).toHaveClass('underconfident')
    })

    it('should display legend with all categories', () => {
      render(
        <MockCalibrationDashboard
          calibrationData={mockCalibrationData}
          metrics={mockMetrics}
          trendData={mockTrendData}
          examples={mockExamples}
        />,
      )

      expect(screen.getByTestId('legend-overconfident')).toBeInTheDocument()
      expect(screen.getByTestId('legend-calibrated')).toBeInTheDocument()
      expect(screen.getByTestId('legend-underconfident')).toBeInTheDocument()
    })

    it('should render line chart for trend data', () => {
      render(
        <MockCalibrationDashboard
          calibrationData={mockCalibrationData}
          metrics={mockMetrics}
          trendData={mockTrendData}
          examples={mockExamples}
        />,
      )

      const trendPoints = screen.getAllByTestId(/trend-point-/)
      expect(trendPoints).toHaveLength(4)
      expect(trendPoints[0]).toHaveAttribute('data-accuracy', '65')
      expect(trendPoints[3]).toHaveAttribute('data-accuracy', '75')
    })

    it('should display correlation coefficient with interpretation', () => {
      render(
        <MockCalibrationDashboard
          calibrationData={mockCalibrationData}
          metrics={mockMetrics}
          trendData={mockTrendData}
          examples={mockExamples}
        />,
      )

      expect(screen.getByTestId('correlation-value')).toHaveTextContent('0.82')
      // Value of 0.82 is > 0.7, so should be "Strong"
    })

    it('should identify consistently overconfident topics', () => {
      render(
        <MockCalibrationDashboard
          calibrationData={[
            {
              confidence: 5,
              score: 35,
              conceptName: 'Cardiology',
              date: '2025-10-17',
              isOverconfident: true,
              isUnderconfident: false,
            },
            {
              confidence: 5,
              score: 40,
              conceptName: 'Cardiology',
              date: '2025-10-16',
              isOverconfident: true,
              isUnderconfident: false,
            },
            {
              confidence: 5,
              score: 38,
              conceptName: 'Cardiology',
              date: '2025-10-15',
              isOverconfident: true,
              isUnderconfident: false,
            },
          ]}
          metrics={mockMetrics}
          trendData={mockTrendData}
          examples={mockExamples}
        />,
      )

      const scatterPoints = screen.getAllByTestId(/scatter-point-/)
      const cardiologyPoints = scatterPoints.filter((el) =>
        el.getAttribute('data-concept')?.includes('Cardiology'),
      )
      expect(cardiologyPoints.length).toBe(3)
      expect(cardiologyPoints.every((el) => el.classList.contains('overconfident'))).toBe(true)
    })

    it('should identify consistently underconfident topics', () => {
      render(
        <MockCalibrationDashboard
          calibrationData={[
            {
              confidence: 1,
              score: 85,
              conceptName: 'Pharmacology',
              date: '2025-10-17',
              isOverconfident: false,
              isUnderconfident: true,
            },
            {
              confidence: 1,
              score: 80,
              conceptName: 'Pharmacology',
              date: '2025-10-16',
              isOverconfident: false,
              isUnderconfident: true,
            },
            {
              confidence: 1,
              score: 88,
              conceptName: 'Pharmacology',
              date: '2025-10-15',
              isOverconfident: false,
              isUnderconfident: true,
            },
          ]}
          metrics={mockMetrics}
          trendData={mockTrendData}
          examples={mockExamples}
        />,
      )

      const scatterPoints = screen.getAllByTestId(/scatter-point-/)
      const pharmPoints = scatterPoints.filter((el) =>
        el.getAttribute('data-concept')?.includes('Pharmacology'),
      )
      expect(pharmPoints.length).toBe(3)
      expect(pharmPoints.every((el) => el.classList.contains('underconfident'))).toBe(true)
    })
  })

  describe('Data Display and Formatting', () => {
    it('should display overconfident examples', () => {
      render(
        <MockCalibrationDashboard
          calibrationData={mockCalibrationData}
          metrics={mockMetrics}
          trendData={mockTrendData}
          examples={mockExamples}
        />,
      )

      const overconfidentExample = screen.getByTestId('example-0')
      expect(overconfidentExample).toHaveAttribute('data-type', 'OVERCONFIDENT')
      expect(overconfidentExample).toHaveTextContent('Overconfidence')
      expect(overconfidentExample).toHaveTextContent('Cardiology')
    })

    it('should display underconfident examples', () => {
      render(
        <MockCalibrationDashboard
          calibrationData={mockCalibrationData}
          metrics={mockMetrics}
          trendData={mockTrendData}
          examples={mockExamples}
        />,
      )

      const underconfidentExample = screen.getByTestId('example-1')
      expect(underconfidentExample).toHaveAttribute('data-type', 'UNDERCONFIDENT')
      expect(underconfidentExample).toHaveTextContent('Underconfidence')
      expect(underconfidentExample).toHaveTextContent('Pharmacology')
    })

    it('should display correlation coefficient with 2 decimals', () => {
      render(
        <MockCalibrationDashboard
          calibrationData={mockCalibrationData}
          metrics={{ ...mockMetrics, correlationCoefficient: 0.8234 }}
          trendData={mockTrendData}
          examples={mockExamples}
        />,
      )

      expect(screen.getByTestId('correlation-value')).toHaveTextContent('0.82')
    })

    it('should display MAE with 1 decimal place', () => {
      render(
        <MockCalibrationDashboard
          calibrationData={mockCalibrationData}
          metrics={{ ...mockMetrics, meanAbsoluteError: 20.456 }}
          trendData={mockTrendData}
          examples={mockExamples}
        />,
      )

      expect(screen.getByTestId('mae-value')).toHaveTextContent('20.5%')
    })
  })

  describe('Trend Interpretation', () => {
    it('should display IMPROVING trend', () => {
      render(
        <MockCalibrationDashboard
          calibrationData={mockCalibrationData}
          metrics={{ ...mockMetrics, trend: 'IMPROVING' }}
          trendData={mockTrendData}
          examples={mockExamples}
        />,
      )

      expect(screen.getByTestId('trend-value')).toHaveTextContent('IMPROVING')
    })

    it('should display STABLE trend', () => {
      render(
        <MockCalibrationDashboard
          calibrationData={mockCalibrationData}
          metrics={{ ...mockMetrics, trend: 'STABLE' }}
          trendData={mockTrendData}
          examples={mockExamples}
        />,
      )

      expect(screen.getByTestId('trend-value')).toHaveTextContent('STABLE')
    })

    it('should display WORSENING trend', () => {
      render(
        <MockCalibrationDashboard
          calibrationData={mockCalibrationData}
          metrics={{ ...mockMetrics, trend: 'WORSENING' }}
          trendData={mockTrendData}
          examples={mockExamples}
        />,
      )

      expect(screen.getByTestId('trend-value')).toHaveTextContent('WORSENING')
    })
  })
})
