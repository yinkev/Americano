/**
 * Prisma Type Extensions
 *
 * Extends Prisma-generated types to include unsupported database types
 * that don't get TypeScript type generation.
 *
 * Why this file exists:
 * - Prisma's `Unsupported("vector(1536)")` type doesn't generate TS types
 * - We need type safety when accessing vector embedding properties
 * - This provides a clean extension pattern without modifying generated code
 */

import type {
  Concept as PrismaConcept,
  Lecture as PrismaLecture,
  LearningObjective as PrismaLearningObjective,
  ContentChunk as PrismaContentChunk
} from '@/generated/prisma'

/**
 * Extended Concept type with vector embedding support
 *
 * The `embedding` field uses pgvector's vector(1536) type which is:
 * - Unsupported by Prisma type generation
 * - Represented as number[] in TypeScript
 * - Can be null if embeddings haven't been generated yet
 */
export type Concept = PrismaConcept & {
  embedding?: number[] | null
}

/**
 * Extended Lecture type with vector embedding support
 */
export type Lecture = PrismaLecture & {
  embedding?: number[] | null
}

/**
 * Extended LearningObjective type with vector embedding support
 */
export type LearningObjective = PrismaLearningObjective & {
  embedding?: number[] | null
}

/**
 * Extended ContentChunk type with vector embedding support
 */
export type ContentChunk = PrismaContentChunk & {
  embedding?: number[] | null
}

/**
 * Type guard to check if a concept has an embedding
 */
export function hasEmbedding(concept: Concept): concept is Concept & { embedding: number[] } {
  return Array.isArray(concept.embedding) && concept.embedding.length > 0
}

/**
 * Type guard for lectures with embeddings
 */
export function lectureHasEmbedding(lecture: Lecture): lecture is Lecture & { embedding: number[] } {
  return Array.isArray(lecture.embedding) && lecture.embedding.length > 0
}
