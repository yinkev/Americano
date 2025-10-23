# Changelog

All notable changes to the Americano adaptive learning platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned
- Epic 6: Social Learning & Collaboration
- Epic 7: Mobile Application
- Advanced spaced repetition optimization
- Multi-language support

---

## [1.0.0] - 2025-10-21

### Epic 5: Behavioral Learning Twin Engine 🧠

**Completion Date:** October 21, 2025
**Status:** ✅ Complete and shipped to production
**Details:** [EPIC-5-MERGE-COMPLETION-FINAL.md](./EPIC-5-MERGE-COMPLETION-FINAL.md)

#### Added
- **Behavioral Analytics Engine** - Research-grade learning pattern analysis
  - Session duration optimization with performance weighting
  - Study time analysis with distraction detection
  - Forgetting curve modeling with exponential decay
  - Goal management with SMART goal validation
  - Habit formation tracking with 66-day research-based approach

- **77 Prisma Models** - World-class database architecture
  - 66 Epic 5 models (behavioral analytics, session tracking, habit formation)
  - 11 Epic 4 models (understanding validation, clinical reasoning)
  - 55 enums for type safety
  - 150+ optimized indexes for performance

- **Performance Optimization** - 98.5% API improvement (21.2s → 180ms)
  - Two-tier caching strategy (Redis L1 + in-memory L2)
  - 65-85% cache hit rate
  - Sub-second response times for all critical paths
  - Database query optimization

- **Type Safety Infrastructure** - 98.4% type safety score
  - 645 TypeScript interfaces auto-generated from Python Pydantic models
  - FastAPI → TypeScript type bridge with json-schema-to-typescript
  - Zero production TypeScript errors
  - Full IDE autocomplete and type checking

- **Learning Analytics Dashboard**
  - Real-time behavioral metrics visualization
  - Optimal study session recommendations
  - Habit formation progress tracking
  - Goal achievement analytics
  - Peer comparison and benchmarking

#### Changed
- Database schema merged from Epic 4 and Epic 5 branches
- Prisma client regenerated with zero duplicates
- Dependencies consolidated (98 total packages)

#### Technical Details
- **Branch:** `epic-5-main-reconciliation`
- **Commits:** 3 total, all pushed to GitHub
- **Files Resolved:** 24 conflict resolutions
- **Architecture:** Hybrid Python (FastAPI) + TypeScript (Next.js)

---

## [0.3.0] - 2025-10-17

### Epic 4: Understanding Validation Engine 🎯

**Completion Date:** October 17, 2025
**Status:** ✅ 100% Complete (6/6 stories, 78 story points)
**Details:** [EPIC-4-COMPLETION-REPORT.md](./EPIC-4-COMPLETION-REPORT.md)

#### Added
- **Natural Language Comprehension Prompts** (Story 4.1)
  - Multi-dimensional AI evaluation (terminology, relationships, application, clarity)
  - Confidence calibration engine with statistical analysis
  - 3 prompt templates: Direct Question, Clinical Scenario, Teaching Simulation
  - Analytics dashboard with weak area identification
  - Pre/post confidence tracking

- **Clinical Reasoning Scenarios** (Story 4.2)
  - Multi-stage interactive cases (Chief Complaint → Diagnosis → Management)
  - 4-competency scoring (Data Gathering, Diagnosis, Management, Clinical Reasoning)
  - USMLE/COMLEX-aligned format
  - Radar chart visualization
  - Board exam topic tagging

- **Controlled Failure Learning** (Story 4.3)
  - Emotion-anchored failure tracking
  - ML-based failure pattern detection
  - Spaced retry scheduling (1h, 8h, 24h, 72h)
  - Challenge generation from mistakes
  - Mastery verification system

- **Confidence Calibration Analytics** (Story 4.4)
  - Pearson correlation analysis (scipy implementation)
  - Overconfidence/underconfidence detection (15-point threshold)
  - Calibration trend tracking over time
  - Statistical significance testing
  - Calibration coaching recommendations

