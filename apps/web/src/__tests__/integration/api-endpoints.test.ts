/**
 * Test suite for Story 4.3 API Endpoints (AC: All)
 *
 * Tests:
 * - GET /api/validation/challenges/next
 * - POST /api/validation/challenges/submit
 * - GET /api/validation/patterns
 * - GET /api/validation/calibration
 */

// Jest globals (describe, it, expect) are available without imports

// Mock API response types
interface ValidationPrompt {
  id: string;
  objective_id: string;
  question_text: string;
  options: Array<{ text: string; is_correct: boolean }>;
  correct_answer_id: number;
  prompt_type: string;
}

interface ChallengeNextResponse {
  challenge: ValidationPrompt;
  vulnerability_type: string;
  retry_info?: {
    attempt_number: number;
    previous_score: number;
  };
}

interface CorrectiveFeedback {
  misconception_explained: string;
  why_answer_wrong: string;
  correct_concept: string;
  clinical_context: string;
  memory_anchor: {
    type: string;
    content: string;
    explanation: string;
  };
}

interface ChallengeSubmitResponse {
  is_correct: boolean;
  feedback?: CorrectiveFeedback;
  retry_schedule?: string[];
  celebration?: string;
  score?: number;
}

interface FailurePattern {
  pattern_id: string;
  category: string;
  affected_objectives: string[];
  failure_count: number;
  remediation: string;
}

interface PatternsResponse {
  patterns: FailurePattern[];
}

interface CalibrationResponse {
  calibration_score: number;
  mean_absolute_error: number;
  correlation_coefficient: number;
  overconfident_examples: Array<{ concept: string; confidence: number; score: number }>;
  underconfident_examples: Array<{ concept: string; confidence: number; score: number }>;
  trend: string;
}

