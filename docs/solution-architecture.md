# Americano Solution Architecture
**Date:** 2025-10-14
**Project:** Americano - AI-Powered Medical Education Platform
**Level:** 3 (Full Product - SaaS MVP with subsystems and integrations)
**Author:** Winston (Architect) with Kevy

---

## Executive Summary

Americano is a Level 3 greenfield web application designed as an AI-powered personalized medical education platform. The system eliminates "what to study" anxiety through intelligent daily study missions, unified knowledge integration, personalized spaced repetition, and behavioral learning pattern analysis.

**Project Context:**
- **Field:** Greenfield (new project)
- **Project Type:** Web Application
- **Platform:** Responsive web (desktop primary, mobile/tablet secondary)
- **Target User:** Medical students (initially personal use, cloud-scalable)
- **Development Philosophy:** Local-first development ($0-2/month costs), cloud portability for future scaling

**Architecture Complexity:**
- **Subsystems:** Learning GPS, Knowledge Graph, Understanding Validator, Progress Analytics
- **Integrations:** ChatMock (GPT-5 local proxy), Google Gemini Embeddings, PostgreSQL + pgvector
- **UI Complexity:** Moderate to Complex (dashboards, real-time updates, knowledge graph visualization)

---

## Prerequisites and Scale Assessment

### Prerequisites Validation

**✅ All Prerequisites Met**

1. **PRD Status:** COMPLETED
   - Path: `/Users/kyin/Projects/Americano/docs/PRD-Americano-2025-10-14.md`
   - Contains: 15 functional requirements, 5 epics, 30+ user stories
   - Technical constraints documented
   - Integration requirements specified

2. **UX Specification Status:** COMPLETED
   - Path: `/Users/kyin/Projects/Americano/docs/ux-specification.md`
   - Contains: 3 user personas, 5 user flows, information architecture, 6-week MVP roadmap
   - UI complexity: Moderate to Complex
   - Screens defined: Dashboard, Study Mode, Content Library, Knowledge Graph, Progress Analytics, AI Chat
   - Navigation structure: Complete
   - Responsive requirements: Desktop primary, mobile/tablet secondary with PWA capabilities

3. **Architecture Brief Status:** READY
   - Path: `/Users/kyin/Projects/Americano/docs/architecture-brief.md`
   - Technical stack decisions documented
   - Storage abstraction requirements specified
   - Migration path requirements defined

### Scale Assessment

**Project Level: 3 (Full Product - SaaS MVP)**

**Characteristics:**
- Multiple subsystems requiring clear boundaries and integration patterns
- Complex state management (learning progress, behavioral analytics, spaced repetition)
- AI/ML integration (GPT-5 via ChatMock, Gemini embeddings, vector search)
- Data architecture complexity (PostgreSQL + pgvector, storage abstraction layer)
- Local-to-cloud migration path requirement

**Phase 3 Requirement:** Required for Level 3
- Solution architecture document: This document
- Component boundaries and integration patterns: Required
- Database schema design: Critical (Prisma + pgvector)
- API design: Essential for frontend-backend separation
- Migration documentation: Required for local→cloud portability

**Architecture Decisions Required:**
- Monolith vs. modular architecture
- State management strategy (client + server)
- Storage abstraction implementation
- Database schema with vector embeddings
- API contract design
- Development to production migration path

Proceeding with full solution architecture workflow...

---

## 1. PRD and UX Specification Analysis

### Requirements Summary

**15 Functional Requirements Identified:**

**Core Learning Management (FR1-FR5):**
- FR1: PDF Lecture Processing - PaddleOCR + OpenAI API, multi-format support, semantic embeddings
- FR2: Personal Learning GPS - Daily mission generation, intelligent prioritization, time-boxed sessions
- FR3: Knowledge Graph Foundation - Unified content linking, semantic search (Gemini embeddings), visualization
- FR4: Personalized Spaced Repetition - Custom FSRS implementation, adaptive scheduling, behavioral modeling
- FR5: Understanding Validation - "Explain to patient" prompts, clinical reasoning, confidence calibration

**AI-Powered Personalization (FR6-FR10):**
- FR6: Behavioral Learning Pattern Analysis - Study pattern tracking, optimal timing prediction, learning style profiling
- FR7: Content Analysis & Learning Objective Extraction - Auto-identification, high-yield flagging, prerequisite mapping
- FR8: Adaptive Difficulty & Cognitive Load Management - Real-time difficulty adjustment, stress response detection
- FR9: Smart Study Session Orchestration - Content mixing, session length optimization, flow state preservation
- FR10: Progress Analytics & Performance Insights - Learning analytics dashboard, exam readiness prediction, peer benchmarks

**Platform Infrastructure (FR11-FR15):**
- FR11: User Authentication & Profile Management - Secure auth, personal profiles, privacy controls
- FR12: Content Management & Organization - Hierarchical organization, medical education taxonomies, note-taking
- FR13: Multi-Platform Web Application - Responsive web, PWA capabilities, real-time synchronization
- FR14: Integration & Import Capabilities - Bulk content import, API readiness, calendar integration
- FR15: Search & Discovery Engine - Semantic search, advanced filtering, recommendation engine

**8 Non-Functional Requirements:**
- NFR1: Performance - <3s PDF processing, <2s page loads, 1000+ concurrent users, <1s search responses
- NFR2: Reliability - 95% uptime, graceful degradation, disaster recovery
- NFR3: Security & Privacy - End-to-end encryption, FERPA compliance, privacy-first behavioral data
- NFR4: User Experience - <5 min setup, WCAG 2.1 AA compliance, mobile-responsive
- NFR5: Maintainability - Modular architecture, API-first design, comprehensive monitoring
- NFR6: Cost Efficiency - AI API optimization, efficient database design, bootstrap-friendly ($1-2/month MVP target)
- NFR7: Data Quality - >90% medical content accuracy, improving behavioral predictions
- NFR8: Integration - RESTful API, standard data formats, webhook support

### Epic Structure

**5 Epics with Clear Priorities:**

1. **Epic 1: Core Learning Infrastructure** (Critical Priority)
   - Foundation for MVP launch
   - PDF processing, authentication, database schema, basic web app
   - Success: >90% processing accuracy, responsive app operational

2. **Epic 2: Personal Learning GPS** (Critical Priority)
   - Core differentiation feature
   - Daily mission generation, performance tracking, intelligent prioritization
   - Success: 90%+ mission completion rate, 25%+ reduction in planning time

3. **Epic 3: Knowledge Graph and Semantic Search** (High Priority)
   - Unified knowledge system
   - Semantic search, knowledge graph visualization, content integration
   - Success: <1s search response, 70%+ satisfaction with search relevance

4. **Epic 4: Understanding Validation Engine** (High Priority)
   - Comprehension testing beyond memorization
   - "Explain to patient" prompts, clinical reasoning, confidence calibration
   - Success: 60%+ improved comprehension, correlation with exam outcomes

5. **Epic 5: Behavioral Learning Twin** (Medium Priority)
   - Advanced personalization and competitive moat
   - Learning pattern analysis, predictive analytics, cognitive load monitoring
   - Success: 80%+ accuracy in predicting struggles, improving personalization

### UX/UI Analysis

**UI Complexity Assessment: Moderate to Complex**

**10 Screens/Views Identified:**
1. **Dashboard/Home** - Primary landing, today's mission CTA, progress summary, quick actions
2. **Study Mode** - Distraction-free learning environment, content presentation, spaced repetition cards
3. **Content Library** - Hierarchical course organization, uploaded lectures, tags, upload center
4. **Knowledge Graph** - Interactive concept visualization, semantic search, integration insights
5. **Progress & Analytics** - Mastery dashboard, retention curves, exam preparation, learning patterns
6. **AI Learning Assistant** - Floating Action Button (FAB) on all screens, context-aware chat panel
7. **Search** - Global semantic search, advanced filtering, search results with context
8. **Settings** - Profile, course management, learning preferences, behavioral data controls
9. **Exam Preparation Mode** - Gap analysis, readiness scoring, targeted review plan
10. **Mission Briefing** - Pre-session summary, objectives, estimated time

**Navigation Complexity: Moderate**
- Primary nav: 7 items (Home, Mission, Library, Graph, Progress, Search, Settings)
- Mobile nav: 5 items (Home, Mission, Library, Progress, More)
- AI Assistant: Persistent FAB (bottom-right, all screens)
- Breadcrumbs: Contextual for deep hierarchies
- In-study: Minimal chrome for flow preservation

