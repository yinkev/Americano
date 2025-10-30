import { ChatMockClient } from '@/lib/ai/chatmock-client'
import { prisma } from '@/lib/db'

// Use types from clinical-scenarios.ts instead of Prisma for consistency
export type ObjectiveComplexity = 'BASIC' | 'INTERMEDIATE' | 'ADVANCED'
export type ScenarioType = 'DIAGNOSIS' | 'MANAGEMENT' | 'DIFFERENTIAL' | 'COMPLICATIONS'

// Minimal ClinicalScenario interface for generator (full interface in types/clinical-scenarios.ts)
export interface ClinicalScenario {
  id: string
  objectiveId: string
  scenarioType: ScenarioType
  difficulty: string
  caseText: CaseStructure
  boardExamTopic?: string
  createdAt: Date
}

/**
 * Clinical Scenario Generator for Story 4.2
 *
 * Generates multi-stage clinical case scenarios from learning objectives
 * using AI (ChatMock/GPT-5) with structured outputs.
 */
export interface CaseStructure {
  chiefComplaint: string
  demographics: {
    age: number
    sex: 'M' | 'F' | 'Other'
    occupation?: string
  }
  history: {
    presenting: string
    past?: string
    medications?: string[]
    socialHistory?: string
  }
  physicalExam: {
    vitals?: Record<string, string>
    general?: string
    cardiovascular?: string
    respiratory?: string
    other?: string
  }
  labs: {
    available: boolean
    options: string[]
    ordered?: string[]
  }
  questions: Array<{
    stage: string
    prompt: string
    options: string[]
    correctAnswer: string
    reasoning: string
  }>
}

export interface ScenarioGenerationRequest {
  objectiveId: string
  difficulty?: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED'
}

export interface GeneratedScenario {
  scenarioType: ScenarioType
  difficulty: string
  caseText: CaseStructure
  boardExamTopic: string
}

export class ClinicalScenarioGenerator {
  private chatMockClient: ChatMockClient

  constructor() {
    this.chatMockClient = new ChatMockClient()
  }

  /**
   * Generate a clinical scenario for a learning objective
   */
  async generateScenario(request: ScenarioGenerationRequest): Promise<ClinicalScenario> {
    // Fetch the learning objective
    const objective = await prisma.learningObjective.findUnique({
      where: { id: request.objectiveId },
      include: { lecture: true },
    })

    if (!objective) {
      throw new Error(`Learning objective not found: ${request.objectiveId}`)
    }

    // Determine difficulty based on objective complexity if not specified
    const difficulty = request.difficulty || this.mapComplexityToDifficulty(objective.complexity)

    // Check if scenario already exists for this objective (cache for 30 days)
    const existingScenario = await this.findExistingScenario(objective.id, difficulty)
    if (existingScenario) {
      return existingScenario
    }

    // Generate new scenario using AI
    const generatedScenario = await this.generateScenarioWithAI(objective, difficulty)

    // Save to database
    const scenario = await prisma.clinicalScenario.create({
      data: {
        objectiveId: objective.id,
        scenarioType: generatedScenario.scenarioType,
        difficulty,
        caseText: generatedScenario.caseText as any, // JSON field
        boardExamTopic: generatedScenario.boardExamTopic,
      },
    })

    return scenario as unknown as ClinicalScenario
  }

  /**
   * Find existing scenario for objective within cache period
   */
  private async findExistingScenario(
    objectiveId: string,
    difficulty: string,
  ): Promise<ClinicalScenario | null> {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const result = await prisma.clinicalScenario.findFirst({
      where: {
        objectiveId,
        difficulty,
        createdAt: { gte: thirtyDaysAgo },
      },
    })

    return result as ClinicalScenario | null
  }

  /**
   * Map objective complexity to scenario difficulty
   */
  private mapComplexityToDifficulty(complexity: ObjectiveComplexity): string {
    switch (complexity) {
      case 'BASIC':
        return 'BASIC'
      case 'INTERMEDIATE':
        return 'INTERMEDIATE'
      case 'ADVANCED':
        return 'ADVANCED'
      default:
        return 'INTERMEDIATE'
    }
  }

