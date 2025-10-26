---
title: "Agent Development Protocol"
description: "Mandatory protocol for all agents contributing to Americano, including documentation fetch rules, quality gates, and technology standards."
type: "Guide"
status: "Active"
version: "1.1"
owner: "Kevy"
review_cadence: "Per Change"
created_date: "2025-10-23T15:00:00-07:00"
last_updated: "2025-10-24T10:05:00-07:00"
last_reviewed: "2025-10-24T10:05:00-07:00"
depends_on:
  - docs/architecture/ADR-006-motion-standard.md
  - docs/frontmatter-standard.md
affects:
  - apps/web
  - apps/ml-service
related_adrs:
  - docs/architecture/ADR-004-oklch-glassmorphism.md
  - docs/architecture/ADR-006-motion-standard.md
audience:
  - agents
  - developers
technical_level: "Intermediate"
tags: ["protocol", "quality", "docs", "animation", "prisma"]
search_priority: "critical"
lifecycle:
  stage: "Active"
---

# Agent Development Protocol

**Project:** Americano - AI-Powered Medical Education Platform
**Last Updated:** 2025-10-23
**Status:** MANDATORY - All agents must follow this protocol
**Documentation Index:** [docs/index.md](./docs/index.md) - Complete project documentation

---

## CRITICAL: Pre-Implementation Checklist

**BEFORE writing ANY code file, ALL agents MUST:**

### 1. Stop and Identify
Ask: "Am I about to use a library, framework, or component?"

### 2. Fetch Latest Documentation
**If YES → STOP and fetch current docs:**

- **Backend/API/Library Code** → Use **context7 MCP**
  - Next.js App Router routes
  - Prisma ORM
  - OpenAI SDK
  - Google Gemini SDK
  - Any npm package
  - File upload handling
  - Authentication libraries

- **UI Components** → Use **shadcn/ui MCP**
  - All React components
  - Forms, buttons, dialogs, cards
  - Layout components
  - Any UI elements

- **Both Required?** → Use **BOTH MCPs**

### 3. Explicit Announcement
Before implementation, agent MUST state:
```
"Fetching latest [TECHNOLOGY] documentation from [context7 MCP / shadcn/ui MCP]..."
```

### 4. Review Documentation
- Verify current API patterns
- Check for breaking changes
- Identify best practices
- Note deprecation warnings

### 5. Then Implement
Use **verified current patterns only** - never memory/training data

---

## Violation Detection & Remediation

### Agent Self-Check
If agent catches itself:
- ❌ Writing code without fetching docs first
- ❌ Saying "I know how this works"
- ❌ Using patterns from memory/training data
- ❌ Implementing without explicit doc fetch announcement
- ❌ **Updating documentation without verifying package names/versions**
- ❌ **Assuming technology relationships based on training data**

### Immediate Remediation
Agent MUST:
1. 🛑 **STOP immediately**
2. 🔄 **Delete what was just written**
3. 📚 **Fetch the proper documentation**
4. ✅ **Start over using verified patterns**

### User Accountability
If user catches violation:
- User should **interrupt immediately**
- Agent acknowledges mistake
- Agent follows remediation steps above
- Agent analyzes root cause and updates protocol if needed

### Special Case: Documentation Updates
**EXTRA VIGILANCE REQUIRED** when updating:
- AGENTS.MD (this file)
- solution-architecture.md
- Technology stack decisions
- Package/library names
- **External API parameters** (embedding dimensions, token limits, model names)

**Why:** Documentation errors propagate to all future implementations
**Rule:** Documentation must be MORE rigorous than code, not less

**Lesson Learned (2025-10-15 - Gemini Embedding Error):**
- ❌ Architecture doc said `gemini-embedding-001 (3072 dimensions)`
- ✅ Actual: `gemini-embedding-001` default is 768, supports 768/1536/3072 via `output_dimensionality`
- 🚨 **Impact**: 3072 exceeded pgvector 2000-dim limit, broke semantic search indexes
- 🔧 **Fix**: Changed to 1536 (middle-ground, within limits)
- 📚 **Prevention**: ALWAYS verify API specs via context7 MCP before documenting, especially:
  - Model names (embedding-001 vs text-embedding-004)
  - Default vs configurable parameters
  - Dimension/size constraints affecting database schema

---

## Examples

### ✅ CORRECT: API Route Implementation
```
Agent: "Fetching latest Next.js App Router documentation from context7 MCP..."
[Fetches docs]
Agent: "Based on latest Next.js 15 docs, implementing route handler with..."
[Implements using verified pattern]
```

### ✅ CORRECT: UI Component Implementation
```
Agent: "Fetching latest shadcn/ui Button component from shadcn MCP..."
[Fetches component]
Agent: "Installing and using shadcn Button component with current API..."
[Implements using verified component]
```