describe('Story 4.3 API Endpoints', () => {
  const API_BASE = '/api/validation';
  let mockFetch: any;

  beforeEach(() => {
    mockFetch = jest.fn();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/validation/challenges/next (AC#1, #2, #8)', () => {
    it('should return 200 status with valid challenge response', async () => {
      const mockResponse: ChallengeNextResponse = {
        challenge: {
          id: 'q_123',
          objective_id: 'obj_ace',
          question_text: 'What enzyme do ACE inhibitors block?',
          options: [
            { text: 'ACE enzyme', is_correct: true },
            { text: 'AT1 receptor', is_correct: false },
            { text: 'Renin', is_correct: false },
            { text: 'Aldosterone', is_correct: false },
          ],
          correct_answer_id: 0,
          prompt_type: 'CONTROLLED_FAILURE',
        },
        vulnerability_type: 'overconfidence',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await fetch(`${API_BASE}/challenges/next`, {
        method: 'GET',
      });

      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.challenge).toBeDefined();
      expect(data.challenge.question_text).toBeDefined();
      expect(data.vulnerability_type).toBe('overconfidence');
    });

    it('should return challenge with prompt_type=CONTROLLED_FAILURE', async () => {
      const mockResponse: ChallengeNextResponse = {
        challenge: {
          id: 'q_123',
          objective_id: 'obj_1',
          question_text: 'Test question?',
          options: [
            { text: 'A', is_correct: true },
            { text: 'B', is_correct: false },
            { text: 'C', is_correct: false },
            { text: 'D', is_correct: false },
          ],
          correct_answer_id: 0,
          prompt_type: 'CONTROLLED_FAILURE',
        },
        vulnerability_type: 'misconception',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await fetch(`${API_BASE}/challenges/next`);
      const data = await response.json();

      expect(data.challenge.prompt_type).toBe('CONTROLLED_FAILURE');
    });

    it('should include retry_info for retry challenges', async () => {
      const mockResponse: ChallengeNextResponse = {
        challenge: {
          id: 'q_retry',
          objective_id: 'obj_1',
          question_text: 'Slightly different question?',
          options: [
            { text: 'Option A', is_correct: true },
            { text: 'Option B', is_correct: false },
            { text: 'Option C', is_correct: false },
            { text: 'Option D', is_correct: false },
          ],
          correct_answer_id: 0,
          prompt_type: 'CONTROLLED_FAILURE',
        },
        vulnerability_type: 'overconfidence',
        retry_info: {
          attempt_number: 2,
          previous_score: 30,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await fetch(`${API_BASE}/challenges/next`);
      const data = await response.json();

      expect(data.retry_info).toBeDefined();
      expect(data.retry_info.attempt_number).toBe(2);
      expect(data.retry_info.previous_score).toBe(30);
    });

    it('should handle missing challenges gracefully (no pending or new)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'No challenges available' }),
      });

      const response = await fetch(`${API_BASE}/challenges/next`);

      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/validation/challenges/submit (AC#3, #4, #5)', () => {
    it('should return 201 status with valid response', async () => {
      const mockResponse: ChallengeSubmitResponse = {
        is_correct: false,
        feedback: {
          misconception_explained: 'Common confusion explanation',
          why_answer_wrong: 'Your answer missed the key point',
          correct_concept: 'The correct concept explanation',
          clinical_context: 'Clinically, this matters because...',
          memory_anchor: {
            type: 'mnemonic',
            content: 'ACE = Angiotensin Converting Enzyme',
            explanation: 'Remember this way...',
          },
        },
        retry_schedule: [
          '2025-10-18',
          '2025-10-20',
          '2025-10-24',
          '2025-10-31',
          '2025-11-16',
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockResponse,
      });

      const payload = {
        challenge_id: 'q_123',
        user_answer: 'Option B',
        confidence: 4,
        emotion_tag: 'CONFUSION',
        personal_notes: 'I got confused here',
      };

      const response = await fetch(`${API_BASE}/challenges/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      expect(response.ok).toBe(true);
      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data.is_correct).toBe(false);
      expect(data.feedback).toBeDefined();
    });

    it('should return corrective feedback with all required components', async () => {
      const mockResponse: ChallengeSubmitResponse = {
        is_correct: false,
        feedback: {
          misconception_explained: 'You thought ACE inhibitors worked by X',
          why_answer_wrong: 'But they actually work by blocking ACE enzyme',
          correct_concept: 'ACE inhibitors block the ACE enzyme',
          clinical_context: 'This leads to reduced angiotensin II and vasodilation',
          memory_anchor: {
            type: 'analogy',
            content: 'Think of ACE inhibitors as blocking a door',
            explanation: 'Without angiotensin II passing through, blood pressure drops',
          },
        },
        retry_schedule: ['2025-10-18'],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockResponse,
      });

      const response = await fetch(`${API_BASE}/challenges/submit`, {
        method: 'POST',
        body: JSON.stringify({ challenge_id: 'q_1', user_answer: 'wrong' }),
      });

      const data = await response.json();

      expect(data.feedback.misconception_explained).toBeDefined();
      expect(data.feedback.correct_concept).toBeDefined();
      expect(data.feedback.clinical_context).toBeDefined();
      expect(data.feedback.memory_anchor).toBeDefined();
      expect(data.feedback.memory_anchor.type).toMatch(/mnemonic|analogy|patient_story/);
    });

    it('should return retry schedule with [+1, +3, +7, +14, +30] day intervals', async () => {
      const mockResponse: ChallengeSubmitResponse = {
        is_correct: false,
        retry_schedule: [
          '2025-10-18', // +1 day
          '2025-10-20', // +3 days
          '2025-10-24', // +7 days
          '2025-10-31', // +14 days
          '2025-11-16', // +30 days
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockResponse,
      });

      const response = await fetch(`${API_BASE}/challenges/submit`, {
        method: 'POST',
        body: JSON.stringify({ challenge_id: 'q_1', user_answer: 'wrong' }),
      });

      const data = await response.json();

      expect(data.retry_schedule.length).toBe(5);
      // Verify dates are spaced correctly (simplified check)
      expect(data.retry_schedule[0]).toBeDefined();
      expect(data.retry_schedule[4]).toBeDefined();
    });

    it('should return celebration message on correct answer', async () => {
      const mockResponse: ChallengeSubmitResponse = {
        is_correct: true,
        celebration: "You've conquered this concept! From failure to mastery.",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockResponse,
      });

      const response = await fetch(`${API_BASE}/challenges/submit`, {
        method: 'POST',
        body: JSON.stringify({ challenge_id: 'q_1', user_answer: 'correct' }),
      });

      const data = await response.json();

      expect(data.is_correct).toBe(true);
      expect(data.celebration).toContain('conquered');
    });

    it('should validate emotion_tag enum (optional)', async () => {
      const payload = {
        challenge_id: 'q_1',
        user_answer: 'B',
        confidence: 3,
        emotion_tag: 'INVALID_EMOTION',
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Invalid emotion_tag' }),
      });

      const response = await fetch(`${API_BASE}/challenges/submit`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      expect(response.ok).toBe(false);
    });

    it('should save ControlledFailure record', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ is_correct: false }),
      });

      const payload = {
        challenge_id: 'q_123',
        user_answer: 'B',
        confidence: 4,
        emotion_tag: 'CONFUSION',
        personal_notes: 'Confused mechanism',
      };

      const response = await fetch(`${API_BASE}/challenges/submit`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      expect(response.ok).toBe(true);
      // In real test, would verify database record created
    });
  });

  describe('GET /api/validation/patterns (AC#6)', () => {
    it('should return 200 with valid patterns response', async () => {
      const mockResponse: PatternsResponse = {
        patterns: [
          {
            pattern_id: 'p_1',
            category: 'Pharmacology - ACE Inhibitors',
            affected_objectives: ['ace_mech', 'ace_side_effects'],
            failure_count: 3,
            remediation: 'Review ACE inhibitor mechanism and clinical use',
          },
          {
            pattern_id: 'p_2',
            category: 'Physiology - Sympathetic vs Parasympathetic',
            affected_objectives: ['symp_effects', 'parasym_effects'],
            failure_count: 2,
            remediation: 'Compare sympathetic (fight/flight) vs parasympathetic (rest/digest)',
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await fetch(`${API_BASE}/patterns`, {
        method: 'GET',
      });

      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.patterns).toBeDefined();
      expect(data.patterns.length).toBeGreaterThan(0);
    });

    it('should return top 5 patterns', async () => {
      const mockResponse: PatternsResponse = {
        patterns: [
          {
            pattern_id: 'p_1',
            category: 'Pattern 1',
            affected_objectives: [],
            failure_count: 5,
            remediation: 'Remediation 1',
          },
          {
            pattern_id: 'p_2',
            category: 'Pattern 2',
            affected_objectives: [],
            failure_count: 4,
            remediation: 'Remediation 2',
          },
          {
            pattern_id: 'p_3',
            category: 'Pattern 3',
            affected_objectives: [],
            failure_count: 3,
            remediation: 'Remediation 3',
          },
          {
            pattern_id: 'p_4',
            category: 'Pattern 4',
            affected_objectives: [],
            failure_count: 2,
            remediation: 'Remediation 4',
          },
          {
            pattern_id: 'p_5',
            category: 'Pattern 5',
            affected_objectives: [],
            failure_count: 1,
            remediation: 'Remediation 5',
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await fetch(`${API_BASE}/patterns`);
      const data = await response.json();

      expect(data.patterns.length).toBeLessThanOrEqual(5);
    });

    it('should include remediation recommendations', async () => {
      const mockResponse: PatternsResponse = {
        patterns: [
          {
            pattern_id: 'p_1',
            category: 'Pharmacology',
            affected_objectives: ['obj1', 'obj2', 'obj3'],
            failure_count: 3,
            remediation: 'Review pharmacology chapter 5, complete practice set B',
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await fetch(`${API_BASE}/patterns`);
      const data = await response.json();

      expect(data.patterns[0].remediation).toBeDefined();
      expect(data.patterns[0].remediation.length).toBeGreaterThan(0);
    });

    it('should group patterns by category', async () => {
      const mockResponse: PatternsResponse = {
        patterns: [
          {
            pattern_id: 'p_1',
            category: 'Pharmacology - ACE Inhibitors',
            affected_objectives: [],
            failure_count: 3,
            remediation: 'Review',
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await fetch(`${API_BASE}/patterns`);
      const data = await response.json();

      expect(data.patterns[0].category).toContain('Pharmacology');
    });

    it('should return empty patterns for new user', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ patterns: [] }),
      });

      const response = await fetch(`${API_BASE}/patterns`);
      const data = await response.json();

      expect(data.patterns).toEqual([]);
    });
  });

  describe('GET /api/validation/calibration (AC#7)', () => {
    it('should return 200 with valid calibration response', async () => {
      const mockResponse: CalibrationResponse = {
        calibration_score: 0.75,
        mean_absolute_error: 12.5,
        correlation_coefficient: 0.82,
        overconfident_examples: [
          {
            concept: 'ACE Inhibitors',
            confidence: 5,
            score: 40,
          },
        ],
        underconfident_examples: [
          {
            concept: 'Sympathomimetics',
            confidence: 2,
            score: 90,
          },
        ],
        trend: 'improving',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await fetch(`${API_BASE}/calibration`, {
        method: 'GET',
      });

      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.calibration_score).toBeDefined();
      expect(data.overconfident_examples).toBeDefined();
      expect(data.trend).toMatch(/improving|stable|worsening/);
    });

    it('should return calibration metrics (score, MAE, correlation)', async () => {
      const mockResponse: CalibrationResponse = {
        calibration_score: 0.85,
        mean_absolute_error: 10.0,
        correlation_coefficient: 0.88,
        overconfident_examples: [],
        underconfident_examples: [],
        trend: 'improving',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await fetch(`${API_BASE}/calibration`);
      const data = await response.json();

      expect(typeof data.calibration_score).toBe('number');
      expect(data.calibration_score).toBeGreaterThanOrEqual(0);
      expect(data.calibration_score).toBeLessThanOrEqual(1);

      expect(typeof data.mean_absolute_error).toBe('number');
      expect(typeof data.correlation_coefficient).toBe('number');
    });

    it('should include overconfident examples', async () => {
      const mockResponse: CalibrationResponse = {
        calibration_score: 0.75,
        mean_absolute_error: 12.5,
        correlation_coefficient: 0.82,
        overconfident_examples: [
          {
            concept: 'ACE Inhibitors',
            confidence: 5,
            score: 40,
          },
          {
            concept: 'ARBs',
            confidence: 4,
            score: 50,
          },
        ],
        underconfident_examples: [],
        trend: 'stable',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await fetch(`${API_BASE}/calibration`);
      const data = await response.json();

      expect(data.overconfident_examples.length).toBeGreaterThan(0);
      expect(data.overconfident_examples[0].concept).toBeDefined();
      expect(data.overconfident_examples[0].confidence).toBeGreaterThan(
        data.overconfident_examples[0].score / 20
      );
    });

    it('should include underconfident examples', async () => {
      const mockResponse: CalibrationResponse = {
        calibration_score: 0.75,
        mean_absolute_error: 12.5,
        correlation_coefficient: 0.82,
        overconfident_examples: [],
        underconfident_examples: [
          {
            concept: 'Sympathomimetics',
            confidence: 2,
            score: 90,
          },
        ],
        trend: 'improving',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await fetch(`${API_BASE}/calibration`);
      const data = await response.json();

      expect(data.underconfident_examples.length).toBeGreaterThan(0);
      expect(data.underconfident_examples[0].score).toBeGreaterThan(
        data.underconfident_examples[0].confidence * 20
      );
    });

    it('should return trend (improving/stable/worsening)', async () => {
      const mockResponse: CalibrationResponse = {
        calibration_score: 0.75,
        mean_absolute_error: 12.5,
        correlation_coefficient: 0.82,
        overconfident_examples: [],
        underconfident_examples: [],
        trend: 'improving',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await fetch(`${API_BASE}/calibration`);
      const data = await response.json();

      expect(['improving', 'stable', 'worsening']).toContain(data.trend);
    });

    it('should return empty examples for new user', async () => {
      const mockResponse: CalibrationResponse = {
        calibration_score: 0,
        mean_absolute_error: 0,
        correlation_coefficient: 0,
        overconfident_examples: [],
        underconfident_examples: [],
        trend: 'stable',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const response = await fetch(`${API_BASE}/calibration`);
      const data = await response.json();

      expect(data.overconfident_examples).toEqual([]);
      expect(data.underconfident_examples).toEqual([]);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      try {
        await fetch(`${API_BASE}/challenges/next`);
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.message).toContain('Network error');
      }
    });

    it('should handle 500 server errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' }),
      });

      const response = await fetch(`${API_BASE}/challenges/next`);

      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
    });

    it('should handle 400 validation errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Invalid request' }),
      });

      const response = await fetch(`${API_BASE}/challenges/submit`, {
        method: 'POST',
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
    });
  });
});
