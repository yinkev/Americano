# Incident Report: Unauthorized Neon Database Dependency

**Date:** 2025-10-16
**Severity:** MEDIUM
**Category:** Architecture Violation, Dependency Management
**Status:** IDENTIFIED - REMEDIATION IN PROGRESS

---

## Executive Summary

During Story 3.2 (Knowledge Graph) build verification, we discovered that `@neondatabase/serverless` was introduced in Story 3.1 without architectural review or documentation. The dependency was used incorrectly, causing TypeScript build failures, and violates our principle of codebase consistency (Prisma is the established database client).

**Impact:**
- Build failures blocking Story 3.2 deployment
- Technical debt introduced (inconsistent database access patterns)
- Unnecessary dependency added to project
- Type safety compromised due to incorrect API usage

**Root Cause:** Agent implementing Story 3.1 made architectural decision without following proper protocol.

---

## Timeline of Events

### **2025-10-16 (Story 3.1 Implementation)**
**Agent:** Unknown (implementing Story 3.1 - Semantic Search)
**Action:** Introduced `@neondatabase/serverless` dependency
**Commit:** `1919d0d` - "feat(epic-3): Complete Story 3.1 - Semantic Search Implementation"

**What Happened:**
1. Agent created `src/lib/semantic-search-service.ts`
2. Agent added `@neondatabase/serverless: ^1.0.2` to package.json
3. Agent wrote code using Neon's `sql` function
4. Agent committed changes without architectural review

**Evidence:**
```typescript
// File: src/lib/semantic-search-service.ts
/**
 * Architecture:
 * - Uses @neondatabase/serverless for edge-compatible Postgres queries
 * - Leverages pgvector extension for vector operations
 */

import { neon } from '@neondatabase/serverless'
import { embeddingService } from './embedding-service'

export class SemanticSearchService {
  private sql: ReturnType<typeof neon>

  constructor(connectionString?: string) {
    this.sql = neon(dbUrl)
  }
}
```

---

### **2025-10-16 (Story 3.2 Build Verification)**
**Agent:** Amelia (DEV agent) + TypeScript-pro agent
**Action:** Discovered build failures caused by Neon type errors

**What Happened:**
1. After fixing 81 TypeScript errors, build still failed
2. Error: `Type error: Argument of type 'string' is not assignable to parameter of type 'TemplateStringsArray'`
3. Investigation revealed Neon was used incorrectly (API mismatch)
4. User (Kevy) questioned: "What is neondatabase where did it come from?"
5. Discovery: Neon was never discussed, reviewed, or documented

**Error Evidence:**
```typescript
// WRONG: Agent tried to use Neon like a regular SQL client
const query = `SELECT * FROM table WHERE id = $1`
const rows = await this.sql(query, params)  // ❌ Type error

// CORRECT: Neon requires tagged template literals
const rows = await this.sql`SELECT * FROM table WHERE id = ${param}`
```

---

## Root Cause Analysis

### **1. Protocol Violation: No context7 MCP Usage**

**AGENTS.MD Requirement (MANDATORY):**
```markdown
## CRITICAL: Pre-Implementation Checklist

**BEFORE writing ANY code file, ALL agents MUST:**

### 2. Fetch Latest Documentation
**If YES → STOP and fetch current docs:**
- **Backend/API/Library Code** → Use **context7 MCP**
```

**What Should Have Happened:**
```
Agent: "Fetching latest @neondatabase/serverless documentation from context7 MCP..."
[Agent reads official Neon docs]
Agent: "Based on latest docs, Neon requires tagged template literals..."
[Agent implements correctly]
```

**What Actually Happened:**
- ❌ Agent did NOT fetch documentation from context7 MCP
- ❌ Agent did NOT announce documentation fetching
- ❌ Agent used training data/memory to implement Neon
- ❌ Agent implemented API incorrectly

**Violation:** CRITICAL - AGENTS.MD §2, §3 not followed

---

### **2. Architectural Decision Without Review**

**Missing:** Architectural Decision Record (ADR) for database client choice

**Question Never Asked:**
> "Should we use Neon for vector queries or stick with Prisma?"

**Comparison Never Done:**

| Criterion | Neon | Prisma | Winner |
|-----------|------|--------|--------|
| **Edge Compatible** | ✅ Yes | ❌ No | Neon |
| **Consistent with codebase** | ❌ No (only file) | ✅ Yes (everywhere) | Prisma |
| **Type safety** | ⚠️ Complex | ✅ Excellent | Prisma |
| **Vector query support** | ✅ Direct SQL | ✅ $queryRawUnsafe | Tie |
| **Maintenance burden** | ❌ New dependency | ✅ Existing | Prisma |
| **Edge deployment needed?** | ❓ Unknown | N/A | Unknown |

**Decision Made:** Neon (without analysis)
**Decision Should Have Been:** Prisma (until edge deployment required)

---

### **3. No Documentation of Architectural Choice**

**Missing Files:**
- ❌ No ADR: `docs/architecture/adr-003-database-client-for-vector-queries.md`
- ❌ No update to: `docs/solution-architecture.md` (Technology Stack section)
- ❌ No justification in: Story 3.1 completion notes

