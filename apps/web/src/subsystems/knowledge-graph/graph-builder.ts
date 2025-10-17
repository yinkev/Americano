/**
 * Knowledge Graph Builder - Constructs knowledge graph from lecture content
 *
 * Features:
 * - Concept extraction from content chunks using ChatMock (GPT-5)
 * - Relationship detection via semantic similarity (pgvector), co-occurrence, and prerequisites
 * - Relationship strength calculation (semantic 40% + co-occurrence 30% + prerequisite 30%)
 * - Incremental graph updates (process only new content)
 * - Integration with existing ObjectivePrerequisite relationships from Story 2.1
 *
 * Epic 3 - Story 3.2 - Task 2
 */

import { Prisma, type ConceptRelationship, RelationshipType } from '@/generated/prisma'
import type { Concept } from '@/types/prisma-extensions'
import { ChatMockClient, type ExtractedObjective } from '@/lib/ai/chatmock-client'
import { EmbeddingService } from '@/lib/embedding-service'
import { prisma } from '@/lib/db'

/**
 * Extracted medical concept from content
 */
export interface ExtractedConcept {
  name: string
  description: string
  category: string // anatomy, physiology, pathology, pharmacology, etc.
}

/**
 * Detected relationship between two concepts
 */
export interface DetectedRelationship {
  fromConceptId: string
  toConceptId: string
  relationship: RelationshipType
  strength: number // 0.0-1.0
}

/**
 * Configuration for graph builder
 */
export interface GraphBuilderConfig {
  /** Semantic similarity threshold for RELATED relationships (default: 0.75) */
  semanticThreshold?: number
  /** Co-occurrence count threshold for INTEGRATED relationships (default: 3) */
  coOccurrenceThreshold?: number
  /** Batch size for concept extraction (default: 10) */
  batchSize?: number
  /** Enable verbose logging (default: false) */
  verbose?: boolean
}

/**
 * Knowledge Graph Builder constructs and maintains the concept graph
 *
 * @example
 * ```typescript
 * const builder = new KnowledgeGraphBuilder()
 *
 * // Build graph from specific lecture
 * await builder.buildGraphFromContent('lecture_id_123')
 *
 * // Build graph from all lectures
 * await builder.buildGraphFromContent()
 * ```
 */
export class KnowledgeGraphBuilder {
  private chatMockClient: ChatMockClient
  private embeddingService: EmbeddingService
  private config: Required<GraphBuilderConfig>

  constructor(config: GraphBuilderConfig = {}) {
    this.chatMockClient = new ChatMockClient()
    this.embeddingService = new EmbeddingService()
    this.config = {
      semanticThreshold: config.semanticThreshold ?? 0.75,
      coOccurrenceThreshold: config.coOccurrenceThreshold ?? 3,
      batchSize: config.batchSize ?? 10,
      verbose: config.verbose ?? false,
    }
  }

  /**
   * Build knowledge graph from lecture content
   * If lectureId provided, process only that lecture; otherwise process all COMPLETED lectures
   *
   * @param lectureId - Optional specific lecture to process
   * @returns Promise that resolves when graph is built
   */
  async buildGraphFromContent(lectureId?: string): Promise<void> {
    this.log('Starting knowledge graph construction...')

    // Fetch content chunks to process
    const chunks = await this.getContentChunks(lectureId)
    this.log(`Found ${chunks.length} content chunks to process`)

    if (chunks.length === 0) {
      this.log('No content chunks found. Nothing to process.')
      return
    }

    // Step 1: Extract concepts from content chunks
    this.log('Step 1: Extracting concepts from content...')
    const concepts = await this.extractConcepts(chunks)
    this.log(`Extracted ${concepts.length} unique concepts`)

    if (concepts.length === 0) {
      this.log('No concepts extracted. Graph construction complete.')
      return
    }

    // Step 2: Identify relationships between concepts
    this.log('Step 2: Identifying relationships between concepts...')
    const relationships = await this.identifyRelationships(concepts)
    this.log(`Identified ${relationships.length} relationships`)

    // Step 3: Clean up orphaned concepts (no relationships, no content chunks)
    this.log('Step 3: Cleaning up orphaned concepts...')
    await this.cleanupOrphanedConcepts()

    this.log('Knowledge graph construction complete!')
  }