### ❌ INCORRECT: Implementing from Memory
```
Agent: "Creating upload API route with Next.js..."
[Starts writing code without fetching docs]
```
**VIOLATION** - Must stop and fetch docs first

---

## Technology Stack Reference

### Always Use Context7 For:
- Next.js (App Router, Server Components, Server Actions)
- React (hooks, patterns, latest features)
- Prisma (schema, queries, migrations)
- TypeScript (latest syntax, type patterns)
- @google/generative-ai (Gemini SDK)
- openai (OpenAI SDK)
- @supabase/supabase-js
- motion (motion.dev - modern animation library, replaces deprecated Framer Motion)
- Any other npm package

### Always Use shadcn/ui MCP For:
- **ALL shadcn/ui components** - The full library is available
- Form elements (Form, Input, Textarea, Select, Checkbox, Radio, etc.)
- Layout components (Card, Separator, Tabs, Accordion, Sidebar, etc.)
- Dialog/Modal components (Dialog, Sheet, Popover, Tooltip, DropdownMenu, etc.)
- Navigation components (NavigationMenu, Breadcrumb, Pagination, Sidebar, etc.)
- Data display (Table, DataTable, Badge, Avatar, etc.)
- Feedback (Toast, Alert, Progress, Skeleton, etc.)

**Installation:** Use `npx shadcn@latest add <component>` to install components on-demand
**Documentation:** Fetch latest component API from shadcn/ui MCP before implementation

**Global Layout Note:** Application uses shadcn/ui Sidebar component (`apps/web/src/components/app-sidebar.tsx`) with:
- `SidebarProvider` wrapping the app in root layout
- `SidebarInset` for main content area
- Glassmorphism styling (bg-white/80 backdrop-blur-md, NO gradients)
- OKLCH colors from design system
- Icon collapsible mode for responsive layout

### Always Use Context7 For Layout/Animation Libraries:
- motion.dev (package: `motion`) — modern animation library replacing Framer Motion; use `motion/react` in React
- bentogrid — modern grid layouts, bento grid patterns, responsive layouts

**Installation:** Use `npm i motion` for motion.dev
**Documentation:** Fetch latest API from context7 MCP before implementation
**IMPORTANT:** motion.dev is the modern replacement - DO NOT use framer-motion (deprecated)

### No MCP Needed For:
- Simple TypeScript interfaces (no library-specific patterns)
- Basic utility functions (no framework dependencies)
- Configuration files (.env, etc.)
- Plain CSS/Tailwind (unless using shadcn components or layout libraries)

### Tailwind CSS v4 Specific Rules:
- ✅ **USE:** Tailwind v4 CSS-first configuration via `@theme` directive in globals.css
- ✅ **USE:** Built-in animations (spin, pulse, bounce, etc.)
- ❌ **DO NOT USE:** tailwindcss-animate package (Tailwind v3 only, incompatible with v4)
- ❌ **DO NOT USE:** tailwind.config.ts/js (deprecated in v4)
- ✅ **FOR ANIMATIONS:** Use Tailwind v4 built-in animations now, motion.dev for advanced later

### Design System Rules (2025-2026 Redesign):
- ❌ **NEVER use gradients** (bg-gradient-*, linear-gradient, radial-gradient)
- ❌ **NEVER use glassmorphism** (backdrop-blur on cards - outdated 2024 trend)
- ✅ **ALWAYS use OKLCH color space** for colors (not hex, not HSL, not RGB)
  - Format: `oklch(L C H)` where L=lightness (0-1), C=chroma (0-0.4), H=hue (0-360)
  - Example: `oklch(0.7 0.15 230)` for blue
- ✅ **ALWAYS use design system tokens** from `@/lib/design-system`
  - Colors: Import from `colors.ts` (light/dark modes, semantic, gamification)
  - Animations: Import from `animations.ts` (spring physics, variants)
  - Typography: Import from `typography.ts` (Figtree headings, Inter body)
  - Spacing: Import from `spacing.ts` (4px grid system)
- Rationale: Perceptual uniformity, better accessibility, consistent brightness across hues, Apple minimalism aesthetic

### Package Manager Standard
- Use npm workspaces (Node 20+, npm 10+). Do not add pnpm/yarn lockfiles.
- If a pnpm lockfile appears, remove it and run `npm install` to regenerate consistent locks.

### Prisma Standards
- Prisma JS/TS: Use Prisma v6 across the repo; generator may be `prisma-client-js` or `prisma-client` with explicit `output`.
- Prisma Python: Existing usage in `apps/ml-service` is TEMPORARY and considered deprecated. Do not add new code with Prisma Python; prefer SQLAlchemy in Python. Migration plan tracked in ADR backlog.

