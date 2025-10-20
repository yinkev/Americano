/**
 * Metacognitive Reflection Prompt Configuration (Story 4.4 Task 6)
 *
 * Contains 10+ reflection questions for post-assessment metacognitive prompts.
 * Questions are randomized to maintain engagement and encourage diverse reflection.
 *
 * @see Story 4.4 AC#5 (Metacognitive Reflection Prompts)
 * @see Story 4.4 Constraint #6 (Randomized question selection)
 */

export interface ReflectionQuestion {
  id: string;
  question: string;
  category: 'strategy' | 'insight' | 'planning' | 'connection' | 'metacognition';
  placeholder?: string;
}

/**
 * Bank of reflection questions for metacognitive prompts
 *
 * Categories:
 * - strategy: Learning strategies and study approaches
 * - insight: Self-awareness and performance insights
 * - planning: Future planning and adjustment
 * - connection: Knowledge connections and relationships
 * - metacognition: Thinking about thinking
 */
export const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: 'strategy-1',
    question: 'What strategies helped you understand this concept?',
    category: 'strategy',
    placeholder: 'E.g., drew diagrams, created mnemonics, related to previous knowledge...',
  },
  {
    id: 'insight-1',
    question: 'What surprised you about your performance?',
    category: 'insight',
    placeholder: 'Reflect on what was easier or harder than expected...',
  },
  {
    id: 'planning-1',
    question: 'How would you approach studying this differently?',
    category: 'planning',
    placeholder: 'Think about what you would do differently next time...',
  },
  {
    id: 'connection-1',
    question: 'What prerequisite knowledge did you need?',
    category: 'connection',
    placeholder: 'Identify foundational concepts that helped or were missing...',
  },
  {
    id: 'metacognition-1',
    question: 'How confident do you feel about applying this in a clinical scenario?',
    category: 'metacognition',
    placeholder: 'Consider your ability to use this knowledge in practice...',
  },
  {
    id: 'connection-2',
    question: 'What would you tell a peer studying this same concept?',
    category: 'connection',
    placeholder: 'Share advice or insights for someone learning this...',
  },
  {
    id: 'insight-2',
    question: 'What parts of the explanation were most challenging to articulate?',
    category: 'insight',
    placeholder: 'Identify specific areas that were difficult to put into words...',
  },
  {
    id: 'connection-3',
    question: 'How does this concept connect to what you already know?',
    category: 'connection',
    placeholder: 'Draw connections to other concepts or courses...',
  },
  {
    id: 'planning-2',
    question: 'What would you need to review to improve your explanation?',
    category: 'planning',
    placeholder: 'Identify specific gaps or areas needing more study...',
  },
  {
    id: 'metacognition-2',
    question: 'How would you verify your understanding of this concept?',
    category: 'metacognition',
    placeholder: 'Think about ways to test or validate your comprehension...',
  },
  {
    id: 'strategy-2',
    question: 'What learning technique worked best for you with this material?',
    category: 'strategy',
    placeholder: 'E.g., spaced repetition, active recall, teaching others...',
  },
  {
    id: 'insight-3',
    question: 'What aspects of this concept do you feel most confident about?',
    category: 'insight',
    placeholder: 'Identify your strengths in understanding this material...',
  },
  {
    id: 'planning-3',
    question: 'How will you use this knowledge in your future practice?',
    category: 'planning',
    placeholder: 'Connect this to clinical applications or patient care...',
  },
  {
    id: 'metacognition-3',
    question: 'What patterns do you notice in how you learn complex medical concepts?',
    category: 'metacognition',
    placeholder: 'Reflect on your learning process and preferences...',
  },
];

/**
 * Selects a random reflection question from the bank
 *
 * @param excludeIds - Optional array of question IDs to exclude (e.g., recently shown)
 * @param category - Optional category filter
 * @returns Random reflection question
 */
export function getRandomReflectionQuestion(
  excludeIds: string[] = [],
  category?: ReflectionQuestion['category']
): ReflectionQuestion {
  let availableQuestions = REFLECTION_QUESTIONS;

  // Filter by category if provided
  if (category) {
    availableQuestions = availableQuestions.filter((q) => q.category === category);
  }

  // Exclude recently shown questions
  if (excludeIds.length > 0) {
    availableQuestions = availableQuestions.filter((q) => !excludeIds.includes(q.id));
  }

  // Fallback to all questions if filtering removed all options
  if (availableQuestions.length === 0) {
    availableQuestions = REFLECTION_QUESTIONS;
  }

  // Select random question
  const randomIndex = Math.floor(Math.random() * availableQuestions.length);
  return availableQuestions[randomIndex];
}

/**
 * Get multiple random reflection questions without repeats
 *
 * @param count - Number of questions to return
 * @param excludeIds - Optional array of question IDs to exclude
 * @returns Array of random reflection questions
 */
export function getRandomReflectionQuestions(
  count: number,
  excludeIds: string[] = []
): ReflectionQuestion[] {
  const selected: ReflectionQuestion[] = [];
  const usedIds = new Set(excludeIds);

  let availableQuestions = REFLECTION_QUESTIONS.filter((q) => !usedIds.has(q.id));

  for (let i = 0; i < count && availableQuestions.length > 0; i++) {
    const randomIndex = Math.floor(Math.random() * availableQuestions.length);
    const question = availableQuestions[randomIndex];
    selected.push(question);
    usedIds.add(question.id);
    availableQuestions = availableQuestions.filter((q) => !usedIds.has(q.id));
  }

  return selected;
}

/**
 * Calculate metacognitive engagement score
 *
 * Score based on:
 * - Reflection completion rate (0-100)
 * - Average response length (quality indicator)
 * - Consistency (completed vs. skipped ratio)
 *
 * @param completedCount - Number of reflections completed
 * @param totalPromptedCount - Total number of reflection prompts shown
 * @param avgResponseLength - Average length of reflection responses (characters)
 * @returns Engagement score 0-100
 */
export function calculateMetacognitiveEngagementScore(
  completedCount: number,
  totalPromptedCount: number,
  avgResponseLength: number = 0
): number {
  if (totalPromptedCount === 0) return 0;

  // Completion rate (70% weight)
  const completionRate = (completedCount / totalPromptedCount) * 100;
  const completionScore = completionRate * 0.7;

  // Response quality based on length (30% weight)
  // Minimum meaningful response: 50 characters
  // Well-developed response: 200+ characters
  const qualityScore = Math.min(avgResponseLength / 200, 1.0) * 30;

  return Math.round(completionScore + qualityScore);
}

/**
 * Get engagement level label based on score
 *
 * @param score - Engagement score 0-100
 * @returns Human-readable engagement level
 */
export function getEngagementLevel(score: number): {
  level: string;
  color: string;
  description: string;
} {
  if (score >= 80) {
    return {
      level: 'Highly Engaged',
      color: 'oklch(0.7 0.15 145)', // Green
      description: 'Excellent metacognitive awareness and consistent reflection',
    };
  }
  if (score >= 60) {
    return {
      level: 'Moderately Engaged',
      color: 'oklch(0.75 0.12 85)', // Yellow
      description: 'Good reflection habits with room for deeper insights',
    };
  }
  if (score >= 40) {
    return {
      level: 'Developing',
      color: 'oklch(0.65 0.18 60)', // Orange
      description: 'Building reflection skills, aim for more consistent practice',
    };
  }
  return {
    level: 'Needs Improvement',
    color: 'oklch(0.65 0.20 25)', // Red
    description: 'Take time to reflect on your learning process after assessments',
  };
}
