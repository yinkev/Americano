# Git Workflow Guide for Americano Project

**Created:** 2025-10-16
**Updated:** 2025-10-16 (Added parallel UI section + flowcharts)
**Purpose:** Reference guide for branch vs worktree decisions during development

---

## Quick Decision Tree

```
┌─────────────────────────────────────────────────────────────────┐
│                    Starting New Work?                           │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ├─ ONE story/feature?
                  │  └─► Sequential Branches ✅ (Default - 99% of cases)
                  │
                  ├─ Multiple INDEPENDENT stories?
                  │  │
                  │  ├─ Team collaboration?
                  │  │  └─► Parallel Branches ✅ (No shared files)
                  │  │
                  │  └─ Solo dev, no urgency?
                  │     └─► Sequential Branches ✅ (Simpler)
                  │
                  ├─ Multiple DEPENDENT stories?
                  │  │
                  │  ├─ Need all prep'd ahead?
                  │  │  └─► Stacked Branches ⚠️ (Advanced only)
                  │  │
                  │  └─ Normal development?
                  │     └─► Sequential Branches ✅ (Safer)
                  │
                  └─ Need to RUN two things SIMULTANEOUSLY?
                     │
                     ├─ Compare UI implementations?
                     │  └─► Worktrees ⚠️ (Run on different ports)
                     │
                     ├─ Production hotfix emergency?
                     │  └─► Worktrees ⚠️ (Don't lose feature work)
                     │
                     └─ Just testing/debugging?
                        └─► Sequential Branches ✅ (Switch branches)
```

---

## Can You Run UI in Parallel? YES (with Worktrees!)

### The Problem with Regular Branches:

```
┌────────────────────────────────────────────────┐
│  /Users/kyin/Projects/Americano                │
│  (ONE directory, ONE dev server at a time)     │
└────────────────────────────────────────────────┘
         │
         ├─ git checkout story-3.1-knowledge-graph
         │  └─► pnpm dev (localhost:3000) ✅
         │
         ├─ git checkout story-3.2-concept-relationships
         │  └─► Files change in SAME directory
         │  └─► Dev server crashes or shows wrong code ❌
         │  └─► Must restart dev server ❌
         │
         └─ Can only view ONE branch at a time ❌
```

### The Solution with Worktrees:

```
┌─────────────────────────────────────────────────────────────────┐
│                      Git Repository (shared)                    │
└───────┬─────────────────────────────────────────────┬───────────┘
        │                                             │
        ▼                                             ▼
┌────────────────────────────┐     ┌────────────────────────────┐
│  Main Worktree             │     │  Second Worktree           │
│  /Projects/Americano       │     │  /Projects/Americano-v2    │
│  Branch: story-3.1         │     │  Branch: story-3.2         │
│                            │     │                            │
│  pnpm dev                  │     │  pnpm dev --port 3001      │
│  └─► localhost:3000 ✅     │     │  └─► localhost:3001 ✅     │
└────────────────────────────┘     └────────────────────────────┘
         │                                      │
         └──────────────┬───────────────────────┘
                        ▼
              Both running simultaneously!
              Compare side-by-side in browser
```

### Setup Example:

```bash
# Main worktree: Dashboard design A
cd /Users/kyin/Projects/Americano
git checkout story-3.1-knowledge-graph
pnpm dev  # localhost:3000

# Create second worktree: Dashboard design B
git worktree add ../Americano-design-b story-3.2-concept-relationships
cd ../Americano-design-b
pnpm install
pnpm dev --port 3001  # localhost:3001

# Now compare both in browser:
# - Open localhost:3000 (Design A)
# - Open localhost:3001 (Design B)
# Click through both simultaneously!

# Cleanup when done
cd /Users/kyin/Projects/Americano
git worktree remove ../Americano-design-b
```

### ⚠️ Database Sharing Consideration:

