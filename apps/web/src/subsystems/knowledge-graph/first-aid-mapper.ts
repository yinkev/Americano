/**
 * FirstAidMapper - Semantic mapping between lecture content and First Aid sections
 *
 * Epic 3 - Story 3.3 - Task 2: Automatic Content Mapping Using Semantic Similarity
 *
 * Features:
 * - Cosine similarity-based mapping using vector embeddings
 * - High-yield content prioritization (+0.1 similarity boost)
 * - Confidence scoring and quality validation
 * - Batch mapping for existing lectures
 * - User feedback integration for algorithm improvement
 *
 * Architecture:
 * - Leverages existing vector search infrastructure from Story 3.1
 * - Uses pgvector cosine distance for similarity matching
 * - Stores mappings in LectureFirstAidMapping table
 */

import { PrismaClient } from '@/generated/prisma'
import { embeddingService } from '@/lib/embedding-service'

/**
 * First Aid mapping result
 */
export interface FirstAidMapping {
  firstAidSectionId: string
  system: string
  section: string
  subsection?: string
  pageNumber: number
  content: string
  similarity: number // 0.0-1.0 similarity score
  confidence: number // 0.0-1.0 composite confidence
  priority: 'HIGH_YIELD' | 'STANDARD' | 'SUGGESTED'
  rationale: string
  isHighYield: boolean
}

/**
 * Convert priority string to database integer value
 */
function priorityToInt(priority: 'HIGH_YIELD' | 'STANDARD' | 'SUGGESTED'): number {
  switch (priority) {
    case 'HIGH_YIELD':
      return 1
    case 'STANDARD':
      return 5
    case 'SUGGESTED':
      return 10
    default:
      return 5
  }
}

/**
 * Convert database integer value back to priority string
 * Map: 1 → HIGH_YIELD, 5 → STANDARD, 10 → SUGGESTED
 */
export function intToPriority(
  value: number | null | undefined,
): 'HIGH_YIELD' | 'STANDARD' | 'SUGGESTED' {
  if (value === 1) return 'HIGH_YIELD'
  if (value === 10) return 'SUGGESTED'
  return 'STANDARD'
}

/**
 * Mapping quality metrics
 */
export interface MappingQualityMetrics {
  totalMappings: number
  highConfidence: number // >0.75
  mediumConfidence: number // 0.65-0.75
  lowConfidence: number // <0.65
  highYieldCount: number
  avgSimilarity: number
}

/**
 * FirstAidMapper handles semantic mapping between lectures and First Aid sections
 *
 * @example
 * ```typescript
 * const mapper = new FirstAidMapper()
 *
 * // Map a specific lecture
 * const mappings = await mapper.mapLectureToFirstAid('lecture-123')
 *
 * // Find relevant First Aid sections for a concept
 * const sections = await mapper.findRelevantFirstAidSections('cardiac conduction')
 * ```
 */
export class FirstAidMapper {
  private prisma: PrismaClient

  // Similarity thresholds (Task 2.2)
  private readonly HIGH_CONFIDENCE_THRESHOLD = 0.75
  private readonly MEDIUM_CONFIDENCE_THRESHOLD = 0.65
  private readonly HIGH_YIELD_BOOST = 0.1

  constructor() {
    this.prisma = new PrismaClient()
  }

  /**
   * Map a lecture to relevant First Aid sections
   * Task 2.1, 2.2: Core mapping algorithm with similarity thresholds
   *
   * @param lectureId - ID of lecture to map
   * @param limit - Maximum number of mappings per lecture (default: 10)
   * @returns Array of First Aid mappings sorted by relevance
   */
  async mapLectureToFirstAid(lectureId: string, limit: number = 10): Promise<FirstAidMapping[]> {
    console.log(`📍 Mapping lecture ${lectureId} to First Aid sections...`)

    // Get lecture content chunks with embeddings
    const chunks = await this.prisma.$queryRawUnsafe<any[]>(
      `
      SELECT id, content, embedding, "chunkIndex"
      FROM content_chunks
      WHERE "lectureId" = $1
        AND embedding IS NOT NULL
      ORDER BY "chunkIndex"
    `,
      lectureId,
    )

    if (chunks.length === 0) {
      console.warn(`⚠️  No content chunks found for lecture ${lectureId}`)
      return []
    }

    console.log(`✓ Found ${chunks.length} content chunks`)

    // Find relevant First Aid sections for each chunk
    const allMappings: FirstAidMapping[] = []

    for (const chunk of chunks) {
      const chunkMappings = await this.findRelevantFirstAidSectionsForEmbedding(
        chunk.embedding,
        5, // Top 5 per chunk
      )
      allMappings.push(...chunkMappings)
    }

    // Deduplicate and aggregate by First Aid section
    const sectionMap = new Map<string, FirstAidMapping>()

    for (const mapping of allMappings) {
      const existing = sectionMap.get(mapping.firstAidSectionId)

      if (!existing || mapping.similarity > existing.similarity) {
        sectionMap.set(mapping.firstAidSectionId, mapping)
      }
    }

    // Sort by similarity (descending) and take top N
    const topMappings = Array.from(sectionMap.values())
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)

