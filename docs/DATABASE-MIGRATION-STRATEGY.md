# Database Migration Strategy: Multi-Worktree Setup

**Document Version:** 1.0
**Date:** 2025-10-16
**Author:** Bob (Scrum Master)
**Status:** Active Policy

---

## Executive Summary

The Americano project uses **Git worktrees** with a **shared PostgreSQL database** strategy. This document outlines the migration management approach, conflict resolution procedures, and deployment protocols.

---

## Current Setup

### Worktree Configuration

```
Repository Structure:
├── Americano (main)              → Database: americano
├── Americano-epic3 (worktree)    → Database: americano (SHARED)
├── Americano-epic4 (worktree)    → Database: N/A (no database)
└── Americano-epic5 (worktree)    → Database: americano (SHARED)
```

### Database Connection Details

**Shared Database:** `postgresql://kyin@localhost:5432/americano`

**Worktrees Using Shared Database:**
- Epic 3: Knowledge Graph features
- Epic 5: Behavioral Twin features

**Migration Tracking:**
- Database: 19 migrations applied
- Epic 3 folder: ~14 migrations (includes Epic 3-specific)
- Epic 5 folder: 14 migrations (Epic 5-specific only)
- Shared migrations: Core schema from main branch

---

## Why This Strategy Works

### Benefits

1. **Feature Isolation** - Each epic develops independently
2. **Real Integration Testing** - Features tested against actual production-like schema
3. **Early Conflict Detection** - Schema conflicts discovered during development
4. **Simplified Data Management** - Single source of truth for test data

### Trade-offs

1. **Migration Coordination Required** - Must track which epic owns which migrations
2. **Worktree Interdependence** - Schema changes in one epic affect others
3. **Reset Risk** - Cannot reset database without affecting all worktrees
4. **Merge Complexity** - Must consolidate migrations when merging to main

---

## Migration Ownership Model

### Timestamp-Based Ownership

Each epic's migrations are identifiable by timestamp range:

```
Epic 3 Migrations (Oct 14-16):
- 20251016000000_create_vector_indexes
- 20251016164000_add_search_analytics_tracking
- 20251016235900_fix_vector_dimensions
- 20251017000000_add_first_aid_integration

Epic 5 Migrations (Oct 16):
- 20251016231054_add_story_5_1_behavioral_pattern_models
- (Future Epic 5 migrations)

Shared Migrations (Oct 14-15):
- 20251014220648_init
- 20251014232348_add_course_color_field
- 20251015000000_page_range_support
- ... (all base schema migrations)
```

### How Prisma Tracks Migrations

```sql
-- _prisma_migrations table structure
migration_name                              | applied_steps | started_at | finished_at
--------------------------------------------|---------------|------------|------------
20251014220648_init                         | 1             | ...        | ...
20251016000000_create_vector_indexes (E3)   | 1             | ...        | ...
20251016231054_add_story_5_1_... (E5)       | 1             | ...        | ...
```

**Key Insight:** Prisma tracks applied migrations **in the database**, not in the local folder. This allows multiple worktrees with different migration folders to share the same database.

---

## Development Workflows

### Creating New Migrations in a Worktree

**Scenario:** You're in Epic 5 and need to add a new table.

```bash
# In Americano-epic5/apps/web
npx prisma migrate dev --name add_new_table

# What happens:
# 1. Prisma reads local migrations folder (14 files)
# 2. Queries database (_prisma_migrations: 19 applied)
# 3. Identifies 5 migrations in DB not in local folder (Epic 3's)
# 4. IGNORES those 5 (they're already applied)
# 5. Creates migration #20 based on schema.prisma changes
# 6. Applies only the new migration to database
```

**Result:**
- ✅ Database now has 20 migrations
- ✅ Epic 5 folder has 15 migration files
- ✅ Epic 3 continues working (no impact)

### Schema Conflicts - Detection

**When Epic 3 and Epic 5 Modify Same Table:**

```prisma
// Epic 3 schema.prisma
model Course {
  id          String @id
  name        String
  vectorIndex Int?   // ← Epic 3 added this
}

// Epic 5 schema.prisma
model Course {
  id            String @id
  name          String
  difficultyAI  Float?  // ← Epic 5 added this
}
```

**What happens when Epic 5 creates a migration:**

```bash
npx prisma migrate dev --name add_difficulty_ai

# Prisma detects:
# ✅ Course.difficultyAI exists in schema.prisma
# ❌ Course.vectorIndex missing in schema.prisma (exists in DB)
#
# Warning: "Drift detected: vectorIndex column exists in database but not in schema"
```

**Resolution Options:**

1. **Pull from database:**
   ```bash
   npx prisma db pull  # Syncs schema.prisma with actual DB state
   # Now Epic 5's schema.prisma includes vectorIndex
   ```

2. **Coordinate with Epic 3:**
   - Get Epic 3's latest schema.prisma
   - Merge both changes manually
   - Create migration including both fields

3. **Separate concerns (recommended):**
   - If no actual conflict, keep changes separate
   - Document the drift in this file
   - Resolve during merge to main

---

## Critical Rules

### ❌ NEVER Do These Actions

