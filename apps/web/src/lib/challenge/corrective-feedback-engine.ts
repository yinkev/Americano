/**
 * TypeScript wrapper for CorrectiveFeedbackEngine (Story 4.3 Task 4)
 *
 * Calls Python FastAPI service for corrective feedback generation.
 * Provides type-safe interface for Next.js API routes and UI components.
 */

// ============================================================================
// Types (mirroring Python Pydantic models)
// ============================================================================

export type MemoryAnchorType =
  | "mnemonic"
  | "visual_analogy"
  | "patient_story"
  | "clinical_pearl";

export type EmotionTag =
  | "SURPRISE"
  | "CONFUSION"
  | "FRUSTRATION"
  | "AHA_MOMENT"
  | "";

export interface FeedbackRequest {
  challenge_id: string;
  user_answer: string;
  correct_answer: string;
  objective_text: string;
  misconception_type?: string;
}

export interface StructuredFeedback {
  misconception_explained: string;
  correct_concept: string;
  clinical_context: string;
  memory_anchor: string;
  memory_anchor_type: MemoryAnchorType;
}

export interface FeedbackResponse {
  challenge_id: string;
  feedback: StructuredFeedback;
  emotion_tag?: EmotionTag;
  personal_notes?: string;
  generated_at: string; // ISO datetime string
}

// ============================================================================
// Configuration
// ============================================================================

const PYTHON_API_BASE_URL = process.env.NEXT_PUBLIC_PYTHON_API_URL || 'http://localhost:8000';

// ============================================================================
// CorrectiveFeedbackEngine Client
// ============================================================================

export class CorrectiveFeedbackEngine {
  private baseUrl: string;

  constructor(baseUrl: string = PYTHON_API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Generate corrective feedback for a failed challenge.
   *
   * Calls Python FastAPI service which uses instructor for structured outputs.
   *
   * @param request - FeedbackRequest with challenge context
   * @returns Promise<FeedbackResponse> with structured feedback
   * @throws Error if API call fails
   */
  async generateFeedback(request: FeedbackRequest): Promise<FeedbackResponse> {
    const url = `${this.baseUrl}/challenge/feedback`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `Feedback generation failed: ${response.statusText}`
        );
      }

      const data: FeedbackResponse = await response.json();
      return data;
    } catch (error) {
      console.error('L CorrectiveFeedbackEngine error:', error);
      throw error;
    }
  }

  /**
   * Helper to format feedback for display in UI.
   *
   * @param feedback - StructuredFeedback object
   * @returns Formatted feedback sections
   */
  formatFeedback(feedback: StructuredFeedback): {
    misconception: string;
    correctConcept: string;
    clinicalContext: string;
    memoryAnchor: string;
    anchorType: string;
  } {
    return {
      misconception: feedback.misconception_explained,
      correctConcept: feedback.correct_concept,
      clinicalContext: feedback.clinical_context,
      memoryAnchor: feedback.memory_anchor,
      anchorType: this.formatAnchorType(feedback.memory_anchor_type),
    };
  }

  /**
   * Format memory anchor type for display.
   *
   * @param type - MemoryAnchorType
   * @returns Human-readable anchor type
   */
  private formatAnchorType(type: MemoryAnchorType): string {
    const typeMap: Record<MemoryAnchorType, string> = {
      mnemonic: 'Mnemonic',
      visual_analogy: 'Visual Analogy',
      patient_story: 'Patient Story',
      clinical_pearl: 'Clinical Pearl',
    };
    return typeMap[type];
  }

  /**
   * Validate feedback request before sending to API.
   *
   * @param request - FeedbackRequest to validate
   * @throws Error if validation fails
   */
  validateRequest(request: FeedbackRequest): void {
    if (!request.challenge_id || request.challenge_id.trim() === '') {
      throw new Error('challenge_id is required');
    }
    if (!request.user_answer || request.user_answer.trim() === '') {
      throw new Error('user_answer is required');
    }
    if (!request.correct_answer || request.correct_answer.trim() === '') {
      throw new Error('correct_answer is required');
    }
    if (!request.objective_text || request.objective_text.trim() === '') {
      throw new Error('objective_text is required');
    }
  }
}

// ============================================================================
// Default Export (Singleton Instance)
// ============================================================================

const correctiveFeedbackEngine = new CorrectiveFeedbackEngine();
export default correctiveFeedbackEngine;