**Key User Flows:**
1. **Upload PNWU Lecture** (MVP Priority #1) - <3 minute PDF processing workflow
2. **Daily Study Session** (MVP Priority #2) - Frictionless start within 30 seconds
3. **AI Chat Help** (MVP Priority #3) - Context-aware assistance via FAB
4. **Exam Preparation Mode** (V2) - Knowledge gap analysis and targeted review
5. **Knowledge Graph Visualization** (V2) - Concept relationship discovery

**UI Complexity Indicators:**
- Real-time updates required (study sessions, AI chat, progress tracking)
- Complex state machines (study flow, mission states, spaced repetition scheduling)
- Rich interactions (knowledge graph navigation, drag-drop uploads)
- Responsive requirements (desktop-first, mobile-optimized, PWA)
- Accessibility requirements (WCAG 2.1 AA, extended-use ergonomics)

**Design System:**
- Component library: shadcn/ui (pre-built, accessible components)
- Styling: Tailwind CSS 4 (utility-first)
- Typography: Inter or System UI (readable, professional)
- Color palette: Medical-professional (blue primary, green success, yellow warning, red error)

### PRD-UX Alignment Check

**Epic to Screen Mapping:**

✅ **Epic 1: Core Learning Infrastructure**
- Screens: Library (upload center), Settings (profile management), Dashboard
- User Flows: Upload PNWU Lecture
- All infrastructure requirements have UI manifestation

✅ **Epic 2: Personal Learning GPS**
- Screens: Dashboard (mission display), Study Mode (mission execution), Mission Briefing
- User Flows: Daily Study Session
- Clear UI path for mission generation and completion

✅ **Epic 3: Knowledge Graph and Semantic Search**
- Screens: Knowledge Graph (visualization), Search (global semantic search)
- User Flows: Knowledge Graph Visualization (V2)
- Search integrated into all screens via top nav

✅ **Epic 4: Understanding Validation Engine**
- Screens: Study Mode (understanding prompts), Progress Analytics (comprehension metrics)
- User Flows: Embedded in Daily Study Session
- Validation UI specified in study flow

✅ **Epic 5: Behavioral Learning Twin**
- Screens: Progress & Analytics (learning patterns), Settings (behavioral data controls)
- User Flows: Insights surfaced in Daily Study Session
- Background processing with UI feedback

**Gaps Identified: None**
- All epics have corresponding screens and user flows
- All screens support epic stories
- FRs have clear UI manifestation where applicable
- NFRs (performance, accessibility) inform UX patterns

### Technical Characteristics Detected

**Project Type:** Web Application (AI-powered e-learning platform)

**Architecture Style Hints:**
- Modular monolith (subsystems with clear boundaries)
- Local-first development ($0-2/month MVP target)
- Cloud portability design (future Supabase migration)
- Event-driven components (behavioral tracking, real-time updates)

**Repository Strategy Hints:**
- Monorepo (Next.js 15 App Router project)
- Single codebase for web application
- Potential Python microservice for PaddleOCR (separate repo or monorepo workspaces)

**Special Architectural Needs:**
- **Real-time:** AI chat streaming, live progress updates
- **Event-driven:** Behavioral data collection, study pattern tracking
- **Offline-first:** PWA capabilities for core features
- **Background processing:** PDF content extraction, embedding generation, spaced repetition calculations
- **Vector search:** pgvector integration for semantic search

**Technologies Explicitly Specified (from Architecture Brief):**

**Frontend:**
- Next.js 15 (App Router, SSR)
- React 19
- TypeScript 5.7
- Tailwind CSS 4
- shadcn/ui components

**Backend:**
- Next.js API routes (start simple)
- PostgreSQL 16 + pgvector extension (native macOS via Homebrew)
- Prisma ORM (environment-based configuration)

**AI/ML:**
- ChatMock (GPT-5 via localhost:8801/v1/chat/completions - OpenAI-compatible API)
- Google Gemini Embedding-001 (1536 dimensions via output_dimensionality parameter, direct API calls, $0.15/million tokens)
- PaddleOCR (Python service for PDF text extraction)

**Storage:**
- Local (Development): Filesystem at ~/americano-data/pdfs/
- Cloud (Production): Supabase Storage
- Storage abstraction layer (StorageProvider interface)

**Deployment:**
- Vercel (implied for Next.js, mentioned in UX spec)

**Unknowns Requiring Architectural Decisions:**
1. API design pattern: REST vs tRPC vs GraphQL
2. State management: React Context vs Zustand vs Redux Toolkit vs Jotai
3. Real-time communication: WebSockets vs Server-Sent Events vs polling
4. Background job processing: Next.js background functions vs separate worker service
5. Caching strategy: React Query vs SWR vs custom implementation
6. Error handling and retry patterns
7. Rate limiting and API protection strategy
8. Session management and JWT token refresh

### Summary

**Project Understanding:**
- Level 3 greenfield web application with sophisticated AI-powered learning features
- 15 functional requirements across core learning, AI personalization, and platform infrastructure
- 8 non-functional requirements emphasizing performance, reliability, security, and cost efficiency
- 5 epics sequenced for phased delivery (foundation → differentiation → advanced personalization)

**UI/UX Summary:**
- **Screen count:** 10 major screens/views
- **Navigation complexity:** Moderate (7 primary nav items, persistent AI assistant FAB)
- **UI complexity:** Moderate to Complex (real-time updates, rich interactions, knowledge graph visualization)
- **Key user flows:** Upload, daily study, AI chat, exam prep, knowledge graph
- **Design system:** shadcn/ui + Tailwind CSS 4 with medical-professional aesthetic

**PRD-UX Alignment:**
- ✅ All epics mapped to screens and user flows
- ✅ All FRs have UI manifestation where applicable
- ✅ NFRs inform UX patterns (performance, accessibility, mobile responsiveness)
- ✅ No critical gaps identified

**Architecture Characteristics:**
- Modular monolith with subsystem boundaries
- Monorepo (Next.js + potential Python service)
- Local-first with cloud portability
- Real-time, event-driven, offline-capable
- Heavy AI/ML integration (GPT-5, Gemini embeddings, pgvector)

**Known Technologies:**
- Full stack specified: Next.js 15, React 19, TypeScript 5.7, Tailwind CSS 4, PostgreSQL 16 + pgvector, Prisma
- AI integrations: ChatMock (local GPT-5), Google Gemini Embeddings, PaddleOCR

**Unknown/Needs Decisions:**
- API architecture pattern
- State management strategy
- Real-time communication approach
- Background job processing
- Caching strategy
- Error handling patterns

---

## 2. User Preferences and Technical Decisions

### Experience Level

**Selected:** Intermediate

**Output Style:** Balanced detail with key architectural rationale. Focused on decisions and patterns rather than basic explanations or excessive prose.

### MVP Technology Stack (2025 Latest Stable)

**Philosophy:** Simple, boring, working stack. Modern but proven. Zero external services for MVP.

**Core Framework:**
- Next.js (latest stable with App Router + Turbopack)
- React (latest stable)
- TypeScript (latest stable)
- Node.js (latest LTS)

**Frontend:**
- Tailwind CSS (latest stable)
- shadcn/ui (component collection)

**Backend:**
- PostgreSQL (latest LTS) + pgvector extension (latest stable)
- Prisma ORM (latest stable)
- Next.js API Routes (RESTful, no tRPC for MVP simplicity)

**AI/ML Integration:**
- ChatMock (GPT-5 via localhost:8801/v1/chat/completions)
- Google Gemini Embedding API (text-embedding-004 or latest available)
- PaddleOCR (Python service, latest stable)

**State Management:**
- Zustand (latest stable) for client-side global state
- React Server Components for server state where possible
- Plain `fetch()` for data fetching (no TanStack Query for MVP)

**Storage:**
- Local Development: Filesystem at ~/americano-data/pdfs/
- Production: Supabase Storage (future migration)
- Storage abstraction layer (StorageProvider interface)

**Package Manager:**
- pnpm (latest stable - fastest, most efficient)

**Deployment:**
- Local development only for MVP
- Future: Vercel or similar when cloud migration occurs

### Explicitly Deferred for MVP

**Not Adding Now (Add When Needed):**
- ❌ External services (Sentry, Trigger.dev, Clerk)
- ❌ Testing frameworks (Vitest, Playwright)
- ❌ CI/CD pipelines
- ❌ Monitoring and analytics
- ❌ Advanced caching (TanStack Query)
- ❌ Server Actions optimization
- ❌ Background job processors

**Rationale:** Single user, local development, rapid iteration. Add infrastructure when deploying to production with real users (Month 6-12).

### Technical Preferences

**API Architecture:**
- Next.js API Routes with RESTful conventions
- Standard `fetch()` for all HTTP requests
- Server Actions for form submissions and mutations where appropriate

**Real-time Communication:**
- Server-Sent Events (SSE) for AI streaming responses
- Standard HTTP polling for progress updates if needed
- No WebSockets for MVP (unnecessary complexity)

**Background Processing:**
- Synchronous processing for MVP (acceptable 2-3 minute wait for PDF uploads)
- Extract to async jobs later if becomes pain point

**Authentication:**
- Deferred for MVP (single user, local development)
- Future: Clerk, Auth.js v5, or Supabase Auth when needed

**Error Handling:**
- console.log for development
- User-friendly error messages in UI
- Add Sentry when deploying to production

**Development Approach:**
- Start simple, add complexity when needed
- Boring technology over cutting-edge hype
- Build features, not infrastructure
- Manual testing until production deployment

---

## 3. Architecture Pattern and System Design

### Architecture Style: Modular Monolith

**Selected Pattern:** Modular Monolith with clear subsystem boundaries

**Rationale:**
- **Right-sized for Level 3:** Multiple subsystems requiring clear boundaries without microservice overhead
- **Local-first development:** Single process deployment simplifies development workflow
- **Cloud portability:** Can extract to microservices later if needed (not required for MVP or initial scale)
- **Development velocity:** Faster iteration than distributed architecture
- **Cost efficiency:** Single deployment, no inter-service communication costs

**Architecture Characteristics:**
- Single Next.js application with modular code organization
- Clear subsystem boundaries via directory structure and dependency rules
- Shared database (PostgreSQL) with domain-based table organization
- In-process communication (function calls, not HTTP)
- Future extraction path: Subsystems can become microservices if scaling requires

**Not Microservices Because:**
- ❌ Unnecessary complexity for single user MVP
- ❌ Network latency between services hurts UX (real-time AI streaming)
- ❌ Distributed debugging overhead
- ❌ Deployment complexity (multiple services, orchestration)
- ✅ Modular monolith gives 80% of benefits with 20% of complexity

### Repository Strategy: Monorepo

**Selected Pattern:** Monorepo with workspace support

**Structure:**
```
americano/                          # Root monorepo
├── apps/
│   └── web/                        # Next.js application (main app)
│       ├── src/
│       │   ├── app/                # Next.js App Router pages
│       │   ├── components/         # React components
│       │   ├── lib/                # Shared utilities
│       │   └── subsystems/         # Modular subsystems (see below)
│       ├── public/                 # Static assets
│       ├── prisma/                 # Database schema
│       └── package.json
├── services/
│   └── ocr-service/                # Python PaddleOCR service (optional separate process)
│       ├── main.py                 # FastAPI or Flask server
│       ├── requirements.txt
│       └── Dockerfile              # For future containerization
├── packages/                       # Shared packages (future)
│   └── types/                      # Shared TypeScript types
├── docs/                           # Documentation (this file)
├── pnpm-workspace.yaml             # pnpm workspace config
└── package.json                    # Root package.json
```

**Rationale:**
- **Single repository:** All code versioned together, atomic commits across subsystems
- **Workspace management:** pnpm workspaces for dependency deduplication
- **Gradual extraction:** OCR service can run in same repo or be extracted later
- **Developer experience:** Single `git clone`, single IDE workspace, unified tooling

**Alternative Considered: Polyrepo**
- ❌ Rejected because coordination overhead outweighs benefits for small team (just you)
- ❌ Cross-repo changes require multiple PRs and version management
- ✅ Monorepo keeps development simple and fast

### Subsystem Boundaries

Based on the 5 epics and functional requirements, the system is organized into 6 core subsystems:

#### **Subsystem 1: Content Processing Pipeline**
**Epic Alignment:** Epic 1 (Core Learning Infrastructure - FR1)

**Responsibilities:**
- PDF upload and storage management
- OCR text extraction via PaddleOCR
- GPT-5 content analysis (learning objectives, key concepts)
- Embedding generation via Gemini
- Content metadata extraction

**Key Components:**
- `StorageProvider` interface (local filesystem / Supabase abstraction)
- `PDFProcessor` (upload, OCR orchestration)
- `ContentAnalyzer` (GPT-5 integration for objective extraction)
- `EmbeddingGenerator` (Gemini API integration)

**Data Models:**
- `Lecture` (uploaded PDFs, metadata, processing status)
- `ContentChunk` (extracted text segments with embeddings)
- `LearningObjective` (AI-extracted objectives)

**Integration Points:**
- PaddleOCR service (HTTP API or in-process Python)
- ChatMock API (GPT-5 for content analysis)
- Gemini Embedding API
- Local filesystem or Supabase Storage

---

#### **Subsystem 2: Learning Engine (Mission Generation & Spaced Repetition)**
**Epic Alignment:** Epic 2 (Personal Learning GPS - FR2, FR4, FR9)

**Responsibilities:**
- Daily mission generation (personalized study objectives)
- FSRS spaced repetition scheduling
- Study session orchestration (content mixing)
- Progress tracking and completion status

**Key Components:**
- `MissionGenerator` (daily mission creation logic)
- `FSRSScheduler` (custom FSRS implementation)
- `SessionOrchestrator` (session composition: new content + reviews)
- `ProgressTracker` (completion tracking, behavioral data collection)

**Data Models:**
- `Mission` (daily study objectives, estimated time, status)
- `Card` (spaced repetition flashcards)
- `Review` (user performance on cards, FSRS state)
- `StudySession` (session metadata, duration, completion)

**Algorithms:**
- Custom FSRS implementation with personal forgetting curves
- Mission prioritization (exam proximity + weakness + high-yield)
- Session composition (warm-up → peak → wind-down)

---

#### **Subsystem 3: Knowledge Graph & Semantic Search**
**Epic Alignment:** Epic 3 (Knowledge Graph - FR3, FR15)

**Responsibilities:**
- Knowledge graph construction (concept relationships)
- Semantic search via pgvector
- Content recommendation engine
- Cross-course integration detection

**Key Components:**
- `KnowledgeGraphBuilder` (construct concept graph from embeddings)
- `SemanticSearchEngine` (pgvector similarity search)
- `ConceptLinker` (detect relationships between concepts)
- `RecommendationEngine` (suggest related content)

**Data Models:**
- `Concept` (nodes in knowledge graph)
- `ConceptRelationship` (edges: prerequisite, related, integrated)
- `SearchIndex` (pgvector embeddings for fast retrieval)

**Queries:**
- Vector similarity search (pgvector `<=>` operator)
- Graph traversal for related concepts
- Semantic filtering by course, topic, difficulty

---

#### **Subsystem 4: Understanding Validation Engine**
**Epic Alignment:** Epic 4 (Understanding Validation - FR5)

**Responsibilities:**
- "Explain to patient" prompt generation
- Clinical reasoning question creation
- GPT-5 response evaluation
- Comprehension scoring and confidence calibration

**Key Components:**
- `ValidationPromptGenerator` (create comprehension questions)
- `ResponseEvaluator` (GPT-5 scoring of user explanations)
- `ConfidenceCalibrator` (detect overconfidence/underconfidence)
- `ControlledFailureDetector` (identify knowledge gaps)

**Data Models:**
- `ValidationPrompt` (question, expected answer criteria)
- `ValidationResponse` (user answer, AI evaluation, score)
- `ComprehensionMetric` (depth of understanding over time)

**Integration Points:**
- ChatMock API (GPT-5 for prompt generation and evaluation)

---

#### **Subsystem 5: Behavioral Analytics & Personalization**
**Epic Alignment:** Epic 5 (Behavioral Learning Twin - FR6, FR8, FR10) + Story 2.6 (Mission Analytics)

**Responsibilities:**
- Learning pattern analysis (optimal study times, content preferences)
- Predictive modeling (struggle detection, performance forecasting)
- Cognitive load monitoring
- Adaptive difficulty adjustment
- **Mission performance analytics and correlation analysis (Story 2.6)**
- **Automatic mission difficulty adaptation (Story 2.6)**
- **Weekly/monthly insights generation (Story 2.6)**

**Key Components:**
- `BehavioralAnalyzer` (pattern detection from study history)
- `PredictiveModel` (forecast struggles, optimal timing)
- `CognitiveLoadMonitor` (detect stress, burnout signals)
- `DifficultyAdapter` (adjust content complexity dynamically)
- **`MissionAnalyticsEngine` (calculate completion rates, performance correlations, Pearson correlation)**
- **`MissionAdaptationEngine` (detect patterns, generate recommendations, auto-adjust mission difficulty)**
- **`MissionInsightsEngine` (generate weekly insights, detect anomalies, identify strengths/weaknesses)**
- **`MissionSuccessCalculator` (weighted success score: completion 30% + performance 25% + time 20% + feedback 15% + streak 10%)**

**Data Models:**
- `BehavioralEvent` (timestamped study actions, performance)
- `LearningPattern` (identified patterns: morning physiology struggles, etc.)
- `PerformancePrediction` (forecasted struggle areas, confidence intervals)
- **`MissionAnalytics` (daily/weekly/monthly aggregates: completion rate, time accuracy, success scores)**
- **`MissionFeedback` (user ratings: helpfulness 1-5, relevance 1-5, pace feedback)**
- **`MissionStreak` (gamification: current streak, longest streak, last completed date)**
- **`MissionReview` (automated weekly/monthly reviews with summaries, highlights, insights)**

**Analytics Queries:**
- Time-series analysis of study performance
- Cohort analysis (you vs. yourself over time)
- Retention curve fitting
- **Mission completion trends over 7/30/90 days**
- **Statistical correlation between mission completion and mastery improvement (p-value, confidence intervals)**
- **Pattern detection for adaptive difficulty (low/high completion, time inaccuracy, skipped types)**

**Implementation Files (Story 2.6):**
- `apps/web/src/lib/mission-analytics-engine.ts` (398 lines)
- `apps/web/src/lib/mission-adaptation-engine.ts` (360 lines)
- `apps/web/src/lib/mission-insights-engine.ts` (387 lines)
- `apps/web/src/lib/mission-success-calculator.ts` (149 lines)

---

#### **Subsystem 6: User Interface & Application Shell**
**Epic Alignment:** Epic 1 (FR11, FR13), All Epics (UI manifestation)

**Responsibilities:**
- React component library (shadcn/ui + custom components)
- Page routing and navigation (Next.js App Router)
- State management (Zustand stores)
- Real-time UI updates (SSE for AI streaming)

**Key Components:**
- Page components (Dashboard, Study Mode, Library, Graph, Analytics)
- Shared UI components (Mission Card, Progress Bar, AI Chat FAB)
- Zustand stores (user session, current mission, study state)
- API client utilities (fetch wrappers, error handling)

**Data Flow:**
- Server Components for initial page loads (RSC)
- Client Components for interactive features (Zustand + fetch)
- Server Actions for form submissions (upload, profile updates)
- SSE for AI streaming (ChatMock responses)

---

### Subsystem Integration Patterns

**Cross-Subsystem Communication:**
- **In-Process Function Calls:** All subsystems run in same Next.js process
- **Shared Database:** PostgreSQL accessed via Prisma (domain tables logically separated)
- **Event Bus (Future):** For complex workflows, implement lightweight event emitter
- **Dependency Direction:** UI → Learning Engine → Content Processing, Knowledge Graph, Validation, Analytics

**Database Integration:**
- **Shared Prisma Client:** Single schema, modular table organization by subsystem
- **Transaction Support:** Critical workflows (mission generation + card scheduling) use Prisma transactions
- **Migration Strategy:** Prisma migrations versioned with application code

**External Service Integration:**
- **ChatMock (GPT-5):** HTTP fetch to localhost:8801, retry logic for transient failures
- **Gemini Embeddings:** Direct HTTPS API calls with rate limiting
- **PaddleOCR:** HTTP API to Python service (FastAPI) or in-process if performance acceptable

**Storage Integration:**
- **Abstraction Layer:** `StorageProvider` interface with `LocalStorageProvider` and `SupabaseStorageProvider` implementations
- **Environment-based selection:** `STORAGE_MODE=local` for development, `STORAGE_MODE=cloud` for production
- **Migration path:** Export from local → import to Supabase

---

### Architecture Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Architecture Style** | Modular Monolith | Right-sized for Level 3, development velocity, cost efficiency |
| **Repository Strategy** | Monorepo (pnpm workspaces) | Single codebase, atomic commits, simple developer experience |
| **Subsystem Count** | 6 core subsystems | Maps to 5 epics + UI shell, clear boundaries without over-segmentation |
| **Database Strategy** | Shared PostgreSQL + Prisma | Single source of truth, transaction support, simple local development |
| **Communication Pattern** | In-process function calls | Lowest latency, simplest debugging, no network overhead |
| **Storage Strategy** | Abstraction layer (local → cloud) | Local-first development, cloud portability, zero migration code changes |

---

## 4. Database Architecture

### Database Schema (Prisma ORM + pgvector)

**Database:** PostgreSQL (latest stable) with pgvector extension for vector similarity search

**Schema Organization:** Modular by subsystem, single Prisma schema file

#### Complete Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  extensions = [pgvector(map: "vector")]
}

// ============================================
// SUBSYSTEM 1: Content Processing Pipeline
// ============================================

model User {
  id            String   @id @default(cuid())
  email         String?  @unique
  name          String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  courses       Course[]
  lectures      Lecture[]
  studySessions StudySession[]
  missions      Mission[]
  reviews       Review[]

  @@map("users")
}

model Course {
  id          String   @id @default(cuid())
  userId      String
  name        String   // "Gross Anatomy (ANAT 505)"
  code        String?  // "ANAT 505"
  term        String?  // "Fall 2025"
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  lectures    Lecture[]
  cards       Card[]

  @@index([userId])
  @@map("courses")
}

model Lecture {
  id                String   @id @default(cuid())
  userId            String
  courseId          String
  title             String
  fileName          String
  fileUrl           String      // Local path or Supabase URL
  fileSize          Int
  processingStatus  ProcessingStatus @default(PENDING)
  uploadedAt        DateTime @default(now())
  processedAt       DateTime?

  // Metadata
  weekNumber        Int?
  topicTags         String[]

  // Relations
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  course            Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  contentChunks     ContentChunk[]
  learningObjectives LearningObjective[]
  cards             Card[]

  @@index([userId])
  @@index([courseId])
  @@index([processingStatus])
  @@map("lectures")
}

enum ProcessingStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}

model ContentChunk {
  id          String   @id @default(cuid())
  lectureId   String
  content     String   @db.Text
  embedding   Unsupported("vector(3072)")?  // Gemini embedding-001 dimension
  chunkIndex  Int      // Order within lecture
  pageNumber  Int?
  createdAt   DateTime @default(now())

  // Relations
  lecture     Lecture  @relation(fields: [lectureId], references: [id], onDelete: Cascade)

  @@index([lectureId])
  @@map("content_chunks")
}

model LearningObjective {
  id          String   @id @default(cuid())
  lectureId   String
  objective   String   @db.Text
  isHighYield Boolean  @default(false)
  extractedBy String   @default("gpt-5")
  createdAt   DateTime @default(now())

  // Relations
  lecture     Lecture  @relation(fields: [lectureId], references: [id], onDelete: Cascade)
  cards       Card[]

  @@index([lectureId])
  @@index([isHighYield])
  @@map("learning_objectives")
}

// ============================================
// SUBSYSTEM 2: Learning Engine
// ============================================

model Mission {
  id              String   @id @default(cuid())
  userId          String
  date            DateTime @default(now())
  status          MissionStatus @default(PENDING)
  estimatedMinutes Int
  completedAt     DateTime?

  // Mission content
  objectives      String[] // Array of objective descriptions
  reviewCardCount Int      // Number of cards due for review
  newContentCount Int      // Number of new concepts to learn

  // Relations
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  studySessions   StudySession[]

  @@index([userId])
  @@index([date])
  @@index([status])
  @@map("missions")
}

enum MissionStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  SKIPPED
}