1. **`npx prisma migrate reset` in a worktree**
   - **Why:** Deletes all migrations and re-applies only local folder
   - **Impact:** Destroys Epic 3's schema changes (vector indexes, etc.)
   - **When safe:** Only in isolated database (not shared)

2. **`npx prisma db push --force-reset`**
   - **Why:** Drops entire database schema
   - **Impact:** All worktrees lose data
   - **When safe:** Never on shared database

3. **Delete migrations from `_prisma_migrations` table manually**
   - **Why:** Breaks Prisma's tracking
   - **Impact:** Future migrations will fail or create duplicates

4. **Modify migration files after they're applied**
   - **Why:** Prisma checksums migration content
   - **Impact:** Migration validation failures

### ✅ Always Safe Actions

1. **`npx prisma migrate dev --name <name>`**
   - Creates new migration based on schema changes
   - Ignores migrations in DB that aren't in local folder

2. **`npx prisma db pull`**
   - Syncs schema.prisma to match actual database state
   - Non-destructive, read-only operation

3. **`npx prisma generate`**
   - Regenerates Prisma Client from schema.prisma
   - No database changes

4. **`npx prisma studio`**
   - Opens database GUI
   - No schema changes

---

## Merge Strategy: Worktree → Main

### Pre-Merge Checklist

**For Epic 3 Merge:**
```bash
# 1. Collect all Epic 3 migrations
cd Americano-epic3/apps/web/prisma/migrations
ls -la  # Note all migration folders

# 2. Copy to main branch
cd /Users/kyin/Projects/Americano/apps/web/prisma/migrations
# Copy Epic 3 migration folders here

# 3. Update schema.prisma in main
# Merge Epic 3's schema changes into main's schema.prisma

# 4. Validate
npx prisma validate
npx prisma migrate status  # Should show all migrations applied
```

**For Epic 5 Merge:**
```bash
# Same process, but ensure Epic 3's migrations are already in main
# Epic 5 migrations will be later timestamps, so no conflicts
```

### Merge Order Dependencies

**Critical:** Merge epics in chronological order of their migrations.

```
Recommended Merge Sequence:
1. Epic 3 → main (migrations 20251016xxx)
2. Epic 5 → main (migrations 20251016xxx - later timestamps)

Why: Later epics may depend on earlier schema changes
```

### Post-Merge Validation

```bash
# In main branch
cd /Users/kyin/Projects/Americano/apps/web

# 1. Validate schema
npx prisma validate

# 2. Check migration status
npx prisma migrate status
# Should show: "Database schema is up to date"

# 3. Run full test suite
npm test

# 4. Build application
npm run build
```

---

## Production Deployment Strategy

### Option A: Separate Database Per Epic (Recommended for Deployment)

**Development:**
- Keep shared database for integration testing

**Staging/Production:**
- Each feature branch gets isolated database
- Merge only after full validation

```yaml
# .env.development (all worktrees)
DATABASE_URL=postgresql://kyin@localhost:5432/americano

# .env.epic3.staging
DATABASE_URL=postgresql://user@host:5432/americano_epic3_staging

# .env.epic5.staging
DATABASE_URL=postgresql://user@host:5432/americano_epic5_staging

# .env.production (after merge to main)
DATABASE_URL=postgresql://user@host:5432/americano_production
```

### Option B: Shared Database Throughout (Current Setup)

**Pros:**
- Real integration testing during development
- Early conflict detection

**Cons:**
- Higher coordination overhead
- Reset/rollback complexity

**When to use:** Small team, tight collaboration, frequent communication

---

## Troubleshooting Guide

### Issue: "Drift detected" warning

**Symptom:**
```
⚠️ Drift detected: Your database schema is not in sync with your migration history
```

**Cause:** Another worktree created migrations not in local folder

**Solution:**
```bash
# Option 1: Pull schema to sync (non-destructive)
npx prisma db pull

# Option 2: Document and ignore (if no actual conflict)
# Add to this document under "Known Drift"

# Option 3: Coordinate with other epic team
```

### Issue: Migration already exists in database

**Symptom:**
```
Error: Migration '20251016xxx' already exists in the database
```

**Cause:** Trying to apply migration that another worktree already applied

**Solution:**
```bash
# Mark as applied without running
npx prisma migrate resolve --applied 20251016xxx
```

### Issue: Cannot create new migration - state is out of sync

**Symptom:**
```
Error: The database is not in sync with migration history
```

**Cause:** Migration tracking inconsistency

**Solution:**
```bash
# 1. Check current state
npx prisma migrate status

# 2. Reset Prisma Client (safe)
rm -rf node_modules/.prisma
npx prisma generate

# 3. If still failing, pull schema
npx prisma db pull

# 4. Create new migration
npx prisma migrate dev --name fix_sync
```

---

## Known Schema Drift (Current State)

### As of 2025-10-16

**Migrations in Database but NOT in Epic 5 folder:**

1. `20251016164000_add_search_analytics_tracking` (Epic 3)
   - **Tables Added:** search_analytics, user_search_history
   - **Owner:** Epic 3 - Knowledge Graph
   - **Status:** ✅ Safe to ignore in Epic 5