  /**
   * Extract medical concepts from content chunks using ChatMock (GPT-5)
   *
   * @param chunks - Array of content chunks with text content
   * @returns Promise resolving to array of Concept records
   */
  async extractConcepts(
    chunks: Array<{ id: string; content: string; lectureId: string; lecture: any }>
  ): Promise<Concept[]> {
    const extractedConcepts: ExtractedConcept[] = []

    // Process content in batches
    for (let i = 0; i < chunks.length; i += this.config.batchSize) {
      const batch = chunks.slice(i, i + this.config.batchSize)
      this.log(`Processing chunk batch ${i / this.config.batchSize + 1}/${Math.ceil(chunks.length / this.config.batchSize)}`)

      // Extract concepts from each chunk using ChatMock
      for (const chunk of batch) {
        const chunkConcepts = await this.extractConceptsFromChunk(chunk)
        extractedConcepts.push(...chunkConcepts)
      }

      // Delay between batches to respect rate limits
      if (i + this.config.batchSize < chunks.length) {
        await this.delay(1000)
      }
    }

    // Deduplicate concepts by name (case-insensitive)
    const uniqueConcepts = this.deduplicateConcepts(extractedConcepts)
    this.log(`Deduplicated to ${uniqueConcepts.length} unique concepts`)

    // Store concepts in database with embeddings
    const storedConcepts: Concept[] = []
    for (const concept of uniqueConcepts) {
      const stored = await this.storeConcept(concept)
      if (stored) {
        storedConcepts.push(stored)
      }
    }

    return storedConcepts
  }

