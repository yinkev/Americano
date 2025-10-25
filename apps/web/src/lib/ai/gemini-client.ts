// Using the unified Google Gen AI SDK per latest docs
// Model: text-embedding-004 with outputDimensionality = 1536
import { GoogleGenAI } from '@google/genai'
import { retryService, DEFAULT_POLICIES } from '../retry/retry-service'

interface EmbeddingResult {
  embedding: number[]
  error?: string
}

export class GeminiClient {
  private ai: GoogleGenAI
  private readonly model = 'gemini-embedding-001'

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required')
    }

    this.ai = new GoogleGenAI({ apiKey })
  }

  /**
   * Generate embeddings for a single text chunk
   * Uses RETRIEVAL_DOCUMENT task type for optimal search/retrieval performance
   * Now includes production-ready retry logic with circuit breaker
   */
  async generateEmbedding(text: string): Promise<EmbeddingResult> {
    const result = await retryService.execute(
      async () => {
        const response = await this.ai.models.embedContent({
          model: this.model,
          contents: text,
          config: {
            // Per ai.google.dev, gemini-embedding-001 defaults to 3072; we enforce 1536 for pgvector
            outputDimensionality: 1536,
            taskType: 'RETRIEVAL_DOCUMENT',
          } as any,
        })
        const values = (response as any).embedding?.values as number[] | undefined
        if (!values || !Array.isArray(values)) {
          throw new Error('Gemini embedContent returned no embedding values')
        }
        return values
      },
      DEFAULT_POLICIES.GEMINI_API,
      'gemini-embedding',
    )

    if (result.error) {
      console.error('Gemini embedding error after retries:', result.error.message)
      return {
        embedding: [],
        error: result.error.message,
      }
    }

    return {
      embedding: result.value!,
    }
  }

  /**
   * Generate embeddings for multiple text chunks with rate limiting
   */
  async generateBatchEmbeddings(texts: string[]): Promise<EmbeddingResult[]> {
    const results: EmbeddingResult[] = []
    const BATCH_SIZE = 100
    const DELAY_MS = 1000 // 1 second delay between batches

    // Process in batches
    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batch = texts.slice(i, i + BATCH_SIZE)

      // Generate embeddings for batch with retry logic
      const batchResults = await Promise.all(batch.map((text) => this.generateEmbedding(text)))

      results.push(...batchResults)

      // Delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < texts.length) {
        await this.delay(DELAY_MS)
      }
    }

    return results
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
