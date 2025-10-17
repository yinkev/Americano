-- Story 3.3: First Aid Integration - Add vector index for semantic search
-- Migration created: 2025-10-17
-- Adds IVFFlat index for FirstAidSection embedding column

-- Create IVFFlat index for First Aid section embeddings
-- This enables fast semantic search across First Aid content
CREATE INDEX IF NOT EXISTS first_aid_sections_embedding_idx
ON first_aid_sections
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Note: Run VACUUM ANALYZE first_aid_sections manually after migration
-- VACUUM cannot run inside a transaction block during migrations