model Card {
  id                String   @id @default(cuid())
  courseId          String
  lectureId         String?
  objectiveId       String?
  front             String   @db.Text
  back              String   @db.Text
  cardType          CardType @default(BASIC)
  createdAt         DateTime @default(now())

  // FSRS state
  difficulty        Float    @default(0)
  stability         Float    @default(0)
  retrievability    Float    @default(0)
  lastReviewedAt    DateTime?
  nextReviewAt      DateTime?
  reviewCount       Int      @default(0)
  lapseCount        Int      @default(0)

  // Relations
  course            Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  lecture           Lecture? @relation(fields: [lectureId], references: [id], onDelete: SetNull)
  objective         LearningObjective? @relation(fields: [objectiveId], references: [id], onDelete: SetNull)
  reviews           Review[]

  @@index([courseId])
  @@index([nextReviewAt])
  @@map("cards")
}

enum CardType {
  BASIC
  CLOZE
  CLINICAL_REASONING
}

model Review {
  id              String   @id @default(cuid())
  userId          String
  cardId          String
  sessionId       String?
  rating          ReviewRating
  timeSpentMs     Int
  reviewedAt      DateTime @default(now())

  // FSRS data captured at review time
  difficultyBefore Float
  stabilityBefore  Float
  difficultyAfter  Float
  stabilityAfter   Float

  // Relations
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  card            Card     @relation(fields: [cardId], references: [id], onDelete: Cascade)
  session         StudySession? @relation(fields: [sessionId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([cardId])
  @@index([reviewedAt])
  @@map("reviews")
}

enum ReviewRating {
  AGAIN   // 1 - Complete lapse
  HARD    // 2 - Difficult recall
  GOOD    // 3 - Correct with effort
  EASY    // 4 - Perfect recall
}

model StudySession {
  id              String   @id @default(cuid())
  userId          String
  missionId       String?
  startedAt       DateTime @default(now())
  completedAt     DateTime?
  durationMs      Int?

  // Session stats
  reviewsCompleted Int     @default(0)
  newCardsStudied  Int     @default(0)

  // Relations
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  mission         Mission? @relation(fields: [missionId], references: [id], onDelete: SetNull)
  reviews         Review[]
  validationResponses ValidationResponse[]

  @@index([userId])
  @@index([startedAt])
  @@map("study_sessions")
}

// ============================================
// SUBSYSTEM 3: Knowledge Graph & Search
// ============================================

model Concept {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?  @db.Text
  category    String?  // "anatomy", "physiology", "pathology"
  embedding   Unsupported("vector(3072)")?
  createdAt   DateTime @default(now())

  // Relations
  relatedFrom ConceptRelationship[] @relation("ConceptFrom")
  relatedTo   ConceptRelationship[] @relation("ConceptTo")

  @@index([category])
  @@map("concepts")
}

model ConceptRelationship {
  id            String   @id @default(cuid())
  fromConceptId String
  toConceptId   String
  relationship  RelationshipType
  strength      Float    @default(1.0)  // 0.0 to 1.0
  createdAt     DateTime @default(now())

  // Relations
  fromConcept   Concept  @relation("ConceptFrom", fields: [fromConceptId], references: [id], onDelete: Cascade)
  toConcept     Concept  @relation("ConceptTo", fields: [toConceptId], references: [id], onDelete: Cascade)

  @@unique([fromConceptId, toConceptId, relationship])
  @@index([fromConceptId])
  @@index([toConceptId])
  @@map("concept_relationships")
}

enum RelationshipType {
  PREREQUISITE  // fromConcept is prerequisite for toConcept
  RELATED       // General association
  INTEGRATED    // Cross-course integration
  CLINICAL      // Clinical application
}

// ============================================
// SUBSYSTEM 4: Understanding Validation
// ============================================

model ValidationPrompt {
  id          String   @id @default(cuid())
  promptText  String   @db.Text
  promptType  PromptType
  conceptName String
  expectedCriteria String[] // Key points expected in answer
  createdAt   DateTime @default(now())

  // Relations
  responses   ValidationResponse[]

  @@map("validation_prompts")
}

enum PromptType {
  EXPLAIN_TO_PATIENT
  CLINICAL_REASONING
  CONTROLLED_FAILURE
}

model ValidationResponse {
  id          String   @id @default(cuid())
  promptId    String
  sessionId   String?
  userAnswer  String   @db.Text
  aiEvaluation String  @db.Text
  score       Float    // 0.0 to 1.0
  confidence  Float?   // User's self-reported confidence
  respondedAt DateTime @default(now())

  // Relations
  prompt      ValidationPrompt @relation(fields: [promptId], references: [id], onDelete: Cascade)
  session     StudySession? @relation(fields: [sessionId], references: [id], onDelete: SetNull)

  @@index([promptId])
  @@index([respondedAt])
  @@map("validation_responses")
}

model ComprehensionMetric {
  id          String   @id @default(cuid())
  conceptName String
  date        DateTime @default(now())
  avgScore    Float    // Average validation score for this concept
  sampleSize  Int      // Number of validations
  trend       String?  // "improving", "stable", "declining"

  @@unique([conceptName, date])
  @@index([conceptName])
  @@map("comprehension_metrics")
}

// ============================================
// SUBSYSTEM 5: Behavioral Analytics
// ============================================

model BehavioralEvent {
  id          String   @id @default(cuid())
  userId      String   // Not FK to allow analytics without user cascade
  eventType   EventType
  eventData   Json     // Flexible JSON for event-specific data
  timestamp   DateTime @default(now())

  @@index([userId])
  @@index([eventType])
  @@index([timestamp])
  @@map("behavioral_events")
}

enum EventType {
  MISSION_STARTED
  MISSION_COMPLETED
  CARD_REVIEWED
  VALIDATION_COMPLETED
  SESSION_STARTED
  SESSION_ENDED
  LECTURE_UPLOADED
  SEARCH_PERFORMED
  GRAPH_VIEWED
}

model LearningPattern {
  id          String   @id @default(cuid())
  userId      String
  patternType PatternType
  patternData Json     // Flexible storage for pattern details
  confidence  Float    // 0.0 to 1.0 confidence in pattern
  detectedAt  DateTime @default(now())
  lastSeenAt  DateTime @default(now())

  @@index([userId])
  @@index([patternType])
  @@map("learning_patterns")
}

enum PatternType {
  OPTIMAL_STUDY_TIME      // "Best performance at 7-9 AM"
  STRUGGLE_TOPIC          // "Low retention on physiology"
  CONTENT_PREFERENCE      // "Prefers visual diagrams"
  SESSION_LENGTH          // "Optimal 45-minute sessions"
  DAY_OF_WEEK_PATTERN     // "Struggles on Mondays"
}

model PerformancePrediction {
  id            String   @id @default(cuid())
  userId        String
  predictedFor  DateTime // Date/time this prediction is for
  predictionType String  // "struggle_likelihood", "optimal_study_time"
  prediction    Json     // Prediction details
  confidence    Float    // Model confidence
  createdAt     DateTime @default(now())

  @@index([userId])
  @@index([predictedFor])
  @@map("performance_predictions")
}
```

#### Database Indexes Strategy

**Performance-Critical Queries:**
1. **Vector Similarity Search:** pgvector indexing on `ContentChunk.embedding` and `Concept.embedding`
2. **Card Due Date Lookup:** Index on `Card.nextReviewAt` for fast mission generation
3. **User Timeline Queries:** Indexes on all timestamp fields with userId
4. **Content Organization:** Indexes on Course, Lecture hierarchies

**pgvector Index Creation (after schema migration):**
```sql
-- Add vector indexes for semantic search
CREATE INDEX content_chunks_embedding_idx ON content_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX concepts_embedding_idx ON concepts
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 50);
```

#### Migration Strategy

**Local Development:**
```bash
# Initialize Prisma
npx prisma init

# Create migration
npx prisma migrate dev --name init

# Enable pgvector extension (manual SQL)
psql americano -c "CREATE EXTENSION IF NOT EXISTS vector;"

# Create vector indexes (manual SQL after first migration)
psql americano -f prisma/vector-indexes.sql
```

**Cloud Migration (Future):**
```bash
# Export local data
pg_dump americano > americano-backup.sql

# Import to Supabase
psql postgres://[supabase-url] < americano-backup.sql

# Run Prisma migrations on cloud
DATABASE_URL="postgres://[supabase-url]" npx prisma migrate deploy
```

---

## 5. API Architecture

### API Design Pattern

**Pattern:** RESTful Next.js API Routes organized by subsystem

**Base Path:** `/api`

**Organization:** Nested by subsystem to mirror architecture boundaries

**Authentication:** Deferred for MVP (single user local development)

**Error Handling:** Consistent error response format across all endpoints

**Response Format:**
```typescript
// Success response
{
  success: true,
  data: { /* payload */ }
}

// Error response
{
  success: false,
  error: {
    code: "ERROR_CODE",
    message: "Human-readable error message",
    details?: { /* additional context */ }
  }
}
```

### API Endpoints by Subsystem

#### Subsystem 1: Content Processing (`/api/content/*`)

**Upload and Process Lectures:**
```
POST /api/content/upload
Body: multipart/form-data
  - file: PDF file
  - courseId: string
  - title?: string
  - weekNumber?: number
Response: { lectureId, processingStatus }
```

**Get Lecture Details:**
```
GET /api/content/lectures/:id
Response: { lecture, contentChunks[], learningObjectives[] }
```

**List Lectures:**
```
GET /api/content/lectures?courseId=:courseId&status=:status
Query params:
  - courseId?: string (filter by course)
  - status?: ProcessingStatus (filter by status)
  - limit?: number (default 50)
  - offset?: number (pagination)
Response: { lectures[], total, hasMore }
```

**Get Processing Status:**
```
GET /api/content/processing/:lectureId
Response: { status, progress, error? }
```

**Manage Courses:**
```
GET /api/content/courses
Response: { courses[] }

POST /api/content/courses
Body: { name, code?, term? }
Response: { course }

PATCH /api/content/courses/:id
Body: { name?, code?, term? }
Response: { course }

DELETE /api/content/courses/:id
Response: { success }
```

---

#### Subsystem 2: Learning Engine (`/api/learning/*`)

**Get Today's Mission:**
```
GET /api/learning/mission/today
Response: { mission, cards[] }
```

**Generate New Mission:**
```
POST /api/learning/mission/generate
Body: { date?: Date }
Response: { mission }
```

**Start Study Session:**
```
POST /api/learning/sessions
Body: { missionId }
Response: { session, nextCard }
```

**Submit Card Review:**
```
POST /api/learning/sessions/:sessionId/review
Body: {
  cardId: string
  rating: ReviewRating
  timeSpentMs: number
}
Response: { nextCard?, sessionComplete: boolean }
```

**Complete Study Session:**
```
PATCH /api/learning/sessions/:sessionId/complete
Response: { session, stats }
```

**Get Due Cards:**
```
GET /api/learning/cards/due?date=:date
Response: { cards[], count }
```

**Get Card History:**
```
GET /api/learning/cards/:id/history
Response: { card, reviews[] }
```

---

#### Subsystem 3: Knowledge Graph (`/api/graph/*`)

**Semantic Search:**
```
POST /api/graph/search
Body: {
  query: string
  limit?: number (default 20)
  filters?: {
    courseId?: string
    category?: string
  }
}
Response: { results[], total }
```

**Get Knowledge Graph:**
```
GET /api/graph/concepts?category=:category
Query params:
  - category?: string (filter by category)
  - depth?: number (traversal depth, default 2)
Response: { nodes[], edges[] }
```

**Get Concept Details:**
```
GET /api/graph/concepts/:id
Response: { concept, relatedConcepts[] }
```

**Get Related Content:**
```
GET /api/graph/concepts/:id/content
Response: { lectures[], cards[] }
```

---

#### Subsystem 4: Understanding Validation (`/api/validation/*`)

**Get Validation Prompt:**
```
GET /api/validation/prompts/next?sessionId=:sessionId
Response: { prompt }
```

**Submit Validation Response:**
```
POST /api/validation/responses
Body: {
  promptId: string
  sessionId?: string
  userAnswer: string
  confidence?: number
}
Response: { evaluation, score, feedback }
```

**Get Comprehension Metrics:**
```
GET /api/validation/metrics?conceptName=:conceptName&startDate=:date&endDate=:date
Response: { metrics[], trend }
```

---

#### Subsystem 5: Behavioral Analytics (`/api/analytics/*`)

**Track Behavioral Event:**
```
POST /api/analytics/events
Body: {
  eventType: EventType
  eventData: object
}
Response: { success }
```

**Get Learning Patterns:**
```
GET /api/analytics/patterns
Response: { patterns[] }
```

**Get Performance Predictions:**
```
GET /api/analytics/predictions?date=:date
Response: { predictions[] }
```

**Get Dashboard Analytics:**
```
GET /api/analytics/dashboard?period=:period
Query params:
  - period: "today" | "week" | "month" | "all"
Response: {
  studyTime: number
  cardsReviewed: number
  retentionRate: number
  strengths: string[]
  weaknesses: string[]
}
```

---

#### AI Integration (`/api/ai/*`)

**AI Chat (SSE Streaming):**
```
GET /api/ai/chat/stream?message=:message&context=:context
Query params:
  - message: string (user question)
  - context?: string (current lecture, concept)
Response: Server-Sent Events stream
  data: { token: string }
  ...
  data: { done: true }
```

**Generate Flashcards:**
```
POST /api/ai/generate/cards
Body: {
  contentChunkIds: string[]
  count?: number (default 10)
}
Response: { cards[] }
```

**Extract Learning Objectives:**
```
POST /api/ai/extract/objectives
Body: {
  text: string
  context?: string
}
Response: { objectives[] }
```

---

### API Implementation Notes

**Server Actions vs API Routes:**

Use Server Actions for:
- ✅ Form submissions (upload lecture, update profile)
- ✅ Mutations with simple request/response

Use API Routes for:
- ✅ Complex queries needing multiple data sources
- ✅ Streaming responses (AI chat)
- ✅ Background processing status checks

**Error Handling Pattern:**
```typescript
// src/lib/api-response.ts
export function successResponse<T>(data: T) {
  return { success: true as const, data };
}

export function errorResponse(code: string, message: string, details?: unknown) {
  return {
    success: false as const,
    error: { code, message, details }
  };
}

// Usage in API route
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET(req: Request) {
  try {
    const data = await fetchData();
    return Response.json(successResponse(data));
  } catch (error) {
    return Response.json(
      errorResponse("FETCH_ERROR", error.message),
      { status: 500 }
    );
  }
}
```

**Rate Limiting (Future):**
- Not implemented for MVP (single user)
- Add when deploying to production with multiple users
- Consider: Upstash Rate Limit or Vercel Edge Config

---

## 6. Storage Architecture

### Storage Abstraction Layer

**Purpose:** Enable seamless migration from local filesystem (development) to Supabase Storage (production) without code changes.

**Pattern:** Strategy pattern with environment-based provider selection

#### StorageProvider Interface

```typescript
// src/lib/storage/storage-provider.ts

export interface StorageProvider {
  /**
   * Upload a file and return its URL
   */
  upload(file: File, path: string): Promise<string>;

  /**
   * Get a signed URL for accessing a file
   */
  getUrl(path: string): Promise<string>;

  /**
   * Delete a file
   */
  delete(path: string): Promise<void>;

  /**
   * Check if a file exists
   */
  exists(path: string): Promise<boolean>;
}
```

#### Local Storage Provider

```typescript
// src/lib/storage/local-storage-provider.ts

