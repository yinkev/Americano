/**
 * Challenge Question Generator Client (Story 4.3 Task 3)
 *
 * TypeScript wrapper for Python Challenge Question Generation service.
 * Generates challenging questions with "near-miss" distractors using ChatMock/GPT-4.
 */

export interface MultipleChoiceOption {
  option_letter: string // A, B, C, D, E
  option_text: string
  is_correct: boolean
  distractor_rationale: string // Why this distractor is plausible
}

export interface ChallengeQuestion {
  question_stem: string
  clinical_vignette?: string
  options: MultipleChoiceOption[]
  correct_answer_letter: string
  explanation: string
  teaching_point: string
  difficulty_rationale: string
}

export interface ChallengeQuestionResponse {
  question: ChallengeQuestion
  objective_id: string
  vulnerability_type: string
  prompt_type: 'CONTROLLED_FAILURE'
}

export interface ChallengeGenerationRequest {
  objective_id: string
  objective_text: string
  vulnerability_type: 'overconfidence' | 'partial_understanding' | 'recent_mistakes'
}

/**
 * Call Python FastAPI service to generate challenge question.
 *
 * @param request - Challenge generation request with objective and vulnerability type
 * @returns Structured challenge question with near-miss distractors
 */
export async function generateChallengeQuestion(
  request: ChallengeGenerationRequest,
): Promise<ChallengeQuestionResponse> {
  const apiUrl = process.env.NEXT_PUBLIC_PYTHON_API_URL || 'http://localhost:8000'

  const response = await fetch(`${apiUrl}/validation/challenge/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(`Challenge generation failed: ${error.detail || response.statusText}`)
  }

  return response.json()
}

/**
 * Format multiple choice options for display.
 *
 * @param options - Array of multiple choice options
 * @returns Formatted options array
 */
export function formatMultipleChoiceOptions(
  options: MultipleChoiceOption[],
): Array<{ label: string; value: string; text: string }> {
  return options.map((option) => ({
    label: option.option_letter,
    value: option.option_letter,
    text: option.option_text,
  }))
}

/**
 * Check if user's answer is correct.
 *
 * @param question - Challenge question
 * @param userAnswer - User's selected answer letter
 * @returns True if correct, false otherwise
 */
export function isAnswerCorrect(question: ChallengeQuestion, userAnswer: string): boolean {
  return userAnswer.toUpperCase() === question.correct_answer_letter.toUpperCase()
}

/**
 * Get the correct option object from a question.
 *
 * @param question - Challenge question
 * @returns The correct option object
 */
export function getCorrectOption(question: ChallengeQuestion): MultipleChoiceOption | undefined {
  return question.options.find((option) => option.is_correct)
}

/**
 * Get the user's selected option object.
 *
 * @param question - Challenge question
 * @param userAnswer - User's selected answer letter
 * @returns The selected option object
 */
export function getSelectedOption(
  question: ChallengeQuestion,
  userAnswer: string,
): MultipleChoiceOption | undefined {
  return question.options.find(
    (option) => option.option_letter.toUpperCase() === userAnswer.toUpperCase(),
  )
}

/**
 * Get distractor rationale for incorrect answer.
 *
 * @param question - Challenge question
 * @param userAnswer - User's selected answer letter
 * @returns Distractor rationale explaining why the answer is plausible but wrong
 */
export function getDistractorRationale(
  question: ChallengeQuestion,
  userAnswer: string,
): string | null {
  const selectedOption = getSelectedOption(question, userAnswer)
  return selectedOption && !selectedOption.is_correct ? selectedOption.distractor_rationale : null
}

/**
 * Validate challenge question structure (for debugging).
 *
 * @param response - Challenge question response
 * @returns Array of validation errors (empty if valid)
 */
export function validateChallengeQuestion(response: ChallengeQuestionResponse): string[] {
  const errors: string[] = []
  const { question } = response

  // Check required fields
  if (!question.question_stem) errors.push('Missing question stem')
  if (!question.correct_answer_letter) errors.push('Missing correct answer letter')
  if (!question.explanation) errors.push('Missing explanation')
  if (!question.teaching_point) errors.push('Missing teaching point')

  // Check options
  if (!question.options || question.options.length < 4 || question.options.length > 5) {
    errors.push('Must have 4-5 multiple choice options')
  }

  // Check exactly one correct answer
  const correctCount = question.options.filter((opt) => opt.is_correct).length
  if (correctCount !== 1) {
    errors.push(`Must have exactly 1 correct answer (found ${correctCount})`)
  }

  // Verify correct_answer_letter matches a correct option
  const correctOption = question.options.find((opt) => opt.is_correct)
  if (correctOption && correctOption.option_letter !== question.correct_answer_letter) {
    errors.push(
      `Correct answer letter mismatch: ${question.correct_answer_letter} vs ${correctOption.option_letter}`,
    )
  }

  return errors
}