**Result:** Future developers (including Kevy) had no idea why Neon was chosen.

---

### **4. Incorrect API Usage (Due to No Documentation Fetching)**

**Neon's Actual API (from official docs):**
```typescript
// CORRECT: Tagged template literal
import { neon } from '@neondatabase/serverless'
const sql = neon(process.env.DATABASE_URL)

const result = await sql`
  SELECT * FROM users WHERE id = ${userId}
`
```

**Agent's Implementation (WRONG):**
```typescript
// WRONG: String concatenation style
const query = `SELECT * FROM users WHERE id = $1`
const result = await this.sql(query, [userId])  // ❌ Type error
```

**Why This Happened:** Agent didn't fetch docs, relied on memory of PostgreSQL clients (pg, node-postgres) which DO use string + params array.

---

## Impact Assessment

### **Technical Debt Created**

1. **Inconsistent Database Access Patterns**
   - 99% of codebase uses Prisma
   - 1% uses Neon (semantic-search-service.ts only)
   - Developers must learn two APIs

2. **Type Safety Compromised**
   - Neon returns `any` types
   - Prisma returns typed results
   - Increased risk of runtime errors

3. **Build Failures**
   - TypeScript cannot compile due to incorrect API usage
   - Blocks Story 3.2 deployment
   - Wastes development time debugging

4. **Unnecessary Dependency**
   - `@neondatabase/serverless: ^1.0.2` added to package.json
   - Increases bundle size
   - Increases security surface area
   - Requires maintenance

### **Time Wasted**

| Activity | Time Lost |
|----------|-----------|
| Debugging TypeScript errors | 30 mins |
| Investigating "Where did Neon come from?" | 15 mins |
| Documenting incident | 30 mins |
| Replacing Neon with Prisma (pending) | 15 mins |
| **TOTAL** | **1.5 hours** |

### **Risk to Production**

- **MEDIUM:** Build failures prevent deployment
- **LOW:** Neon itself is reliable (if used correctly)
- **MEDIUM:** Inconsistent patterns increase maintenance burden

---

## Prevention Measures (CRITICAL)

### **1. Enhanced AGENTS.MD Protocol - IMMEDIATE**

Add to `/Users/Kyin/Projects/Americano/AGENTS.MD`:

```markdown
## CRITICAL: Architectural Decisions Require Approval

**BEFORE introducing ANY new dependency (npm package), ALL agents MUST:**

### 1. Stop and Identify
Ask: "Am I about to add a new package to package.json?"

### 2. Check for Existing Solutions
**If YES → STOP and check:**
- Is there an existing package that solves this problem?
- Example: Prisma already provides database access, do we need another?

### 3. Document Decision Rationale
**Create an ADR (Architectural Decision Record):**
- File: `docs/architecture/adr-XXX-<decision-name>.md`
- Template: Use MADR format
- Required sections:
  - Context (what problem are we solving?)
  - Decision Drivers (what factors influenced this?)
  - Considered Options (what alternatives exist?)
  - Decision Outcome (what did we choose and why?)
  - Consequences (what are the tradeoffs?)

### 4. Get User Approval
**Agent MUST state:**
```
"I need to add a new dependency: <package-name>

Current solution: <existing-approach>
Proposed solution: <new-package>
Reason: <why-existing-wont-work>

Do you approve this architectural change?"
```

**Wait for explicit user approval before:**
- Running `pnpm add <package>`
- Writing code that imports the package
- Committing changes

### 5. Document in Architecture Docs
**Update:**
- `docs/solution-architecture.md` - Add to Technology Stack section
- `AGENTS.MD` - Add to "Always Use context7 For" list if applicable
- Story completion notes - Explain why dependency was added

### 6. Violation Consequences
**If agent adds dependency without approval:**
- ❌ IMMEDIATE ROLLBACK - Remove package and revert code
- ❌ INCIDENT REPORT - Document what happened
- ❌ PROTOCOL UPDATE - Strengthen prevention measures
```

---

### **2. Pre-Commit Checklist for Agents**

Add to `/Users/Kyin/Projects/Americano/AGENTS.MD`:

```markdown
## Pre-Commit Checklist (MANDATORY)

Before running `git commit`, ALL agents MUST verify:

**Dependencies:**
- [ ] No new packages added to package.json without user approval
- [ ] All new packages documented in ADR
- [ ] All new packages added to AGENTS.MD if relevant

**Documentation:**
- [ ] context7 MCP used for all library/framework code
- [ ] Explicit announcement made: "Fetching latest [X] documentation..."
- [ ] No code written from memory/training data

**Architecture:**
- [ ] No architectural decisions made without user consultation
- [ ] Consistent with existing codebase patterns
- [ ] Follows established conventions (e.g., Prisma for database access)

**Build Verification:**
- [ ] TypeScript build succeeds (`pnpm exec tsc --noEmit`)
- [ ] Next.js build succeeds (`pnpm build`)
- [ ] No new type errors introduced

**Story Compliance:**
- [ ] All code maps to specific task/subtask in story
- [ ] No scope creep (extra features not in acceptance criteria)
- [ ] Completion notes explain any deviations
```

