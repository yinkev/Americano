/**
 * ConflictDetector - Semantic conflict detection algorithm
 *
 * Epic 3 - Story 3.4 - Tasks 1.1-1.3: Conflict Detection Algorithm
 *
 * Features:
 * - Semantic similarity analysis using vector embeddings (cosine similarity > 0.85)
 * - Contradiction pattern detection (medical, linguistic, numerical)
 * - GPT-5 powered analysis for complex contradictions
 * - Medical term normalization and context-aware detection
 * - Confidence scoring and severity classification
 *
 * Architecture:
 * - Uses existing SemanticSearchService for vector similarity
 * - Integrates with ChatMockClient for AI-powered contradiction analysis
 * - Leverages Prisma for conflict persistence
 * - Medical context awareness for dosage, contraindications, mechanisms
 */

import {
  type Concept,
  type ConflictSeverity,
  ConflictStatus,
  type ConflictType,
  type ContentChunk,
  PrismaClient,
} from '@/generated/prisma'
import { ChatMockClient } from '@/lib/ai/chatmock-client'
import { GeminiClient } from '@/lib/ai/gemini-client'
import { semanticSearchService } from '@/lib/semantic-search-service'

/**
 * Contradiction pattern detected in content
 */
export interface ContradictionPattern {
  /** Pattern type */
  type:
    | 'NEGATION'
    | 'OPPOSING_TERMS'
    | 'NUMERICAL_CONFLICT'
    | 'DOSAGE_CONFLICT'
    | 'TEMPORAL_CONFLICT'
  /** Pattern description */
  description: string
  /** Confidence score (0.0-1.0) */
  confidence: number
  /** Evidence from content */
  evidence: {
    sourceA: string
    sourceB: string
  }
}

/**
 * Medical term variant for normalization
 */
interface MedicalTermVariant {
  term: string
  variants: string[]
  type: 'SYNONYM' | 'ABBREVIATION' | 'ACRONYM' | 'LATIN' | 'COLLOQUIAL'
}

/**
 * Conflict analysis result from GPT-5
 */
export interface ConflictAnalysis {
  /** Is this a true conflict? */
  isConflict: boolean
  /** Conflict type classification */
  conflictType: ConflictType
  /** Severity level */
  severity: ConflictSeverity
  /** Human-readable explanation */
  explanation: string
  /** Recommended resolution */
  recommendation: string
  /** Confidence in analysis (0.0-1.0) */
  confidence: number
  /** Key differences identified */
  keyDifferences: string[]
}

/**
 * Detected conflict data structure
 */
export interface DetectedConflict {
  /** Concept ID (if applicable) */
  conceptId?: string
  /** Source A chunk ID */
  sourceAChunkId?: string
  /** Source B chunk ID */
  sourceBChunkId?: string
  /** Source A First Aid section ID */
  sourceAFirstAidId?: string
  /** Source B First Aid section ID */
  sourceBFirstAidId?: string
  /** Conflict type */
  conflictType: ConflictType
  /** Severity level */
  severity: ConflictSeverity
  /** Human-readable description */
  description: string
  /** Similarity score that triggered detection */
  similarity: number
  /** Confidence in conflict detection */
  confidence: number
}

/**
 * Parameters for conflict scanning
 */
export interface ScanParams {
  /** Concept ID to scan */
  conceptId?: string
  /** Specific source IDs to include (optional) */
  sourceIds?: string[]
  /** Minimum similarity threshold (default: 0.85) */
  minSimilarity?: number
  /** Maximum number of conflicts to detect (default: 100) */
  maxConflicts?: number
  /** Skip GPT-5 analysis (for faster scanning) */
  skipAIAnalysis?: boolean
}

/**
 * ConflictDetector - Main conflict detection service
 *
 * Task 1.1: Semantic similarity analysis between content chunks from different sources
 * Task 1.2: ConflictDetector service class with detection methods
 * Task 1.3: Contradiction pattern detection (medical, linguistic, numerical)
 *
 * @example
 * ```typescript
 * const detector = new ConflictDetector()
 *
 * // Detect conflicts for a specific concept
 * const conflicts = await detector.scanAllSources({ conceptId: 'concept-123' })
 *
 * // Analyze a single conflict pair
 * const analysis = await detector.analyzeConflict(conflict)
 *
 * // Direct comparison of two chunks
 * const conflict = await detector.detectConflicts(chunkA, chunkB)
 * ```
 */
