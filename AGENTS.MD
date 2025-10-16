# Agent Development Protocol

**Project:** Americano - AI-Powered Medical Education Platform
**Last Updated:** 2025-10-14
**Status:** MANDATORY - All agents must follow this protocol

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
- **motion.dev:** Modern animation library (replaces deprecated Framer Motion), animations, gestures, layout animations, page transitions
- **bentogrid:** Modern grid layouts, bento grid patterns, responsive layouts

**Installation:** Use `pnpm add motion` for motion.dev
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

### Design System Rules:
- ❌ **NEVER use gradients** (bg-gradient-*, linear-gradient, radial-gradient)
- ✅ **ALWAYS use OKLCH color space** for colors (not hex, not HSL, not RGB)
  - Format: `oklch(L C H)` where L=lightness (0-1), C=chroma (0-0.4), H=hue (0-360)
  - Example: `oklch(0.7 0.15 230)` for blue
  - Rationale: Perceptual uniformity, better accessibility, consistent brightness across hues

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

**Last Protocol Update:** 2025-10-15 (Story 2.1: Learning Objective Extraction - Added board exam tagging patterns, ChatMock prompt engineering for medical education)
**Next Review:** After Epic 2 completion

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