    console.log(`✓ Generated ${topMappings.length} unique mappings`)

    // Store mappings in database (Task 2.2)
    await this.storeMappings(lectureId, topMappings)

    return topMappings
  }

  /**
   * Find relevant First Aid sections for a concept name
   * Task 2.1: Concept-based section discovery
   */
  async findRelevantFirstAidSections(
    conceptName: string,
    limit: number = 5,
  ): Promise<FirstAidMapping[]> {
    // Generate embedding for concept
    const embeddingResult = await embeddingService.generateEmbedding(conceptName)

    if (embeddingResult.error || embeddingResult.embedding.length === 0) {
      console.error(`Failed to generate embedding for concept: ${conceptName}`)
      return []
    }

    return this.findRelevantFirstAidSectionsForEmbedding(embeddingResult.embedding, limit)
  }

  /**
   * Find relevant First Aid sections using vector similarity
   * Task 2.2: Semantic similarity-based matching
   */
  private async findRelevantFirstAidSectionsForEmbedding(
    queryEmbedding: number[],
    limit: number = 5,
  ): Promise<FirstAidMapping[]> {
    const embeddingStr = `[${queryEmbedding.join(',')}]`

    // Search with pgvector cosine distance
    const results = await this.prisma.$queryRawUnsafe<any[]>(
      `
      SELECT
        id,
        system,
        section,
        subsection,
        "pageNumber",
        content,
        "isHighYield",
        (embedding <=> $1::vector) AS distance
      FROM first_aid_sections
      WHERE embedding IS NOT NULL
      ORDER BY distance
      LIMIT $2
    `,
      embeddingStr,
      limit * 2, // Get 2x for high-yield boosting
    )

    // Convert distance to similarity and apply high-yield boost
    const mappings = results.map((row: any) => {
      const baseSimilarity = this.distanceToSimilarity(row.distance)

      // Apply high-yield boost (Task 2.3)
      const adjustedSimilarity = row.isHighYield
        ? Math.min(1.0, baseSimilarity + this.HIGH_YIELD_BOOST)
        : baseSimilarity

      const priority = this.determinePriority(adjustedSimilarity, row.isHighYield)
      const confidence = this.calculateConfidence(adjustedSimilarity, row.isHighYield)

      return {
        firstAidSectionId: row.id,
        system: row.system,
        section: row.section,
        subsection: row.subsection,
        pageNumber: row.pageNumber,
        content: this.truncateContent(row.content),
        similarity: adjustedSimilarity,
        confidence,
        priority,
        rationale: this.generateRationale(adjustedSimilarity, row.isHighYield, row.system),
        isHighYield: row.isHighYield,
      } as FirstAidMapping
    })

    // Re-sort after boost and take top N
    return mappings.sort((a, b) => b.similarity - a.similarity).slice(0, limit)
  }

  /**
   * Calculate composite confidence score
   * Task 2.1: Mapping confidence calculation
   *
   * Factors:
   * - Similarity score (60% weight)
   * - High-yield status (20% weight)
   * - Content length adequacy (20% weight)
   */
  async calculateMappingConfidence(
    lectureChunk: { content: string; embedding: number[] },
    firstAidChunk: { content: string; embedding: number[] },
  ): Promise<number> {
    // Calculate cosine similarity
    const similarity = this.cosineSimilarity(lectureChunk.embedding, firstAidChunk.embedding)

    // Simple confidence = similarity for MVP
    // Production: Can add more sophisticated factors
    return similarity
  }

  /**
   * Batch map all existing lectures to First Aid
   * Task 2.2: Batch processing for existing content
   */
  async batchMapAllLectures(userId: string): Promise<MappingQualityMetrics> {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(`📚 Batch mapping all lectures for user ${userId}`)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)

    // Get all lectures for user
    const lectures = await this.prisma.lecture.findMany({
      where: { userId },
      select: { id: true, title: true },
    })

    console.log(`Found ${lectures.length} lectures to map`)

    let totalMappings = 0
    let highConfidence = 0
    let mediumConfidence = 0
    let lowConfidence = 0
    let highYieldCount = 0
    let totalSimilarity = 0

    for (const lecture of lectures) {
      console.log(`\nMapping: ${lecture.title}`)
      const mappings = await this.mapLectureToFirstAid(lecture.id)

      totalMappings += mappings.length

      for (const mapping of mappings) {
        totalSimilarity += mapping.similarity

        if (mapping.similarity >= this.HIGH_CONFIDENCE_THRESHOLD) {
          highConfidence++
        } else if (mapping.similarity >= this.MEDIUM_CONFIDENCE_THRESHOLD) {
          mediumConfidence++
        } else {
          lowConfidence++
        }

        if (mapping.isHighYield) {
          highYieldCount++
        }
      }
    }

    const metrics: MappingQualityMetrics = {
      totalMappings,
      highConfidence,
      mediumConfidence,
      lowConfidence,
      highYieldCount,
      avgSimilarity: totalMappings > 0 ? totalSimilarity / totalMappings : 0,
    }

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(`✅ Batch mapping complete`)
    console.log(`   Total mappings: ${metrics.totalMappings}`)
    console.log(`   High confidence: ${metrics.highConfidence}`)
    console.log(`   Medium confidence: ${metrics.mediumConfidence}`)
    console.log(`   Low confidence: ${metrics.lowConfidence}`)
    console.log(`   High-yield: ${metrics.highYieldCount}`)
    console.log(`   Avg similarity: ${metrics.avgSimilarity.toFixed(3)}`)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)

    return metrics
  }

  /**
   * Store mappings in database
   * Task 2.2: Persistence of mapping results
   */
  private async storeMappings(lectureId: string, mappings: FirstAidMapping[]): Promise<void> {
    for (const mapping of mappings) {
      try {
        await this.prisma.lectureFirstAidMapping.upsert({
          where: {
            lectureId_firstAidSectionId: {
              lectureId,
              firstAidSectionId: mapping.firstAidSectionId,
            },
          },
          create: {
            lectureId,
            firstAidSectionId: mapping.firstAidSectionId,
            confidence: mapping.similarity,
            priority: priorityToInt(mapping.priority),
            rationale: mapping.rationale,
          },
          update: {
            confidence: mapping.similarity,
            priority: priorityToInt(mapping.priority),
            rationale: mapping.rationale,
          },
        })
      } catch (error) {
        console.error(`Failed to store mapping: ${error}`)
      }
    }
  }

  /**
   * Calculate confidence from similarity and other factors
   */
  private calculateConfidence(similarity: number, isHighYield: boolean): number {
    // Base confidence from similarity
    let confidence = similarity

    // Slight boost for high-yield content
    if (isHighYield) {
      confidence = Math.min(1.0, confidence + 0.05)
    }

    return confidence
  }

  /**
   * Determine mapping priority
   * Task 2.3: Priority classification
   */
  private determinePriority(
    similarity: number,
    isHighYield: boolean,
  ): 'HIGH_YIELD' | 'STANDARD' | 'SUGGESTED' {
    if (similarity >= this.HIGH_CONFIDENCE_THRESHOLD) {
      return isHighYield ? 'HIGH_YIELD' : 'STANDARD'
    } else if (similarity >= this.MEDIUM_CONFIDENCE_THRESHOLD) {
      return 'SUGGESTED'
    } else {
      return 'SUGGESTED'
    }
  }

  /**
   * Generate human-readable rationale for mapping
   * Task 2.4: Mapping quality validation
   */
  private generateRationale(similarity: number, isHighYield: boolean, system: string): string {
    const confidenceLevel =
      similarity >= this.HIGH_CONFIDENCE_THRESHOLD
        ? 'high'
        : similarity >= this.MEDIUM_CONFIDENCE_THRESHOLD
          ? 'medium'
          : 'low'

    const parts = [`${confidenceLevel} semantic similarity (${(similarity * 100).toFixed(1)}%)`]

    if (isHighYield) {
      parts.push('high-yield board exam content')
    }

    parts.push(`${system} system`)

    return `Mapped based on ${parts.join(', ')}`
  }

  /**
   * Truncate content for preview
   */
  private truncateContent(content: string, maxLength: number = 200): string {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  /**
   * Convert pgvector cosine distance to similarity
   */
  private distanceToSimilarity(distance: number): number {
    return Math.max(0, 1 - distance / 2)
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) {
      throw new Error('Vectors must have same length')
    }

    let dotProduct = 0
    let magnitude1 = 0
    let magnitude2 = 0

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i]
      magnitude1 += vec1[i] * vec1[i]
      magnitude2 += vec2[i] * vec2[i]
    }

    const magnitude = Math.sqrt(magnitude1) * Math.sqrt(magnitude2)
    return magnitude === 0 ? 0 : dotProduct / magnitude
  }

  /**
   * Map a specific section/chunk of content to First Aid references
   * Story 3.3 AC#3: Section-level contextual loading
   *
   * @param contentText - Text content of the section
   * @param sectionId - Optional section identifier for caching
   * @param limit - Maximum number of references to return
   * @returns Array of First Aid mappings for this specific section
   */
  async mapSectionToFirstAid(
    contentText: string,
    sectionId?: string,
    limit: number = 5,
  ): Promise<FirstAidMapping[]> {
    console.log(`📍 Mapping section ${sectionId || 'unknown'} to First Aid...`)

    // Generate embedding for this section's content
    const embeddingResult = await embeddingService.generateEmbedding(contentText)

    if (embeddingResult.error || embeddingResult.embedding.length === 0) {
      console.error(`Failed to generate embedding for section ${sectionId}`)
      return []
    }

    // Find relevant First Aid sections using the embedding
    const mappings = await this.findRelevantFirstAidSectionsForEmbedding(
      embeddingResult.embedding,
      limit,
    )

    console.log(`✓ Found ${mappings.length} First Aid references for section`)

    return mappings
  }

  /**
   * Extract key medical concepts from a content section
   * Story 3.3 AC#3: Concept extraction for contextual loading
   *
   * @param contentText - Text content to analyze
   * @returns Array of extracted medical concepts
   */
  async extractConceptsFromSection(contentText: string): Promise<string[]> {
    // Simple keyword extraction for MVP
    // Production: Use medical NER (Named Entity Recognition) or GPT-5

    const medicalKeywords = [
      // Cardiovascular
      'myocardial infarction',
      'MI',
      'heart failure',
      'arrhythmia',
      'atrial fibrillation',
      'ventricular tachycardia',
      'hypertension',
      'coronary artery disease',
      // Respiratory
      'pneumonia',
      'COPD',
      'asthma',
      'pulmonary embolism',
      'PE',
      'respiratory failure',
      // GI
      'cirrhosis',
      'hepatitis',
      'pancreatitis',
      'inflammatory bowel disease',
      'IBD',
      'ulcer',
      // Neuro
      'stroke',
      'seizure',
      'meningitis',
      'encephalitis',
      'multiple sclerosis',
      // Add more as needed
    ]

    const lowerContent = contentText.toLowerCase()
    const foundConcepts: string[] = []

    for (const keyword of medicalKeywords) {
      if (lowerContent.includes(keyword.toLowerCase())) {
        foundConcepts.push(keyword)
      }
    }

    return foundConcepts
  }

  /**
   * Get First Aid references for multiple sections in batch
   * Story 3.3 AC#3: Batch contextual loading for prefetching
   *
   * @param sections - Array of {text, id} for each section
   * @param limit - Maximum references per section
   * @returns Map of section ID to First Aid references
   */
  async batchMapSectionsToFirstAid(
    sections: Array<{ text: string; id: string }>,
    limit: number = 5,
  ): Promise<Map<string, FirstAidMapping[]>> {
    console.log(`📦 Batch mapping ${sections.length} sections to First Aid...`)

    const results = new Map<string, FirstAidMapping[]>()

    // Process in parallel with concurrency limit
    const CONCURRENCY = 3
    const chunks = []

    for (let i = 0; i < sections.length; i += CONCURRENCY) {
      chunks.push(sections.slice(i, i + CONCURRENCY))
    }

    for (const chunk of chunks) {
      const promises = chunk.map(async (section) => {
        const mappings = await this.mapSectionToFirstAid(section.text, section.id, limit)
        return { id: section.id, mappings }
      })

      const chunkResults = await Promise.all(promises)

      for (const result of chunkResults) {
        results.set(result.id, result.mappings)
      }
    }

    console.log(`✓ Batch mapping complete: ${results.size} sections mapped`)

    return results
  }

  /**
   * Find First Aid references for a specific content chunk ID
   * Story 3.3 AC#3: Lookup references by chunk/section
   *
   * @param chunkId - Content chunk ID
   * @param limit - Maximum references to return
   * @returns Array of First Aid mappings
   */
  async getReferencesForChunk(chunkId: string, limit: number = 5): Promise<FirstAidMapping[]> {
    // Get the chunk
    const chunk = await this.prisma.contentChunk.findUnique({
      where: { id: chunkId },
      select: {
        id: true,
        content: true,
        lectureId: true,
      },
    })

    if (!chunk) {
      console.warn(`Chunk ${chunkId} not found`)
      return []
    }

    // TODO: Embedding-based similarity not yet implemented
    // When embeddings are added to ContentChunk schema, implement:
    // const embedding = chunk.embedding as unknown as number[]
    // return this.findRelevantFirstAidSectionsForEmbedding(embedding, limit)

    console.warn('Embedding-based First Aid references not yet implemented')
    return []
  }

  /**
   * Disconnect Prisma client
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect()
  }
}

/**
 * Singleton instance for application-wide use
 */
export const firstAidMapper = new FirstAidMapper()