import fs from 'fs/promises';
import path from 'path';

export class LocalStorageProvider implements StorageProvider {
  private basePath: string;

  constructor() {
    this.basePath = process.env.LOCAL_STORAGE_PATH || '~/americano-data/pdfs';
  }

  async upload(file: File, filePath: string): Promise<string> {
    const fullPath = path.join(this.basePath, filePath);
    const buffer = Buffer.from(await file.arrayBuffer());

    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, buffer);

    return `file://${fullPath}`;
  }

  async getUrl(filePath: string): Promise<string> {
    return `file://${path.join(this.basePath, filePath)}`;
  }

  async delete(filePath: string): Promise<void> {
    await fs.unlink(path.join(this.basePath, filePath));
  }

  async exists(filePath: string): Promise<boolean> {
    try {
      await fs.access(path.join(this.basePath, filePath));
      return true;
    } catch {
      return false;
    }
  }
}
```

#### Supabase Storage Provider

```typescript
// src/lib/storage/supabase-storage-provider.ts

import { createClient } from '@supabase/supabase-js';

export class SupabaseStorageProvider implements StorageProvider {
  private supabase;
  private bucket = 'lectures';

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );
  }

  async upload(file: File, filePath: string): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from(this.bucket)
      .upload(filePath, file);

    if (error) throw error;

    return data.path;
  }

  async getUrl(filePath: string): Promise<string> {
    const { data } = this.supabase.storage
      .from(this.bucket)
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  async delete(filePath: string): Promise<void> {
    const { error } = await this.supabase.storage
      .from(this.bucket)
      .remove([filePath]);

    if (error) throw error;
  }

  async exists(filePath: string): Promise<boolean> {
    const { data } = await this.supabase.storage
      .from(this.bucket)
      .list(path.dirname(filePath), {
        search: path.basename(filePath)
      });

    return data && data.length > 0;
  }
}
```

#### Storage Factory

```typescript
// src/lib/storage/index.ts

