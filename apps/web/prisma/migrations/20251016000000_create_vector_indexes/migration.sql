-- Create vector indexes for semantic search (Story 3.1 Task 1.2)
-- Note: embedding columns already exist in schema as vector(1536)
-- This migration only adds the required indexes for fast similarity search

-- Create IVFFlat indexes for vector similarity search
-- IVFFlat uses inverted file with flat compression (good for <1M vectors)
-- lists = 100 is recommended for datasets < 1M rows
-- vector_cosine_ops uses cosine distance (1 - cosine similarity)

-- DISABLED in dev: defer index creation until after dimension fix (1536-d)
-- The initial schema may use vector(3072), and ivfflat requires <= 2000 dims.
-- We create these indexes later via apps/web/prisma/vector-indexes.sql once
-- the dimension is corrected to 1536.
--
-- CREATE INDEX IF NOT EXISTS content_chunks_embedding_idx
-- ON content_chunks
-- USING ivfflat (embedding vector_cosine_ops)
-- WITH (lists = 100);

-- CREATE INDEX IF NOT EXISTS concepts_embedding_idx
-- ON concepts
-- USING ivfflat (embedding vector_cosine_ops)
-- WITH (lists = 100);

-- Note: After initial data load, consider running:
-- VACUUM ANALYZE content_chunks;
-- VACUUM ANALYZE concepts;
-- This optimizes the IVFFlat index performance