---

## Agent Roles & Responsibilities

### All Agents MUST:
1. Follow this protocol without exception
2. Fetch docs before implementation
3. Announce doc fetching explicitly
4. Use only verified current patterns
5. Self-correct immediately on violation

### Specific Reminders:
- **DEV agents:** Verify library APIs before every subsystem implementation
- **Frontend-developer agents:** Use design system (`apps/web/src/lib/design-system/`) for ALL UI work
  - Import tokens: `import { springSubtle, colors, spacing } from '@/lib/design-system'`
  - Fetch shadcn/ui docs via MCP before adding components
  - Follow Apple minimalism aesthetic (NO glassmorphism, NO gradients)
  - Test dark mode and `prefers-reduced-motion` for accessibility
- **PM agents:** Check latest workflow patterns when creating stories
- **Architect agents:** Validate architectural patterns against current docs

---

## Consequences of Violation

### Technical Debt:
- Outdated patterns → difficult debugging
- Deprecated APIs → breaking changes in future
- Incorrect implementations → wasted time refactoring

### User Trust:
- Pattern violations → loss of confidence
- Repeated mistakes → frustration
- Ignoring tools → undermines investment in MCPs

---

## Protocol Updates

This document should be updated when:
- New MCPs are added to the project
- New libraries/frameworks are adopted
- Protocol violations reveal gaps
- User feedback suggests improvements

### Documentation Update Protocol (Meta-Protocol)

**CRITICAL:** When updating this document or any architecture documentation with new technologies:

1. **Stop and Verify** - Do NOT assume package names or relationships
2. **Fetch Latest Docs** - Use context7 MCP to verify:
   - Exact package name (npm package name)
   - Current version and status (deprecated? replaced?)
   - Official documentation URL
   - Relationship to similar libraries
3. **Explicit Announcement** - State what you're verifying: "Verifying motion.dev package details via context7 MCP..."
4. **Cross-Check User Intent** - If user says "motion.dev", verify that's the actual package, not an alias
5. **Document Explicitly** - State package name AND what it replaces/deprecates

**Example Violation:**
- User says: "Use motion.dev"
- Agent assumes: "Oh, that's Framer Motion's new domain"
- Agent writes: "framer-motion (motion.dev)"
- ❌ WRONG - Should have verified first!

**Correct Process:**
- User says: "Use motion.dev"
- Agent: "Verifying motion.dev package details via context7 MCP..."
- Agent verifies: Package is `motion`, replaces deprecated `framer-motion`
- Agent writes: "motion.dev (package: `motion`, replaces deprecated Framer Motion)"
- ✅ CORRECT

**Self-Accountability Check:**
Before committing documentation updates, ask:
- "Did I verify this with context7 MCP?"
- "Am I following the protocol I'm documenting?"
- "Did I use training data instead of current docs?"

**Last Protocol Update:** 2025-10-23 (Added documentation system references - docs/index.md, ADR system, quality gates)
**Next Review:** After next epic completion or quarterly (2026-01-23)

---

## Documentation System for Agents

**CRITICAL:** All agents must be aware of and use the project documentation system.

### Documentation Entry Points

1. **Master Index:** [docs/index.md](./docs/index.md)
   - Single source of truth for all documentation
   - 10 essential documentation areas
   - Complete navigation to all resources

2. **Architecture Decision Records:** [docs/architecture/ADR-INDEX.md](./docs/architecture/ADR-INDEX.md)
   - 5 ADRs documenting critical technical decisions
   - Context, alternatives considered, rationale for each decision
   - Supersedes memory/training data for architectural patterns

3. **API Contracts:** [docs/api-contracts.md](./docs/api-contracts.md)
   - Canonical API documentation (40+ Next.js routes, 5 FastAPI endpoints)
   - OpenAPI specification reference
   - Authentication requirements

4. **Data Models:** [docs/data-models.md](./docs/data-models.md)
   - 77 Prisma models documented
   - 27 strategic indexes
   - pgvector configuration

5. **Frontmatter Standard:** [docs/frontmatter-standard.md](./docs/frontmatter-standard.md)
   - Template for all documentation metadata
   - Required fields for documentation updates
   - ISO 8601 timestamp format

### Documentation Quality Gates

**Before updating ANY documentation:**

1. **Read the Frontmatter Standard:** [docs/frontmatter-standard.md](./docs/frontmatter-standard.md)
2. **Check existing ADRs:** [docs/architecture/ADR-INDEX.md](./docs/architecture/ADR-INDEX.md)
3. **Verify with context7 MCP:** Fetch latest library/framework docs
4. **Add proper frontmatter:** Include all required metadata fields
5. **Update timestamps:** Use ISO 8601 format with timezone
6. **Run quality checks:**
   ```bash
   npm run lint:docs      # Markdown linting
   npm run check:links    # Link verification
   vale docs/             # Grammar checking (optional locally)
   ```