  /**
   * Generate scenario using ChatMock (GPT-5)
   */
  private async generateScenarioWithAI(
    objective: any,
    difficulty: string,
  ): Promise<GeneratedScenario> {
    const systemPrompt = this.buildSystemPrompt(difficulty)
    const userPrompt = this.buildUserPrompt(objective)

    try {
      // Use extractLearningObjectives method from ChatMockClient which handles JSON parsing
      // For now, we'll use a simplified approach with the OpenAI client directly
      const response = await (this.chatMockClient as any).client.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.4,
        max_tokens: 4000,
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error('No response from ChatMock')
      }

      // Parse JSON response, handling potential thinking tags
      let jsonContent = content
      jsonContent = jsonContent.replace(/<think>[\s\S]*?<\/think>/gi, '')

      const jsonStart = jsonContent.indexOf('{')
      const jsonEnd = jsonContent.lastIndexOf('}') + 1

      if (jsonStart === -1 || jsonEnd === 0) {
        throw new Error('No JSON object found in response')
      }

      jsonContent = jsonContent.substring(jsonStart, jsonEnd).trim()
      const parsed = JSON.parse(jsonContent)

      return parsed as GeneratedScenario
    } catch (error) {
      console.error('Failed to generate clinical scenario:', error)
      throw new Error('AI scenario generation failed')
    }
  }

  /**
   * Build system prompt for scenario generation
   */
  private buildSystemPrompt(difficulty: string): string {
    const basePrompt = `You are a medical education expert creating clinical reasoning scenarios for osteopathic medical students.

Generate a multi-stage case scenario that tests clinical reasoning skills. The case should follow USMLE/COMLEX format and be appropriate for the specified difficulty level.

Scenario Types:
- DIAGNOSIS: Focus on diagnostic reasoning and differential diagnosis
- MANAGEMENT: Focus on treatment planning and management decisions
- DIFFERENTIAL: Focus on broad differential diagnosis and prioritization
- COMPLICATIONS: Focus on recognizing and managing complications

Difficulty Levels:
- BASIC: Straightforward presentation, clear diagnosis, simple management (1-2 decision points)
- INTERMEDIATE: Atypical presentation, differential required, workup planning (3-4 decision points)
- ADVANCED: Complex comorbidities, rare conditions, multiple pathways (5+ decision points)

Case Structure Requirements:
- Chief complaint: Clear, concise presentation
- Demographics: Realistic age, sex, relevant occupation
- History: Presenting complaint, past medical history, medications, social history
- Physical exam: Relevant findings, vitals if applicable
- Labs/imaging: Available options, initial availability status
- Questions: Decision points at each stage with clear reasoning

All questions should:
- Test clinical reasoning, not just factual recall
- Have clear correct answers with evidence-based reasoning
- Include plausible distractors based on common errors
- Progress logically through the case`

    const difficultySpecific = this.getDifficultySpecificInstructions(difficulty)

    return basePrompt + '\n\n' + difficultySpecific
  }

  /**
   * Get difficulty-specific instructions
   */
  private getDifficultySpecificInstructions(difficulty: string): string {
    switch (difficulty) {
      case 'BASIC':
        return `BASIC Difficulty:
- Classic presentation of common conditions
- Single-step diagnosis or clear management pathway
- 1-2 decision points maximum
- Focus on fundamental clinical reasoning
- Avoid red herrings or complex comorbidities`

      case 'INTERMEDIATE':
        return `INTERMEDIATE Difficulty:
- Atypical presentation or multiple possible diagnoses
- Requires differential diagnosis reasoning
- 3-4 decision points including workup planning
- Some distractors but clear best pathway
- May include 1-2 comorbidities that don't complicate primary diagnosis`

      case 'ADVANCED':
        return `ADVANCED Difficulty:
- Complex presentation with multiple active issues
- Requires prioritization and managing diagnostic uncertainty
- 5+ decision points with branching pathways
- Significant comorbidities affecting diagnosis/management
- Include cognitive bias traps (anchoring, premature closure)
- May require resource allocation decisions`

      default:
        return ''
    }
  }

  /**
   * Build user prompt with objective context
   */
  private buildUserPrompt(objective: any): string {
    const boardExamTopics = objective.boardExamTags?.join(', ') || 'General medicine'

    return `Generate a clinical scenario for this learning objective:

Learning Objective: ${objective.objective}
Complexity: ${objective.complexity}
High Yield: ${objective.isHighYield ? 'Yes' : 'No'}
Board Exam Topics: ${boardExamTopics}

${objective.lecture ? `Lecture Context: ${objective.lecture.title}` : ''}

Create a realistic clinical case that directly tests this objective. Ensure the case is appropriate for board exam preparation and aligns with the specified topics.`
  }
}
