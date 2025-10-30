import OpenAI from 'openai'
import { DEFAULT_POLICIES, retryService } from '../retry/retry-service'

export type ObjectiveComplexity = 'BASIC' | 'INTERMEDIATE' | 'ADVANCED'

export interface ExtractedObjective {
  objective: string
  complexity: ObjectiveComplexity
  pageStart?: number
  pageEnd?: number
  isHighYield: boolean
  prerequisites: string[]
  boardExamTags: string[] // USMLE Step 1/2/3, COMLEX Level 1/2/3, NBME subject tags
}

export interface ExtractionResponse {
  objectives: ExtractedObjective[]
  error?: string
}

export interface ExtractionContext {
  courseName: string
  lectureName: string
  pageNumbers?: number[]
}

export class ChatMockClient {
  private client: OpenAI
  private readonly CHATMOCK_URL = process.env.CHATMOCK_URL || 'http://localhost:8801'

  constructor() {
    this.client = new OpenAI({
      baseURL: `${this.CHATMOCK_URL}/v1`,
      apiKey: 'not-needed', // ChatMock doesn't require API key
      timeout: 120000, // 2 minute timeout
      maxRetries: 0, // Don't retry - handled by RetryService
    })
  }

  /**
   * Extract learning objectives from medical lecture text using GPT-5
   * Now includes production-ready retry logic with circuit breaker
   *
   * @param lectureText - The full text content of the lecture
   * @param context - Context about the lecture (course, name, page numbers)
   * @returns Extracted objectives with complexity, prerequisites, and AAMC competencies
   */
  async extractLearningObjectives(
    lectureText: string,
    context: ExtractionContext,
  ): Promise<ExtractionResponse> {
    const result = await retryService.execute(
      async () => {
        const systemPrompt = `You are a medical education expert analyzing lecture content for osteopathic medical students.

Your task is to identify and formulate learning objectives from medical lectures, using deep reasoning to understand what students should learn.

CRITICAL INSTRUCTIONS:
1. **Extract explicit objectives** if clearly stated in the lecture (look for "Learning Objectives", "Goals", "By the end of this lecture you will...")
2. **If no explicit objectives exist**, use your reasoning capabilities to INFER objectives by analyzing:
   - Key anatomical structures and systems discussed
   - Physiological mechanisms and processes explained
   - Clinical correlations and pathological conditions
   - Diagnostic approaches and treatment principles
   - Important medical concepts and terminology introduced

Think deeply about: "If I were teaching this content, what should students be able to do after learning this material?"

For each learning objective (extracted OR inferred):
1. Write a clear, actionable objective statement preserving exact medical terms (e.g., "cardiac conduction system" not "heart signals")
2. Use action verbs: describe, explain, identify, differentiate, analyze, compare, evaluate
3. Categorize complexity:
   - BASIC: Foundational knowledge (definitions, basic anatomy, terminology)
   - INTERMEDIATE: Application and integration (mechanisms, clinical correlations, physiological processes)
   - ADVANCED: Analysis and synthesis (complex pathophysiology, differential diagnosis, treatment planning)
4. Identify if high-yield (board-exam relevant, clinically critical, frequently tested topics)
5. List prerequisite concepts needed to understand this objective (as simple strings)
6. Tag with relevant board exam topics for USMLE Step 1/2/3 and COMLEX Level 1/2/3:
   - USMLE Step 1 subjects: Anatomy, Biochemistry, Physiology, Pathology, Pharmacology, Microbiology, Behavioral Sciences
   - USMLE Step 2 CK: Internal Medicine, Surgery, Pediatrics, Psychiatry, OB/GYN, Emergency Medicine
   - COMLEX subjects: Similar to USMLE but includes Osteopathic Principles and Practice (OPP)
   - NBME subject tags: Cardiovascular, Respiratory, GI, Renal, Endocrine, Hematology, Neurology, etc.
   - Use abbreviated tags like "USMLE-Step1-Cardio", "COMLEX-L1-Anatomy", "NBME-Renal"
7. If page numbers are available in the text, extract the page range for each objective:
   - Use pageStart and pageEnd to capture the full range (e.g., if content spans pages 673-676, set pageStart: 673, pageEnd: 676)
   - If the objective is only on one page, set both pageStart and pageEnd to the same number
   - If no page numbers are found, omit both fields

QUALITY STANDARDS:
- Generate 5-15 objectives per lecture (fewer for focused topics, more for comprehensive reviews)
- Each objective should be specific and measurable (not vague like "understand the heart")
- Objectives should cover the major topics and key clinical pearls
- Prioritize clinically relevant and board-exam testable content

Return a JSON object with this exact structure:
{
  "objectives": [
    {
      "objective": "Describe the cardiac conduction system pathway from SA node to Purkinje fibers",
      "complexity": "INTERMEDIATE",
      "pageStart": 12,
      "pageEnd": 14,
      "isHighYield": true,
      "prerequisites": ["basic cardiac anatomy", "electrophysiology fundamentals"],
      "boardExamTags": ["USMLE-Step1-Cardio", "COMLEX-L1-Anatomy", "NBME-Cardiovascular"]
    }
  ]
}`

        const userContent = `Context:
- Course: ${context.courseName}
- Lecture: ${context.lectureName}
${context.pageNumbers ? `- Pages: ${context.pageNumbers.join(', ')}` : ''}

Analyze this medical lecture content and determine what learning objectives are taught here.

If explicit objectives are stated, extract them. If not, use your medical education expertise to infer what students should learn from this material.

Lecture content:

${lectureText}`

        const response = await this.client.chat.completions.create({
          model: 'gpt-5',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent },
          ],
          temperature: 0.3, // Lower temperature for more consistent extraction
          max_tokens: 16000, // High limit to ensure comprehensive extraction never truncates
        })

        const content = response.choices[0]?.message?.content

        if (!content) {
          throw new Error('No response from ChatMock')
        }

        // Strip thinking tags if present (GPT-5 reasoning tokens)
        // Extract JSON from response - handle both pure JSON and thinking-wrapped responses
        let jsonContent = content

        // Remove <think>...</think> blocks
        jsonContent = jsonContent.replace(/<think>[\s\S]*?<\/think>/gi, '')

        // Extract JSON object (find first { to last })
        const jsonStart = jsonContent.indexOf('{')
        const jsonEnd = jsonContent.lastIndexOf('}') + 1

        if (jsonStart === -1 || jsonEnd === 0) {
          throw new Error('No JSON object found in response')
        }

        jsonContent = jsonContent.substring(jsonStart, jsonEnd).trim()

        // Parse JSON response
        const parsed = JSON.parse(jsonContent)

        // Validate complexity values
        const validComplexities: ObjectiveComplexity[] = ['BASIC', 'INTERMEDIATE', 'ADVANCED']
        const objectives = (parsed.objectives || []).map((obj: any) => ({
          ...obj,
          complexity: validComplexities.includes(obj.complexity) ? obj.complexity : 'INTERMEDIATE',
          prerequisites: obj.prerequisites || [],
          boardExamTags: obj.boardExamTags || [],
        }))

        return { objectives }
      },
      DEFAULT_POLICIES.CHATMOCK_API,
      'chatmock-extraction',
    )

    if (result.error) {
      console.error('ChatMock extraction error after retries:', result.error.message)
      return {
        objectives: [],
        error: result.error.message,
      }
    }

    return result.value!
  }

  async createChatCompletion(
    params: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming,
  ): Promise<OpenAI.Chat.Completions.ChatCompletion> {
    const result = await retryService.execute(
      async () => this.client.chat.completions.create(params),
      DEFAULT_POLICIES.CHATMOCK_API,
      'chatmock-completion',
    )

    if (result.error) {
      throw result.error
    }

    return result.value!
  }
}
