import { prisma } from '@/lib/db';
import { GeminiClient } from '@/lib/ai/gemini-client';

interface GenerationResult {
  success: boolean;
  embeddingsGenerated?: number;
  error?: string;
}

export class EmbeddingGenerator {
  private geminiClient: GeminiClient;

  constructor() {
    this.geminiClient = new GeminiClient();
  }

  /**
   * Generate embeddings for all content chunks in a lecture
   */
  async generateEmbeddings(lectureId: string): Promise<GenerationResult> {
    try {
      // Get all content chunks for this lecture
      const chunks = await prisma.contentChunk.findMany({
        where: { lectureId },
        orderBy: { chunkIndex: 'asc' },
      });

      if (!chunks || chunks.length === 0) {
        throw new Error('No content chunks found for lecture');
      }

      // Generate embeddings in batch
      const texts = chunks.map((chunk) => chunk.content);
      const embeddings = await this.geminiClient.generateBatchEmbeddings(texts);

      // Update chunks with embeddings using raw SQL (pgvector not fully supported in Prisma)
      let successCount = 0;
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const embeddingResult = embeddings[i];

        if (embeddingResult && embeddingResult.embedding && embeddingResult.embedding.length > 0) {
          // Convert embedding array to pgvector format: '[0.1, 0.2, ...]'
          const vectorString = `[${embeddingResult.embedding.join(',')}]`;

          // Update chunk with embedding vector using raw SQL
          await prisma.$executeRaw`
            UPDATE content_chunks
            SET embedding = ${vectorString}::vector
            WHERE id = ${chunk.id}
          `;
          successCount++;
        } else {
          console.warn(`Failed to generate embedding for chunk ${chunk.id}:`, embeddingResult?.error);
        }
      }

      return {
        success: true,
        embeddingsGenerated: successCount,
      };
    } catch (error) {
      console.error('Embedding generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