import { LocalStorageProvider } from './local-storage-provider';
import { SupabaseStorageProvider } from './supabase-storage-provider';
import type { StorageProvider } from './storage-provider';

export function getStorageProvider(): StorageProvider {
  const mode = process.env.STORAGE_MODE || 'local';

  switch (mode) {
    case 'local':
      return new LocalStorageProvider();
    case 'cloud':
      return new SupabaseStorageProvider();
    default:
      throw new Error(`Unknown storage mode: ${mode}`);
  }
}

// Usage in API routes
const storage = getStorageProvider();
const fileUrl = await storage.upload(file, `lectures/${lectureId}.pdf`);
```

#### Environment Configuration

```bash
# Local Development (.env.local)
STORAGE_MODE=local
LOCAL_STORAGE_PATH=~/americano-data/pdfs

# Production (.env.production)
STORAGE_MODE=cloud
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

#### Migration Process

**Step 1: Export local files**
```bash
# Sync local files to Supabase
node scripts/migrate-storage.js
```

**Step 2: Update database URLs**
```sql
-- Update file URLs from local to Supabase
UPDATE lectures
SET file_url = REPLACE(file_url, 'file://', 'https://supabase.co/storage/v1/')
WHERE file_url LIKE 'file://%';
```

**Step 3: Switch environment variable**
```bash
# Change STORAGE_MODE from 'local' to 'cloud'
```

