-- Fix vector dimensions from 3072 to 1536 for pgvector ivfflat index compatibility
-- Issue: pgvector ivfflat indexes support max 2000 dimensions
-- Solution: Reduce from 3072 to 1536 (Gemini embedding output_dimensionality: 1536)

-- Note: This will delete existing embedding data. In production, you would:
-- 1. Create new columns with correct dimensions
-- 2. Re-generate embeddings
-- 3. Drop old columns
-- For development, we can safely drop and recreate

-- content_chunks table
ALTER TABLE content_chunks
ALTER COLUMN embedding TYPE vector(1536);

-- concepts table
ALTER TABLE concepts
ALTER COLUMN embedding TYPE vector(1536);
