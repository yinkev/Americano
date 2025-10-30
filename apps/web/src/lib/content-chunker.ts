/**
 * ContentChunker - Intelligent text chunking for semantic search
 *
 * Implements a sliding window approach with overlap to preserve context
 * across chunk boundaries. Optimized for medical educational content.
 *
 * Chunking Strategy:
 * - Base chunk size: ~1000 tokens (~750 words)
 * - Overlap: 200 tokens between chunks
 * - Sentence boundary preservation to avoid breaking medical concepts
 * - Token estimation: ~1.3 tokens per word (English average)
 *
 * Epic 3 - Story 3.1 - Task 1.4
 */

/**
 * Metadata for a content chunk
 */
export interface ChunkMetadata {
  /** Reference to parent lecture */
  lectureId: string
  /** Index position within lecture (0-based) */
  chunkIndex: number
  /** Page number in source document (if available) */
  pageNumber?: number
  /** Number of tokens (estimated) */
  tokenCount: number
  /** Number of words */
  wordCount: number
  /** Character count */
  charCount: number
}

/**
 * A chunk of content with metadata
 */
export interface ContentChunk {
  /** The text content */
  content: string
  /** Chunk metadata */
  metadata: ChunkMetadata
}

/**
 * Configuration for content chunking
 */
export interface ChunkingConfig {
  /** Target chunk size in tokens (default: 1000) */
  chunkSizeTokens?: number
  /** Overlap size in tokens (default: 200) */
  overlapTokens?: number
  /** Average tokens per word (default: 1.3 for English) */
  tokensPerWord?: number
  /** Minimum chunk size to avoid tiny fragments (default: 100 tokens) */
  minChunkSizeTokens?: number
}

/**
 * ContentChunker splits large documents into semantic chunks for embedding
 *
 * @example
 * ```typescript
 * const chunker = new ContentChunker()
 * const chunks = await chunker.chunkText({
 *   text: lectureContent,
 *   lectureId: 'lecture-123',
 *   pageNumber: 1
 * })
 * ```
 */
export class ContentChunker {
  private config: Required<ChunkingConfig>

  /**
   * Sentence boundary markers for intelligent splitting
   * Avoids breaking in the middle of medical abbreviations
   */
  private readonly sentenceEnders = /[.!?]+[\s\n]/g
  private readonly abbreviations = new Set([
    'Dr',
    'Mr',
    'Mrs',
    'Ms',
    'Prof',
    'vs',
    'etc',
    'i.e',
    'e.g',
    'approx',
    'Fig',
    'Figs',
    'Vol',
    'No',
    'Nos',
  ])

  constructor(config: ChunkingConfig = {}) {
    this.config = {
      chunkSizeTokens: config.chunkSizeTokens ?? 1000,
      overlapTokens: config.overlapTokens ?? 200,
      tokensPerWord: config.tokensPerWord ?? 1.3,
      minChunkSizeTokens: config.minChunkSizeTokens ?? 100,
    }

    // Validate config
    if (this.config.overlapTokens >= this.config.chunkSizeTokens) {
      throw new Error('Overlap tokens must be less than chunk size tokens')
    }
  }

  /**
   * Chunk text into semantic segments with overlap
   *
   * @param params - Chunking parameters
   * @param params.text - Text to chunk
   * @param params.lectureId - ID of parent lecture
   * @param params.pageNumber - Optional page number
   * @returns Array of content chunks with metadata
   *
   * @example
   * ```typescript
   * const chunks = await chunker.chunkText({
   *   text: 'The cardiac conduction system...',
   *   lectureId: 'lec-001',
   *   pageNumber: 5
   * })
   * console.log(`Created ${chunks.length} chunks`)
   * ```
   */
  async chunkText(params: {
    text: string
    lectureId: string
    pageNumber?: number
  }): Promise<ContentChunk[]> {
    const { text, lectureId, pageNumber } = params

    // Normalize whitespace
    const normalizedText = this.normalizeText(text)

    if (!normalizedText || normalizedText.trim().length === 0) {
      return []
    }

    // Split into sentences for intelligent chunking
    const sentences = this.splitIntoSentences(normalizedText)

    if (sentences.length === 0) {
      return []
    }

    const chunks: ContentChunk[] = []
    let currentChunk: string[] = []
    let currentTokenCount = 0
    let chunkIndex = 0

    // Build chunks by adding sentences until target size reached
    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i]
      const sentenceTokens = this.estimateTokens(sentence)

      // Check if adding this sentence exceeds chunk size
      if (
        currentTokenCount + sentenceTokens > this.config.chunkSizeTokens &&
        currentChunk.length > 0
      ) {
        // Finalize current chunk
        const chunkContent = currentChunk.join(' ')
        chunks.push(this.createChunk(chunkContent, lectureId, chunkIndex, pageNumber))

        // Start new chunk with overlap
        const overlapSentences = this.getOverlapSentences(currentChunk)
        currentChunk = [...overlapSentences]
        currentTokenCount = this.estimateTokens(currentChunk.join(' '))
        chunkIndex++
      }