---

## 7. Technology Stack and Decisions

### Complete Technology Decision Table

| Category | Technology | Version | Rationale |
|----------|-----------|---------|-----------|
| **Core Framework** |
| Frontend Framework | Next.js | Latest stable (App Router) | SSR, RSC, API routes, industry standard |
| UI Library | React | Latest stable | Required by Next.js, component model |
| Language | TypeScript | Latest stable | Type safety, better DX, fewer runtime errors |
| Runtime | Node.js | Latest LTS | Required for Next.js |
| **Frontend** |
| Styling | Tailwind CSS | Latest stable | Utility-first, fast development, small bundle |
| Component Library | shadcn/ui | Latest | **Full library available** - Install on-demand via `npx shadcn@latest add <component>` |
| Animation Library | motion.dev | Latest stable | Modern animation library (replaces deprecated Framer Motion), powerful animations, gestures, layout animations, page transitions |
| Layout System | bentogrid | Latest stable | Modern grid layouts, bento grid patterns, responsive layouts |
| State Management | Zustand | Latest stable | Lightweight, TypeScript-first, minimal boilerplate |
| Data Fetching | `fetch()` API | Native | Simple, no additional library needed for MVP |
| Knowledge Graph | React Flow | Latest stable | Interactive node graphs, extensive features |
| **Backend** |
| Database | PostgreSQL | Latest stable | Robust, pgvector support, ACID compliance |
| Vector Extension | pgvector | Latest stable | Native vector similarity search |
| ORM | Prisma | Latest stable | Type-safe, great DX, migration system |
| API Pattern | Next.js API Routes | Native | RESTful APIs, simple for MVP |
| **AI/ML** |
| LLM (Development) | ChatMock | GPT-5 compatible | Local proxy to OpenAI, $0 cost in development |
| LLM (Production) | OpenAI GPT-4/5 | Latest | Via ChatMock or direct API |
| Embeddings | Google Gemini | embedding-004 or latest | 3072 dimensions, cost-effective ($0.15/1M tokens) |
| OCR | PaddleOCR | Latest stable (Python) | Accurate medical content extraction |
| **Storage** |
| Local Storage | Node.js `fs` | Native | Filesystem access for development |
| Cloud Storage | Supabase Storage | Latest | S3-compatible, integrated with Supabase |
| Abstraction | Custom StorageProvider | - | Clean migration path local → cloud |
| **Development** |
| Package Manager | pnpm | Latest stable | Faster, more efficient than npm/yarn |
| Code Quality | Biome | Latest stable | Linting + formatting in one tool (replaces ESLint + Prettier) |
| **Deferred for MVP** |
| Testing | - | - | Add Vitest + Playwright when deploying to production |
| CI/CD | - | - | Add GitHub Actions when deploying to production |
| Monitoring | - | - | Add Sentry when deploying to production |
| Background Jobs | - | - | Synchronous processing acceptable for MVP |
| Auth | - | - | Single user local development, add Clerk/Auth.js later |

### Key Library Justifications

**Zustand over Redux/Jotai:**
- Simpler API, less boilerplate
- Sufficient for moderate state complexity
- Easy to learn and maintain solo

**shadcn/ui over Material-UI/Chakra:**
- **Full library available:** 40+ components (Form, Dialog, Table, Select, Toast, Tabs, etc.)
- **Install on-demand:** `npx shadcn@latest add <component>` - Only install what you need
- Copy-paste components (not npm package) - Full customization control
- Tailwind CSS integration - Medical-professional aesthetic easier to achieve
- Always fetch latest docs via shadcn/ui MCP before implementing

**motion.dev for Animations:**
- Modern animation library that replaces deprecated Framer Motion
- Industry-standard declarative API for complex animations and gestures
- Layout animations, page transitions, scroll-based effects
- Excellent TypeScript support
- Package name: `motion` (NOT `framer-motion`)
- Always fetch latest docs via context7 MCP before implementing

**bentogrid for Layouts:**
- Modern grid layout system inspired by bento box design
- Responsive grid patterns for dashboard and content organization
- Clean API for complex layouts without custom CSS
- Always fetch latest docs via context7 MCP before implementing

**Prisma over Drizzle/TypeORM:**
- Industry standard
- Excellent TypeScript support
- Migration system built-in
- pgvector extension support

**Biome over ESLint + Prettier:**
- Single tool (simpler config)
- 10-100x faster (Rust-based)
- Growing adoption in 2025

---

## 8. Complete Source Tree Structure

