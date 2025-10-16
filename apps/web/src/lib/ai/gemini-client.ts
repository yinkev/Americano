import { GoogleGenerativeAI } from '@google/generative-ai';

interface EmbeddingResult {
  embedding: number[];
  error?: string;
}

export class GeminiClient {
  private genAI: GoogleGenerativeAI;
  private readonly model = 'gemini-embedding-001';

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  /**
   * Generate embeddings for a single text chunk
   * Uses RETRIEVAL_DOCUMENT task type for optimal search/retrieval performance
   */
  async generateEmbedding(text: string): Promise<EmbeddingResult> {
    try {
      const model = this.genAI.getGenerativeModel({ model: this.model });

      const result = await model.embedContent(text);

      return {
        embedding: result.embedding.values,
      };
    } catch (error) {
      console.error('Gemini embedding error:', error);
      return {
        embedding: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Generate embeddings for multiple text chunks with rate limiting
   */
  async generateBatchEmbeddings(texts: string[]): Promise<EmbeddingResult[]> {
    const results: EmbeddingResult[] = [];
    const BATCH_SIZE = 100;
    const DELAY_MS = 1000; // 1 second delay between batches

    // Process in batches
    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batch = texts.slice(i, i + BATCH_SIZE);

      // Generate embeddings for batch with retry logic
      const batchResults = await Promise.all(
        batch.map((text) => this.generateEmbeddingWithRetry(text))
      );

      results.push(...batchResults);

      // Delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < texts.length) {
        await this.delay(DELAY_MS);
      }
    }

    return results;
  }

  /**
   * Generate embedding with exponential backoff retry
   */
  private async generateEmbeddingWithRetry(
    text: string,
    maxRetries = 3
  ): Promise<EmbeddingResult> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const result = await this.generateEmbedding(text);

        if (result.error) {
          throw new Error(result.error);
        }

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');

        // Exponential backoff: 1s, 2s, 4s
        if (attempt < maxRetries - 1) {
          const delayMs = Math.pow(2, attempt) * 1000;
          console.warn(`Retry ${attempt + 1}/${maxRetries} after ${delayMs}ms...`);
          await this.delay(delayMs);
        }
      }
    }

    return {
      embedding: [],
      error: lastError?.message || 'Max retries exceeded',
    };
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