**Quality Gate CI:** All documentation changes are automatically checked in GitHub Actions (`.github/workflows/docs-quality.yml`)

### Documentation Update Protocol for Agents

When creating or updating documentation:

1. ✅ **Add frontmatter** using template from [docs/frontmatter-standard.md](./docs/frontmatter-standard.md)
2. ✅ **Cross-link** to related documentation (use `depends_on`, `affects`, `related_adrs` fields)
3. ✅ **Update index** if adding new major documentation
4. ✅ **Follow BMAD conventions** for agent/workflow READMEs
5. ✅ **Verify links** are not broken (`npm run check:links`)
6. ✅ **ISO 8601 timestamps** with timezone (e.g., `2025-10-23T15:00:00-07:00`)

### When to Create an ADR

Create an Architecture Decision Record when:
- Making a significant architectural choice (e.g., technology stack, design pattern)
- Choosing between 3+ viable alternatives
- Decision impacts multiple epics or has long-term consequences
- Decision involves trade-offs that need documentation

**ADR Template:** [docs/architecture/adr-template.md](./docs/architecture/adr-template.md)

**Process:**
1. Copy template to `docs/architecture/ADR-XXX-short-title.md`
2. Fill in all sections (Context, Options, Decision, Consequences)
3. Add frontmatter with proper metadata
4. Update [docs/architecture/ADR-INDEX.md](./docs/architecture/ADR-INDEX.md)
5. Get user (Kevy) approval before marking as "Accepted"

---

## Story 2.1 Implementation Patterns

### Learning Objective Extraction with ChatMock (GPT-5)

**Pattern:** AI-powered extraction from medical lecture content with board exam relevance

**Key Implementation:**
```typescript
// ChatMock API call with medical education context
const systemPrompt = `You are a medical education expert analyzing lecture content for osteopathic medical students.
Extract learning objectives that preserve precise medical terminology and map to USMLE/COMLEX board exam topics.`;

const response = await client.chat.completions.create({
  model: 'gpt-5',
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: lectureContent }
  ],
  temperature: 0.3,  // Low for consistency
  max_tokens: 16000, // High to avoid truncation
});
```

**Board Exam Tagging:**
- USMLE Step 1/2/3: Subject-based tags (e.g., `USMLE-Step1-Cardio`, `USMLE-Step2-Neurology`)
- COMLEX Level 1/2/3: DO-specific tags (e.g., `COMLEX-L1-OPP`, `COMLEX-L2-IM`)
- NBME Subject Exams: Organ system tags (e.g., `NBME-Cardiovascular`, `NBME-Renal`)

**Database Schema:**
```prisma
model LearningObjective {
  id             String              @id @default(cuid())
  objective      String              @db.Text
  complexity     ObjectiveComplexity @default(INTERMEDIATE)
  pageNumber     Int?
  isHighYield    Boolean             @default(false)
  boardExamTags  String[]            // USMLE/COMLEX/NBME tags
  extractedBy    String              @default("gpt-5")

  prerequisites  ObjectivePrerequisite[] @relation("Objective")
  dependents     ObjectivePrerequisite[] @relation("Prerequisite")
}

enum ObjectiveComplexity {
  BASIC        // Foundational knowledge
  INTERMEDIATE // Application and integration
  ADVANCED     // Analysis and synthesis
}

model ObjectivePrerequisite {
  id             String @id @default(cuid())
  objectiveId    String
  prerequisiteId String
  strength       Float  @default(1.0)

  @@unique([objectiveId, prerequisiteId])
}
```

**Prerequisite Mapping:**
- Fuzzy text matching with 80% similarity threshold (Levenshtein distance)
- Automatic linking of prerequisite concepts mentioned by ChatMock
- Circular dependency validation

**Medical Terminology Preservation:**
- Explicit prompt instructions to use precise medical terms
- Example: "cardiac conduction system" not "heart signals"
- Minimum 10-character validation for objective length

**High-Yield Identification:**
- Board exam relevance scoring
- Clinically critical topics
- Frequently tested concepts
- Visual indicator: Gold star badge in UI

---

## Commitment Statement

**Every agent working on Americano commits to:**

> "I will fetch the latest documentation using context7 MCP or shadcn/ui MCP before implementing any code that depends on external libraries, frameworks, or UI components. I will explicitly announce what I'm fetching. I will use only verified current patterns. I will self-correct immediately if I catch myself violating this protocol."

---

**This is non-negotiable. This is how we build world-class software.**
