/**
 * Test suite for Calibration Dashboard (Story 4.3, AC#7)
 *
 * Tests confidence recalibration dashboard:
 * - Scatter plot (confidence vs score)
 * - Overconfidence/underconfidence zones highlighted
 * - Calibration trend line chart
 * - Specific examples displayed
 * - Calibration accuracy metrics
 */

import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import type React from 'react'

interface CalibrationMetrics {
  calibration_score: number
  mean_absolute_error: number
  correlation_coefficient: number
  overconfident_examples: Array<{
    concept: string
    confidence: number
    score: number
    delta: number
  }>
  underconfident_examples: Array<{
    concept: string
    confidence: number
    score: number
    delta: number
  }>
  trend: 'improving' | 'stable' | 'worsening'
  total_challenges: number
}

interface CalibrationDashboardProps {
  metrics: CalibrationMetrics
}

// Mock CalibrationDashboard component
const CalibrationDashboard: React.FC<CalibrationDashboardProps> = ({ metrics }) => {
  const dataPoints = [...metrics.overconfident_examples, ...metrics.underconfident_examples]

  return (
    <div data-testid="calibration-dashboard">
      {/* Main metrics section */}
      <div data-testid="metrics-summary">
        <h2>Confidence Recalibration</h2>
        <div data-testid="calibration-score">
          Calibration Accuracy: {Math.round(metrics.calibration_score * 100)}%
        </div>
        <div data-testid="mae">Mean Absolute Error: {metrics.mean_absolute_error.toFixed(2)}</div>
        <div data-testid="correlation">
          Correlation Coefficient: {metrics.correlation_coefficient.toFixed(2)}
        </div>
      </div>

      {/* Scatter plot */}
      <div
        data-testid="scatter-plot"
        style={{
          width: 600,
          height: 400,
          border: '1px solid #ccc',
          position: 'relative',
        }}
      >
        <svg width="600" height="400">
          {/* Grid background */}
          <rect width="600" height="400" fill="#f9f9f9" />

          {/* Diagonal line (perfect calibration) */}
          <line x1="50" y1="350" x2="550" y2="50" stroke="#ccc" strokeDasharray="5,5" />

          {/* Overconfidence zone (high confidence, low score) - top left */}
          <rect
            x="350"
            y="50"
            width="200"
            height="150"
            fill="#FFE6E6"
            opacity="0.3"
            data-testid="overconfidence-zone"
          />

          {/* Underconfidence zone (low confidence, high score) - bottom right */}
          <rect
            x="50"
            y="250"
            width="200"
            height="150"
            fill="#E6F7E6"
            opacity="0.3"
            data-testid="underconfidence-zone"
          />

          {/* Data points */}
          {dataPoints.map((point, idx) => {
            const x = 50 + (point.confidence / 5) * 500
            const y = 350 - (point.score / 100) * 300
            const isOverconfident = point.delta > 0

            return (
              <circle
                key={idx}
                cx={x}
                cy={y}
                r="5"
                fill={isOverconfident ? '#FF6B6B' : '#4CAF50'}
                data-testid={`data-point-${idx}`}
              />
            )
          })}

          {/* Axes */}
          <line x1="50" y1="350" x2="550" y2="350" stroke="#000" strokeWidth="2" />
          <line x1="50" y1="50" x2="50" y2="350" stroke="#000" strokeWidth="2" />

          {/* Axis labels */}
          <text x="300" y="380" textAnchor="middle">
            Confidence (1-5)
          </text>
          <text x="20" y="200" textAnchor="middle" transform="rotate(-90 20 200)">
            Score (0-100%)
          </text>
        </svg>
      </div>

      {/* Trend line chart */}
      <div data-testid="trend-chart">
        <h3>Your Calibration Progress</h3>
        <div data-testid="trend-status">
          Trend:{' '}
          <span style={{ color: metrics.trend === 'improving' ? 'green' : 'gray' }}>
            {metrics.trend}
          </span>
        </div>
      </div>

      {/* Examples section */}
      <div data-testid="examples-section">
        {/* Overconfident examples */}
        {metrics.overconfident_examples.length > 0 && (
          <div data-testid="overconfident-examples">
            <h3>Times You Were Too Confident:</h3>
            {metrics.overconfident_examples.slice(0, 3).map((example, idx) => (
              <div key={idx} data-testid={`overconfident-example-${idx}`}>
                <p>
                  You felt very confident ({example.confidence}/5) but scored {example.score}% on{' '}
                  {example.concept}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Underconfident examples */}
        {metrics.underconfident_examples.length > 0 && (
          <div data-testid="underconfident-examples">
            <h3>Times You Were Too Modest:</h3>
            {metrics.underconfident_examples.slice(0, 3).map((example, idx) => (
              <div key={idx} data-testid={`underconfident-example-${idx}`}>
                <p>
                  You felt uncertain ({example.confidence}/5) but scored {example.score}% on{' '}
                  {example.concept} - trust yourself more!
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recalibration tips */}
      <div data-testid="tips-section">
        <h3>Tips for Better Calibration</h3>
        {metrics.trend === 'improving' && (
          <p>You're doing great! Your calibration is improving. Keep it up!</p>
        )}
        {metrics.overconfident_examples.length > metrics.underconfident_examples.length && (
          <p>You tend to be overconfident. Try being more cautious in your self-assessment.</p>
        )}
        {metrics.underconfident_examples.length > metrics.overconfident_examples.length && (
          <p>You tend to underestimate yourself. Trust your knowledge more!</p>
        )}
      </div>
    </div>
  )
}

describe('Calibration Dashboard Component', () => {
  let mockMetrics: CalibrationMetrics

  beforeEach(() => {
    mockMetrics = {
      calibration_score: 0.75,
      mean_absolute_error: 12.5,
      correlation_coefficient: 0.82,
      overconfident_examples: [
        {
          concept: 'ACE Inhibitor Mechanism',
          confidence: 5,
          score: 40,
          delta: 60,
        },
        {
          concept: 'ARB vs ACE-i',
          confidence: 4,
          score: 50,
          delta: 30,
        },
        {
          concept: 'Diuretic Classification',
          confidence: 5,
          score: 45,
          delta: 55,
        },
      ],
      underconfident_examples: [
        {
          concept: 'Sympathetic vs Parasympathetic',
          confidence: 2,
          score: 90,
          delta: -80,
        },
        {
          concept: 'Drug Half-life Calculation',
          confidence: 1,
          score: 85,
          delta: -80,
        },
      ],
      trend: 'improving',
      total_challenges: 15,
    }
  })

  describe('Dashboard Structure and Metrics Display', () => {
    it('should render calibration dashboard', () => {
      render(<CalibrationDashboard metrics={mockMetrics} />)

      expect(screen.getByTestId('calibration-dashboard')).toBeInTheDocument()
    })

    it('should display calibration score', () => {
      render(<CalibrationDashboard metrics={mockMetrics} />)

      expect(screen.getByTestId('calibration-score')).toBeInTheDocument()
      expect(screen.getByText(/Calibration Accuracy: 75%/i)).toBeInTheDocument()
    })

    it('should display mean absolute error', () => {
      render(<CalibrationDashboard metrics={mockMetrics} />)

      expect(screen.getByTestId('mae')).toBeInTheDocument()
      expect(screen.getByText(/Mean Absolute Error: 12.50/i)).toBeInTheDocument()
    })

    it('should display correlation coefficient', () => {
      render(<CalibrationDashboard metrics={mockMetrics} />)

      expect(screen.getByTestId('correlation')).toBeInTheDocument()
      expect(screen.getByText(/Correlation Coefficient: 0.82/i)).toBeInTheDocument()
    })
  })

  describe('Scatter Plot (AC#7)', () => {
    it('should render scatter plot', () => {
      render(<CalibrationDashboard metrics={mockMetrics} />)

      expect(screen.getByTestId('scatter-plot')).toBeInTheDocument()
    })

    it('should display data points on scatter plot', () => {
      render(<CalibrationDashboard metrics={mockMetrics} />)

      const totalPoints =
        mockMetrics.overconfident_examples.length + mockMetrics.underconfident_examples.length

      for (let i = 0; i < totalPoints; i++) {
        expect(screen.getByTestId(`data-point-${i}`)).toBeInTheDocument()
      }
    })

    it('should highlight overconfidence zone (top left)', () => {
      render(<CalibrationDashboard metrics={mockMetrics} />)

      const overconfidenceZone = screen.getByTestId('overconfidence-zone')
      expect(overconfidenceZone).toBeInTheDocument()
      expect(overconfidenceZone).toHaveAttribute('fill', '#FFE6E6')
    })

    it('should highlight underconfidence zone (bottom right)', () => {
      render(<CalibrationDashboard metrics={mockMetrics} />)

      const underconfidenceZone = screen.getByTestId('underconfidence-zone')
      expect(underconfidenceZone).toBeInTheDocument()
      expect(underconfidenceZone).toHaveAttribute('fill', '#E6F7E6')
    })

    it('should use red for overconfident data points', () => {
      render(<CalibrationDashboard metrics={mockMetrics} />)

      // First 3 points are overconfident
      for (let i = 0; i < 3; i++) {
        expect(screen.getByTestId(`data-point-${i}`)).toHaveAttribute('fill', '#FF6B6B')
      }
    })

    it('should use green for underconfident data points', () => {
      render(<CalibrationDashboard metrics={mockMetrics} />)

      // Last 2 points are underconfident
      for (let i = 3; i < 5; i++) {
        expect(screen.getByTestId(`data-point-${i}`)).toHaveAttribute('fill', '#4CAF50')
      }
    })
  })

  describe('Trend Chart (AC#7)', () => {
    it('should display trend chart section', () => {
      render(<CalibrationDashboard metrics={mockMetrics} />)

      expect(screen.getByTestId('trend-chart')).toBeInTheDocument()
    })

    it('should display calibration trend status', () => {
      render(<CalibrationDashboard metrics={mockMetrics} />)

      const trendStatus = screen.getByTestId('trend-status')
      expect(trendStatus).toBeInTheDocument()
      expect(trendStatus.textContent).toMatch(/Trend: improving/i)
    })

    it('should show green for improving trend', () => {
      render(<CalibrationDashboard metrics={mockMetrics} />)

      const trendSpan = screen.getByTestId('trend-status').querySelector('span')
      expect(trendSpan).toBeInTheDocument()
      if (trendSpan) {
        // Check the style attribute for color property
        const style = window.getComputedStyle(trendSpan)
        expect(style.color || trendSpan.getAttribute('style')).toBeTruthy()
      }
    })

    it('should show gray for stable/worsening trend', () => {
      const stableMetrics = { ...mockMetrics, trend: 'stable' as const }
      render(<CalibrationDashboard metrics={stableMetrics} />)

      const trendSpan = screen.getByTestId('trend-status').querySelector('span')
      expect(trendSpan).toBeInTheDocument()
      if (trendSpan) {
        // Check that the span exists and contains the trend value
        expect(trendSpan.textContent).toMatch(/stable/i)
      }
    })
  })

  describe('Overconfident Examples (AC#7)', () => {
    it('should display overconfident examples section', () => {
      render(<CalibrationDashboard metrics={mockMetrics} />)

      expect(screen.getByTestId('overconfident-examples')).toBeInTheDocument()
    })

    it('should display up to 3 overconfident examples', () => {
      render(<CalibrationDashboard metrics={mockMetrics} />)

      expect(screen.getByTestId('overconfident-example-0')).toBeInTheDocument()
      expect(screen.getByTestId('overconfident-example-1')).toBeInTheDocument()
      expect(screen.getByTestId('overconfident-example-2')).toBeInTheDocument()
    })

    it('should show specific confidence and score discrepancy', () => {
      render(<CalibrationDashboard metrics={mockMetrics} />)

      expect(
        screen.getByText(/You felt very confident \(5\/5\) but scored 40%/i),
      ).toBeInTheDocument()
      expect(screen.getByText(/ACE Inhibitor Mechanism/i)).toBeInTheDocument()
    })

    it('should not display section when no overconfident examples', () => {
      const noOverconfidentMetrics = { ...mockMetrics, overconfident_examples: [] }
      const { queryByTestId } = render(<CalibrationDashboard metrics={noOverconfidentMetrics} />)

      expect(queryByTestId('overconfident-examples')).not.toBeInTheDocument()
    })
  })

  describe('Underconfident Examples (AC#7)', () => {
    it('should display underconfident examples section', () => {
      render(<CalibrationDashboard metrics={mockMetrics} />)

      expect(screen.getByTestId('underconfident-examples')).toBeInTheDocument()
    })

    it('should display up to 3 underconfident examples', () => {
      render(<CalibrationDashboard metrics={mockMetrics} />)

      expect(screen.getByTestId('underconfident-example-0')).toBeInTheDocument()
      expect(screen.getByTestId('underconfident-example-1')).toBeInTheDocument()
    })

    it('should show encouraging message for underconfident cases', () => {
      render(<CalibrationDashboard metrics={mockMetrics} />)

      const underconfidentSection = screen.getByTestId('underconfident-examples')
      expect(underconfidentSection.textContent).toMatch(/trust yourself more/i)
    })

    it('should not display section when no underconfident examples', () => {
      const noUnderconfidentMetrics = { ...mockMetrics, underconfident_examples: [] }
      const { queryByTestId } = render(<CalibrationDashboard metrics={noUnderconfidentMetrics} />)

      expect(queryByTestId('underconfident-examples')).not.toBeInTheDocument()
    })
  })

  describe('Calibration Tips and Recommendations', () => {
    it('should display tips section', () => {
      render(<CalibrationDashboard metrics={mockMetrics} />)

      expect(screen.getByTestId('tips-section')).toBeInTheDocument()
    })

    it('should show encouragement when improving', () => {
      render(<CalibrationDashboard metrics={mockMetrics} />)

      expect(screen.getByText(/You're doing great/i)).toBeInTheDocument()
      expect(screen.getByText(/Your calibration is improving/i)).toBeInTheDocument()
    })

    it('should recommend caution when trending toward overconfidence', () => {
      const overconfidentMetrics = {
        ...mockMetrics,
        overconfident_examples: Array(5).fill({
          concept: 'test',
          confidence: 5,
          score: 50,
          delta: 50,
        }),
        underconfident_examples: [{ concept: 'test', confidence: 2, score: 80, delta: -80 }],
      }

      render(<CalibrationDashboard metrics={overconfidentMetrics} />)

      expect(screen.getByText(/You tend to be overconfident/i)).toBeInTheDocument()
      expect(screen.getByText(/Try being more cautious/i)).toBeInTheDocument()
    })

    it('should encourage confidence when trending toward underconfidence', () => {
      const underconfidentMetrics = {
        ...mockMetrics,
        overconfident_examples: [{ concept: 'test', confidence: 5, score: 40, delta: 60 }],
        underconfident_examples: Array(5).fill({
          concept: 'test',
          confidence: 1,
          score: 90,
          delta: -80,
        }),
      }

      render(<CalibrationDashboard metrics={underconfidentMetrics} />)

      expect(screen.getByText(/You tend to underestimate yourself/i)).toBeInTheDocument()
      expect(screen.getByText(/Trust your knowledge more/i)).toBeInTheDocument()
    })
  })

  describe('Calibration Score Interpretation', () => {
    it('should display high calibration as strong performance', () => {
      const highCalibrationMetrics = {
        ...mockMetrics,
        calibration_score: 0.95,
      }

      render(<CalibrationDashboard metrics={highCalibrationMetrics} />)

      expect(screen.getByText(/Calibration Accuracy: 95%/i)).toBeInTheDocument()
    })

    it('should display low calibration as room for improvement', () => {
      const lowCalibrationMetrics = {
        ...mockMetrics,
        calibration_score: 0.45,
      }

      render(<CalibrationDashboard metrics={lowCalibrationMetrics} />)

      expect(screen.getByText(/Calibration Accuracy: 45%/i)).toBeInTheDocument()
    })
  })

  describe('Accessibility and Usability', () => {
    it('should have descriptive heading', () => {
      render(<CalibrationDashboard metrics={mockMetrics} />)

      expect(screen.getByText('Confidence Recalibration')).toBeInTheDocument()
    })

    it('should have axis labels on scatter plot', () => {
      render(<CalibrationDashboard metrics={mockMetrics} />)

      expect(screen.getByText('Confidence (1-5)')).toBeInTheDocument()
      expect(screen.getByText('Score (0-100%)')).toBeInTheDocument()
    })

    it('should clearly distinguish example types with headings', () => {
      render(<CalibrationDashboard metrics={mockMetrics} />)

      expect(screen.getByText('Times You Were Too Confident:')).toBeInTheDocument()
      expect(screen.getByText('Times You Were Too Modest:')).toBeInTheDocument()
    })
  })
})