export class ConflictDetector {
  private prisma: PrismaClient
  private chatmock: ChatMockClient
  private gemini: GeminiClient

  /**
   * Medical terminology normalization database
   * Maps terms to their common variants for accurate matching
   */
  private medicalTerms: Map<string, MedicalTermVariant> = new Map([
    // Cardiac terminology
    [
      'myocardial infarction',
      {
        term: 'myocardial infarction',
        variants: ['MI', 'heart attack', 'myocardial infarct', 'coronary occlusion'],
        type: 'SYNONYM',
      },
    ],
    [
      'heart failure',
      {
        term: 'heart failure',
        variants: ['HF', 'CHF', 'congestive heart failure', 'cardiac failure'],
        type: 'SYNONYM',
      },
    ],
    [
      'atrial fibrillation',
      {
        term: 'atrial fibrillation',
        variants: ['AFib', 'AF', 'atrial fib'],
        type: 'ABBREVIATION',
      },
    ],

    // Dosage-related
    [
      'aspirin',
      {
        term: 'aspirin',
        variants: ['ASA', 'acetylsalicylic acid'],
        type: 'SYNONYM',
      },
    ],

    // Common medical abbreviations
    [
      'blood pressure',
      {
        term: 'blood pressure',
        variants: ['BP'],
        type: 'ABBREVIATION',
      },
    ],
    [
      'diabetes mellitus',
      {
        term: 'diabetes mellitus',
        variants: ['DM', 'diabetes'],
        type: 'ABBREVIATION',
      },
    ],
    [
      'chronic kidney disease',
      {
        term: 'chronic kidney disease',
        variants: ['CKD'],
        type: 'ABBREVIATION',
      },
    ],
  ])

  /**
   * Contradiction patterns for linguistic analysis
   */
  private contradictionMarkers = {
    negation: [
      'not',
      'never',
      'no',
      'none',
      'neither',
      'nor',
      'without',
      'absence of',
      'lacks',
      'does not',
      'cannot',
      'contraindicated',
      'prohibited',
      'avoid',
    ],
    opposition: [
      'however',
      'but',
      'although',
      'despite',
      'in contrast',
      'conversely',
      'on the other hand',
      'whereas',
      'unlike',
      'contrary to',
      'opposite',
      'different from',
    ],
    uncertainty: ['may', 'might', 'possibly', 'rarely', 'sometimes', 'occasionally', 'uncommonly'],
    certainty: [
      'always',
      'must',
      'definitely',
      'certainly',
      'commonly',
      'typically',
      'usually',
      'frequently',
      'invariably',
    ],
  }

  constructor() {
    this.prisma = new PrismaClient()
    this.chatmock = new ChatMockClient()
    this.gemini = new GeminiClient()
  }