```
americano/                                  # Root monorepo
├── .env.local                              # Local environment variables
├── .env.example                            # Environment template
├── .gitignore
├── biome.json                              # Biome config (linting + formatting)
├── package.json                            # Root package.json
├── pnpm-workspace.yaml                     # pnpm workspace config
├── README.md
│
├── apps/
│   └── web/                                # Next.js application
│       ├── .next/                          # Build output (gitignored)
│       ├── public/                         # Static assets
│       │   ├── favicon.ico
│       │   └── images/
│       │
│       ├── src/
│       │   ├── app/                        # Next.js App Router
│       │   │   ├── layout.tsx              # Root layout
│       │   │   ├── page.tsx                # Dashboard (home page)
│       │   │   ├── globals.css             # Global styles (Tailwind directives)
│       │   │   │
│       │   │   ├── dashboard/              # Dashboard page
│       │   │   │   └── page.tsx
│       │   │   ├── study/                  # Study mode
│       │   │   │   └── page.tsx
│       │   │   ├── library/                # Content library
│       │   │   │   ├── page.tsx
│       │   │   │   └── [lectureId]/
│       │   │   │       └── page.tsx
│       │   │   ├── graph/                  # Knowledge graph
│       │   │   │   └── page.tsx
│       │   │   ├── progress/               # Analytics dashboard
│       │   │   │   └── page.tsx
│       │   │   ├── settings/               # User settings
│       │   │   │   └── page.tsx
│       │   │   │
│       │   │   └── api/                    # API routes
│       │   │       ├── content/
│       │   │       │   ├── upload/route.ts
│       │   │       │   ├── courses/route.ts
│       │   │       │   └── lectures/
│       │   │       │       ├── route.ts
│       │   │       │       └── [id]/route.ts
│       │   │       ├── learning/
│       │   │       │   ├── mission/
│       │   │       │   │   └── today/route.ts
│       │   │       │   ├── sessions/
│       │   │       │   │   ├── route.ts
│       │   │       │   │   └── [id]/
│       │   │       │   │       ├── review/route.ts
│       │   │       │   │       └── complete/route.ts
│       │   │       │   └── cards/
│       │   │       │       └── due/route.ts
│       │   │       ├── graph/
│       │   │       │   ├── search/route.ts
│       │   │       │   └── concepts/
│       │   │       │       ├── route.ts
│       │   │       │       └── [id]/route.ts
│       │   │       ├── validation/
│       │   │       │   ├── prompts/
│       │   │       │   │   └── next/route.ts
│       │   │       │   └── responses/route.ts
│       │   │       ├── analytics/
│       │   │       │   ├── events/route.ts
│       │   │       │   ├── patterns/route.ts
│       │   │       │   └── dashboard/route.ts
│       │   │       └── ai/
│       │   │           ├── chat/
│       │   │           │   └── stream/route.ts
│       │   │           └── generate/
│       │   │               └── cards/route.ts
│       │   │
│       │   ├── components/                 # React components
│       │   │   ├── ui/                     # shadcn/ui components
│       │   │   │   ├── button.tsx
│       │   │   │   ├── card.tsx
│       │   │   │   ├── dialog.tsx
│       │   │   │   └── ... (other shadcn components)
│       │   │   ├── dashboard/
│       │   │   │   ├── mission-card.tsx
│       │   │   │   ├── progress-summary.tsx
│       │   │   │   └── upcoming-reviews.tsx
│       │   │   ├── study/
│       │   │   │   ├── flashcard.tsx
│       │   │   │   ├── validation-prompt.tsx
│       │   │   │   └── session-progress.tsx
│       │   │   ├── library/
│       │   │   │   ├── lecture-list.tsx
│       │   │   │   ├── upload-button.tsx
│       │   │   │   └── course-selector.tsx
│       │   │   ├── graph/
│       │   │   │   ├── knowledge-graph.tsx
│       │   │   │   └── concept-detail.tsx
│       │   │   ├── analytics/
│       │   │   │   ├── retention-chart.tsx
│       │   │   │   ├── study-time-chart.tsx
│       │   │   │   └── mastery-dashboard.tsx
│       │   │   ├── ai/
│       │   │   │   ├── chat-fab.tsx         # Floating action button
│       │   │   │   └── chat-panel.tsx       # Chat interface
│       │   │   └── shared/
│       │   │       ├── navigation.tsx
│       │   │       └── error-boundary.tsx
│       │   │
│       │   ├── subsystems/                 # Modular subsystems
│       │   │   ├── content-processing/
│       │   │   │   ├── pdf-processor.ts
│       │   │   │   ├── content-analyzer.ts
│       │   │   │   ├── embedding-generator.ts
│       │   │   │   └── types.ts
│       │   │   ├── learning-engine/
│       │   │   │   ├── mission-generator.ts
│       │   │   │   ├── fsrs-scheduler.ts
│       │   │   │   ├── session-orchestrator.ts
│       │   │   │   └── types.ts
│       │   │   ├── knowledge-graph/
│       │   │   │   ├── graph-builder.ts
│       │   │   │   ├── semantic-search.ts
│       │   │   │   ├── concept-linker.ts
│       │   │   │   └── types.ts
│       │   │   ├── validation-engine/
│       │   │   │   ├── prompt-generator.ts
│       │   │   │   ├── response-evaluator.ts
│       │   │   │   ├── confidence-calibrator.ts
│       │   │   │   └── types.ts
│       │   │   └── behavioral-analytics/
│       │   │       ├── behavioral-analyzer.ts
│       │   │       ├── predictive-model.ts
│       │   │       ├── cognitive-load-monitor.ts
│       │   │       └── types.ts
│       │   │
│       │   ├── lib/                        # Shared utilities
│       │   │   ├── db.ts                   # Prisma client singleton
│       │   │   ├── api-response.ts         # API response helpers
│       │   │   ├── storage/
│       │   │   │   ├── index.ts            # Storage factory
│       │   │   │   ├── storage-provider.ts # Interface
│       │   │   │   ├── local-storage-provider.ts
│       │   │   │   └── supabase-storage-provider.ts
│       │   │   ├── ai/
│       │   │   │   ├── chatmock-client.ts  # ChatMock API wrapper
│       │   │   │   └── gemini-client.ts    # Gemini embeddings wrapper
│       │   │   └── utils.ts                # Misc utilities (cn, etc.)
│       │   │
│       │   └── store/                      # Zustand stores
│       │       ├── use-user-store.ts
│       │       ├── use-mission-store.ts
│       │       ├── use-study-session-store.ts
│       │       └── use-chat-store.ts
│       │
│       ├── prisma/
│       │   ├── schema.prisma               # Complete database schema
│       │   ├── migrations/                 # Prisma migrations
│       │   └── seed.ts                     # Optional seed data
│       │
│       ├── next.config.js                  # Next.js configuration
│       ├── tailwind.config.ts              # Tailwind configuration
│       ├── tsconfig.json                   # TypeScript configuration
│       └── package.json
│
├── services/
│   └── ocr-service/                        # Python PaddleOCR service (optional)
│       ├── main.py                         # FastAPI server
│       ├── ocr_processor.py                # PaddleOCR integration
│       ├── requirements.txt
│       ├── Dockerfile
│       └── README.md
│
├── docs/                                   # Documentation
│   ├── solution-architecture.md            # This file
│   ├── PRD-Americano-2025-10-14.md
│   ├── epics-Americano-2025-10-14.md
│   ├── ux-specification.md
│   ├── architecture-brief.md
│   └── bmm-workflow-status.md
│
└── scripts/                                # Utility scripts
    ├── migrate-storage.js                  # Local → Supabase migration
    └── setup-local-db.sh                   # PostgreSQL + pgvector setup
```

### Directory Organization Principles

**Modular Subsystems (`src/subsystems/`):**
- Each subsystem is self-contained
- Clear boundaries prevent tight coupling
- Easy to extract to microservice if needed

**API Routes Mirror Subsystems:**
- `/api/content/*` → `subsystems/content-processing/`
- `/api/learning/*` → `subsystems/learning-engine/`
- Clear 1:1 mapping for maintainability

**Components by Feature:**
- Organized by page/feature, not type
- `components/dashboard/` not `components/cards/`
- Easier to find and modify

**Shared Libraries (`src/lib/`):**
- Cross-cutting concerns (database, storage, AI clients)
- No business logic (that belongs in subsystems)

---

## 9. Architecture Cohesion Check

### Functional Requirements Coverage

This section validates that every functional requirement has clear architectural support.

| FR | Requirement | Subsystem | Database Models | API Endpoints | Status |
|----|-------------|-----------|-----------------|---------------|--------|
| **FR1** | PDF Lecture Processing | Content Processing | Lecture, ContentChunk, LearningObjective | /api/content/upload, /api/content/processing/:id | ✅ Complete |
| **FR2** | Personal Learning GPS | Learning Engine | Mission, Card, Review | /api/learning/mission/today, /api/learning/mission/generate | ✅ Complete |
| **FR3** | Knowledge Graph | Knowledge Graph | Concept, ConceptRelationship | /api/graph/search, /api/graph/concepts | ✅ Complete |
| **FR4** | Spaced Repetition Engine | Learning Engine | Card, Review, StudySession | /api/learning/cards/due, /api/learning/sessions/:id/review | ✅ Complete |
| **FR5** | Understanding Validation | Validation Engine | ValidationPrompt, ValidationResponse | /api/validation/prompts/next, /api/validation/responses | ✅ Complete |
| **FR6** | Behavioral Pattern Analysis | Behavioral Analytics | BehavioralEvent, LearningPattern | /api/analytics/events, /api/analytics/patterns | ✅ Complete |
| **FR7** | Content Analysis | Content Processing | LearningObjective | /api/ai/extract/objectives | ✅ Complete |
| **FR8** | Adaptive Difficulty | Behavioral Analytics | PerformancePrediction | /api/analytics/predictions | ✅ Complete |
| **FR9** | Session Orchestration | Learning Engine | StudySession | /api/learning/sessions | ✅ Complete |
| **FR10** | Progress Analytics | Behavioral Analytics | ComprehensionMetric, BehavioralEvent | /api/analytics/dashboard | ✅ Complete |
| **FR11** | User Authentication | Application Shell | User | Deferred for MVP | ⚠️ Deferred |
| **FR12** | Content Management | Content Processing | Course, Lecture | /api/content/courses, /api/content/lectures | ✅ Complete |
| **FR13** | Multi-Platform Web App | Application Shell | N/A (Frontend) | All pages in /app | ✅ Complete |
| **FR14** | Integration Capabilities | Content Processing | Lecture | /api/content/upload (bulk import ready) | ✅ Complete |
| **FR15** | Search & Discovery | Knowledge Graph | ContentChunk (embeddings) | /api/graph/search | ✅ Complete |

