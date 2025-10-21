# Worktree Database Strategy

**Date:** 2025-10-16
**Context:** Working on Epic 3 and Epic 5 in parallel using git worktrees
**Decision:** Use shared database with migration coordination protocol

---

## 🎯 Strategy: Shared Database Approach

### Database Configuration

**All worktrees use the same development database:**
```bash
DATABASE_URL="postgresql://kyin@localhost:5432/americano"
```

**Worktrees:**
<<<<<<< HEAD
- **Epic 3:** `/Users/kyin/Projects/Americano-epic3` (branch: `feature/epic-3-knowledge-graph`)
- **Epic 5:** `/Users/kyin/Projects/Americano-epic5` (branch: `feature/epic-5-behavioral-twin`)
=======
- Epic 3: `/Users/kyin/Projects/Americano-epic3` (branch: `feature/epic-3-knowledge-graph`)
- Epic 5: TBD (branch: TBD)
>>>>>>> origin/main

---

## 📋 Migration Coordination Protocol

### Before Creating ANY Migration in ANY Worktree:

```bash
# 1. Check current migration state
cd apps/web
npx prisma migrate status

# 2. Pull latest schema from main
git fetch origin main
git show origin/main:apps/web/prisma/schema.prisma > /tmp/main-schema.prisma

# 3. Compare schemas
diff apps/web/prisma/schema.prisma /tmp/main-schema.prisma

# 4. If different, merge main into your branch first
git merge origin/main
```

### When Applying Migrations:

<<<<<<< HEAD
**Epic 3:**
=======
**Epic 3 (Current):**
>>>>>>> origin/main
```bash
cd /Users/kyin/Projects/Americano-epic3/apps/web
npx prisma migrate dev --name add_vector_search_and_analytics
```

<<<<<<< HEAD
**Epic 5:**
```bash
cd /Users/kyin/Projects/Americano-epic5/apps/web
=======
**Epic 5 (Later, when switching worktrees):**
```bash
cd /path/to/epic5/worktree/apps/web

# IMPORTANT: Apply pending migrations first
npx prisma migrate deploy  # Applies Epic 3's migration

# Then create Epic 5's migration
>>>>>>> origin/main
npx prisma migrate dev --name add_epic5_features
```

### When Switching Between Worktrees:

```bash
# Always run this when switching worktrees:
cd apps/web
npx prisma migrate deploy    # Apply any pending migrations
npx prisma generate          # Regenerate Prisma Client
```

---

## ⚠️ Potential Conflicts & Solutions

### Conflict Type 1: Both Epics Modify Same Table
**Example:** Epic 3 adds column A, Epic 5 adds column B to same table
**Solution:** ✅ No conflict - migrations are additive

### Conflict Type 2: Both Epics Modify Same Column
**Example:** Epic 3 changes column type, Epic 5 also changes same column type
**Solution:** ❌ Requires coordination - discuss schema design before implementing

### Conflict Type 3: Migration Timestamp Ordering
**Example:** Epic 5 migration has earlier timestamp than Epic 3
**Solution:** Rename Epic 5 migration to later timestamp

### Conflict Type 4: Migration Applied in Another Worktree ⭐ MOST COMMON
**Example:**
- Epic 5 applied migration `20251016231054_add_story_5_1_behavioral_pattern_models`
- Epic 3 worktree doesn't have this migration file locally
- Epic 3 tries to apply its own migration and fails

**Solution (BEST PRACTICE):**
```bash
<<<<<<< HEAD
# FROM EPIC 3 WORKTREE:
=======
>>>>>>> origin/main
# Step 1: Mark Epic 5's migration as resolved (tells Prisma it's okay)
cd /Users/kyin/Projects/Americano-epic3/apps/web
npx prisma migrate resolve --applied 20251016231054_add_story_5_1_behavioral_pattern_models

# Step 2: Apply Epic 3's pending migrations
npx prisma migrate deploy

# Step 3: Verify everything is synced
npx prisma migrate status
<<<<<<< HEAD

# FROM EPIC 5 WORKTREE (reciprocal):
# Step 1: Mark Epic 3's migration as resolved
cd /Users/kyin/Projects/Americano-epic5/apps/web
npx prisma migrate resolve --applied 20251016000000_create_vector_indexes

# Step 2: Verify
npx prisma migrate status
=======
>>>>>>> origin/main
```

**Why this is the best way:**
- ✅ Doesn't modify the database (safe)
- ✅ Doesn't require copying migration files between worktrees
- ✅ Each worktree maintains its own migration history
- ✅ Database reflects the combined state of both Epics
- ✅ When merging, git will combine migration directories automatically

**What NOT to do:**
- ❌ Don't copy Epic 5's migration file to Epic 3 worktree (creates confusion)
- ❌ Don't delete Epic 5's migration from database (breaks Epic 5)
- ❌ Don't reset database (loses data)
- ❌ Don't use `migrate dev` (will try to create shadow DB and fail)

---

## 🔀 Merge Strategy

### When Merging Epic 3 → Main:
1. Epic 3 PR includes migration files in `prisma/migrations/`
2. Merge PR normally
3. In main branch: `npx prisma migrate deploy`
4. ✅ Done

### When Merging Epic 5 → Main (after Epic 3 merged):
1. Before creating PR, merge main into Epic 5
2. Resolve any schema conflicts in `schema.prisma`
3. Epic 5 PR includes its migration files
4. Merge PR normally
5. In main branch: `npx prisma migrate deploy`
6. ✅ Done

### When Merging Both Epics Simultaneously:
1. Merge Epic 3 first
2. Rebase Epic 5 on updated main
3. Resolve conflicts in Epic 5
4. Merge Epic 5
5. ✅ Done

---

## ✅ Benefits of This Approach

1. **Single Source of Truth** - One database reflects merged reality
2. **Early Conflict Detection** - Conflicts appear immediately, not at merge time
3. **No Merge Surprises** - You know the final schema state in advance
4. **Simpler Testing** - One database to validate against
5. **CI/CD Compatible** - Standard approach used in industry

---

## 🚫 What NOT to Do

❌ **Don't use separate databases per worktree** - Causes merge conflicts
❌ **Don't run migrations without checking status** - Can cause inconsistencies
❌ **Don't modify migrations after applying** - Prisma tracks by filename and checksum
❌ **Don't forget to run `prisma migrate deploy`** when switching worktrees

---

## 📚 Reference Commands

```bash
# Check migration status
npx prisma migrate status

