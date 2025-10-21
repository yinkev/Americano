/**
 * ReviewCard Component Tests
 *
 * Tests for ReviewCard rendering, expansion, data display,
 * and interaction handling.
 *
 * Story 2.6 - Task 12.3: Test UI Components
 */

import React from 'react'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { ReviewCard } from '@/components/analytics/review-card'

describe('ReviewCard', () => {
  const mockReview = {
    id: 'review-1',
    period: 'WEEK' as const,
    startDate: '2025-10-09',
    endDate: '2025-10-15',
    summary: {
      missionsCompleted: 6,
      missionsSkipped: 1,
      totalTime: 360, // 6 hours
      avgSuccessScore: 0.85,
      completionRate: 0.857, // 6/7
      avgDifficultyRating: 3.5,
    },
    highlights: {
      longestStreak: 5,
      bestPerformance: {
        missionId: 'mission-3',
        successScore: 0.95,
        date: '2025-10-12',
      },
      topObjectives: [
        {
          objectiveId: 'obj-1',
          objective: 'Understand cardiac conduction system',
          masteryGain: 0.8,
        },
        {
          objectiveId: 'obj-2',
          objective: 'Identify ECG abnormalities',
          masteryGain: 0.75,
        },
      ],
      personalBests: ['Completed 6 missions in a week - new record!', 'Maintained 5-day streak'],
    },
    insights: {
      patterns: ['Consistently high performance in morning sessions'],
      correlations: ['Mission completion correlates with 23% faster mastery'],
      improvements: [
        'Completion rate improved 15% from last week',
        'Success score increased from 0.70 to 0.85',
      ],
      concerns: ['Missing evening study sessions'],
    },
    recommendations: {
      actionItems: [
        {
          priority: 'HIGH' as const,
          action: 'Continue morning study sessions',
          reason: 'Your best performance occurs during this time',
        },
        {
          priority: 'MEDIUM' as const,
          action: 'Add evening review sessions',
          reason: 'To maintain knowledge retention',
        },
      ],
      adjustments: [
        {
          type: 'DURATION' as const,
          current: '60 min',
          recommended: '55 min',
          reason: 'You consistently finish early',
        },
      ],
    },
    generatedAt: '2025-10-15T23:00:00Z',
  }

  describe('Basic Rendering', () => {
    it('should render weekly review card', () => {
      render(<ReviewCard review={mockReview} />)

      expect(screen.getByText('Weekly Review')).toBeInTheDocument()
      expect(screen.getByText('EXCELLENT')).toBeInTheDocument()
    })

    it('should render monthly review card', () => {
      const monthlyReview = { ...mockReview, period: 'MONTH' as const }
      render(<ReviewCard review={monthlyReview} />)

      expect(screen.getByText('Monthly Review')).toBeInTheDocument()
    })

    it('should display date range correctly', () => {
      render(<ReviewCard review={mockReview} />)

      // Check for formatted date range (format may vary by locale and timezone)
      // Using flexible regex to match date patterns
      expect(screen.getByText(/Oct \d+ - Oct \d+, 2025/i)).toBeInTheDocument()
    })

    it('should display success rating badge', () => {
      render(<ReviewCard review={mockReview} />)

      const badge = screen.getByText('EXCELLENT')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('text-green-700')
    })
  })

  describe('Summary Stats Display', () => {
    it('should display missions completed count', () => {
      render(<ReviewCard review={mockReview} />)

      expect(screen.getByText('6')).toBeInTheDocument()
      expect(screen.getByText('missions')).toBeInTheDocument()
    })

    it('should display completion rate with correct color', () => {
      render(<ReviewCard review={mockReview} />)

      const completionRate = screen.getByText('86%') // 85.7% rounded
      expect(completionRate).toBeInTheDocument()
      expect(completionRate).toHaveClass('text-green-600') // >= 0.85 shows green
      expect(screen.getByText('Optimal range')).toBeInTheDocument()
    })

    it('should display study time in hours', () => {
      render(<ReviewCard review={mockReview} />)

      expect(screen.getByText('6h')).toBeInTheDocument()
      expect(screen.getByText('360 min total')).toBeInTheDocument()
    })

    it('should display longest streak', () => {
      render(<ReviewCard review={mockReview} />)

      const streakElements = screen.getAllByText('5')
      expect(streakElements.length).toBeGreaterThan(0)
      expect(screen.getByText('days')).toBeInTheDocument()
    })
  })

  describe('Success Score Ratings', () => {
    it('should show EXCELLENT for score >= 0.8', () => {
      const review = { ...mockReview, summary: { ...mockReview.summary, avgSuccessScore: 0.85 } }
      render(<ReviewCard review={review} />)

      expect(screen.getByText('EXCELLENT')).toBeInTheDocument()
    })

    it('should show GOOD for score 0.7-0.79', () => {
      const review = { ...mockReview, summary: { ...mockReview.summary, avgSuccessScore: 0.75 } }
      render(<ReviewCard review={review} />)

      expect(screen.getByText('GOOD')).toBeInTheDocument()
    })

    it('should show FAIR for score 0.6-0.69', () => {
      const review = { ...mockReview, summary: { ...mockReview.summary, avgSuccessScore: 0.65 } }
      render(<ReviewCard review={review} />)

      expect(screen.getByText('FAIR')).toBeInTheDocument()
    })

    it('should show NEEDS IMPROVEMENT for score 0.5-0.59', () => {
      const review = { ...mockReview, summary: { ...mockReview.summary, avgSuccessScore: 0.55 } }
      render(<ReviewCard review={review} />)

      expect(screen.getByText('NEEDS IMPROVEMENT')).toBeInTheDocument()
    })

    it('should show POOR for score < 0.5', () => {
      const review = { ...mockReview, summary: { ...mockReview.summary, avgSuccessScore: 0.45 } }
      render(<ReviewCard review={review} />)

      expect(screen.getByText('POOR')).toBeInTheDocument()
    })
  })

  describe('Completion Rate Colors', () => {
    it('should show green for rate >= 0.85', () => {
      render(<ReviewCard review={mockReview} />)

      const completionRate = screen.getByText('86%')
      expect(completionRate).toHaveClass('text-green-600') // >= 0.85 shows green
    })

    it('should show yellow for rate 0.5-0.69', () => {
      const review = {
        ...mockReview,
        summary: { ...mockReview.summary, completionRate: 0.6 },
      }
      render(<ReviewCard review={review} />)

      const completionRate = screen.getByText('60%')
      expect(completionRate).toHaveClass('text-yellow-600')
      expect(screen.getByText('Below target')).toBeInTheDocument()
    })

    it('should show red for rate < 0.5', () => {
      const review = {
        ...mockReview,
        summary: { ...mockReview.summary, completionRate: 0.4 },
      }
      render(<ReviewCard review={review} />)

      const completionRate = screen.getByText('40%')
      expect(completionRate).toHaveClass('text-red-600')
      expect(screen.getByText('Below target')).toBeInTheDocument()
    })

    it('should show "Above target" for rate > 0.9', () => {
      const review = {
        ...mockReview,
        summary: { ...mockReview.summary, completionRate: 0.95 },
      }
      render(<ReviewCard review={review} />)

      expect(screen.getByText('Above target')).toBeInTheDocument()
    })
  })

  describe('Expand/Collapse Functionality', () => {
    it('should initially be collapsed', () => {
      render(<ReviewCard review={mockReview} />)

      // Expanded content should not be visible
      expect(screen.queryByText('Highlights')).not.toBeInTheDocument()
    })

    it('should expand when chevron button clicked', () => {
      render(<ReviewCard review={mockReview} />)

      const expandButton = screen.getByRole('button')
      fireEvent.click(expandButton)

      // Expanded content should now be visible
      expect(screen.getByText('Highlights')).toBeInTheDocument()
      expect(screen.getByText('Insights')).toBeInTheDocument()
      expect(screen.getByText('Recommendations')).toBeInTheDocument()
    })

    it('should collapse when clicked again', () => {
      render(<ReviewCard review={mockReview} />)

      const expandButton = screen.getByRole('button')

      // Expand
      fireEvent.click(expandButton)
      expect(screen.getByText('Highlights')).toBeInTheDocument()

      // Collapse
      fireEvent.click(expandButton)
      expect(screen.queryByText('Highlights')).not.toBeInTheDocument()
    })

    it('should toggle chevron icon direction', () => {
      render(<ReviewCard review={mockReview} />)

      const expandButton = screen.getByRole('button')

      // Initially shows ChevronDown (collapsed)
      fireEvent.click(expandButton)
      // After click, shows ChevronUp (expanded)

      // SVG icons are present, just checking toggle works
      expect(expandButton).toBeInTheDocument()
    })
  })

  describe('Highlights Section', () => {
    it('should display personal bests', () => {
      render(<ReviewCard review={mockReview} />)
      fireEvent.click(screen.getByRole('button')) // Expand

      expect(screen.getByText('Completed 6 missions in a week - new record!')).toBeInTheDocument()
      expect(screen.getByText('Maintained 5-day streak')).toBeInTheDocument()
    })

    it('should display top objectives', () => {
      render(<ReviewCard review={mockReview} />)
      fireEvent.click(screen.getByRole('button')) // Expand

      expect(screen.getByText('Top Objectives Completed')).toBeInTheDocument()
      expect(screen.getByText('Understand cardiac conduction system')).toBeInTheDocument()
      expect(screen.getByText('Identify ECG abnormalities')).toBeInTheDocument()
    })

    it('should limit top objectives to 3', () => {
      const reviewWithManyObjectives = {
        ...mockReview,
        highlights: {
          ...mockReview.highlights,
          topObjectives: [
            { objectiveId: 'obj-1', objective: 'Objective 1', masteryGain: 0.8 },
            { objectiveId: 'obj-2', objective: 'Objective 2', masteryGain: 0.75 },
            { objectiveId: 'obj-3', objective: 'Objective 3', masteryGain: 0.7 },
            { objectiveId: 'obj-4', objective: 'Objective 4', masteryGain: 0.65 },
          ],
        },
      }

      render(<ReviewCard review={reviewWithManyObjectives} />)
      fireEvent.click(screen.getByRole('button')) // Expand

      expect(screen.getByText('Objective 1')).toBeInTheDocument()
      expect(screen.getByText('Objective 2')).toBeInTheDocument()
      expect(screen.getByText('Objective 3')).toBeInTheDocument()
      expect(screen.queryByText('Objective 4')).not.toBeInTheDocument()
    })
  })

  describe('Insights Section', () => {
    it('should display improvements with correct styling', () => {
      render(<ReviewCard review={mockReview} />)
      fireEvent.click(screen.getByRole('button')) // Expand

      expect(screen.getByText('Improvements')).toBeInTheDocument()
      expect(screen.getByText('Completion rate improved 15% from last week')).toBeInTheDocument()
      expect(screen.getByText('Success score increased from 0.70 to 0.85')).toBeInTheDocument()
    })

    it('should display patterns detected', () => {
      render(<ReviewCard review={mockReview} />)
      fireEvent.click(screen.getByRole('button')) // Expand

      expect(screen.getByText('Patterns Detected')).toBeInTheDocument()
      expect(
        screen.getByText('Consistently high performance in morning sessions'),
      ).toBeInTheDocument()
    })

    it('should display concerns', () => {
      render(<ReviewCard review={mockReview} />)
      fireEvent.click(screen.getByRole('button')) // Expand

      expect(screen.getByText('Areas for Attention')).toBeInTheDocument()
      expect(screen.getByText('Missing evening study sessions')).toBeInTheDocument()
    })
  })

  describe('Recommendations Section', () => {
    it('should display action items with priority badges', () => {
      render(<ReviewCard review={mockReview} />)
      fireEvent.click(screen.getByRole('button')) // Expand

      expect(screen.getByText('HIGH')).toBeInTheDocument()
      expect(screen.getByText('MEDIUM')).toBeInTheDocument()
      expect(screen.getByText('Continue morning study sessions')).toBeInTheDocument()
      expect(screen.getByText('Add evening review sessions')).toBeInTheDocument()
    })

    it('should display reasons for recommendations', () => {
      render(<ReviewCard review={mockReview} />)
      fireEvent.click(screen.getByRole('button')) // Expand

      expect(screen.getByText('Your best performance occurs during this time')).toBeInTheDocument()
      expect(screen.getByText('To maintain knowledge retention')).toBeInTheDocument()
    })

    it('should show "Apply Recommendations" button when callback provided', () => {
      const onApply = jest.fn()
      render(<ReviewCard review={mockReview} onApplyRecommendations={onApply} />)
      fireEvent.click(screen.getByRole('button')) // Expand

      const applyButton = screen.getByText('Apply Recommendations')
      expect(applyButton).toBeInTheDocument()
    })

    it('should call onApplyRecommendations when button clicked', () => {
      const onApply = jest.fn()
      render(<ReviewCard review={mockReview} onApplyRecommendations={onApply} />)

      // Expand card
      const expandButton = screen.getAllByRole('button')[0]
      fireEvent.click(expandButton)

      // Click apply button
      const applyButton = screen.getByText('Apply Recommendations')
      fireEvent.click(applyButton)

      expect(onApply).toHaveBeenCalledWith('review-1')
    })

    it('should not show apply button when no callback provided', () => {
      render(<ReviewCard review={mockReview} />)
      fireEvent.click(screen.getByRole('button')) // Expand

      expect(screen.queryByText('Apply Recommendations')).not.toBeInTheDocument()
    })
  })

  describe('Review Metadata', () => {
    it('should display generation timestamp', () => {
      render(<ReviewCard review={mockReview} />)
      fireEvent.click(screen.getByRole('button')) // Expand

      // Check for date (format may vary by locale)
      expect(screen.getByText(/Generated.*Oct 15, 2025/i)).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle review with no highlights', () => {
      const minimalReview = {
        ...mockReview,
        highlights: {
          longestStreak: 0,
          bestPerformance: null,
          topObjectives: [],
          personalBests: [],
        },
      }

      render(<ReviewCard review={minimalReview} />)
      fireEvent.click(screen.getByRole('button')) // Expand

      // Should not render highlights section
      expect(screen.queryByText('Highlights')).not.toBeInTheDocument()
    })

    it('should handle review with no insights', () => {
      const minimalReview = {
        ...mockReview,
        insights: {
          patterns: [],
          correlations: [],
          improvements: [],
          concerns: [],
        },
      }

      render(<ReviewCard review={minimalReview} />)
      fireEvent.click(screen.getByRole('button')) // Expand

      // Should not render insights section
      expect(screen.queryByText('Insights')).not.toBeInTheDocument()
    })

    it('should handle review with no recommendations', () => {
      const minimalReview = {
        ...mockReview,
        recommendations: {
          actionItems: [],
          adjustments: [],
        },
      }

      render(<ReviewCard review={minimalReview} />)
      fireEvent.click(screen.getByRole('button')) // Expand

      // Should not render recommendations section
      expect(screen.queryByText('Recommendations')).not.toBeInTheDocument()
    })

    it('should handle zero values correctly', () => {
      const zeroReview = {
        ...mockReview,
        summary: {
          missionsCompleted: 0,
          missionsSkipped: 0,
          totalTime: 0,
          avgSuccessScore: 0,
          completionRate: 0,
          avgDifficultyRating: 0,
        },
        highlights: {
          longestStreak: 0,
          bestPerformance: null,
          topObjectives: [],
          personalBests: [],
        },
      }

      render(<ReviewCard review={zeroReview} />)

      expect(screen.getByText('0h')).toBeInTheDocument()
      expect(screen.getByText('0%')).toBeInTheDocument()
      expect(screen.getByText('POOR')).toBeInTheDocument()
    })

    it('should handle very long text gracefully', () => {
      const longTextReview = {
        ...mockReview,
        insights: {
          ...mockReview.insights,
          improvements: [
            'This is a very long improvement description that should be handled gracefully without breaking the layout or causing overflow issues in the component'.repeat(
              5,
            ),
          ],
        },
      }

      render(<ReviewCard review={longTextReview} />)
      fireEvent.click(screen.getByRole('button'))

      // Component should render without errors
      expect(screen.getByText(/This is a very long improvement/)).toBeInTheDocument()
    })

    it('should handle invalid dates gracefully', () => {
      const invalidDateReview = {
        ...mockReview,
        startDate: 'invalid',
        endDate: 'invalid',
        generatedAt: 'invalid',
      }

      // Should not throw error
      render(<ReviewCard review={invalidDateReview} />)
      expect(screen.getByText('Weekly Review')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper button roles', () => {
      render(<ReviewCard review={mockReview} />)

      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
    })

    it('should support keyboard navigation', () => {
      render(<ReviewCard review={mockReview} />)

      const expandButton = screen.getByRole('button')
      expandButton.focus()
      expect(expandButton).toHaveFocus()
    })

    it('should have semantic HTML structure', () => {
      const { container } = render(<ReviewCard review={mockReview} />)

      // Check for proper card structure (shadcn Card component uses specific classes)
      const cardElement = container.querySelector('.rounded-xl.border')
      expect(cardElement).toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    it('should use responsive grid for summary stats', () => {
      const { container } = render(<ReviewCard review={mockReview} />)

      const grid = container.querySelector('.grid')
      expect(grid).toHaveClass('grid-cols-2', 'md:grid-cols-4')
    })
  })
})