  /**
   * Disconnect Prisma client
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect()
  }

  /**
   * Task 1.2: Detect conflicts between two content chunks
   *
   * Uses semantic similarity (>0.85 threshold) + contradiction pattern detection
   * Optionally uses GPT-5 for complex medical contradiction analysis
   *
   * @param sourceA - First content chunk
   * @param sourceB - Second content chunk
   * @param useAIAnalysis - Whether to use GPT-5 for detailed analysis (default: true)
   * @returns Detected conflict or null if no conflict found
   */
  async detectConflicts(
    sourceA: ChunkWithEmbedding,
    sourceB: ChunkWithEmbedding,
    useAIAnalysis: boolean = true,
  ): Promise<DetectedConflict | null> {
    // Step 1: Calculate semantic similarity
    const similarity = await this.calculateSimilarity(sourceA, sourceB)

    // If content is not topically similar, skip (no conflict possible)
    if (similarity < 0.85) {
      return null
    }

    // Step 2: Normalize medical terminology
    const normalizedA = this.normalizeMedicalTerms(sourceA.content)
    const normalizedB = this.normalizeMedicalTerms(sourceB.content)

    // Step 3: Detect contradiction patterns
    const patterns = this.detectContradictionPatterns(normalizedA, normalizedB)

    // If no patterns detected, no conflict
    if (patterns.length === 0) {
      return null
    }

    // Step 4: Calculate initial confidence based on pattern strength
    const patternConfidence = Math.max(...patterns.map((p) => p.confidence))

    // Step 5: Use GPT-5 for detailed analysis if enabled
    let analysis: ConflictAnalysis | null = null

    if (useAIAnalysis) {
      analysis = await this.analyzeWithGPT5(sourceA.content, sourceB.content, patterns)

      // If GPT-5 says no conflict, trust it
      if (!analysis.isConflict) {
        return null
      }
    }

    // Step 6: Determine conflict type and severity
    const conflictType = analysis?.conflictType || this.inferConflictType(patterns)
    const severity = analysis?.severity || this.calculateSeverity(patterns, patternConfidence)

    // Step 7: Generate description
    const description = analysis?.explanation || this.generateDescription(patterns, similarity)

    return {
      sourceAChunkId: sourceA.id,
      sourceBChunkId: sourceB.id,
      conflictType,
      severity,
      description,
      similarity,
      confidence: analysis?.confidence || patternConfidence,
    }
  }

  /**
   * Task 1.2: Scan all sources for conflicts related to a concept
   *
   * Performs N×N comparison of content chunks (optimized with vector pre-filtering)
   * Background job endpoint - designed for <500ms per concept target
   *
   * @param params - Scan parameters
   * @returns Array of detected conflicts
   */
  async scanAllSources(params: ScanParams): Promise<DetectedConflict[]> {
    const {
      conceptId,
      sourceIds,
      minSimilarity = 0.85,
      maxConflicts = 100,
      skipAIAnalysis = false,
    } = params

    const conflicts: DetectedConflict[] = []

    // Fetch all content chunks for the concept
    let chunks: ChunkWithEmbedding[]

    if (conceptId) {
      // Get chunks related to concept (via lecture relationship)
      // TODO: Implement concept-to-chunk mapping
      chunks = await this.getChunksForConcept(conceptId)
    } else if (sourceIds && sourceIds.length > 0) {
      // Get chunks from specific sources
      chunks = (await this.prisma.contentChunk.findMany({
        where: {
          lecture: {
            courseId: { in: sourceIds },
          },
        },
        take: 1000, // Limit for performance
      })) as unknown as ChunkWithEmbedding[]
    } else {
      throw new Error('Either conceptId or sourceIds must be provided')
    }

    // Optimize: Use vector similarity pre-filtering to reduce N×N comparisons
    // Only compare chunks with similarity > minSimilarity threshold

    for (let i = 0; i < chunks.length && conflicts.length < maxConflicts; i++) {
      for (let j = i + 1; j < chunks.length && conflicts.length < maxConflicts; j++) {
        const chunkA = chunks[i]
        const chunkB = chunks[j]

        // Skip if same lecture (not a source conflict)
        if (chunkA.lectureId === chunkB.lectureId) {
          continue
        }

        try {
          const conflict = await this.detectConflicts(chunkA, chunkB, !skipAIAnalysis)

          if (conflict) {
            conflicts.push({
              ...conflict,
              conceptId: conceptId,
            })
          }
        } catch (error) {
          console.error(`Error detecting conflict between ${chunkA.id} and ${chunkB.id}:`, error)
          // Continue scanning even if one pair fails
        }
      }
    }

    return conflicts
  }