- **Item Response Theory Engine** (Story 4.5)
  - Adaptive difficulty adjustment using IRT algorithms
  - Question difficulty estimation (scipy-based)
  - Student ability scoring with Bayesian updates
  - Optimal next question selection
  - Performance prediction modeling

- **Comprehensive Analytics Dashboard** (Story 4.6)
  - 8 key metrics: mastery %, calibration delta, clinical reasoning, failure recovery, etc.
  - Peer benchmarking with anonymized comparisons
  - Failure pattern visualization
  - Topic mastery heatmaps
  - Priority insights generation

#### Technical Details
- **Architecture:** Hybrid Python (FastAPI, Pydantic, scipy) + TypeScript (Next.js, React)
- **Lines of Code:** ~15,000 (Python: 6,000 | TypeScript: 7,000 | Tests: 2,000)
- **Test Coverage:** 85%+ across all stories
- **Performance:** <500ms for AI evaluations, <200ms for analytics queries

#### Business Impact
- **Core differentiator** - Tests genuine understanding, not rote memorization
- Addresses critical gap in competitor tools (Anki, AMBOSS, UWorld)
- Validates clinical readiness through natural language and scenario-based assessment

---

## [0.2.0] - 2025-10-16

### Epic 3: Knowledge Graph and Semantic Search 🔍

**Completion Date:** October 16, 2025
**Status:** ✅ 100% Complete (6/6 stories, ~102 story points)
**Duration:** 1 day intensive development
**Details:** [docs/epic-3-completion-report.md](./docs/epic-3-completion-report.md)

#### Added
- **Semantic Search Engine** (Story 3.1)
  - Google Gemini text-embedding-001 integration (1536 dimensions)
  - PostgreSQL + pgvector for vector similarity search
  - Hybrid search (70% vector + 30% keyword)
  - Batch processing with rate limiting (100 RPM, 1000 RPD)
  - Average search latency: 340ms
  - 135+ test cases, 85% code coverage

- **Interactive Knowledge Graph** (Story 3.2)
  - Automatic concept extraction and relationship detection
  - React Flow v12 visualization with force-directed layout
  - User annotation system for custom connections
  - Graph analytics dashboard with Recharts
  - Prerequisite pathway integration
  - Export capabilities (JSON, PNG, CSV)

- **First Aid Integration** (Story 3.3)
  - Automated lecture-to-First Aid mapping
  - PDF structure preservation
  - Section-based chunking with high-yield detection
  - Semantic similarity matching (>0.75 threshold)
  - Board exam alignment tracking

- **Conflict Detection** (Story 3.4)
  - AI-powered contradiction detection between sources
  - Severity classification (LOW/MEDIUM/HIGH/CRITICAL)
  - Faculty review workflow
  - Student notification system
  - Resolution tracking

- **Smart Recommendations** (Story 3.5)
  - Hybrid recommendation engine (semantic similarity + performance data)
  - Content gap analysis
  - Learning path suggestions
  - Prerequisites and co-requisites detection

- **Advanced Search Tools** (Story 3.6)
  - Boolean operators (AND, OR, NOT)
  - Autocomplete suggestions
  - Saved search functionality
  - Graph-based content discovery
  - Search history and analytics

#### Performance Metrics
- Search latency: <1s (340ms average)
- Graph load: <2s for 100 nodes, <5s for 500 nodes
- Embedding generation: <300ms per request
- Vector similarity search: <100ms

#### Technical Stack
- **Embeddings:** Google Gemini text-embedding-001 (1536-dim)
- **Vector Database:** PostgreSQL + pgvector (IVFFlat index)
- **Visualization:** React Flow v12, D3.js, Recharts
- **Testing:** Jest with 85% coverage target

---

## [0.1.5] - 2025-10-15

### Dependency Updates and Technical Debt Cleanup 🔧