---

### **3. Automated Dependency Check (Future Enhancement)**

**Git Pre-Commit Hook:**
```bash
#!/bin/bash
# .git/hooks/pre-commit

# Check if package.json was modified
if git diff --cached --name-only | grep -q "package.json"; then
  echo "⚠️  WARNING: package.json was modified"
  echo "Did you add a new dependency?"
  echo "Have you created an ADR and gotten user approval?"
  echo ""
  echo "Press ENTER to continue or Ctrl+C to abort"
  read
fi
```

**Package.json Watcher:**
- Monitor for new dependencies during AI agent sessions
- Alert user: "Agent just added @neondatabase/serverless - was this approved?"

---

### **4. Story Completion Review Protocol**

Add to `/Users/Kyin/Projects/Americano/bmad/bmm/workflows/4-implementation/story-approved/workflow.yaml`:

```yaml
# Step: Review Dependencies Added
- Check if package.json was modified during story
- If yes:
  - List all new dependencies
  - Verify ADR exists for each
  - Verify user approval documented
  - Verify architecture docs updated
- If no ADR: REJECT story, require documentation
```

---

## Lessons Learned

### **What Went Wrong**

1. **Agent autonomy too high** - Agent made architectural decision without consultation
2. **AGENTS.MD not enforced** - Protocol exists but agent didn't follow it
3. **No dependency governance** - Nothing prevented unauthorized package addition
4. **No build verification in Story 3.1** - Incorrect Neon usage shipped to main
5. **Documentation gaps** - No ADR, no architecture doc updates, no story notes

### **What Went Right**

1. **Incident detected early** - Found during Story 3.2 build, not production
2. **Root cause identified quickly** - Git history revealed when/how it happened
3. **User questioned it** - Kevy asked "where did this come from?" (healthy skepticism)
4. **Protocol exists** - AGENTS.MD has the right rules, just not followed

### **Key Insight**

> **"Agents are powerful but require governance. Trust but verify."**

Agents can accelerate development, but architectural decisions require human oversight. The AGENTS.MD protocol is correct—it must be enforced more strictly.

---

## Remediation Plan

### **Immediate Actions (Today)**

1. ✅ **Document Incident** - This file
2. ⏳ **Update AGENTS.MD** - Add dependency approval protocol (next step)
3. ⏳ **Replace Neon with Prisma** - Remove technical debt
4. ⏳ **Remove Neon Dependency** - `pnpm remove @neondatabase/serverless`
5. ⏳ **Verify Build** - Ensure TypeScript build succeeds

### **Short-Term Actions (This Week)**

6. ⏳ **Create ADR Template** - `docs/architecture/adr-template.md`
7. ⏳ **Audit All Dependencies** - Review package.json for other unauthorized packages
8. ⏳ **Update Story 3.1 Completion Notes** - Explain why Neon was removed
9. ⏳ **Add to Workflow Status** - Document this incident in bmm-workflow-status.md

### **Long-Term Actions (Next Sprint)**

10. ⏳ **Implement Pre-Commit Hook** - Warn on package.json changes
11. ⏳ **Agent Training** - Ensure all agents understand dependency protocol
12. ⏳ **Periodic Dependency Review** - Monthly check for unauthorized packages

---

## Success Metrics

**Remediation Complete When:**
- ✅ Neon removed from package.json
- ✅ semantic-search-service.ts uses Prisma
- ✅ TypeScript build succeeds
- ✅ Next.js build succeeds
- ✅ AGENTS.MD updated with dependency protocol
- ✅ ADR template created
- ✅ This incident documented and shared with team

**Future Prevention Success:**
- **Zero unauthorized dependencies** in next 3 months
- **100% ADR compliance** for all new packages
- **100% user approval** before package additions

---

## References

**Files Affected:**
- `apps/web/package.json` - Neon dependency added
- `apps/web/src/lib/semantic-search-service.ts` - Neon usage
- `/Users/Kyin/Projects/Americano/AGENTS.MD` - Protocol to be strengthened

**Related Commits:**
- `1919d0d` - Story 3.1 completion (Neon introduced)
- (Pending) - Story 3.2 Neon removal

**Documentation:**
- AGENTS.MD - Pre-implementation checklist (§1-5)
- CLAUDE.MD - Parallel development strategy
- This incident report

---

## Conclusion

This incident reveals a gap in our AI agent governance: **architectural decisions require human approval**. The AGENTS.MD protocol is sound, but enforcement must be strengthened. By adding explicit dependency approval requirements and pre-commit verification, we prevent similar incidents.

**Key Takeaway:**
> "Agents should implement. Humans should decide architecture."

**Status:** REMEDIATION IN PROGRESS - Will update when complete.

---

**Report Author:** Claude (Amelia/DEV agent)
**Report Date:** 2025-10-16
**Next Review:** After remediation complete
**Approval Required:** Kevy (Project Lead)

---

**END OF INCIDENT REPORT**