  /**
   * Task 1.2: Analyze existing conflict with detailed GPT-5 analysis
   *
   * Provides resolution recommendations and evidence-based guidance
   *
   * @param conflictId - ID of existing conflict to analyze
   * @returns Detailed conflict analysis with recommendations
   */
  async analyzeExistingConflict(conflictId: string): Promise<ConflictAnalysis> {
    // Fetch conflict from database
    const conflict = await this.prisma.conflict.findUnique({
      where: { id: conflictId },
      include: {
        sourceAChunk: true,
        sourceBChunk: true,
        sourceAFirstAid: true,
        sourceBFirstAid: true,
      },
    })

    if (!conflict) {
      throw new Error(`Conflict ${conflictId} not found`)
    }

    // Get content from sources
    const contentA = conflict.sourceAChunk?.content || conflict.sourceAFirstAid?.content || ''
    const contentB = conflict.sourceBChunk?.content || conflict.sourceBFirstAid?.content || ''

    if (!contentA || !contentB) {
      throw new Error('Conflict missing source content')
    }

    // Detect patterns
    const normalizedA = this.normalizeMedicalTerms(contentA)
    const normalizedB = this.normalizeMedicalTerms(contentB)
    const patterns = this.detectContradictionPatterns(normalizedA, normalizedB)

    // Analyze with GPT-5
    return await this.analyzeWithGPT5(contentA, contentB, patterns)
  }

  /**
   * Task 1.3: Detect contradiction patterns in normalized text
   *
   * Identifies:
   * - Negation patterns (is vs. is not)
   * - Opposing terms (increase vs. decrease)
   * - Numerical conflicts (different dosages, percentages)
   * - Temporal conflicts (acute vs. chronic)
   *
   * @param textA - Normalized text from source A
   * @param textB - Normalized text from source B
   * @returns Array of detected contradiction patterns
   */
  private detectContradictionPatterns(textA: string, textB: string): ContradictionPattern[] {
    const patterns: ContradictionPattern[] = []

    // Pattern 1: Negation detection
    const negationPattern = this.detectNegationPattern(textA, textB)
    if (negationPattern) patterns.push(negationPattern)

    // Pattern 2: Opposing terms
    const opposingPattern = this.detectOpposingTerms(textA, textB)
    if (opposingPattern) patterns.push(opposingPattern)

    // Pattern 3: Numerical conflicts
    const numericalPatterns = this.detectNumericalConflicts(textA, textB)
    patterns.push(...numericalPatterns)

    // Pattern 4: Dosage conflicts
    const dosagePattern = this.detectDosageConflicts(textA, textB)
    if (dosagePattern) patterns.push(dosagePattern)

    // Pattern 5: Certainty conflicts (always vs. rarely)
    const certaintyPattern = this.detectCertaintyConflicts(textA, textB)
    if (certaintyPattern) patterns.push(certaintyPattern)

    return patterns
  }

  /**
   * Detect negation patterns (affirmation vs. negation)
   */
  private detectNegationPattern(textA: string, textB: string): ContradictionPattern | null {
    const aLower = textA.toLowerCase()
    const bLower = textB.toLowerCase()

    const aHasNegation = this.contradictionMarkers.negation.some((marker) =>
      aLower.includes(marker),
    )
    const bHasNegation = this.contradictionMarkers.negation.some((marker) =>
      bLower.includes(marker),
    )

    // If one has negation and the other doesn't, potential conflict
    if (aHasNegation !== bHasNegation) {
      return {
        type: 'NEGATION',
        description: 'One source affirms while the other negates the same statement',
        confidence: 0.7,
        evidence: {
          sourceA: this.extractSentence(textA, this.contradictionMarkers.negation),
          sourceB: this.extractSentence(textB, this.contradictionMarkers.negation),
        },
      }
    }

    return null
  }

  /**
   * Detect opposing terms (increase/decrease, effective/ineffective)
   */
  private detectOpposingTerms(textA: string, textB: string): ContradictionPattern | null {
    const opposingPairs = [
      ['increase', 'decrease'],
      ['effective', 'ineffective'],
      ['safe', 'unsafe'],
      ['recommended', 'contraindicated'],
      ['beneficial', 'harmful'],
      ['elevated', 'reduced'],
      ['high', 'low'],
      ['positive', 'negative'],
    ]

    for (const [term1, term2] of opposingPairs) {
      const aHasTerm1 = textA.toLowerCase().includes(term1)
      const bHasTerm1 = textB.toLowerCase().includes(term1)
      const aHasTerm2 = textA.toLowerCase().includes(term2)
      const bHasTerm2 = textB.toLowerCase().includes(term2)

      // If A has term1 and B has term2 (or vice versa), conflict
      if ((aHasTerm1 && bHasTerm2) || (aHasTerm2 && bHasTerm1)) {
        return {
          type: 'OPPOSING_TERMS',
          description: `Sources use opposing terms: "${term1}" vs "${term2}"`,
          confidence: 0.8,
          evidence: {
            sourceA: this.extractSentence(textA, [term1, term2]),
            sourceB: this.extractSentence(textB, [term1, term2]),
          },
        }
      }
    }

    return null
  }