2. `20251016000000_create_vector_indexes` (Epic 3)
   - **Changes:** Vector indexing for semantic search
   - **Owner:** Epic 3 - Knowledge Graph
   - **Status:** ✅ Safe to ignore in Epic 5

3. `20251016235900_fix_vector_dimensions` (Epic 3)
   - **Changes:** Adjusted vector dimension constraints
   - **Owner:** Epic 3 - Knowledge Graph
   - **Status:** ✅ Safe to ignore in Epic 5

4. `20251016223131_add_validation_response_fields` (Epic 4)
   - **Tables Added:** validation_responses
   - **Owner:** Epic 4 - Understanding Validation
   - **Status:** ✅ Safe to ignore in Epic 5

5. `20251017000000_add_first_aid_integration` (Epic 3)
   - **Tables Added:** first_aid_editions, first_aid_sections, lecture_first_aid_mappings
   - **Owner:** Epic 3 - Knowledge Graph
   - **Status:** ✅ Safe to ignore in Epic 5

**Impact on Epic 5:** None - all tables are independent

**Action Required:** None - document only

---

## Team Communication Protocol

### Before Creating Schema Changes

1. **Check Slack/Discord:** "Planning to add [table/column] to [model]"
2. **Wait 30 min** for other teams to respond if conflict
3. **Document in this file** under "Planned Changes"

### After Creating Migrations

1. **Update this document** with migration details
2. **Notify team:** "New migration applied: [name] affects [tables]"
3. **Add to Known Drift section** if applicable

### Weekly Sync (Recommended)

- **Who:** All epic leads
- **When:** Friday EOD
- **Agenda:**
  - Review migrations created this week
  - Identify conflicts or dependencies
  - Plan merge sequence

---

## Migration File Naming Convention

**Format:** `YYYYMMDDHHmmss_descriptive_name`

**Example:** `20251016231054_add_story_5_1_behavioral_pattern_models`

**Best Practices:**
- Include epic number or feature in description
- Use snake_case for readability
- Be descriptive (future developers will thank you)

**Bad:**
```
20251016000000_update
20251016000001_changes
20251016000002_fix
```

**Good:**
```
20251016120000_epic3_add_vector_search_indexes
20251016140000_epic5_add_behavioral_pattern_models
20251016160000_epic3_integrate_first_aid_content
```

---

## Appendix A: Database State Inspection

### Useful Commands

```bash
# List all migrations in database
psql postgresql://kyin@localhost:5432/americano -c \
  "SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY finished_at;"

# List all tables
psql postgresql://kyin@localhost:5432/americano -c "\dt"

# Show table schema
psql postgresql://kyin@localhost:5432/americano -c "\d+ table_name"

# Count migrations
psql postgresql://kyin@localhost:5432/americano -c \
  "SELECT COUNT(*) FROM _prisma_migrations;"
```

### Prisma CLI Commands

```bash
# Check migration status
npx prisma migrate status

# View pending migrations
npx prisma migrate status --schema=./prisma/schema.prisma

# Validate schema
npx prisma validate

# Generate Prisma Client
npx prisma generate

# Open database GUI
npx prisma studio
```

---

## Appendix B: Emergency Rollback Procedure

**⚠️ Use ONLY if shared database is corrupted**

### Step 1: Backup Current State

```bash
# Dump database
pg_dump postgresql://kyin@localhost:5432/americano > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup all worktree migration folders
tar -czf migrations_backup_$(date +%Y%m%d_%H%M%S).tar.gz \
  /Users/kyin/Projects/Americano*/apps/web/prisma/migrations/
```

### Step 2: Identify Rollback Target

```bash
# Find last known good migration
psql postgresql://kyin@localhost:5432/americano -c \
  "SELECT migration_name, finished_at FROM _prisma_migrations \
   WHERE finished_at < 'YYYY-MM-DD HH:MM:SS' \
   ORDER BY finished_at DESC LIMIT 1;"
```

### Step 3: Manual Rollback

```bash
# 1. Create new database
createdb americano_clean

# 2. Apply migrations up to target
cd Americano/apps/web
DATABASE_URL=postgresql://kyin@localhost:5432/americano_clean \
  npx prisma migrate deploy

# 3. Migrate data from old to new
pg_dump americano | psql americano_clean

# 4. Swap databases (requires downtime)
psql -c "ALTER DATABASE americano RENAME TO americano_old;"
psql -c "ALTER DATABASE americano_clean RENAME TO americano;"
```

### Step 4: Notify All Teams

**Message Template:**
```
🚨 DATABASE ROLLBACK COMPLETED 🚨

Rolled back to: [migration_name]
Reason: [description]
Impact: Migrations after [timestamp] removed
Action Required:
- Pull latest from main
- Regenerate Prisma Client: npx prisma generate
- Validate local schema: npx prisma validate

Downtime: [duration]
```

---

## Document Changelog

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-16 | Bob (SM) | Initial documentation of multi-worktree migration strategy |

---

**Document Owner:** Technical Scrum Master (Bob)
**Review Cycle:** Monthly or after major schema changes
**Last Reviewed:** 2025-10-16