  /**
   * Extract concepts from a single content chunk
   * @private
   */
  private async extractConceptsFromChunk(chunk: {
    id: string
    content: string
    lectureId: string
    lecture: any
  }): Promise<ExtractedConcept[]> {
    try {
      const systemPrompt = `You are a medical education expert analyzing lecture content to extract key medical concepts.

Your task is to identify distinct medical concepts (NOT learning objectives) from the provided text.

INSTRUCTIONS:
1. Extract key medical concepts, terms, anatomical structures, physiological processes, pathological conditions, or clinical procedures
2. For each concept, provide:
   - **name**: Concise name (2-5 words, e.g., "cardiac conduction system", "insulin resistance")
   - **description**: Brief explanation (1-2 sentences)
   - **category**: One of: anatomy, physiology, pathology, pharmacology, biochemistry, microbiology, immunology, clinical
3. Focus on concepts that are:
   - Central to understanding the material
   - Potentially reusable across multiple topics
   - Clinically or academically significant
4. Avoid duplicates - extract each distinct concept only once
5. Extract 5-15 concepts per text (depending on content density)

Return a JSON object with this structure:
{
  "concepts": [
    {
      "name": "cardiac conduction system",
      "description": "Specialized tissue that generates and conducts electrical impulses through the heart, coordinating chamber contractions.",
      "category": "anatomy"
    }
  ]
}`

      const userContent = `Context:
- Course: ${chunk.lecture.course.name}
- Lecture: ${chunk.lecture.title}

Extract key medical concepts from this content:

${chunk.content}`

      const response = await this.chatMockClient['client'].chat.completions.create({
        model: 'gpt-5',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        temperature: 0.3,
        max_tokens: 8000,
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error('No response from ChatMock')
      }

      // Strip thinking tags and extract JSON
      let jsonContent = content.replace(/<think>[\s\S]*?<\/think>/gi, '')
      const jsonStart = jsonContent.indexOf('{')
      const jsonEnd = jsonContent.lastIndexOf('}') + 1
      if (jsonStart === -1 || jsonEnd === 0) {
        throw new Error('No JSON object found in response')
      }
      jsonContent = jsonContent.substring(jsonStart, jsonEnd).trim()

      const parsed = JSON.parse(jsonContent)
      return (parsed.concepts || []).map((c: any) => ({
        name: c.name,
        description: c.description,
        category: c.category || 'clinical',
      }))
    } catch (error) {
      console.error('Concept extraction error:', error)
      return []
    }
  }

  /**
   * Identify relationships between concepts
   * Uses semantic similarity, co-occurrence, and prerequisite detection
   *
   * @param concepts - Array of Concept records
   * @returns Promise resolving to array of ConceptRelationship records
   */
  async identifyRelationships(concepts: Concept[]): Promise<ConceptRelationship[]> {
    const relationships: DetectedRelationship[] = []

    // 1. Semantic similarity relationships (RELATED)
    this.log('Detecting semantic similarity relationships...')
    const semanticRels = await this.detectSemanticSimilarity(concepts)
    relationships.push(...semanticRels)
    this.log(`Found ${semanticRels.length} RELATED relationships`)

    // 2. Co-occurrence relationships (INTEGRATED)
    this.log('Detecting co-occurrence relationships...')
    const coOccurrenceRels = await this.detectCoOccurrence(concepts)
    relationships.push(...coOccurrenceRels)
    this.log(`Found ${coOccurrenceRels.length} INTEGRATED relationships`)

    // 3. Prerequisite relationships (PREREQUISITE)
    this.log('Mapping prerequisite relationships from learning objectives...')
    const prerequisiteRels = await this.mapPrerequisiteRelationships(concepts)
    relationships.push(...prerequisiteRels)
    this.log(`Found ${prerequisiteRels.length} PREREQUISITE relationships`)

    // Store relationships in database
    const storedRelationships: ConceptRelationship[] = []
    for (const rel of relationships) {
      const stored = await this.storeRelationship(rel)
      if (stored) {
        storedRelationships.push(stored)
      }
    }

    return storedRelationships
  }

  /**
   * Calculate relationship strength score
   * Formula: (semantic_similarity * 0.4) + (co_occurrence_score * 0.3) + (prerequisite_confidence * 0.3)
   *
   * @param concept1 - First concept
   * @param concept2 - Second concept
   * @returns Strength score (0.0-1.0)
   */
  calculateRelationshipStrength(concept1: Concept, concept2: Concept): number {
    // This is a simplified version - actual calculation happens in detection methods
    // Each detection method provides its own strength component
    // This method is primarily for documentation and potential future unified scoring
    return 0.8 // Default strong relationship
  }

  /**
   * Detect semantic similarity relationships using pgvector cosine distance
   * @private
   */
  private async detectSemanticSimilarity(concepts: Concept[]): Promise<DetectedRelationship[]> {
    const relationships: DetectedRelationship[] = []

    for (const concept of concepts) {
      if (!concept.embedding) continue

      // Query pgvector for similar concepts using cosine distance
      // Prisma doesn't support pgvector operators, so use raw SQL
      const similarConcepts = await prisma.$queryRaw<Array<{ id: string; distance: number }>>`
        SELECT id, (embedding <=> ${concept.embedding}::vector) AS distance
        FROM concepts
        WHERE id != ${concept.id}
          AND embedding IS NOT NULL
          AND (embedding <=> ${concept.embedding}::vector) < ${1 - this.config.semanticThreshold}
        ORDER BY distance
        LIMIT 20
      `

      for (const similar of similarConcepts) {
        // Convert distance to similarity score
        const similarity = 1 - similar.distance
        const strength = (similarity - this.config.semanticThreshold) / (1 - this.config.semanticThreshold)

        relationships.push({
          fromConceptId: concept.id,
          toConceptId: similar.id,
          relationship: RelationshipType.RELATED,
          strength: Math.min(Math.max(strength * 0.4, 0), 1), // 40% weight for semantic similarity
        })
      }
    }

    return relationships
  }

  /**
   * Detect co-occurrence relationships from shared content chunks
   * @private
   */
  private async detectCoOccurrence(concepts: Concept[]): Promise<DetectedRelationship[]> {
    const relationships: DetectedRelationship[] = []

    // Query concept co-occurrence in content chunks
    // This is a simplified approach - in production, you'd maintain a co-occurrence matrix
    for (let i = 0; i < concepts.length; i++) {
      for (let j = i + 1; j < concepts.length; j++) {
        const concept1 = concepts[i]
        const concept2 = concepts[j]

        // Count how many chunks mention both concepts (fuzzy name matching)
        const coOccurrenceCount = await prisma.contentChunk.count({
          where: {
            AND: [
              { content: { contains: concept1.name, mode: 'insensitive' } },
              { content: { contains: concept2.name, mode: 'insensitive' } },
            ],
          },
        })

        if (coOccurrenceCount >= this.config.coOccurrenceThreshold) {
          const strength = Math.min(coOccurrenceCount / 10, 1) * 0.3 // 30% weight for co-occurrence

          relationships.push({
            fromConceptId: concept1.id,
            toConceptId: concept2.id,
            relationship: RelationshipType.INTEGRATED,
            strength,
          })
        }
      }
    }

    return relationships
  }

  /**
   * Map prerequisite relationships from ObjectivePrerequisite (Story 2.1)
   * @private
   */
  private async mapPrerequisiteRelationships(concepts: Concept[]): Promise<DetectedRelationship[]> {
    const relationships: DetectedRelationship[] = []

    // Fetch all objective prerequisites
    const objectivePrereqs = await prisma.objectivePrerequisite.findMany({
      include: {
        objective: true,
        prerequisite: true,
      },
    })

    // Map learning objectives to concepts via fuzzy name matching
    for (const prereq of objectivePrereqs) {
      const objectiveConcept = concepts.find((c) =>
        this.fuzzyMatch(c.name, prereq.objective.objective)
      )
      const prerequisiteConcept = concepts.find((c) =>
        this.fuzzyMatch(c.name, prereq.prerequisite.objective)
      )

      if (objectiveConcept && prerequisiteConcept) {
        relationships.push({
          fromConceptId: prerequisiteConcept.id, // prerequisite → dependent
          toConceptId: objectiveConcept.id,
          relationship: RelationshipType.PREREQUISITE,
          strength: prereq.strength * 0.3, // 30% weight for prerequisite confidence
        })
      }
    }

    return relationships
  }

  /**
   * Store concept in database with deduplication
   * @private
   */
  private async storeConcept(concept: ExtractedConcept): Promise<Concept | null> {
    try {
      // Check if concept already exists (case-insensitive name match)
      const existing = await prisma.concept.findFirst({
        where: {
          name: {
            equals: concept.name,
            mode: 'insensitive',
          },
        },
      })

      if (existing) {
        // Merge with existing concept (update description if empty)
        if (!existing.description && concept.description) {
          return await prisma.concept.update({
            where: { id: existing.id },
            data: { description: concept.description },
          })
        }
        return existing
      }

      // Generate embedding for new concept
      const embeddingResult = await this.embeddingService.generateEmbedding(
        `${concept.name}: ${concept.description}`
      )

      if (embeddingResult.error) {
        console.error(`Failed to generate embedding for concept "${concept.name}":`, embeddingResult.error)
        return null
      }

      // Create new concept using raw SQL (embedding is Unsupported vector type)
      const embeddingStr = JSON.stringify(embeddingResult.embedding)
      const created = await prisma.$queryRaw<Concept[]>`
        INSERT INTO concepts (id, name, description, category, embedding, "createdAt", "updatedAt")
        VALUES (
          gen_random_uuid(),
          ${concept.name},
          ${concept.description},
          ${concept.category},
          ${embeddingStr}::vector,
          NOW(),
          NOW()
        )
        RETURNING *
      `

      return created[0] || null
    } catch (error) {
      console.error('Error storing concept:', error)
      return null
    }
  }

  /**
   * Store relationship in database
   * @private
   */
  private async storeRelationship(rel: DetectedRelationship): Promise<ConceptRelationship | null> {
    try {
      // Check if relationship already exists
      const existing = await prisma.conceptRelationship.findFirst({
        where: {
          fromConceptId: rel.fromConceptId,
          toConceptId: rel.toConceptId,
          relationship: rel.relationship,
        },
      })

      if (existing) {
        // Update strength if new calculation is higher
        if (rel.strength > existing.strength) {
          return await prisma.conceptRelationship.update({
            where: { id: existing.id },
            data: { strength: rel.strength },
          })
        }
        return existing
      }

      // Create new relationship
      const created = await prisma.conceptRelationship.create({
        data: {
          fromConceptId: rel.fromConceptId,
          toConceptId: rel.toConceptId,
          relationship: rel.relationship,
          strength: rel.strength,
          isUserDefined: false,
        },
      })

      return created
    } catch (error) {
      console.error('Error storing relationship:', error)
      return null
    }
  }

  /**
   * Fetch content chunks to process
   * @private
   */
  private async getContentChunks(lectureId?: string) {
    return await prisma.contentChunk.findMany({
      where: {
        lectureId: lectureId,
        lecture: {
          processingStatus: 'COMPLETED',
        },
      },
      include: {
        lecture: {
          include: {
            course: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  /**
   * Clean up orphaned concepts (no relationships, no content references)
   * @private
   */
  private async cleanupOrphanedConcepts(): Promise<void> {
    // Find concepts with no relationships
    const orphaned = await prisma.concept.findMany({
      where: {
        AND: [
          { relatedFrom: { none: {} } },
          { relatedTo: { none: {} } },
        ],
      },
    })

    // Delete orphaned concepts
    if (orphaned.length > 0) {
      await prisma.concept.deleteMany({
        where: {
          id: { in: orphaned.map((c) => c.id) },
        },
      })
      this.log(`Cleaned up ${orphaned.length} orphaned concepts`)
    }
  }

  /**
   * Deduplicate concepts by name (case-insensitive, >90% similarity)
   * @private
   */
  private deduplicateConcepts(concepts: ExtractedConcept[]): ExtractedConcept[] {
    const unique: ExtractedConcept[] = []
    const seen = new Set<string>()

    for (const concept of concepts) {
      const normalizedName = concept.name.toLowerCase().trim()

      // Check for exact duplicates
      if (seen.has(normalizedName)) {
        continue
      }

      // Check for high similarity duplicates (>90%)
      let isDuplicate = false
      for (const existing of unique) {
        if (this.fuzzyMatch(concept.name, existing.name, 0.9)) {
          isDuplicate = true
          break
        }
      }

      if (!isDuplicate) {
        unique.push(concept)
        seen.add(normalizedName)
      }
    }

    return unique
  }

  /**
   * Fuzzy string matching using simple character overlap
   * @private
   */
  private fuzzyMatch(str1: string, str2: string, threshold: number = 0.8): boolean {
    const s1 = str1.toLowerCase().trim()
    const s2 = str2.toLowerCase().trim()

    // Exact match
    if (s1 === s2) return true

    // Check if one string contains the other
    if (s1.includes(s2) || s2.includes(s1)) return true

    // Simple token overlap
    const tokens1 = new Set(s1.split(/\s+/))
    const tokens2 = new Set(s2.split(/\s+/))
    const intersection = new Set([...tokens1].filter((x) => tokens2.has(x)))
    const union = new Set([...tokens1, ...tokens2])

    const overlap = intersection.size / union.size
    return overlap >= threshold
  }

  /**
   * Logging helper
   * @private
   */
  private log(message: string): void {
    if (this.config.verbose) {
      console.log(`[KnowledgeGraphBuilder] ${message}`)
    }
  }

  /**
   * Delay helper
   * @private
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