  /**
   * Detect numerical conflicts (different values for same measurement)
   */
  private detectNumericalConflicts(textA: string, textB: string): ContradictionPattern[] {
    const patterns: ContradictionPattern[] = []

    // Extract numbers with units
    const numberPattern = /(\d+(?:\.\d+)?)\s*(mg|g|ml|%|mmHg|mg\/dL|units?)/gi
    const numbersA = [...textA.matchAll(numberPattern)]
    const numbersB = [...textB.matchAll(numberPattern)]

    // Compare numbers with same units
    for (const [, valueA, unitA] of numbersA) {
      for (const [, valueB, unitB] of numbersB) {
        if (unitA.toLowerCase() === unitB.toLowerCase()) {
          const numA = parseFloat(valueA)
          const numB = parseFloat(valueB)

          // If values differ by >20%, potential conflict
          const percentDiff = Math.abs(numA - numB) / Math.max(numA, numB)

          if (percentDiff > 0.2) {
            patterns.push({
              type: 'NUMERICAL_CONFLICT',
              description: `Numerical discrepancy: ${valueA} ${unitA} vs ${valueB} ${unitB}`,
              confidence: Math.min(0.9, 0.5 + percentDiff),
              evidence: {
                sourceA: this.extractSentence(textA, [valueA]),
                sourceB: this.extractSentence(textB, [valueB]),
              },
            })
          }
        }
      }
    }

    return patterns
  }

  /**
   * Detect dosage conflicts (medication dosing discrepancies)
   */
  private detectDosageConflicts(textA: string, textB: string): ContradictionPattern | null {
    // Look for dosage patterns: drug name + number + unit
    const dosagePattern = /(\w+)\s+(\d+(?:\.\d+)?)\s*(mg|g|ml|units?)/gi
    const dosagesA = [...textA.matchAll(dosagePattern)]
    const dosagesB = [...textB.matchAll(dosagePattern)]

    for (const [, drugA, valueA, unitA] of dosagesA) {
      for (const [, drugB, valueB, unitB] of dosagesB) {
        // Same drug, same unit, but different dose
        if (
          drugA.toLowerCase() === drugB.toLowerCase() &&
          unitA.toLowerCase() === unitB.toLowerCase() &&
          parseFloat(valueA) !== parseFloat(valueB)
        ) {
          return {
            type: 'DOSAGE_CONFLICT',
            description: `Dosage discrepancy for ${drugA}: ${valueA}${unitA} vs ${valueB}${unitB}`,
            confidence: 0.9,
            evidence: {
              sourceA: this.extractSentence(textA, [drugA]),
              sourceB: this.extractSentence(textB, [drugB]),
            },
          }
        }
      }
    }

    return null
  }

  /**
   * Detect certainty conflicts (always vs. rarely, common vs. uncommon)
   */
  private detectCertaintyConflicts(textA: string, textB: string): ContradictionPattern | null {
    const aLower = textA.toLowerCase()
    const bLower = textB.toLowerCase()

    const aHasCertainty = this.contradictionMarkers.certainty.some((m) => aLower.includes(m))
    const aHasUncertainty = this.contradictionMarkers.uncertainty.some((m) => aLower.includes(m))
    const bHasCertainty = this.contradictionMarkers.certainty.some((m) => bLower.includes(m))
    const bHasUncertainty = this.contradictionMarkers.uncertainty.some((m) => bLower.includes(m))

    // If one expresses certainty and the other uncertainty, conflict
    if ((aHasCertainty && bHasUncertainty) || (aHasUncertainty && bHasCertainty)) {
      return {
        type: 'OPPOSING_TERMS',
        description: 'Sources disagree on certainty/frequency of occurrence',
        confidence: 0.6,
        evidence: {
          sourceA: this.extractSentence(textA, [
            ...this.contradictionMarkers.certainty,
            ...this.contradictionMarkers.uncertainty,
          ]),
          sourceB: this.extractSentence(textB, [
            ...this.contradictionMarkers.certainty,
            ...this.contradictionMarkers.uncertainty,
          ]),
        },
      }
    }

    return null
  }

