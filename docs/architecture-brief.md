# Architecture Brief for Americano
**Date:** 2025-10-14
**Phase:** 3-Solutioning
**Agent:** Architect
**Author:** Kevy (with PM John)

---

## Project Context

**Project:** Americano - AI-powered personalized medical education platform
**Level:** 3 (Full Product - SaaS MVP with subsystems and integrations)
**Field:** Greenfield
**User:** Personal use initially, designed for cloud scaling later

---

## Architecture Requirements

### Stack Overview
- **Local-first development** (zero hosting costs during MVP)
- **Cloud portability** (easy Supabase migration when ready)
- **Cost:** ~$1-2/month for embeddings only during development

---

## Technical Stack

### AI/ML
- **LLM:** GPT-5 via ChatMock at `http://localhost:8801/v1/chat/completions`
  - OpenAI-compatible API using ChatGPT Plus subscription
  - Zero API costs during development
  - Standard fetch calls (no Vercel AI SDK)

- **Embeddings:** Google Gemini Embedding-001
  - Direct API calls to Google AI API
  - 3072 dimensions (or 1536/768 for efficiency)
  - $0.15 per million tokens
  - Estimated cost: $1-2/month for personal use

### Database
- **PostgreSQL 16** with **pgvector extension**
- **Native macOS installation** via Homebrew (no Docker)
- **Prisma ORM** with environment-based configuration
- Support for both local development and cloud migration

### Storage
- **Local (Development):** Filesystem at `~/americano-data/pdfs/`
- **Cloud (Production):** Supabase Storage
- **Design:** Storage abstraction layer (StorageProvider interface)
- **Switching:** Environment-based configuration

### Frontend
- **Next.js 15** (App Router)
- **React 19**
- **TypeScript 5.7**
- **Tailwind CSS 4**
- **shadcn/ui** components

---

## Critical Design Requirements

### 1. Storage Abstraction Layer
```typescript
// Must support environment-based switching
interface StorageProvider {
  upload(file: File): Promise<string>;
  download(url: string): Promise<Buffer>;
  delete(url: string): Promise<void>;
}

// Local implementation
const localStorageProvider: StorageProvider = { ... }

// Cloud implementation (for migration)
const supabaseStorageProvider: StorageProvider = { ... }

// Environment-based selection
const storage = process.env.STORAGE_MODE === 'local'
  ? localStorageProvider
  : supabaseStorageProvider;
```

### 2. Database Portability
```typescript
// Prisma configuration must support:
// Local: postgresql://localhost:5432/americano
// Cloud: postgresql://[supabase-url]

// Same schema, different connection string
```

### 3. Migration Path Documentation
Include comprehensive documentation for:
- Exporting data from local PostgreSQL (`pg_dump`)
- Setting up Supabase database
- Running Prisma migrations on cloud
- Importing data (`pg_restore`)
- Uploading PDFs to Supabase Storage
- Environment variable updates
- Testing checklist

---

## Installation & Setup

### PostgreSQL Setup (Native macOS)
```bash
# Install PostgreSQL 16
brew install postgresql@16

# Install pgvector extension
brew install pgvector

# Start PostgreSQL service
brew services start postgresql@16

# Create database
createdb americano

# Enable pgvector extension
psql americano -c "CREATE EXTENSION vector;"
```

### Project Structure
```
~/americano/                    # Project root
├── src/                        # Application code
├── prisma/                     # Database schema
├── .env                        # Environment config
└── ~/americano-data/           # Data directory
    └── pdfs/                   # PDF storage
```

---

## API Integration Patterns

### GPT-5 via ChatMock
```typescript
async function callGPT5(messages: Message[]) {
  const response = await fetch('http://localhost:8801/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer dummy' // ChatMock may not need real key
    },
    body: JSON.stringify({
      model: 'gpt-5',
      messages: messages,
      stream: true
    })
  });
  return response;
}
```

### Gemini Embedding-001
```typescript
async function generateEmbeddings(text: string) {
  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': process.env.GOOGLE_AI_API_KEY
    },
    body: JSON.stringify({
      model: 'models/embedding-001',
      content: { parts: [{ text }] }
    })
  });

  const data = await response.json();
  return data.embedding.values; // 3072-dimensional vector
}
```

---

## Architecture Deliverables Required

### 1. System Architecture Diagram
- Component overview (Next.js app, PostgreSQL, ChatMock, Google AI)
- Data flow diagrams
- Local vs cloud topology

### 2. Database Schema Design
- Complete Prisma schema with all models:
  - Users, Lectures, Flashcards, Reviews, StudySessions
  - Vector embeddings with pgvector
  - Relationships and constraints
- Migration strategy

### 3. API Design
- RESTful API endpoints (or tRPC if preferred)
- Upload/processing endpoints
- Study session APIs
- AI chat endpoints
- Authentication strategy

### 4. Storage Architecture
- StorageProvider abstraction implementation
- Local filesystem organization
- Supabase Storage migration plan
- File naming conventions

### 5. Development Setup Guide
- PostgreSQL installation (Homebrew)
- pgvector setup
- Prisma initialization
- Environment configuration
- ChatMock setup requirements

### 6. Migration Documentation
- Step-by-step local → cloud migration
- Data backup procedures
- Testing checklist
- Rollback plan

### 7. Security & Performance
- API key management (ChatMock, Google AI)
- Rate limiting strategy
- Caching approach
- Error handling patterns

---

## Reference Documents

- **PRD:** `docs/PRD-Americano-2025-10-14.md`
- **UX Specification:** `docs/ux-specification.md`
- **Epic Breakdown:** `docs/epics-Americano-2025-10-14.md`
- **Product Brief:** `docs/product-brief-Americano-2025-10-14.md`
- **Workflow Status:** `docs/bmm-workflow-status.md`

---

## Success Criteria

The architecture is complete when:
- ✅ Storage abstraction allows local ↔ cloud switching
- ✅ PostgreSQL setup is documented and tested
- ✅ Prisma schema supports all PRD requirements
- ✅ ChatMock integration pattern is clear
- ✅ Gemini embedding integration is specified
- ✅ Migration documentation is comprehensive
- ✅ Development setup takes < 2 hours for new developer

---

## Notes

- **Privacy:** Not a concern for personal use
- **Offline Mode:** Not required (always online when studying)
- **Multi-device:** Not needed initially, but cloud migration enables it later
- **Cost Optimization:** Local-first keeps development free, migrate when ROI justifies cost

---

**Next Step:** Architect agent creates comprehensive solution architecture document based on this brief.