**Date:** October 15, 2025
**Type:** Major dependency updates, breaking changes resolved
**Details:** [docs/CHANGELOG-2025-10-15.md](./docs/CHANGELOG-2025-10-15.md)

#### Changed
- **Zod:** Upgraded from v3.25.76 to v4.1.12 ⚠️ Breaking changes
  - Fixed `error.errors` → `error.issues` API change
  - Fixed `.default()` ordering (must be before `.transform()`)
  - Updated all validation schemas across codebase

- **React Hook Form:** Upgraded @hookform/resolvers to v5.2.2 (stable)
  - Full Zod 4 compatibility
  - Removed beta version dependency
  - Zero breaking changes in form components

- **Next.js:** Updated to 15.5.5
  - Moved `experimental.turbo` to root-level `turbopack` config
  - Migrated viewport/themeColor to separate export (official pattern)
  - Used official codemod: `@next/codemod@latest metadata-to-viewport-export`

- **Core Dependencies:** Updated to latest 2025 versions
  - React: 19.2.0
  - TypeScript: 5.9.3
  - Tailwind CSS: 4.1.14
  - Prisma: 6.17.1

#### Fixed
- **API Response Format** - Fixed Story 1.5 standardization
  - Updated all library pages to access `result.data.courses`
  - Fixed "undefined is not an object (evaluating 'courses.map')" crash
  - Applied consistent `{ success: true, data: {...} }` format

- **TypeScript Compilation** - Zero errors after dependency updates
  - Clean compilation with `pnpm tsc --noEmit`
  - Resolved type resolution issues with fresh install

- **Dev Server Warnings** - Clean startup
  - Removed deprecation warnings for turbo config
  - Fixed unsupported metadata warnings
  - No console errors on startup

#### Migration Notes
- **Zod 4 Pattern:** Always use `error.issues` (not `error.errors`)
- **Next.js 15 Pattern:** Use `export const viewport: Viewport` for viewport config
- **API Standard:** All responses follow `{ success: true, data: {...} }` format
- **Context7 Requirement:** Always fetch latest docs via MCP before implementing

---

## [0.1.0] - 2025-10-14

### Initial Platform Foundation

#### Added
- **Core Application Framework**
  - Next.js 15 with App Router
  - TypeScript configuration
  - Tailwind CSS styling system
  - shadcn/ui component library

- **Database Infrastructure**
  - PostgreSQL with Prisma ORM
  - pgvector extension for embeddings
  - Initial schema with User, Course, Lecture models

- **Authentication System**
  - User registration and login
  - Session management
  - Protected routes

- **Content Management**
  - Lecture library system
  - Course organization
  - Content upload and editing

- **Study Features**
  - Flashcard system
  - Basic quiz functionality
  - Study session tracking

#### Technical Details
- **Framework:** Next.js 15, React 19, TypeScript 5
- **Database:** PostgreSQL with Prisma ORM
- **Styling:** Tailwind CSS 4, shadcn/ui
- **State Management:** Zustand
- **Testing:** Jest, React Testing Library

---

## Release Links

- [1.0.0 - Epic 5 Complete](https://github.com/americano/releases/tag/v1.0.0)
- [0.3.0 - Epic 4 Complete](https://github.com/americano/releases/tag/v0.3.0)
- [0.2.0 - Epic 3 Complete](https://github.com/americano/releases/tag/v0.2.0)

---

## Definitions

### Types of Changes
- **Added** - New features
- **Changed** - Changes to existing functionality
- **Deprecated** - Soon-to-be removed features
- **Removed** - Removed features
- **Fixed** - Bug fixes
- **Security** - Security vulnerability fixes

### Versioning
- **Major (X.0.0)** - Epic completions, breaking changes
- **Minor (0.X.0)** - Story completions, new features
- **Patch (0.0.X)** - Bug fixes, dependency updates

---

**Maintained by:** Americano Development Team
**Last Updated:** 2025-10-21
**Format Version:** 1.1.0 (Keep a Changelog)