  /**
   * Normalize medical terminology for consistent comparison
   * Maps variants to canonical terms
   */
  private normalizeMedicalTerms(text: string): string {
    let normalized = text

    for (const [canonical, variant] of this.medicalTerms) {
      for (const v of variant.variants) {
        // Case-insensitive replacement
        const regex = new RegExp(`\\b${v}\\b`, 'gi')
        normalized = normalized.replace(regex, canonical)
      }
    }

    return normalized
  }

  /**
   * Calculate semantic similarity between two chunks using embeddings
   */
  private async calculateSimilarity(
    chunkA: ChunkWithEmbedding,
    chunkB: ChunkWithEmbedding,
  ): Promise<number> {
    // If both have embeddings, use cosine similarity
    if (chunkA.embedding && chunkB.embedding) {
      return this.cosineSimilarity(
        chunkA.embedding as unknown as number[],
        chunkB.embedding as unknown as number[],
      )
    }

    // If no embeddings, generate them
    const [embeddingA, embeddingB] = await Promise.all([
      chunkA.embedding
        ? Promise.resolve({ embedding: chunkA.embedding as unknown as number[], error: undefined })
        : this.gemini.generateEmbedding(chunkA.content),
      chunkB.embedding
        ? Promise.resolve({ embedding: chunkB.embedding as unknown as number[], error: undefined })
        : this.gemini.generateEmbedding(chunkB.content),
    ])

    if (embeddingA.error || embeddingB.error) {
      throw new Error('Failed to generate embeddings for similarity calculation')
    }

    return this.cosineSimilarity(embeddingA.embedding, embeddingB.embedding)
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have same dimension')
    }

    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i]
      normA += vecA[i] * vecA[i]
      normB += vecB[i] * vecB[i]
    }

    normA = Math.sqrt(normA)
    normB = Math.sqrt(normB)

    if (normA === 0 || normB === 0) {
      return 0
    }

    return dotProduct / (normA * normB)
  }

  /**
   * Analyze conflict with GPT-5 for detailed contradiction detection
   */
  private async analyzeWithGPT5(
    contentA: string,
    contentB: string,
    patterns: ContradictionPattern[],
  ): Promise<ConflictAnalysis> {
    const systemPrompt = `You are a medical education expert analyzing potential conflicts between medical educational sources.

Your task is to determine if two pieces of medical content contradict each other, and if so, classify the conflict.

IMPORTANT MEDICAL CONTEXT:
- Some apparent differences are NOT conflicts:
  * Different levels of detail (one source simplified, another comprehensive)
  * Context-dependent recommendations (e.g., aspirin 81mg prophylaxis vs 325mg acute MI)
  * Updates to medical knowledge (newer guidelines superseding older ones)
  * Different patient populations or clinical scenarios

- True conflicts include:
  * Contradictory dosage recommendations for the same indication
  * Opposing statements about contraindications
  * Conflicting mechanisms of action
  * Different diagnostic criteria for same condition
  * Contradictory treatment protocols

Analyze the following two content chunks and detected patterns, then respond with JSON:

{
  "isConflict": true/false,
  "conflictType": "DOSAGE" | "CONTRAINDICATION" | "MECHANISM" | "TREATMENT" | "DIAGNOSIS" | "PROGNOSIS" | "OTHER",
  "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "explanation": "Clear explanation of the conflict or why it's not a true conflict",
  "recommendation": "Which source to prefer and why, or suggest further investigation",
  "confidence": 0.0-1.0,
  "keyDifferences": ["difference 1", "difference 2", ...]
}

Severity guidelines:
- CRITICAL: Life-threatening contradictions (e.g., contradictory emergency drug dosages)
- HIGH: Significant clinical impact (e.g., major contraindication disagreement)
- MEDIUM: Important but not immediately dangerous (e.g., conflicting non-urgent treatment)
- LOW: Minor discrepancies with limited clinical impact`

    const userContent = `Content A:
${contentA}

Content B:
${contentB}

Detected patterns:
${patterns.map((p) => `- ${p.type}: ${p.description} (confidence: ${p.confidence})`).join('\n')}`

    try {
      const response = await this.chatmock.createChatCompletion({
        model: 'gpt-5',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        temperature: 0.3, // Low for consistency
        max_tokens: 16000,
      })

      const content = response.choices[0]?.message?.content

      if (!content) {
        throw new Error('No response from GPT-5')
      }

      // Extract JSON (strip thinking tags if present)
      let jsonContent = content.replace(/<think>[\s\S]*?<\/think>/gi, '')
      const jsonStart = jsonContent.indexOf('{')
      const jsonEnd = jsonContent.lastIndexOf('}') + 1

      if (jsonStart === -1 || jsonEnd === 0) {
        throw new Error('No JSON in GPT-5 response')
      }

      jsonContent = jsonContent.substring(jsonStart, jsonEnd)
      const parsed = JSON.parse(jsonContent)

      return {
        isConflict: parsed.isConflict,
        conflictType: parsed.conflictType as ConflictType,
        severity: parsed.severity as ConflictSeverity,
        explanation: parsed.explanation,
        recommendation: parsed.recommendation,
        confidence: parsed.confidence,
        keyDifferences: parsed.keyDifferences || [],
      }
    } catch (error) {
      console.error('GPT-5 analysis error:', error)

      // Fallback to pattern-based analysis
      return {
        isConflict: patterns.length > 0,
        conflictType: this.inferConflictType(patterns),
        severity: this.calculateSeverity(patterns, 0.5),
        explanation: `Pattern-based detection (GPT-5 unavailable): ${patterns.map((p) => p.description).join('; ')}`,
        recommendation: 'Requires manual review - AI analysis failed',
        confidence: 0.5,
        keyDifferences: patterns.map((p) => p.description),
      }
    }
  }

  /**
   * Infer conflict type from detected patterns
   */
  private inferConflictType(patterns: ContradictionPattern[]): ConflictType {
    for (const pattern of patterns) {
      if (pattern.type === 'DOSAGE_CONFLICT') return 'DOSAGE'
      if (pattern.type === 'NUMERICAL_CONFLICT') return 'DOSAGE'
    }

    // Default to OTHER
    return 'OTHER'
  }

  /**
   * Calculate severity based on patterns and confidence
   */
  private calculateSeverity(
    patterns: ContradictionPattern[],
    confidence: number,
  ): ConflictSeverity {
    // Dosage conflicts are always at least MEDIUM severity
    const hasDosageConflict = patterns.some(
      (p) => p.type === 'DOSAGE_CONFLICT' || p.type === 'NUMERICAL_CONFLICT',
    )

    if (hasDosageConflict && confidence > 0.8) {
      return 'HIGH'
    }

    if (hasDosageConflict || confidence > 0.7) {
      return 'MEDIUM'
    }

    return 'LOW'
  }

  /**
   * Generate human-readable description of conflict
   */
  private generateDescription(patterns: ContradictionPattern[], similarity: number): string {
    const descriptions = patterns.map((p) => p.description)

    return `Conflict detected (${(similarity * 100).toFixed(1)}% similarity): ${descriptions.join('; ')}`
  }

  /**
   * Extract sentence containing keywords
   */
  private extractSentence(text: string, keywords: string[]): string {
    const sentences = text.split(/[.!?]+/)

    for (const sentence of sentences) {
      const lowerSentence = sentence.toLowerCase()
      if (keywords.some((kw) => lowerSentence.includes(kw.toLowerCase()))) {
        return sentence.trim()
      }
    }

    // Return first 100 characters if no match
    return text.substring(0, 100) + '...'
  }

  /**
   * Get chunks for a specific concept
   *
   * Implementation: Queries ContentChunk table for chunks whose content
   * semantically relates to the concept via vector similarity search.
   *
   * Strategy:
   * 1. Get concept embedding from Concept table
   * 2. Use pgvector similarity search to find related chunks
   * 3. Return chunks ordered by similarity (threshold: 0.7)
   *
   * @param conceptId - Concept ID to find related chunks for
   * @returns Array of related ContentChunk objects with relations
   */
  private async getChunksForConcept(conceptId: string): Promise<ChunkWithEmbedding[]> {
    // Fetch concept with its embedding
    const concept = (await this.prisma.concept.findUnique({
      where: { id: conceptId },
    })) as ConceptWithEmbedding | null

    if (!concept || !concept.embedding) {
      console.warn(`Concept ${conceptId} not found or has no embedding`)
      return []
    }

    // Use pgvector similarity search to find related chunks
    // Query uses vector similarity operator <=> (L2 distance)
    // Lower distance = higher similarity
    const chunks = await this.prisma.$queryRaw<ChunkWithEmbedding[]>`
      SELECT
        id,
        "lectureId",
        content,
        embedding,
        "chunkIndex",
        "pageNumber",
        "createdAt"
      FROM content_chunks
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> ${concept.embedding}::vector
      LIMIT 100
    `

    // Filter by similarity threshold (cosine similarity > 0.7)
    // Convert L2 distance to cosine similarity for consistent thresholding
    const filteredChunks: ChunkWithEmbedding[] = []
    for (const chunk of chunks) {
      if (chunk.embedding) {
        const similarity = this.cosineSimilarity(
          concept.embedding as unknown as number[],
          chunk.embedding as unknown as number[],
        )

        // Only include chunks with strong semantic relationship
        if (similarity > 0.7) {
          filteredChunks.push(chunk)
        }
      }
    }

    return filteredChunks
  }

  /**
   * Compare two text statements for conflicts
   * Lightweight wrapper for API compatibility
   *
   * Used by: /api/first-aid/conflicts/detect route
   *
   * @param textA - First text statement
   * @param textB - Second text statement
   * @param options - Optional configuration
   * @returns Conflict comparison result
   */
  async compareStatements(
    textA: string,
    textB: string,
    options?: {
      sourceAId?: string
      sourceBId?: string
      conceptId?: string
      useAI?: boolean
    },
  ): Promise<{
    isConflict: boolean
    severity: ConflictSeverity | null
    contradictionPattern: string | null
    explanation: string | null
    confidence: number
  }> {
    // Call existing detectConflicts with minimal source objects
    const result = await this.detectConflicts(
      {
        id: options?.sourceAId || 'source-a',
        content: textA,
        lectureId: options?.sourceAId || 'unknown',
        chunkIndex: 0,
        pageNumber: null,
        embedding: null,
        createdAt: new Date(),
      } as ChunkWithEmbedding,
      {
        id: options?.sourceBId || 'source-b',
        content: textB,
        lectureId: options?.sourceBId || 'unknown',
        chunkIndex: 0,
        pageNumber: null,
        embedding: null,
        createdAt: new Date(),
      } as ChunkWithEmbedding,
      options?.useAI ?? true,
    )

    // If no conflict detected, return null values
    if (!result) {
      return {
        isConflict: false,
        severity: null,
        contradictionPattern: null,
        explanation: null,
        confidence: 0,
      }
    }

    // Return formatted result
    return {
      isConflict: true,
      severity: result.severity,
      contradictionPattern: result.conflictType,
      explanation: result.description,
      confidence: result.confidence,
    }
  }
}

/**
 * Singleton instance
 */
export const conflictDetector = new ConflictDetector()

/**
 * Cleanup handler
 */
if (typeof process !== 'undefined') {
  process.on('beforeExit', async () => {
    await conflictDetector.disconnect()
  })
}
type ChunkWithEmbedding = ContentChunk & { embedding?: number[] | null }
type ConceptWithEmbedding = Concept & { embedding?: number[] | null }