**Summary:**
- ✅ **14/15 FRs fully supported** with database models, API endpoints, and subsystem implementations
- ⚠️ **1 FR deferred** (FR11 - Authentication) intentionally for single-user MVP
- **100% of MVP-critical FRs covered**

### Epic to Architecture Mapping

| Epic | Subsystem(s) | Database Tables | API Routes | Components | Status |
|------|--------------|-----------------|------------|------------|--------|
| **Epic 1: Core Learning Infrastructure** | Content Processing, Application Shell | User, Course, Lecture, ContentChunk, LearningObjective | /api/content/* | library/*, settings/*, shared/* | ✅ Complete |
| **Epic 2: Personal Learning GPS** | Learning Engine | Mission, Card, Review, StudySession | /api/learning/* | dashboard/mission-card, study/* | ✅ Complete |
| **Epic 3: Knowledge Graph** | Knowledge Graph | Concept, ConceptRelationship | /api/graph/* | graph/*, shared/search | ✅ Complete |
| **Epic 4: Understanding Validation** | Validation Engine | ValidationPrompt, ValidationResponse, ComprehensionMetric | /api/validation/* | study/validation-prompt, progress/* | ✅ Complete |
| **Epic 5: Behavioral Learning Twin** | Behavioral Analytics | BehavioralEvent, LearningPattern, PerformancePrediction | /api/analytics/* | progress/analytics/* | ✅ Complete |

**All 5 epics have complete architectural support.**

### Non-Functional Requirements Coverage

| NFR | Requirement | Architectural Support | Status |
|-----|-------------|----------------------|--------|
| **NFR1** | Performance (<3s PDF processing, <2s page loads, <1s search) | Prisma ORM, pgvector indexes, Next.js SSR/RSC, synchronous processing for MVP | ✅ Supported |
| **NFR2** | Reliability (95% uptime, graceful degradation) | Error boundaries, API error handling, Prisma connection pooling | ✅ Supported |
| **NFR3** | Security & Privacy (encryption, FERPA compliance) | Storage abstraction (local-first), no external tracking, auth deferred for MVP | ✅ Supported |
| **NFR4** | User Experience (<5 min setup, WCAG 2.1 AA, mobile-responsive) | shadcn/ui accessible components, Tailwind responsive design, simple onboarding | ✅ Supported |
| **NFR5** | Maintainability (modular architecture, API-first) | 6 clear subsystems, RESTful APIs, TypeScript type safety, monorepo structure | ✅ Supported |
| **NFR6** | Cost Efficiency ($1-2/month MVP target) | Local-first development, ChatMock (free), PostgreSQL (local), no external services | ✅ Supported |
| **NFR7** | Data Quality (>90% medical content accuracy) | PaddleOCR for medical text, GPT-5 for objective extraction, validation engine | ✅ Supported |
| **NFR8** | Integration & Interoperability (RESTful API, standard formats) | RESTful Next.js API routes, JSON responses, export capabilities planned | ✅ Supported |

**All 8 NFRs architecturally supported.**

### Technology Stack Gaps

**None identified.** All required technologies specified and justified.

### Missing Components

**None for MVP.** The following are intentionally deferred:
- Authentication system (FR11) - Single user local development
- Testing infrastructure - Add when deploying to production
- CI/CD pipelines - Add when deploying to production
- Monitoring & observability - Add when deploying to production
- Background job processing - Synchronous acceptable for MVP

---

## 10. Summary and Next Steps

### Architecture Summary

**Americano Solution Architecture** is a complete technical blueprint for building an AI-powered medical education platform as a Level 3 greenfield web application.

**Key Architectural Decisions:**
1. **Pattern:** Modular Monolith (not microservices) - Right-sized for MVP, extraction path available
2. **Repository:** Monorepo with pnpm workspaces - Single codebase, unified tooling
3. **Subsystems:** 6 clear boundaries mapping to 5 epics + UI shell
4. **Database:** PostgreSQL 16+ with pgvector - Complete Prisma schema with 20+ models
5. **API:** RESTful Next.js API Routes - Organized by subsystem with consistent patterns
6. **Storage:** Abstraction layer (local → cloud) - Zero-code migration path
7. **Stack:** Modern, boring, proven - Next.js, React, TypeScript, Tailwind, Zustand, Prisma

**Architecture Validation:**
- ✅ **14/15 FRs fully architecturally supported** (1 intentionally deferred for MVP)
- ✅ **All 5 epics mapped** to subsystems, database models, APIs, and UI components
- ✅ **All 8 NFRs supported** with specific architectural patterns
- ✅ **Complete source tree defined** - Ready for implementation
- ✅ **Technology decisions documented** - Every library justified

**Philosophy:**
- Simple, boring, working technology over cutting-edge hype
- Build features, not infrastructure
- Local-first development with cloud portability
- Modular boundaries prevent tight coupling
- Add complexity when needed, not preemptively

### Implementation Readiness

**This architecture document provides:**

1. **Complete Database Schema** - Copy-paste Prisma schema ready for `prisma migrate dev`
2. **API Contract Specification** - All 40+ endpoints documented with request/response formats
3. **Storage Abstraction Code** - Working TypeScript implementations for local and cloud storage
4. **Source Tree Structure** - Exact directory layout with file purposes
5. **Technology Stack** - Specific libraries with version guidance and rationale

**What developers need to start:**
- ✅ Complete requirements (PRD)
- ✅ Complete UX specification
- ✅ Complete architecture (this document)
- ✅ Epic breakdown with user stories (separate document)

**What's NOT needed before starting:**
- ❌ Detailed tech specs (create just-in-time per epic)
- ❌ Testing strategy (add when deploying to production)
- ❌ Deployment pipeline (local development first)

### Immediate Next Steps

**Step 1: Environment Setup (Day 1)**
```bash
# Clone/create repository
git init americano
cd americano

# Initialize Next.js project
pnpm create next-app@latest apps/web --typescript --tailwind --app

# Set up PostgreSQL + pgvector (latest stable versions)
brew install postgresql
brew install pgvector
createdb americano
psql americano -c "CREATE EXTENSION vector;"

# Initialize Prisma
cd apps/web
npx prisma init

# Copy schema from this document to prisma/schema.prisma
# Run first migration
npx prisma migrate dev --name init

# Install dependencies
pnpm install zustand @supabase/supabase-js reactflow
pnpm install -D biome

# Create .env.local
echo "DATABASE_URL=postgresql://localhost/americano" > .env.local
echo "STORAGE_MODE=local" >> .env.local
echo "LOCAL_STORAGE_PATH=~/americano-data/pdfs" >> .env.local
echo "CHATMOCK_URL=http://localhost:8801" >> .env.local
```

**Step 2: Implement Epic 1 - Core Learning Infrastructure (Weeks 1-2)**
- Create upload flow (PDF upload UI + API)
- Implement storage abstraction layer
- Integrate PaddleOCR for text extraction
- Connect ChatMock for objective extraction
- Test with real PNWU lecture PDFs

**Step 3: Implement Epic 2 - Personal Learning GPS (Weeks 3-4)**
- Implement FSRS algorithm
- Build mission generation logic
- Create study session UI
- Implement card review flow
- Test daily mission workflow

**Step 4-6: Continue with remaining epics** following the phased roadmap in the PRD.

### Development Workflow Recommendation

**For each epic:**

1. **Read epic user stories** (from epics document)
2. **Implement database models** (already defined in this architecture)
3. **Build API endpoints** (specs provided in this architecture)
4. **Create UI components** (referencing UX specification)
5. **Integrate subsystem logic** (directory structure provided)
6. **Test manually** (you are the user, use it yourself)
7. **Iterate based on real usage**

**No need for:**
- Detailed tech specs before starting (architecture is sufficient)
- Extensive planning meetings (you're solo)
- Code reviews (but consider self-review before committing)

### Success Criteria

**Architecture is successful if:**
- ✅ Developers can start implementing Epic 1 immediately
- ✅ All 15 FRs are implementable using this architecture
- ✅ Local → cloud migration is straightforward (no architectural changes)
- ✅ Subsystems remain modular and loosely coupled during implementation

---

## Document Status

**Status:** ✅ COMPLETE - Ready for Implementation

**Version:** 1.0
**Date:** 2025-10-14
**Author:** Winston (Architect) with Kevy

**Prerequisites Validated:**
- ✅ PRD: Complete (15 FRs, 5 epics, 8 NFRs)
- ✅ UX Specification: Complete (3 personas, 5 user flows, 10 screens)
- ✅ Architecture Brief: Complete (technical requirements, stack decisions)

**Deliverables:**
- ✅ Architecture pattern definition (Modular Monolith)
- ✅ Complete database schema (20+ Prisma models with pgvector)
- ✅ API design specification (40+ endpoints documented)
- ✅ Storage abstraction layer (local → cloud portability)
- ✅ Technology decision table (all libraries justified)
- ✅ Complete source tree structure (ready for implementation)
- ✅ Architecture cohesion check (all FRs/NFRs/Epics covered)

**Next Phase:** Phase 4 - Implementation
**Next Workflow:** `dev-story` (Scrum Master generates story context, Developer implements)

**Ready to build.** 🚀

---

