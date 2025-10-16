-- pgvector indexes for semantic search
-- These indexes must be created manually after migrations

-- IMPORTANT: Vector dimension configuration
-- ========================================
-- gemini-embedding-001 configured with output_dimensionality: 1536
-- This is within pgvector 0.8.1's 2000-dimension limit for HNSW/IVFFlat indexes
-- ✅ Indexes can be created immediately (no upgrade needed)

-- ContentChunk embedding index
-- Used for semantic search across lecture content
CREATE INDEX IF NOT EXISTS content_chunks_embedding_idx ON content_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Concept embedding index
-- Used for knowledge graph semantic similarity
CREATE INDEX IF NOT EXISTS concepts_embedding_idx ON concepts
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Notes:
-- - HNSW (Hierarchical Navigable Small World) is preferred for high-dimensional vectors
-- - m: number of connections per layer (16 is recommended default)
-- - ef_construction: size of dynamic candidate list during index build (64-200 range, higher = better quality but slower build)
-- - For search: SET hnsw.ef_search = 40-100 (higher = better recall but slower)
-- - Run after each migration: psql americano -f prisma/vector-indexes.sql
-- - Monitor pgvector releases: https://github.com/pgvector/pgvector/releases