# Apply pending migrations
npx prisma migrate deploy

# Create new migration
npx prisma migrate dev --name <migration_name>

# Regenerate Prisma Client
npx prisma generate

<<<<<<< HEAD
# Mark migration as resolved (when it exists in DB but not locally)
npx prisma migrate resolve --applied <migration_name>

=======
>>>>>>> origin/main
# Reset database (DESTRUCTIVE - dev only)
npx prisma migrate reset

# Open Prisma Studio to inspect data
npx prisma studio
```

---

## 🎯 Current State (Updated 2025-10-16)

<<<<<<< HEAD
### Epic 3 Status:
- ✅ Worktree: `/Users/kyin/Projects/Americano-epic3`
- ✅ Branch: `feature/epic-3-knowledge-graph`
- ✅ Story 3.1 implementation complete (all 7 tasks, 31 subtasks)
- ✅ Migration conflict resolved using `prisma migrate resolve`
- ✅ Migration applied: `20251016000000_create_vector_indexes`

### Epic 5 Status:
- ✅ Worktree: `/Users/kyin/Projects/Americano-epic5`
- ✅ Branch: `feature/epic-5-behavioral-twin`
- ✅ Story 5.1 complete (12/12 tasks, 8/8 ACs, ~4,000 lines)
- ✅ Migration applied: `20251016231054_add_story_5_1_behavioral_pattern_models`
- ✅ Committed: `29a284b`
- ⏳ Needs to resolve Epic 3's migration: `20251016000000_create_vector_indexes`
- ⏳ Ready to continue with Story 5.2 (Predictive Analytics)

### Database State:
- ✅ Last common migration: `20251015231031_story_2_5_mission_orchestration_fields`
- ✅ Epic 5 migration applied: `20251016231054_add_story_5_1_behavioral_pattern_models`
- ✅ Epic 3 migration applied: `20251016000000_create_vector_indexes`
- ✅ Database contains models from BOTH epics

### Table Ownership:
**Epic 3 Tables:**
- `Concept` - Extracted concepts from lectures
- `ConceptRelationship` - Links between concepts
- Vector indexes on `ContentChunk.embedding`, `Concept.embedding`

**Epic 5 Tables:**
- `BehavioralPattern` - Detected user patterns
- `BehavioralInsight` - Actionable recommendations
- `UserLearningProfile` - Persistent user preferences
- `InsightPattern` - Join table for many-to-many

**Shared Tables (No Conflicts):**
- ✅ Both epics extend different fields
- ✅ Epic 3 uses: `Lecture`, `LearningObjective`, `ContentChunk`
- ✅ Epic 5 uses: `User`, `StudySession`, `Review`, `Mission`, `BehavioralEvent`

### Next Steps:

**Epic 5 (This Worktree):**
1. ✅ Resolve Epic 3's migration when ready:
   ```bash
   cd /Users/kyin/Projects/Americano-epic5/apps/web
   npx prisma migrate resolve --applied 20251016000000_create_vector_indexes
   ```
2. Continue with Story 5.2 (Predictive Analytics)
3. Story 5.3-5.6 implementation

**Epic 3 (Parallel Worktree):**
1. ✅ Migration conflict resolved
2. Continue with Story 3.2-3.6 implementation

---

## 📝 Key Learnings

1. **Migration conflicts are normal** in parallel development with shared DB
2. **`prisma migrate resolve --applied`** is the correct tool for this scenario
3. **Don't copy migration files** between worktrees - let git handle merges
4. **Each worktree maintains its own migration history** - this is by design
5. **The database is the single source of truth** - worktrees mark migrations as resolved

---

**Last Updated:** 2025-10-16 by Amelia (DEV Agent) - Epic 5 Worktree
=======
**Epic 3 Status:**
- ✅ Story 3.1 implementation complete (all 7 tasks, 31 subtasks)
- ⏳ Migration conflict detected: Epic 5 migration already in database
- ⏳ Resolution in progress using `prisma migrate resolve`

**Epic 5 Status:**
- ✅ Already has migration in database: `20251016231054_add_story_5_1_behavioral_pattern_models`
- ⏳ Worktree location unknown
- ⏳ Will need to resolve Epic 3's migrations when you switch back to it

**Database State:**
- Last common migration: `20251015231031_story_2_5_mission_orchestration_fields`
- Applied but not in Epic 3: `20251016231054_add_story_5_1_behavioral_pattern_models`
- Pending in Epic 3: `20251016000000_create_vector_indexes`

**Next Steps:**
1. ✅ Resolve Epic 5 migration conflict using `prisma migrate resolve`
2. Apply Epic 3 migrations using `prisma migrate deploy`
3. Test Epic 3 search feature
4. Commit Epic 3 work
5. When switching to Epic 5: resolve Epic 3's migrations there too

---

**Last Updated:** 2025-10-16 by Amelia (DEV Agent)
>>>>>>> origin/main
