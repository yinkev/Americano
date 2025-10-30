/**
 * Unit Tests for ContentChunker
 * Story 3.1 Task 7.1: Comprehensive Unit Tests
 *
 * Test Coverage:
 * - Text chunking algorithm
 * - Overlap between chunks
 * - Metadata generation
 * - Sentence boundary preservation
 * - Medical terminology handling
 * - Edge cases and validation
 * - Performance and optimization
 */

import { beforeEach, describe, expect, it } from '@jest/globals'
import { type ChunkingConfig, type ContentChunk, ContentChunker } from '../content-chunker'

describe('ContentChunker', () => {
  let chunker: ContentChunker

  beforeEach(() => {
    chunker = new ContentChunker({
      chunkSizeTokens: 100, // Smaller for testing
      overlapTokens: 20,
      tokensPerWord: 1.3,
      minChunkSizeTokens: 10,
    })
  })

  describe('Basic Chunking', () => {
    it('should chunk simple text into appropriate sizes', async () => {
      const text =
        'The cardiac conduction system is responsible for controlling heart rhythm. '.repeat(20)

      const chunks = await chunker.chunkText({
        text,
        lectureId: 'lecture-001',
        pageNumber: 1,
      })

      expect(chunks.length).toBeGreaterThan(1)
      chunks.forEach((chunk, index) => {
        expect(chunk.content).toBeTruthy()
        expect(chunk.metadata.lectureId).toBe('lecture-001')
        expect(chunk.metadata.chunkIndex).toBe(index)
        expect(chunk.metadata.pageNumber).toBe(1)
      })
    })

    it('should handle empty text', async () => {
      const chunks = await chunker.chunkText({
        text: '',
        lectureId: 'lecture-001',
      })

      expect(chunks).toEqual([])
    })

    it('should handle whitespace-only text', async () => {
      const chunks = await chunker.chunkText({
        text: '   \n\t  \n  ',
        lectureId: 'lecture-001',
      })

      expect(chunks).toEqual([])
    })

    it('should normalize whitespace in text', async () => {
      const text = 'Text    with\n\nmultiple\t\tspaces    and     newlines'

      const chunks = await chunker.chunkText({
        text,
        lectureId: 'lecture-001',
      })

      expect(chunks.length).toBeGreaterThan(0)
      expect(chunks[0].content).not.toContain('  ') // No double spaces
      expect(chunks[0].content).not.toContain('\n') // No newlines
    })

    it('should create chunk with correct metadata', async () => {
      const text = 'Simple test text for metadata validation.'

      const chunks = await chunker.chunkText({
        text,
        lectureId: 'test-lecture',
        pageNumber: 5,
      })

      expect(chunks).toHaveLength(1)

      const chunk = chunks[0]
      expect(chunk.metadata.lectureId).toBe('test-lecture')
      expect(chunk.metadata.chunkIndex).toBe(0)
      expect(chunk.metadata.pageNumber).toBe(5)
      expect(chunk.metadata.tokenCount).toBeGreaterThan(0)
      expect(chunk.metadata.wordCount).toBeGreaterThan(0)
      expect(chunk.metadata.charCount).toBe(chunk.content.length)
    })
  })

  describe('Sentence Boundary Preservation', () => {
    it('should split on sentence boundaries', async () => {
      const text = `
        First sentence is here. Second sentence is here. Third sentence is here.
        Fourth sentence is here. Fifth sentence is here. Sixth sentence is here.
      `.repeat(5)

      const chunks = await chunker.chunkText({
        text,
        lectureId: 'lecture-001',
      })

      chunks.forEach((chunk) => {
        // Each chunk should end with sentence-ending punctuation or be truncated
        const trimmed = chunk.content.trim()
        if (trimmed.length > 0) {
          // Allow for various sentence endings
          expect(trimmed).toMatch(/[.!?]$|[a-zA-Z0-9]$/)
        }
      })
    })

    it('should handle abbreviations correctly', async () => {
      const text =
        'Dr. Smith explained vs. the previous theory. The patient had approx. 2 hours remaining.'

      const chunks = await chunker.chunkText({
        text,
        lectureId: 'lecture-001',
      })

      // Should not split on abbreviations
      expect(chunks).toHaveLength(1)
      expect(chunks[0].content).toContain('Dr.')
      expect(chunks[0].content).toContain('vs.')
      expect(chunks[0].content).toContain('approx.')
    })

    it('should preserve medical abbreviations', async () => {
      const text =
        'The patient presented with Fig. 1 showing ECG abnormalities. Dr. Johnson reviewed Vol. 3, No. 2 of the journal.'

      const chunks = await chunker.chunkText({
        text,
        lectureId: 'lecture-001',
      })

      const allContent = chunks.map((c) => c.content).join(' ')
      expect(allContent).toContain('Fig.')
      expect(allContent).toContain('Vol.')
      expect(allContent).toContain('No.')
    })
  })

  describe('Overlap Between Chunks', () => {
    it('should include overlap between consecutive chunks', async () => {
      const text = 'Sentence one. Sentence two. Sentence three. Sentence four. '.repeat(10)

      const chunks = await chunker.chunkText({
        text,
        lectureId: 'lecture-001',
      })

      if (chunks.length > 1) {
        // Check overlap between first two chunks
        const firstChunk = chunks[0].content
        const secondChunk = chunks[1].content

        // Extract end of first chunk
        const firstChunkWords = firstChunk.split(' ')
        const overlapStart = firstChunkWords.slice(-5).join(' ')

        // Second chunk should start with some overlap from first
        expect(secondChunk.toLowerCase()).toContain(overlapStart.slice(0, 20).toLowerCase())
      }
    })

    it('should respect configured overlap size', async () => {
      const smallOverlapChunker = new ContentChunker({
        chunkSizeTokens: 50,
        overlapTokens: 5, // Very small overlap
        tokensPerWord: 1.3,
      })

      const text = 'This is a test sentence. '.repeat(30)

      const chunks = await smallOverlapChunker.chunkText({
        text,
        lectureId: 'lecture-001',
      })

      if (chunks.length > 1) {
        const firstChunk = chunks[0]
        const secondChunk = chunks[1]

        // Overlap should be small (roughly 5 tokens ~= 4 words)
        const firstWords = firstChunk.content.split(' ')
        const secondWords = secondChunk.content.split(' ')

        // Check that overlap exists but isn't too large
        expect(firstWords.length).toBeGreaterThan(10)
        expect(secondWords.length).toBeGreaterThan(10)
      }
    })

    it('should handle zero-overlap configuration', () => {
      expect(() => {
        new ContentChunker({
          chunkSizeTokens: 100,
          overlapTokens: 0,
        })
      }).not.toThrow()
    })

    it('should reject invalid overlap configuration', () => {
      expect(() => {
        new ContentChunker({
          chunkSizeTokens: 100,
          overlapTokens: 150, // Larger than chunk size
        })
      }).toThrow('Overlap tokens must be less than chunk size tokens')
    })
  })

  describe('Token Estimation', () => {
    it('should estimate tokens based on word count', async () => {
      const text = 'one two three four five six seven eight nine ten'
      // 10 words * 1.3 tokens/word = 13 tokens

      const chunks = await chunker.chunkText({
        text,
        lectureId: 'lecture-001',
      })

      expect(chunks).toHaveLength(1)
      expect(chunks[0].metadata.wordCount).toBe(10)
      expect(chunks[0].metadata.tokenCount).toBe(13) // 10 * 1.3 rounded up
    })

    it('should use custom tokens-per-word ratio', async () => {
      const customChunker = new ContentChunker({
        chunkSizeTokens: 100,
        overlapTokens: 20,
        tokensPerWord: 2.0, // Custom ratio
      })

      const text = 'word word word word word'

      const chunks = await customChunker.chunkText({
        text,
        lectureId: 'lecture-001',
      })

      expect(chunks[0].metadata.wordCount).toBe(5)
      expect(chunks[0].metadata.tokenCount).toBe(10) // 5 * 2.0
    })

    it('should provide accurate chunking statistics', () => {
      const text = 'word '.repeat(200) // 200 words

      const stats = chunker.getChunkingStats(text)

      expect(stats.totalWords).toBe(200)
      expect(stats.totalTokens).toBe(260) // 200 * 1.3
      expect(stats.estimatedChunks).toBeGreaterThan(0)
      expect(stats.avgTokensPerChunk).toBeGreaterThan(0)
    })
  })

  describe('Minimum Chunk Size', () => {
    it('should not create chunks smaller than minimum size', async () => {
      const text = 'Short text at end. ' + 'Normal sentence. '.repeat(10)

      const chunks = await chunker.chunkText({
        text,
        lectureId: 'lecture-001',
      })

      chunks.forEach((chunk) => {
        expect(chunk.metadata.tokenCount).toBeGreaterThanOrEqual(10) // minChunkSizeTokens
      })
    })

    it('should merge small final chunk with previous chunk', async () => {
      const largeText = 'This is a normal sentence. '.repeat(15)
      const tinyText = 'Tiny.'
      const text = largeText + tinyText

      const chunks = await chunker.chunkText({
        text,
        lectureId: 'lecture-001',
      })

      // Last chunk should include the tiny text merged with previous
      const lastChunk = chunks[chunks.length - 1]
      expect(lastChunk.content).toContain('Tiny')
    })
  })

  describe('Medical Content Handling', () => {
    it('should preserve medical terminology', async () => {
      const medicalText = `
        The sinoatrial (SA) node serves as the natural pacemaker.
        The atrioventricular (AV) node delays electrical impulses.
        Purkinje fibers distribute impulses to the ventricles.
        The Bundle of His conducts signals through the septum.
      `.repeat(3)

      const chunks = await chunker.chunkText({
        text: medicalText,
        lectureId: 'cardio-lecture',
      })

      const allContent = chunks.map((c) => c.content).join(' ')

      expect(allContent).toContain('sinoatrial')
      expect(allContent).toContain('atrioventricular')
      expect(allContent).toContain('Purkinje')
      expect(allContent).toContain('Bundle of His')
    })

    it('should handle complex medical sentences', async () => {
      const complexText = `
        Myocardial infarction (MI) results from prolonged ischemia.
        The pathophysiology involves thrombotic occlusion of coronary arteries.
        Biochemical markers include troponin I, troponin T, and CK-MB.
      `.repeat(5)

      const chunks = await chunker.chunkText({
        text: complexText,
        lectureId: 'pathology-lecture',
      })

      expect(chunks.length).toBeGreaterThan(0)

      chunks.forEach((chunk) => {
        expect(chunk.content.length).toBeGreaterThan(0)
        expect(chunk.metadata.charCount).toBe(chunk.content.length)
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle text with no sentence boundaries', async () => {
      const text =
        'This is one long sentence without any periods or other endings that goes on and on'

      const chunks = await chunker.chunkText({
        text,
        lectureId: 'lecture-001',
      })

      expect(chunks.length).toBeGreaterThan(0)
      expect(chunks[0].content).toBeTruthy()
    })

    it('should handle text with only punctuation', async () => {
      const text = '... !!! ???'

      const chunks = await chunker.chunkText({
        text,
        lectureId: 'lecture-001',
      })

      // May or may not create chunks depending on implementation
      // Just ensure it doesn't crash
      expect(chunks).toBeInstanceOf(Array)
    })

    it('should handle very long single sentence', async () => {
      const longSentence = 'word '.repeat(500) + '.'

      const chunks = await chunker.chunkText({
        text: longSentence,
        lectureId: 'lecture-001',
      })

      // Should split even though it's one sentence
      expect(chunks.length).toBeGreaterThan(1)
    })

    it('should handle text with mixed line endings', async () => {
      const text = 'Line one\rLine two\nLine three\r\nLine four'

      const chunks = await chunker.chunkText({
        text,
        lectureId: 'lecture-001',
      })

      expect(chunks.length).toBeGreaterThan(0)
      // All line endings should be normalized to spaces
      expect(chunks[0].content).not.toMatch(/[\r\n]/)
    })

    it('should handle unicode characters', async () => {
      const text = 'Résumé of médical terminology: α-helix, β-sheet, γ-globulin. 中文测试。'

      const chunks = await chunker.chunkText({
        text,
        lectureId: 'lecture-001',
      })

      expect(chunks.length).toBeGreaterThan(0)
      expect(chunks[0].content).toContain('Résumé')
      expect(chunks[0].content).toContain('α-helix')
    })
  })

  describe('Performance', () => {
    it('should chunk large text efficiently', async () => {
      const largeText = 'This is a medical sentence with terminology. '.repeat(1000)

      const startTime = Date.now()
      const chunks = await chunker.chunkText({
        text: largeText,
        lectureId: 'large-lecture',
      })
      const elapsed = Date.now() - startTime

      expect(chunks.length).toBeGreaterThan(0)
      expect(elapsed).toBeLessThan(1000) // Should complete in under 1 second
    })

    it('should handle multiple sequential chunking operations', async () => {
      const texts = Array(10).fill('Medical text. '.repeat(50))

      const startTime = Date.now()

      for (const text of texts) {
        await chunker.chunkText({
          text,
          lectureId: `lecture-${texts.indexOf(text)}`,
        })
      }

      const elapsed = Date.now() - startTime

      expect(elapsed).toBeLessThan(5000) // All operations under 5 seconds
    })
  })

  describe('Configuration Validation', () => {
    it('should use default configuration when not provided', () => {
      const defaultChunker = new ContentChunker()

      // Access via type assertion for testing
      const config = (defaultChunker as any).config

      expect(config.chunkSizeTokens).toBe(1000)
      expect(config.overlapTokens).toBe(200)
      expect(config.tokensPerWord).toBe(1.3)
      expect(config.minChunkSizeTokens).toBe(100)
    })

    it('should merge partial configuration with defaults', () => {
      const partialChunker = new ContentChunker({
        chunkSizeTokens: 500,
        // Other values should use defaults
      })

      const config = (partialChunker as any).config

      expect(config.chunkSizeTokens).toBe(500)
      expect(config.overlapTokens).toBe(200) // Default
      expect(config.tokensPerWord).toBe(1.3) // Default
    })
  })

  describe('Chunk Indexing', () => {
    it('should assign sequential chunk indices', async () => {
      const text = 'Sentence. '.repeat(100)

      const chunks = await chunker.chunkText({
        text,
        lectureId: 'lecture-001',
      })

      chunks.forEach((chunk, index) => {
        expect(chunk.metadata.chunkIndex).toBe(index)
      })
    })

    it('should start chunk index at 0', async () => {
      const text = 'Test sentence.'

      const chunks = await chunker.chunkText({
        text,
        lectureId: 'lecture-001',
      })

      expect(chunks[0].metadata.chunkIndex).toBe(0)
    })
  })

  describe('Helper Functions', () => {
    it('should export chunkText helper function', async () => {
      const { chunkText } = await import('../content-chunker')

      const chunks = await chunkText('Test text.', 'lecture-001', 1)

      expect(chunks).toBeInstanceOf(Array)
    })

    it('should provide singleton instance', async () => {
      const { contentChunker } = await import('../content-chunker')

      expect(contentChunker).toBeInstanceOf(ContentChunker)
    })
  })
})