      // Add sentence to current chunk
      currentChunk.push(sentence)
      currentTokenCount += sentenceTokens
    }

    // Add final chunk if not empty
    if (currentChunk.length > 0) {
      const chunkContent = currentChunk.join(' ')
      const tokens = this.estimateTokens(chunkContent)

      // Only add if meets minimum size requirement
      if (tokens >= this.config.minChunkSizeTokens) {
        chunks.push(this.createChunk(chunkContent, lectureId, chunkIndex, pageNumber))
      } else if (chunks.length > 0) {
        // If too small, append to previous chunk
        const prevChunk = chunks[chunks.length - 1]
        prevChunk.content += ' ' + chunkContent
        prevChunk.metadata.tokenCount = this.estimateTokens(prevChunk.content)
        prevChunk.metadata.wordCount = this.countWords(prevChunk.content)
        prevChunk.metadata.charCount = prevChunk.content.length
      }
    }

    return chunks
  }

  /**
   * Normalize text by standardizing whitespace
   *
   * @private
   */
  private normalizeText(text: string): string {
    return (
      text
        // Replace multiple whitespace with single space
        .replace(/\s+/g, ' ')
        // Remove leading/trailing whitespace
        .trim()
    )
  }

  /**
   * Split text into sentences while preserving medical abbreviations
   *
   * @private
   */
  private splitIntoSentences(text: string): string[] {
    const sentences: string[] = []
    let currentSentence = ''

    // Split on sentence boundaries
    const parts = text.split(this.sentenceEnders)

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i].trim()

      if (!part) continue

      currentSentence += part

      // Check if this is a real sentence boundary (not an abbreviation)
      const lastWord = currentSentence.split(/\s+/).pop()?.replace(/\.$/, '')

      if (lastWord && this.abbreviations.has(lastWord)) {
        // This is an abbreviation, continue sentence
        currentSentence += '. '
      } else {
        // Real sentence boundary
        if (currentSentence.trim()) {
          sentences.push(currentSentence.trim())
        }
        currentSentence = ''
      }
    }

    // Add any remaining text
    if (currentSentence.trim()) {
      sentences.push(currentSentence.trim())
    }

    return sentences
  }

  /**
   * Get sentences for overlap window
   *
   * @private
   */
  private getOverlapSentences(sentences: string[]): string[] {
    let overlapTokens = 0
    const overlapSentences: string[] = []

    // Work backwards from end of chunk
    for (let i = sentences.length - 1; i >= 0; i--) {
      const sentence = sentences[i]
      const tokens = this.estimateTokens(sentence)

      if (overlapTokens + tokens > this.config.overlapTokens) {
        break
      }

      overlapSentences.unshift(sentence)
      overlapTokens += tokens
    }

    return overlapSentences
  }

  /**
   * Create chunk object with metadata
   *
   * @private
   */
  private createChunk(
    content: string,
    lectureId: string,
    chunkIndex: number,
    pageNumber?: number,
  ): ContentChunk {
    const tokenCount = this.estimateTokens(content)
    const wordCount = this.countWords(content)
    const charCount = content.length

    return {
      content,
      metadata: {
        lectureId,
        chunkIndex,
        pageNumber,
        tokenCount,
        wordCount,
        charCount,
      },
    }
  }

  /**
   * Estimate token count from text
   * Uses tokens-per-word heuristic
   *
   * @private
   */
  private estimateTokens(text: string): number {
    const words = this.countWords(text)
    return Math.ceil(words * this.config.tokensPerWord)
  }

  /**
   * Count words in text
   *
   * @private
   */
  private countWords(text: string): number {
    return text.split(/\s+/).filter((word) => word.length > 0).length
  }

  /**
   * Get chunking statistics for a text
   * Useful for debugging and optimization
   *
   * @param text - Text to analyze
   * @returns Statistics about potential chunking
   */
  getChunkingStats(text: string): {
    estimatedChunks: number
    totalTokens: number
    totalWords: number
    avgTokensPerChunk: number
  } {
    const totalWords = this.countWords(text)
    const totalTokens = this.estimateTokens(text)

    // Calculate chunks with overlap
    const effectiveChunkSize = this.config.chunkSizeTokens - this.config.overlapTokens
    const estimatedChunks = Math.ceil(totalTokens / effectiveChunkSize)
    const avgTokensPerChunk = estimatedChunks > 0 ? totalTokens / estimatedChunks : 0

    return {
      estimatedChunks,
      totalTokens,
      totalWords,
      avgTokensPerChunk,
    }
  }
}

/**
 * Singleton instance for application-wide use
 */
export const contentChunker = new ContentChunker()

/**
 * Helper function to chunk text with default settings
 * Convenience wrapper around ContentChunker
 *
 * @param text - Text to chunk
 * @param lectureId - ID of parent lecture
 * @param pageNumber - Optional page number
 * @returns Array of content chunks
 *
 * @example
 * ```typescript
 * const chunks = await chunkText(lectureContent, 'lec-123', 1)
 * ```
 */
export async function chunkText(
  text: string,
  lectureId: string,
  pageNumber?: number,
): Promise<ContentChunk[]> {
  return contentChunker.chunkText({ text, lectureId, pageNumber })
}
