import { GoogleGenerativeAI } from '@google/generative-ai'
import { DEFAULT_POLICIES, PermanentError, retryService } from '../retry/retry-service'

interface EmbeddingResult {
  embedding: number[]
  error?: string
}

export class GeminiClient {
  private genAI: GoogleGenerativeAI
  private readonly model = 'gemini-embedding-001'

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required')
    }

    this.genAI = new GoogleGenerativeAI(apiKey)
  }

  /**
   * Generate embeddings for a single text chunk
   * Uses RETRIEVAL_DOCUMENT task type for optimal search/retrieval performance
   * Now includes production-ready retry logic with circuit breaker
   */
  async generateEmbedding(text: string): Promise<EmbeddingResult> {
    const result = await retryService.execute(
      async () => {
        const model = this.genAI.getGenerativeModel({ model: this.model })
        const result = await model.embedContent(text)
        return result.embedding.values
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
