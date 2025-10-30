import { ClinicalScenarioGenerator } from '@/lib/clinical-scenario-generator'
import { prisma } from '@/lib/db'

// Mock types for Prisma enums (from schema)
type ScenarioType = 'DIAGNOSIS' | 'MANAGEMENT' | 'DIFFERENTIAL' | 'COMPLICATIONS'
type ObjectiveComplexity = 'BASIC' | 'INTERMEDIATE' | 'ADVANCED'

// Create a proper mock for the ChatMockClient first
const mockChatMockClient = {
  client: {
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  },
}

// Mock the dependencies
jest.mock('@/lib/db')
jest.mock('@/lib/ai/chatmock-client', () => ({
  ChatMockClient: jest.fn(() => mockChatMockClient),
}))

// Create type-safe mock for Prisma
const mockPrisma = prisma as any

describe('ClinicalScenarioGenerator', () => {
  let generator: ClinicalScenarioGenerator

  beforeEach(() => {
    generator = new ClinicalScenarioGenerator()
    jest.clearAllMocks()
  })

  describe('generateScenario', () => {
    const mockObjective = {
      id: 'obj123',
      objective: 'Evaluate chest pain in emergency department',
      complexity: 'INTERMEDIATE' as ObjectiveComplexity,
      isHighYield: true,
      boardExamTags: ['USMLE-Step2-Cardiology', 'COMLEX-L2-Emergency-Medicine'],
      lecture: {
        title: 'Cardiovascular Emergencies',
      },
    }

    const mockGeneratedScenario = {
      scenarioType: 'DIAGNOSIS' as ScenarioType,
      difficulty: 'INTERMEDIATE',
      caseText: {
        chiefComplaint: '65-year-old man with chest pain',
        demographics: {
          age: 65,
          sex: 'M' as const,
          occupation: 'accountant',
        },
        history: {
          presenting: 'Sudden onset substernal chest pain',
          past: 'Hypertension, hyperlipidemia',
          medications: ['Lisinopril', 'Atorvastatin'],
          socialHistory: 'Former smoker',
        },
        physicalExam: {
          vitals: { BP: '150/90', HR: '95' },
          general: 'Anxious, diaphoretic',
          cardiovascular: 'Regular rhythm, no murmurs',
        },
        labs: {
          available: false,
          options: ['ECG', 'Troponin', 'CBC', 'CMP'],
        },
        questions: [
          {
            stage: 'initial',
            prompt: 'What is the first diagnostic test?',
            options: ['ECG', 'CT angiography', 'Chest X-ray', 'Blood cultures'],
            correctAnswer: 'ECG',
            reasoning: 'ECG is the first-line test for suspected acute coronary syndrome',
          },
        ],
      },
      boardExamTopic: 'Cardiovascular Emergencies',
    }

    it('should generate a new scenario successfully', async () => {
      // Mock database calls using spyOn
      jest.spyOn(mockPrisma.learningObjective, 'findUnique').mockResolvedValue(mockObjective as any)
      jest.spyOn(mockPrisma.clinicalScenario, 'findFirst').mockResolvedValue(null)

      const mockCreatedScenario = {
        id: 'scenario123',
        objectiveId: mockObjective.id,
        scenarioType: mockGeneratedScenario.scenarioType,
        difficulty: mockGeneratedScenario.difficulty,
        caseText: mockGeneratedScenario.caseText,
        boardExamTopic: mockGeneratedScenario.boardExamTopic,
        createdAt: new Date(),
      }

      jest
        .spyOn(mockPrisma.clinicalScenario, 'create')
        .mockResolvedValue(mockCreatedScenario as any)

      // Mock ChatMock client
      const mockChatMockResponse = {
        choices: [
          {
            message: {
              content: mockGeneratedScenario,
            },
          },
        ],
      }

      mockChatMockClient.client.chat.completions.create.mockResolvedValue(mockChatMockResponse)

      // Execute
      const result = await generator.generateScenario({
        objectiveId: mockObjective.id,
        difficulty: 'INTERMEDIATE',
      })

      // Assertions
      expect(result).toEqual(mockCreatedScenario)
      expect(mockPrisma.learningObjective.findUnique).toHaveBeenCalledWith({
        where: { id: mockObjective.id },
        include: { lecture: true },
      })
      expect(mockPrisma.clinicalScenario.findFirst).toHaveBeenCalledWith({
        where: {
          objectiveId: mockObjective.id,
          difficulty: 'INTERMEDIATE',
          createdAt: expect.objectContaining({
            gte: expect.any(Date),
          }),
        },
      })
      expect(mockPrisma.clinicalScenario.create).toHaveBeenCalledWith({
        data: {
          objectiveId: mockObjective.id,
          scenarioType: mockGeneratedScenario.scenarioType,
          difficulty: 'INTERMEDIATE',
          caseText: mockGeneratedScenario.caseText,
          boardExamTopic: mockGeneratedScenario.boardExamTopic,
        },
      })
    })

    it('should return existing scenario if found within cache period', async () => {
      const mockExistingScenario = {
        id: 'existing123',
        objectiveId: mockObjective.id,
        scenarioType: 'MANAGEMENT' as ScenarioType,
        difficulty: 'INTERMEDIATE',
        caseText: {},
        boardExamTopic: 'Cardiology',
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      }

      jest.spyOn(mockPrisma.learningObjective, 'findUnique').mockResolvedValue(mockObjective as any)
      jest
        .spyOn(mockPrisma.clinicalScenario, 'findFirst')
        .mockResolvedValue(mockExistingScenario as any)

      const result = await generator.generateScenario({
        objectiveId: mockObjective.id,
      })

      expect(result).toEqual(mockExistingScenario)
      expect(mockPrisma.clinicalScenario.create).not.toHaveBeenCalled()
    })

    it('should throw error if objective not found', async () => {
      jest.spyOn(mockPrisma.learningObjective, 'findUnique').mockResolvedValue(null)

      await expect(generator.generateScenario({ objectiveId: 'nonexistent' })).rejects.toThrow(
        'Learning objective not found: nonexistent',
      )
    })

    it('should map objective complexity to difficulty when not specified', async () => {
      const basicObjective = {
        ...mockObjective,
        complexity: 'BASIC' as ObjectiveComplexity,
      }

      jest
        .spyOn(mockPrisma.learningObjective, 'findUnique')
        .mockResolvedValue(basicObjective as any)
      jest.spyOn(mockPrisma.clinicalScenario, 'findFirst').mockResolvedValue(null)

      const mockCreatedScenario = {
        id: 'scenario456',
        objectiveId: basicObjective.id,
        scenarioType: 'DIAGNOSIS' as ScenarioType,
        difficulty: 'BASIC',
        caseText: {},
        boardExamTopic: 'Basic Medicine',
        createdAt: new Date(),
      }

      jest
        .spyOn(mockPrisma.clinicalScenario, 'create')
        .mockResolvedValue(mockCreatedScenario as any)

      // Mock ChatMock client
      const mockChatMockResponse = {
        choices: [
          {
            message: {
              content: {
                ...mockGeneratedScenario,
                difficulty: 'BASIC',
              },
            },
          },
        ],
      }

      mockChatMockClient.client.chat.completions.create.mockResolvedValue(mockChatMockResponse)

      await generator.generateScenario({ objectiveId: basicObjective.id })

      expect(mockPrisma.clinicalScenario.findFirst).toHaveBeenCalledWith({
        where: {
          objectiveId: basicObjective.id,
          difficulty: 'BASIC', // Should be mapped from BASIC complexity
          createdAt: expect.objectContaining({
            gte: expect.any(Date),
          }),
        },
      })
    })

    it('should handle AI generation failure gracefully', async () => {
      jest.spyOn(mockPrisma.learningObjective, 'findUnique').mockResolvedValue(mockObjective as any)
      jest.spyOn(mockPrisma.clinicalScenario, 'findFirst').mockResolvedValue(null)

      // Mock ChatMock client to throw error
      mockChatMockClient.client.chat.completions.create.mockRejectedValue(
        new Error('AI service unavailable'),
      )

      await expect(generator.generateScenario({ objectiveId: mockObjective.id })).rejects.toThrow(
        'AI scenario generation failed',
      )
    })
  })

  describe('findExistingScenario', () => {
    it('should find scenario within 30 days', async () => {
      const recentScenario = {
        id: 'recent123',
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
      }

      jest.spyOn(mockPrisma.clinicalScenario, 'findFirst').mockResolvedValue(recentScenario as any)

      // Access private method through prototype
      const result = await (generator as any).findExistingScenario('obj123', 'INTERMEDIATE')

      expect(result).toEqual(recentScenario)
      expect(mockPrisma.clinicalScenario.findFirst).toHaveBeenCalledWith({
        where: {
          objectiveId: 'obj123',
          difficulty: 'INTERMEDIATE',
          createdAt: expect.objectContaining({
            gte: expect.any(Date),
          }),
        },
      })
    })

    it('should return null for scenarios older than 30 days', async () => {
      const oldScenario = {
        id: 'old123',
        createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000), // 35 days ago
      }

      jest.spyOn(mockPrisma.clinicalScenario, 'findFirst').mockResolvedValue(null)

      const result = await (generator as any).findExistingScenario('obj123', 'INTERMEDIATE')

      expect(result).toBeNull()
    })
  })

  describe('mapComplexityToDifficulty', () => {
    it('should map BASIC complexity to BASIC difficulty', () => {
      const result = (generator as any).mapComplexityToDifficulty('BASIC')
      expect(result).toBe('BASIC')
    })

    it('should map INTERMEDIATE complexity to INTERMEDIATE difficulty', () => {
      const result = (generator as any).mapComplexityToDifficulty('INTERMEDIATE')
      expect(result).toBe('INTERMEDIATE')
    })

    it('should map ADVANCED complexity to ADVANCED difficulty', () => {
      const result = (generator as any).mapComplexityToDifficulty('ADVANCED')
      expect(result).toBe('ADVANCED')
    })

    it('should default to INTERMEDIATE for unknown complexity', () => {
      const result = (generator as any).mapComplexityToDifficulty('UNKNOWN' as any)
      expect(result).toBe('INTERMEDIATE')
    })
  })

  describe('buildSystemPrompt', () => {
    it('should include base prompt and difficulty-specific instructions', () => {
      const basicPrompt = (generator as any).buildSystemPrompt('BASIC')
      expect(basicPrompt).toContain('medical education expert')
      expect(basicPrompt).toContain('USMLE/COMLEX format')
      expect(basicPrompt).toContain('BASIC Difficulty:')
      expect(basicPrompt).toContain('Classic presentation')
      expect(basicPrompt).toContain('1-2 decision points maximum')

      const advancedPrompt = (generator as any).buildSystemPrompt('ADVANCED')
      expect(advancedPrompt).toContain('ADVANCED Difficulty:')
      expect(advancedPrompt).toContain('Complex presentation')
      expect(advancedPrompt).toContain('5+ decision points')
      expect(advancedPrompt).toContain('cognitive bias traps')
    })
  })

  describe('buildUserPrompt', () => {
    const mockObjective = {
      id: 'obj123',
      objective: 'Evaluate acute abdominal pain',
      complexity: 'INTERMEDIATE',
      isHighYield: true,
      boardExamTags: ['USMLE-Step2-GI', 'COMLEX-L2-Surgery'],
      lecture: {
        title: 'Abdominal Emergencies',
      },
    }

    it('should build comprehensive user prompt', () => {
      const prompt = (generator as any).buildUserPrompt(mockObjective)

      expect(prompt).toContain('Evaluate acute abdominal pain')
      expect(prompt).toContain('INTERMEDIATE')
      expect(prompt).toContain('High Yield: Yes')
      expect(prompt).toContain('USMLE-Step2-GI, COMLEX-L2-Surgery')
      expect(prompt).toContain('Abdominal Emergencies')
    })

    it('should handle objective without lecture', () => {
      const objectiveWithoutLecture = {
        ...mockObjective,
        lecture: null,
      }

      const prompt = (generator as any).buildUserPrompt(objectiveWithoutLecture)

      expect(prompt).toContain('Evaluate acute abdominal pain')
      expect(prompt).not.toContain('Lecture Context:')
    })

    it('should handle objective without board exam tags', () => {
      const objectiveWithoutTags = {
        ...mockObjective,
        boardExamTags: [],
      }

      const prompt = (generator as any).buildUserPrompt(objectiveWithoutTags)

      expect(prompt).toContain('Board Exam Topics: General medicine')
    })
  })

  describe('getDifficultySpecificInstructions', () => {
    it('should return appropriate instructions for BASIC difficulty', () => {
      const instructions = (generator as any).getDifficultySpecificInstructions('BASIC')

      expect(instructions).toContain('Classic presentation')
      expect(instructions).toContain('1-2 decision points maximum')
      expect(instructions).toContain('Avoid red herrings')
    })

    it('should return appropriate instructions for INTERMEDIATE difficulty', () => {
      const instructions = (generator as any).getDifficultySpecificInstructions('INTERMEDIATE')

      expect(instructions).toContain('Atypical presentation')
      expect(instructions).toContain('3-4 decision points')
      expect(instructions).toContain('May include 1-2 comorbidities')
    })

    it('should return appropriate instructions for ADVANCED difficulty', () => {
      const instructions = (generator as any).getDifficultySpecificInstructions('ADVANCED')

      expect(instructions).toContain('Complex presentation')
      expect(instructions).toContain('5+ decision points')
      expect(instructions).toContain('cognitive bias traps')
      expect(instructions).toContain('resource allocation decisions')
    })

    it('should return empty string for unknown difficulty', () => {
      const instructions = (generator as any).getDifficultySpecificInstructions('UNKNOWN')

      expect(instructions).toBe('')
    })
  })
})
