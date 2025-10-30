/**
 * Tests for ReflectionPromptDialog component
 *
 * @see Story 4.4 Task 6 (Metacognitive Reflection System)
 * @see Story 4.4 AC#5 (Metacognitive Reflection Prompts)
 */

import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ReflectionPromptDialog } from '@/components/study/ReflectionPromptDialog'
import * as reflectionConfig from '@/lib/reflection-config'

// Mock the reflection config to control question selection
jest.mock('@/lib/reflection-config', () => ({
  ...(jest.requireActual('@/lib/reflection-config') as any),
  getRandomReflectionQuestion: jest.fn(),
}))

describe('ReflectionPromptDialog', () => {
  const mockOnSubmit = jest.fn()
  const mockOnSkip = jest.fn()
  const mockOnOpenChange = jest.fn()

  const mockQuestion = {
    id: 'test-1',
    question: 'What strategies helped you understand this concept?',
    category: 'strategy' as const,
    placeholder: 'Share your learning strategies...',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(reflectionConfig.getRandomReflectionQuestion as jest.Mock).mockReturnValue(mockQuestion)
  })

  describe('Rendering', () => {
    it('should render when open', () => {
      render(
        <ReflectionPromptDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSubmit={mockOnSubmit}
          onSkip={mockOnSkip}
        />,
      )

      expect(screen.getByText('Reflect on Your Learning')).toBeInTheDocument()
      expect(screen.getByText(mockQuestion.question)).toBeInTheDocument()
    })

    it('should not render when closed', () => {
      render(
        <ReflectionPromptDialog
          open={false}
          onOpenChange={mockOnOpenChange}
          onSubmit={mockOnSubmit}
          onSkip={mockOnSkip}
        />,
      )

      expect(screen.queryByText('Reflect on Your Learning')).not.toBeInTheDocument()
    })

    it('should display randomly selected question', () => {
      render(
        <ReflectionPromptDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSubmit={mockOnSubmit}
          onSkip={mockOnSkip}
        />,
      )

      expect(screen.getByText(mockQuestion.question)).toBeInTheDocument()
      expect(reflectionConfig.getRandomReflectionQuestion).toHaveBeenCalled()
    })

    it('should display question category badge', () => {
      render(
        <ReflectionPromptDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSubmit={mockOnSubmit}
          onSkip={mockOnSkip}
        />,
      )

      expect(screen.getByText('Strategy')).toBeInTheDocument()
    })

    it('should display weekly completion progress', () => {
      render(
        <ReflectionPromptDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSubmit={mockOnSubmit}
          onSkip={mockOnSkip}
          completedThisWeek={5}
        />,
      )

      expect(screen.getByText('5 reflections completed this week')).toBeInTheDocument()
    })

    it('should handle singular reflection count', () => {
      render(
        <ReflectionPromptDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSubmit={mockOnSubmit}
          onSkip={mockOnSkip}
          completedThisWeek={1}
        />,
      )

      expect(screen.getByText('1 reflection completed this week')).toBeInTheDocument()
    })
  })

  describe('Textarea Interaction', () => {
    it('should render optional textarea with placeholder', () => {
      render(
        <ReflectionPromptDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSubmit={mockOnSubmit}
          onSkip={mockOnSkip}
        />,
      )

      const textarea = screen.getByPlaceholderText(mockQuestion.placeholder!)
      expect(textarea).toBeInTheDocument()
    })

    it('should update reflection notes on user input', () => {
      render(
        <ReflectionPromptDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSubmit={mockOnSubmit}
          onSkip={mockOnSkip}
        />,
      )

      const textarea = screen.getByPlaceholderText(mockQuestion.placeholder!)
      fireEvent.change(textarea, { target: { value: 'My reflection notes' } })

      expect(textarea).toHaveValue('My reflection notes')
    })

    it('should display character count when user types', () => {
      render(
        <ReflectionPromptDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSubmit={mockOnSubmit}
          onSkip={mockOnSkip}
        />,
      )

      const textarea = screen.getByPlaceholderText(mockQuestion.placeholder!)
      fireEvent.change(textarea, { target: { value: 'Test' } })

      expect(screen.getByText('4 characters')).toBeInTheDocument()
    })

    it('should show hint when textarea is empty', () => {
      render(
        <ReflectionPromptDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSubmit={mockOnSubmit}
          onSkip={mockOnSkip}
        />,
      )

      expect(
        screen.getByText(
          /You can skip this reflection, but taking time to reflect improves learning/,
        ),
      ).toBeInTheDocument()
    })
  })

  describe('Button Actions', () => {
    it('should call onSkip when Skip button clicked', () => {
      render(
        <ReflectionPromptDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSubmit={mockOnSubmit}
          onSkip={mockOnSkip}
        />,
      )

      const skipButton = screen.getByRole('button', { name: /skip/i })
      fireEvent.click(skipButton)

      expect(mockOnSkip).toHaveBeenCalledTimes(1)
      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })

    it('should call onSubmit with empty string when Continue clicked without text', () => {
      render(
        <ReflectionPromptDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSubmit={mockOnSubmit}
          onSkip={mockOnSkip}
        />,
      )

      const submitButton = screen.getByRole('button', { name: /continue/i })
      fireEvent.click(submitButton)

      expect(mockOnSubmit).toHaveBeenCalledWith('')
      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })

    it('should call onSubmit with reflection notes when Submit clicked', () => {
      render(
        <ReflectionPromptDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSubmit={mockOnSubmit}
          onSkip={mockOnSkip}
        />,
      )

      const textarea = screen.getByPlaceholderText(mockQuestion.placeholder!)
      fireEvent.change(textarea, { target: { value: 'My detailed reflection' } })

      const submitButton = screen.getByRole('button', { name: /submit reflection/i })
      fireEvent.click(submitButton)

      expect(mockOnSubmit).toHaveBeenCalledWith('My detailed reflection')
      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })

    it('should trim whitespace from reflection notes', () => {
      render(
        <ReflectionPromptDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSubmit={mockOnSubmit}
          onSkip={mockOnSkip}
        />,
      )

      const textarea = screen.getByPlaceholderText(mockQuestion.placeholder!)
      fireEvent.change(textarea, { target: { value: '  Reflection with spaces  ' } })

      const submitButton = screen.getByRole('button', { name: /submit reflection/i })
      fireEvent.click(submitButton)

      expect(mockOnSubmit).toHaveBeenCalledWith('Reflection with spaces')
    })

    it('should change button text from Continue to Submit Reflection when text entered', () => {
      render(
        <ReflectionPromptDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSubmit={mockOnSubmit}
          onSkip={mockOnSkip}
        />,
      )

      expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument()

      const textarea = screen.getByPlaceholderText(mockQuestion.placeholder!)
      fireEvent.change(textarea, { target: { value: 'Some text' } })

      expect(screen.getByRole('button', { name: /submit reflection/i })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /continue/i })).not.toBeInTheDocument()
    })
  })

  describe('Question Selection', () => {
    it('should pass recentQuestionIds to avoid repeating questions', () => {
      const recentIds = ['test-1', 'test-2']
      render(
        <ReflectionPromptDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSubmit={mockOnSubmit}
          onSkip={mockOnSkip}
          recentQuestionIds={recentIds}
        />,
      )

      expect(reflectionConfig.getRandomReflectionQuestion).toHaveBeenCalledWith(recentIds)
    })

    it('should select new question when dialog opens', () => {
      const { rerender } = render(
        <ReflectionPromptDialog
          open={false}
          onOpenChange={mockOnOpenChange}
          onSubmit={mockOnSubmit}
          onSkip={mockOnSkip}
        />,
      )

      expect(reflectionConfig.getRandomReflectionQuestion).not.toHaveBeenCalled()

      rerender(
        <ReflectionPromptDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSubmit={mockOnSubmit}
          onSkip={mockOnSkip}
        />,
      )

      expect(reflectionConfig.getRandomReflectionQuestion).toHaveBeenCalled()
    })
  })

  describe('State Management', () => {
    it('should reset textarea when dialog closes', async () => {
      const { rerender } = render(
        <ReflectionPromptDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSubmit={mockOnSubmit}
          onSkip={mockOnSkip}
        />,
      )

      const textarea = screen.getByPlaceholderText(mockQuestion.placeholder!)
      fireEvent.change(textarea, { target: { value: 'Some reflection' } })
      expect(textarea).toHaveValue('Some reflection')

      // Close dialog
      rerender(
        <ReflectionPromptDialog
          open={false}
          onOpenChange={mockOnOpenChange}
          onSubmit={mockOnSubmit}
          onSkip={mockOnSkip}
        />,
      )

      // Wait for animation (300ms delay in component)
      await waitFor(
        () => {
          // Reopen dialog
          rerender(
            <ReflectionPromptDialog
              open={true}
              onOpenChange={mockOnOpenChange}
              onSubmit={mockOnSubmit}
              onSkip={mockOnSkip}
            />,
          )

          const newTextarea = screen.getByPlaceholderText(mockQuestion.placeholder!)
          expect(newTextarea).toHaveValue('')
        },
        { timeout: 500 },
      )
    })

    it('should disable buttons when submitting', () => {
      render(
        <ReflectionPromptDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSubmit={mockOnSubmit}
          onSkip={mockOnSkip}
        />,
      )

      const submitButton = screen.getByRole('button', { name: /continue/i })
      fireEvent.click(submitButton)

      // After clicking, buttons should be disabled during submission
      expect(screen.getByRole('button', { name: /skip/i })).toBeDisabled()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(
        <ReflectionPromptDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSubmit={mockOnSubmit}
          onSkip={mockOnSkip}
        />,
      )

      expect(screen.getByRole('textbox')).toHaveAttribute('aria-describedby', 'reflection-hint')
    })

    it('should have semantic HTML structure', () => {
      render(
        <ReflectionPromptDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSubmit={mockOnSubmit}
          onSkip={mockOnSkip}
        />,
      )

      expect(screen.getByRole('button', { name: /skip/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument()
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })
  })

  describe('Educational Note', () => {
    it('should display metacognition explanation', () => {
      render(
        <ReflectionPromptDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSubmit={mockOnSubmit}
          onSkip={mockOnSkip}
        />,
      )

      expect(screen.getByText(/Why reflect?/)).toBeInTheDocument()
      expect(screen.getByText(/Metacognitive reflection helps you understand/)).toBeInTheDocument()
    })
  })
})