```
┌─────────────────────────────────────────────────────────────────┐
│              PostgreSQL Database (SHARED!)                      │
│              postgres://localhost:5432/americano                │
└───────┬─────────────────────────────────────────────┬───────────┘
        │                                             │
        ▼                                             ▼
   Worktree 1                                    Worktree 2
   localhost:3000                                localhost:3001

   ⚠️ Both connect to SAME database
   ⚠️ If schemas differ → errors
   ⚠️ If migrations differ → conflicts

   ✅ Safe if: UI-only changes (React components)
   ⚠️ Risky if: Database schema changes
```

**Solutions:**
- **UI-only changes:** Safe to share database ✅
- **Schema changes:** Use separate databases or test sequentially ⚠️
- **Keep schemas in sync:** Merge database changes first, then UI changes ✅

---

## Workflow 1: Sequential Branches (RECOMMENDED - Default)

**When to use:**
- ✅ Solo development (what you're doing now)
- ✅ Stories have dependencies (Story 2.5 needs Story 2.4)
- ✅ One story at a time workflow
- ✅ Stories modify same files/systems
- ✅ You want simplicity and safety

**Example:**
```bash
# Story 3.1
git checkout -b story-3.1-knowledge-graph
# ... implement, test, complete ...
git checkout main
git merge story-3.1-knowledge-graph
git branch -d story-3.1-knowledge-graph

# Story 3.2 (builds on 3.1)
git checkout -b story-3.2-concept-relationships
# ... implement, test, complete ...
git checkout main
git merge story-3.2-concept-relationships
git branch -d story-3.2-concept-relationships
```

**Benefits:**
- Simple mental model
- No merge conflicts
- Code always compiles
- Clean git history

**Use for:** Epic 1, Epic 2 (what you did) ✅

---

## Workflow 2: Parallel Branches (Team Collaboration)

**When to use:**
- ✅ Multiple people working simultaneously
- ✅ Stories are COMPLETELY INDEPENDENT
- ✅ No shared files between stories
- ✅ Different subsystems (e.g., Knowledge Graph vs Flashcards vs AI Tutor)

**Example:**
```bash
# Developer 1: Knowledge Graph
git checkout -b story-3.1-knowledge-graph

# Developer 2: Flashcard System (DIFFERENT files)
git checkout -b story-4.1-flashcards

# Developer 3: AI Tutor (DIFFERENT files)
git checkout -b story-5.1-ai-tutor

# All work independently, merge when done
```

**Benefits:**
- Parallel development
- Faster delivery
- Team can work independently

**When NOT to use:**
- ❌ Stories modify same files
- ❌ Stories have dependencies (2.5 needs 2.4)
- ❌ Stories touch same database models
- ❌ Solo developer working on sequential features

---

## Workflow 3: Stacked Branches (Advanced - Dependent Parallel)

**When to use:**
- ⚠️ You want to prep multiple dependent stories ahead of time
- ⚠️ You understand rebase and merge order
- ⚠️ Stories MUST be merged in specific order

**Example:**
```bash
# Create story 2.4
git checkout -b story-2.4-missions
# ... implement 2.4 ...
git commit -m "Complete 2.4"

# Create 2.5 FROM 2.4 (not main!)
git checkout -b story-2.5-orchestration
# ... implement 2.5 (has access to 2.4 code) ...
git commit -m "Complete 2.5"

# Create 2.6 FROM 2.5 (not main!)
git checkout -b story-2.6-analytics
# ... implement 2.6 (has access to 2.4+2.5 code) ...
git commit -m "Complete 2.6"

# CRITICAL: Merge in order!
git checkout main
git merge story-2.4-missions  # First
git merge story-2.5-orchestration  # Second
git merge story-2.6-analytics  # Third
```

**Benefits:**
- Can prep multiple stories
- Each branch has dependencies available

**Drawbacks:**
- Complex (easy to mess up)
- If 2.4 changes, must rebase 2.5 and 2.6
- Merge order is critical

**When NOT to use:**
- ❌ Solo developer (just do sequential)
- ❌ Not comfortable with git rebase
- ❌ Stories might change order

---

## Workflow 4: Worktrees (Simultaneous Work)

**When to use:**
- ⚠️ Production hotfix while working on feature
- ⚠️ Comparing two implementations side-by-side (A/B testing UI)
- ⚠️ Running dev servers for multiple branches simultaneously
- ⚠️ Testing performance of different approaches

### Visual: Parallel UI Development with Worktrees

```
┌──────────────────────────────────────────────────────────────────┐
│                     Use Case: A/B Testing                        │
└──────────────────────────────────────────────────────────────────┘

  Main Worktree                         Second Worktree
  ┌─────────────────┐                  ┌─────────────────┐
  │ Dashboard A     │                  │ Dashboard B     │
  │ (Simple layout) │                  │ (Advanced)      │
  └────────┬────────┘                  └────────┬────────┘
           │                                     │
           │  pnpm dev                          │  pnpm dev --port 3001
           ▼                                     ▼
  ┌─────────────────┐                  ┌─────────────────┐
  │ localhost:3000  │                  │ localhost:3001  │
  │                 │                  │                 │
  │ ┌─────────────┐ │                  │ ┌─────────────┐ │
  │ │  Dashboard  │ │                  │ │  Dashboard  │ │
  │ │  Design A   │ │                  │ │  Design B   │ │
  │ │  ▢▢▢▢▢▢     │ │                  │ │  ▢▢▢        │ │
  │ │  ▢▢▢▢▢▢     │ │                  │ │  ▢▢▢▢▢▢▢▢  │ │
  │ └─────────────┘ │                  │ │  ▢▢▢▢▢▢▢▢  │ │
  └─────────────────┘                  │ └─────────────┘ │
                                       └─────────────────┘
           │                                     │
           └──────────┬──────────────────────────┘
                      ▼
           User/Advisor compares both
           Decides which design to use
```

### Visual: Production Hotfix Scenario

```
┌──────────────────────────────────────────────────────────────────┐
│              Scenario: Bug in Production!                        │
└──────────────────────────────────────────────────────────────────┘

BEFORE: (Without Worktrees - Must lose feature work)
────────────────────────────────────────────────────
  ┌─────────────────────────────────────┐
  │  /Projects/Americano                │
  │  Branch: story-3.1-feature          │
  │  Status: 50% complete ⚠️            │
  └─────────────────────────────────────┘
           │
           │ Production bug reported! 🚨
           │ Must fix ASAP
           ▼
  git checkout main  (lose uncommitted work)
  git stash          (manual backup)
  # Fix bug
  git checkout story-3.1-feature
  git stash pop      (restore work)

  ❌ Risk of losing work
  ❌ Context switching overhead


AFTER: (With Worktrees - Keep feature work safe)
────────────────────────────────────────────────────
  ┌─────────────────────────────────┐   ┌───────────────────────────┐
  │  Main: /Projects/Americano      │   │  Hotfix Worktree          │
  │  Branch: story-3.1-feature      │   │  /Projects/Americano-fix  │
  │  Status: 50% complete           │   │  Branch: main             │
  │                                 │   │                           │
  │  pnpm dev (localhost:3000) ✅   │   │  # Fix production bug     │
  │  Keep working!                  │   │  git commit & push ✅     │
  └─────────────────────────────────┘   └───────────────────────────┘
           │                                       │
           └───────── Both active! ───────────────┘

  ✅ Feature work safe and untouched
  ✅ No context switching
  ✅ Both environments available
```

**Setup Example:**
```bash
# Main work area
cd /Users/kyin/Projects/Americano  # (feature branch)

# Production bug reported! 🚨
# Create worktree for hotfix
git worktree add ../Americano-hotfix main
cd ../Americano-hotfix

# Fix the bug
# ... make changes ...
git add -A && git commit -m "Fix critical login bug"
git push origin main

# Return to original work (untouched!)
cd /Users/kyin/Projects/Americano
# ... continue feature work ...

# Cleanup when done
git worktree remove ../Americano-hotfix
```

**Benefits:**
- ✅ Work on multiple branches without switching
- ✅ Keep dev servers running
- ✅ Compare implementations side-by-side
- ✅ Zero context switching overhead
- ✅ Feature work remains safe during hotfix

**Drawbacks:**
- ❌ Takes disk space (full repo copy per worktree)
- ❌ More complex mental model
- ❌ Easy to forget about worktrees
- ❌ Shared database can cause schema conflicts

**When NOT to use:**
- ❌ Normal feature development (use branches)
- ❌ Sequential stories (use branches)
- ❌ Limited disk space
- ❌ Stories with different database schemas

---

## Americano-Specific Recommendations

### Epic 1 (Core Learning Infrastructure) ✅
- **Used:** Sequential branches
- **Why:** Stories had dependencies, modified same systems
- **Result:** Clean, conflict-free

### Epic 2 (Personal Learning GPS) ✅
- **Used:** Sequential branches
- **Why:** 2.5 needed 2.4, 2.6 needed 2.4+2.5, all modified mission system
- **Result:** Clean, conflict-free

### Epic 3 (Knowledge Graph) - Recommendation
- **Use:** Sequential branches
- **Why:** Stories likely build on each other, modify same graph system
- **Rationale:** Keep it simple, avoid conflicts

### Epic 4 (Understanding Validation) - Recommendation
- **Use:** Sequential branches
- **Why:** Flashcard generation → Review system → Spaced repetition (dependencies)

### Future: Multiple Epics in Parallel
- **Consider:** Parallel branches IF epics are independent
- **Example:** Epic 3 (Knowledge Graph) + Epic 4 (Flashcards) could be parallel
- **Why:** Different subsystems, different files
- **Caveat:** Only if you're comfortable with potential conflicts

---

## Red Flags: When NOT to Parallel

🚫 **Do NOT use parallel branches if:**

1. **Stories modify same database models**
   - Example: Both add fields to `Mission` model → conflict

2. **Stories modify same API endpoints**
   - Example: Both modify `/api/missions/generate` → conflict

3. **Stories modify same React components**
   - Example: Both update `MissionCard.tsx` → conflict

4. **Stories have dependencies**
   - Example: Story 2.5 imports from Story 2.4 → compilation error

5. **You're unsure about merge conflicts**
   - Default to sequential (safer)

---

## Commit & Branch Naming Standards

### Branch Names:
```
story-{epic}.{story}-{short-description}

Examples:
✅ story-3.1-knowledge-graph-foundation
✅ story-3.2-concept-relationships
✅ story-4.1-flashcard-generation
✅ hotfix-production-login-bug
```

### Commit Messages:
```
Complete Story {ID}: {Title}

{Epic context if relevant}

Deliverables:
- Feature 1
- Feature 2
- ...

All {N} acceptance criteria met, TypeScript compilation clean (0 errors)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## Merge Workflow (Standard)

```bash
# 1. Complete story on branch
git checkout story-3.1-knowledge-graph
# ... implement, test, verify ...

# 2. Commit work
git add -A
git commit -m "Complete Story 3.1: ..."

# 3. Switch to main
git checkout main

# 4. Merge (fast-forward)
git merge story-3.1-knowledge-graph

# 5. Push to remote
git push origin main

# 6. Delete branch
git branch -d story-3.1-knowledge-graph

# 7. Start next story
git checkout -b story-3.2-concept-relationships
```

---

## When Claude Should Recommend Alternatives

### Recommend Sequential Branches (Default) when:
- Solo development
- Stories have any dependencies
- Stories modify related files
- User hasn't explicitly asked for parallel

### Recommend Parallel Branches when:
- User has a team
- Stories are provably independent
- User asks "can I work on multiple stories?"
- Different epics, different subsystems

### Recommend Worktrees when:
- User needs production hotfix ASAP
- User explicitly wants to compare implementations
- User wants to run multiple branches simultaneously
- User asks "how do I work on two things at once?"

### Recommend Stacked Branches when:
- User is comfortable with git
- User wants to prep dependent stories ahead
- User explicitly asks about this workflow
- NEVER recommend proactively (too complex)

---

## Summary: What to Use When

| Scenario | Use | Why |
|----------|-----|-----|
| Default (99% of time) | Sequential Branches | Simple, safe, clean |
| Team collaboration | Parallel Branches | Independent work |
| Production emergency | Worktrees | Don't lose feature work |
| Comparing solutions | Worktrees | Run both simultaneously |
| Dependent prep work | Stacked Branches | Advanced, risky |

**Golden Rule:** When in doubt, use sequential branches. It's always safe.

---

## Comprehensive Visual Comparison

```
┌─────────────────────────────────────────────────────────────────────┐
│              Git Workflow Pattern Comparison                        │
└─────────────────────────────────────────────────────────────────────┘

1. SEQUENTIAL BRANCHES (Default - 99% of time)
──────────────────────────────────────────────
  Time ─────────────────────────────────────────────────►

  main  ────●────────●────────────●────────────●────────
            │        │            │            │
         Story 3.1   merge     Story 3.2      merge
            ▼        ▲            ▼            ▲
  branch  ──┴────────┘            └────────────┘

  ✅ One story at a time
  ✅ Clean linear history
  ✅ No conflicts
  ✅ Always compiles


2. PARALLEL BRANCHES (Team Collaboration)
──────────────────────────────────────────
  Time ─────────────────────────────────────────────────►

  main  ────●──────────────────────●────────────────────
            │                      │
            ├──── Dev 1: Story 3.1 ┤
            │         ▼            │
  branch1  ─┴──────────────────────┘
            │
            ├──── Dev 2: Story 4.1 ┤
            │         ▼            │
  branch2  ─┴──────────────────────┘

  ✅ Multiple devs work simultaneously
  ⚠️ Must be independent stories
  ⚠️ Risk of merge conflicts


3. STACKED BRANCHES (Advanced - Dependent)
───────────────────────────────────────────
  Time ─────────────────────────────────────────────────►

  main    ────●────────────────────────────────●────────
              │                                │
  story-2.4  ─┴───────●──────────────────┐     │
                      │                  │     │
  story-2.5  ─────────┴───────●──────────┼─────┤
                              │          │     │
  story-2.6  ─────────────────┴───────●──┴─────┘
                                      │
                              All merge in order!

  ⚠️ Complex (easy to mess up)
  ⚠️ Must merge in specific order
  ⚠️ Changes to 2.4 require rebase of 2.5, 2.6


4. WORKTREES (Simultaneous Execution)
──────────────────────────────────────
  Filesystem Layout:

  /Projects/Americano/          ← Main worktree
  │  Branch: story-3.1
  │  pnpm dev → localhost:3000
  │
  /Projects/Americano-v2/       ← Second worktree
     Branch: story-3.2
     pnpm dev → localhost:3001

  Both running simultaneously! ✅
  Compare in browser side-by-side ✅
  Shared database ⚠️
  2x disk space ⚠️


DECISION MATRIX:
────────────────
┌─────────────────────┬──────────────┬──────────────┬─────────┐
│ Scenario            │ Dependencies │ UI Testing   │ Use     │
├─────────────────────┼──────────────┼──────────────┼─────────┤
│ Solo, one at a time │ Any          │ Sequential   │ Branch  │
│ Team, independent   │ None         │ Sequential   │ Branch  │
│ Team, dependent     │ Yes          │ Sequential   │ Stack   │
│ Compare UIs         │ Any          │ Parallel     │ Worktree│
│ Production hotfix   │ Any          │ Keep running │ Worktree│
└─────────────────────┴──────────────┴──────────────┴─────────┘
```

---

## Final Recommendations for Kevy

1. **Continue using sequential branches** - What you've been doing is correct
2. **One story at a time** - Complete, merge, move on
3. **Push to remote after each story** - Backup your work
4. **Only use parallel/worktrees when explicitly needed** - Don't complicate unnecessarily
5. **Ask Claude before trying advanced workflows** - I'll tell you if it's the right time

**Current approach: ✅ PERFECT - Keep doing what you're doing!**

---

*This guide will be referenced by Claude in future sessions to provide consistent git workflow recommendations.*
