/**
 * Tests for reflection configuration and metacognitive engagement scoring
 *
 * @see Story 4.4 Task 6 (Metacognitive Reflection System)
 * @see Story 4.4 AC#5 (Metacognitive Reflection Prompts)
 * @see Story 4.4 Constraint #6 (Randomized questions, completion tracking)
 */

import { describe, it, expect } from '@jest/globals';
import {
  REFLECTION_QUESTIONS,
  getRandomReflectionQuestion,
  getRandomReflectionQuestions,
  calculateMetacognitiveEngagementScore,
  getEngagementLevel,
  type ReflectionQuestion,
} from '@/lib/reflection-config';

describe('Reflection Configuration', () => {
  describe('REFLECTION_QUESTIONS', () => {
    it('should have at least 10 questions', () => {
      expect(REFLECTION_QUESTIONS.length).toBeGreaterThanOrEqual(10);
    });

    it('should have all required fields for each question', () => {
      REFLECTION_QUESTIONS.forEach((question) => {
        expect(question).toHaveProperty('id');
        expect(question).toHaveProperty('question');
        expect(question).toHaveProperty('category');
        expect(typeof question.id).toBe('string');
        expect(typeof question.question).toBe('string');
        expect(question.question.length).toBeGreaterThan(0);
        expect(['strategy', 'insight', 'planning', 'connection', 'metacognition']).toContain(
          question.category
        );
      });
    });

    it('should have unique question IDs', () => {
      const ids = REFLECTION_QUESTIONS.map((q) => q.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have questions in all categories', () => {
      const categories = new Set(REFLECTION_QUESTIONS.map((q) => q.category));
      expect(categories.has('strategy')).toBe(true);
      expect(categories.has('insight')).toBe(true);
      expect(categories.has('planning')).toBe(true);
      expect(categories.has('connection')).toBe(true);
      expect(categories.has('metacognition')).toBe(true);
    });
  });

  describe('getRandomReflectionQuestion', () => {
    it('should return a random question', () => {
      const question = getRandomReflectionQuestion();
      expect(question).toBeDefined();
      expect(REFLECTION_QUESTIONS).toContainEqual(question);
    });

    it('should exclude specified question IDs', () => {
      const excludeIds = [REFLECTION_QUESTIONS[0].id, REFLECTION_QUESTIONS[1].id];
      const question = getRandomReflectionQuestion(excludeIds);
      expect(excludeIds).not.toContain(question.id);
    });

    it('should filter by category when specified', () => {
      const question = getRandomReflectionQuestion([], 'strategy');
      expect(question.category).toBe('strategy');
    });

    it('should return different questions on multiple calls (probabilistic)', () => {
      const questions: ReflectionQuestion[] = [];
      // Sample 20 times to get different questions (should get at least 3 unique)
      for (let i = 0; i < 20; i++) {
        questions.push(getRandomReflectionQuestion());
      }
      const uniqueIds = new Set(questions.map((q) => q.id));
      expect(uniqueIds.size).toBeGreaterThanOrEqual(3);
    });

    it('should fallback to all questions if filtering removes all options', () => {
      // Exclude all questions
      const allIds = REFLECTION_QUESTIONS.map((q) => q.id);
      const question = getRandomReflectionQuestion(allIds);
      expect(question).toBeDefined();
      expect(REFLECTION_QUESTIONS).toContainEqual(question);
    });
  });

  describe('getRandomReflectionQuestions', () => {
    it('should return requested number of questions', () => {
      const questions = getRandomReflectionQuestions(5);
      expect(questions.length).toBe(5);
    });

    it('should return unique questions (no repeats)', () => {
      const questions = getRandomReflectionQuestions(5);
      const ids = questions.map((q) => q.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(5);
    });

    it('should exclude specified question IDs', () => {
      const excludeIds = [REFLECTION_QUESTIONS[0].id];
      const questions = getRandomReflectionQuestions(5, excludeIds);
      questions.forEach((q) => {
        expect(excludeIds).not.toContain(q.id);
      });
    });

    it('should handle requesting more questions than available', () => {
      const allIds = REFLECTION_QUESTIONS.map((q) => q.id);
      const questions = getRandomReflectionQuestions(100, []);
      // Should return all available questions (limited by bank size)
      expect(questions.length).toBeLessThanOrEqual(REFLECTION_QUESTIONS.length);
    });

    it('should return empty array if all questions excluded and count > 0', () => {
      const allIds = REFLECTION_QUESTIONS.map((q) => q.id);
      const questions = getRandomReflectionQuestions(5, allIds);
      expect(questions.length).toBe(0);
    });
  });

  describe('calculateMetacognitiveEngagementScore', () => {
    it('should return 0 when no prompts shown', () => {
      const score = calculateMetacognitiveEngagementScore(0, 0, 0);
      expect(score).toBe(0);
    });

    it('should calculate score based on completion rate (70% weight)', () => {
      // 100% completion rate, no quality bonus
      const score = calculateMetacognitiveEngagementScore(10, 10, 0);
      expect(score).toBe(70); // 100% * 0.7 = 70
    });

    it('should add quality score based on avg response length (30% weight)', () => {
      // 100% completion rate + 200 char avg = full quality bonus
      const score = calculateMetacognitiveEngagementScore(10, 10, 200);
      expect(score).toBe(100); // 70 + 30 = 100
    });

    it('should cap quality score at 30 points for 200+ chars', () => {
      // 100% completion rate + 400 char avg = still max 30 quality
      const score = calculateMetacognitiveEngagementScore(10, 10, 400);
      expect(score).toBe(100); // 70 + 30 = 100 (quality capped)
    });

    it('should calculate partial quality score for shorter responses', () => {
      // 100% completion rate + 100 char avg = half quality bonus
      const score = calculateMetacognitiveEngagementScore(10, 10, 100);
      expect(score).toBe(85); // 70 + (100/200 * 30) = 70 + 15 = 85
    });

    it('should handle 50% completion rate', () => {
      // 50% completion rate, no quality
      const score = calculateMetacognitiveEngagementScore(5, 10, 0);
      expect(score).toBe(35); // 50% * 0.7 * 100 = 35
    });

    it('should calculate combined score correctly', () => {
      // 80% completion rate + 150 char avg
      const score = calculateMetacognitiveEngagementScore(8, 10, 150);
      // Completion: 80% * 70 = 56
      // Quality: (150/200) * 30 = 22.5
      // Total: 56 + 22.5 = 78.5 → 79 (rounded)
      expect(score).toBe(79);
    });

    it('should handle minimum meaningful response (50 chars)', () => {
      const score = calculateMetacognitiveEngagementScore(10, 10, 50);
      // Completion: 70
      // Quality: (50/200) * 30 = 7.5
      // Total: 77.5 → 78 (rounded)
      expect(score).toBe(78);
    });

    it('should default avgResponseLength to 0 if not provided', () => {
      const score = calculateMetacognitiveEngagementScore(10, 10);
      expect(score).toBe(70); // Only completion score
    });
  });

  describe('getEngagementLevel', () => {
    it('should return Highly Engaged for score >= 80', () => {
      const result = getEngagementLevel(80);
      expect(result.level).toBe('Highly Engaged');
      expect(result.color).toBe('oklch(0.7 0.15 145)'); // Green
      expect(result.description).toContain('Excellent');
    });

    it('should return Moderately Engaged for score 60-79', () => {
      const result = getEngagementLevel(60);
      expect(result.level).toBe('Moderately Engaged');
      expect(result.color).toBe('oklch(0.75 0.12 85)'); // Yellow
      expect(result.description).toContain('Good');
    });

    it('should return Developing for score 40-59', () => {
      const result = getEngagementLevel(40);
      expect(result.level).toBe('Developing');
      expect(result.color).toBe('oklch(0.65 0.18 60)'); // Orange
      expect(result.description).toContain('Building');
    });

    it('should return Needs Improvement for score < 40', () => {
      const result = getEngagementLevel(39);
      expect(result.level).toBe('Needs Improvement');
      expect(result.color).toBe('oklch(0.65 0.20 25)'); // Red
      expect(result.description).toContain('Take time');
    });

    it('should handle edge case at 79 (Moderately Engaged)', () => {
      const result = getEngagementLevel(79);
      expect(result.level).toBe('Moderately Engaged');
    });

    it('should handle score of 0', () => {
      const result = getEngagementLevel(0);
      expect(result.level).toBe('Needs Improvement');
    });

    it('should handle score of 100', () => {
      const result = getEngagementLevel(100);
      expect(result.level).toBe('Highly Engaged');
    });
  });

  describe('Question Quality', () => {
    it('should have meaningful placeholders for all questions', () => {
      REFLECTION_QUESTIONS.forEach((question) => {
        if (question.placeholder) {
          expect(question.placeholder.length).toBeGreaterThan(10);
        }
      });
    });

    it('should have questions ending with question mark', () => {
      REFLECTION_QUESTIONS.forEach((question) => {
        expect(question.question.trim().endsWith('?')).toBe(true);
      });
    });

    it('should have questions longer than 20 characters', () => {
      REFLECTION_QUESTIONS.forEach((question) => {
        expect(question.question.length).toBeGreaterThan(20);
      });
    });
  });

  describe('Category Distribution', () => {
    it('should have balanced category distribution (each category >= 2 questions)', () => {
      const categoryCounts = REFLECTION_QUESTIONS.reduce(
        (counts, q) => {
          counts[q.category] = (counts[q.category] || 0) + 1;
          return counts;
        },
        {} as Record<string, number>
      );

      Object.values(categoryCounts).forEach((count) => {
        expect(count).toBeGreaterThanOrEqual(2);
      });
    });
  });
});
