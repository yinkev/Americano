---
title: "Database Migrations Guide - Americano"
description: "Comprehensive guide for managing database migrations with Prisma across development, staging, and production environments"
type: "Guide"
status: "Active"
version: "1.0"

owner: "Database Optimizer"
dri_backup: "Winston (Architect)"
contributors: ["Backend Team", "DevOps Team"]
review_cadence: "Per Change"

created_date: "2025-10-23T13:00:00-07:00"
last_updated: "2025-10-23T13:00:00-07:00"
last_reviewed: "2025-10-23T13:00:00-07:00"
next_review_due: "2025-11-23"

depends_on:
  - apps/web/prisma/schema.prisma
  - docs/DATABASE-MIGRATION-STRATEGY.md
  - docs/EPIC5-DEPLOYMENT-GUIDE.md
affects:
  - All database schema changes
  - Deployment procedures
related_adrs: []

audience:
  - backend-devs
  - database-admins
  - devops-engineers
technical_level: "Intermediate"
tags: ["migrations", "database", "prisma", "deployment", "schema"]
keywords: ["Prisma migrate", "database migrations", "rollback", "schema changes", "production deployment"]
search_priority: "critical"

lifecycle:
  stage: "Active"
  deprecation_date: null
  replacement_doc: null
  archive_after: null

metrics:
  word_count: 3500
  reading_time_min: 17
  code_examples: 25
  last_link_check: "2025-10-23T13:00:00-07:00"
  broken_links: 0

changelog:
  - version: "1.0"
    date: "2025-10-23"
    author: "Database Optimizer"
    changes:
      - "Initial migrations guide"
      - "Consolidated migration strategies"
      - "Environment-specific instructions"
      - "Rollback procedures documented"
---

# Database Migrations Guide - Americano

## Overview

This guide covers database migration management for the Americano adaptive learning platform using Prisma ORM with PostgreSQL.

**Schema Source:** [`apps/web/prisma/schema.prisma`](../apps/web/prisma/schema.prisma) (77 models)
**Migration Count:** 40+ migrations across Epic 3, 4, 5

---

## Quick Reference

### Common Commands

```bash
# Development: Create new migration
npx prisma migrate dev --name add_new_feature

# Production: Apply pending migrations
npx prisma migrate deploy

# Generate Prisma Client (after schema changes)
npx prisma generate

# Check migration status
npx prisma migrate status

# Open Prisma Studio (database GUI)
npx prisma studio
```

---

## Standard Migration Workflow (Development)

### 1. Modify Prisma Schema

```prisma
// apps/web/prisma/schema.prisma

// Add new model
model NewFeature {
  id          String   @id @default(uuid())
  name        String
  description String?
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  createdAt   DateTime @default(now())

  @@index([userId])
  @@index([name])
}

// Add relationship to existing model
model User {
  // ... existing fields
  newFeatures NewFeature[]
}
```

### 2. Create Migration

```bash
cd apps/web

# Create migration with descriptive name
npx prisma migrate dev --name add_new_feature_model

# What happens:
# 1. Prisma compares schema.prisma with current database state
# 2. Generates SQL migration file in prisma/migrations/
# 3. Applies migration to local database
# 4. Regenerates Prisma Client
```

### 3. Review Generated Migration

```sql
-- prisma/migrations/20251023130000_add_new_feature_model/migration.sql

-- CreateTable
CREATE TABLE "NewFeature" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewFeature_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NewFeature_userId_idx" ON "NewFeature"("userId");

-- CreateIndex
CREATE INDEX "NewFeature_name_idx" ON "NewFeature"("name");

-- AddForeignKey
ALTER TABLE "NewFeature" ADD CONSTRAINT "NewFeature_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
```

### 4. Test Migration

```bash
# Verify schema
npx prisma validate

# Check migration status
npx prisma migrate status

# Test with Prisma Studio
npx prisma studio
```

### 5. Commit Changes

```bash
git add prisma/schema.prisma
git add prisma/migrations/20251023130000_add_new_feature_model/
git commit -m "feat: add NewFeature model for feature XYZ"
```

---

## Environment-Specific Procedures

### Development (localhost)

**Database:** `postgresql://user@localhost:5432/americano`
**Workflow:** `prisma migrate dev`

```bash
# Standard workflow
npx prisma migrate dev --name your_migration_name

# This command:
# 1. Creates migration file
# 2. Applies to local DB
# 3. Regenerates Prisma Client
```

**Database Reset (Development Only):**
```bash
# WARNING: Deletes all data!
npx prisma migrate reset

# This command:
# 1. Drops database
# 2. Creates new database
# 3. Applies all migrations
# 4. Runs seed script (if configured)
```

---

### Staging (Preview Environment)

**Database:** Neon branch or separate staging database
**Workflow:** `prisma migrate deploy`

```bash
# Set staging DATABASE_URL
export DATABASE_URL="postgresql://staging-xxx"

# Apply pending migrations
npx prisma migrate deploy

# Verify
npx prisma migrate status
```

**Best Practices:**
- Test migrations on staging before production
- Use Neon database branching for preview environments
- Keep staging data similar to production (anonymized)

---

### Production (Neon/Managed PostgreSQL)

**Database:** `postgresql://production-xxx` (Neon recommended)
**Workflow:** `prisma migrate deploy`

#### Pre-Deployment Checklist

- [ ] Migrations tested on staging
- [ ] Database backup created
- [ ] Migration SQL reviewed for breaking changes
- [ ] Downtime window planned (if needed)
- [ ] Rollback plan prepared

#### Deployment Steps

```bash
# 1. Backup production database
pg_dump $PROD_DATABASE_URL > backup-$(date +%Y%m%d_%H%M%S).sql

# 2. Check pending migrations
DATABASE_URL=$PROD_DATABASE_URL npx prisma migrate status

# 3. Deploy migrations
DATABASE_URL=$PROD_DATABASE_URL npx prisma migrate deploy

# 4. Verify schema
DATABASE_URL=$PROD_DATABASE_URL npx prisma validate

# 5. Test critical queries
psql $PROD_DATABASE_URL -c "SELECT COUNT(*) FROM \"User\";"
```

**See Also:** [EPIC5-DEPLOYMENT-GUIDE.md](./EPIC5-DEPLOYMENT-GUIDE.md#6-database-migration-execution)

---

## Migration File Structure

### File Location

```
apps/web/prisma/migrations/
├── 20251014220648_init/
│   └── migration.sql
├── 20251016000000_create_vector_indexes/
│   └── migration.sql
├── 20251016231054_add_story_5_1_behavioral_pattern_models/
│   └── migration.sql
└── migration_lock.toml
```

### Naming Convention

**Format:** `YYYYMMDDHHmmss_descriptive_name`

**Examples:**
```
✅ Good:
20251016120000_epic3_add_vector_search_indexes
20251016140000_epic5_add_behavioral_pattern_models
20251016160000_epic3_integrate_first_aid_content

❌ Bad:
20251016000000_update
20251016000001_changes
20251016000002_fix
```

### Migration Lock File

```toml
# prisma/migrations/migration_lock.toml
provider = "postgresql"
```

This file ensures migrations are only applied to PostgreSQL databases.

---

## Special Cases

### Adding NOT NULL Column to Existing Table

**Problem:** Adding NOT NULL column to table with existing data fails.

**Solution:** Use two-step migration:

```sql
-- Step 1: Add column as nullable
ALTER TABLE "User" ADD COLUMN "newField" TEXT;

-- Step 2: Backfill data
UPDATE "User" SET "newField" = 'default_value' WHERE "newField" IS NULL;

-- Step 3: Make column NOT NULL
ALTER TABLE "User" ALTER COLUMN "newField" SET NOT NULL;
```

**Prisma Schema:**
```prisma
// First migration
model User {
  newField String?  // Nullable first
}

// Second migration (after backfill)
model User {
  newField String   // Now NOT NULL
}
```

---

### Renaming Columns (Avoiding Data Loss)

**Problem:** Prisma sees rename as drop + create, losing data.

**Solution:** Manual migration with RENAME:

```sql
-- prisma/migrations/XXXXXX_rename_column/migration.sql

-- Rename column (preserves data)
ALTER TABLE "User" RENAME COLUMN "oldName" TO "newName";
```

Then update schema.prisma:
```prisma
model User {
  newName String  // Updated field name
}
```

---

### Changing Column Type

**Problem:** Type changes may lose data or fail validation.

**Solution:** Test on staging first, consider migration script:

```sql
-- Example: Change from INT to BIGINT (safe)
ALTER TABLE "User" ALTER COLUMN "count" TYPE BIGINT;

-- Example: Change from TEXT to INT (requires conversion)
-- Step 1: Add new column
ALTER TABLE "User" ADD COLUMN "count_new" INTEGER;

-- Step 2: Migrate data
UPDATE "User" SET "count_new" = CAST("count_old" AS INTEGER)
WHERE "count_old" ~ '^[0-9]+$';  -- Only valid integers

-- Step 3: Drop old, rename new
ALTER TABLE "User" DROP COLUMN "count_old";
ALTER TABLE "User" RENAME COLUMN "count_new" TO "count";
```

---

## Rollback Procedures

### Rollback Last Migration (Development)

```bash
# Option 1: Reset database (deletes data!)
npx prisma migrate reset

# Option 2: Mark migration as rolled back
npx prisma migrate resolve --rolled-back 20251023130000_migration_name

# Then create new migration to undo changes
```

### Rollback in Production

**⚠️ Production rollback requires careful planning**

#### Method 1: Forward Migration (Preferred)

Create a new migration that undoes changes:

```sql
-- If you added a table
DROP TABLE "NewFeature";

-- If you added a column
ALTER TABLE "User" DROP COLUMN "newField";

-- If you added an index
DROP INDEX "User_email_idx";
```

```bash
# Create undo migration
npx prisma migrate dev --name revert_feature_xyz

# Deploy to production
DATABASE_URL=$PROD_DATABASE_URL npx prisma migrate deploy
```

#### Method 2: Database Restore (Last Resort)

```bash
# 1. Create current backup
pg_dump $PROD_DATABASE_URL > current-backup.sql

# 2. Restore from previous backup
psql $PROD_DATABASE_URL < backup-previous.sql

# 3. Verify data integrity
psql $PROD_DATABASE_URL -c "SELECT COUNT(*) FROM \"User\";"
```

**See Also:** [EPIC5-DEPLOYMENT-GUIDE.md - Rollback Procedure](./EPIC5-DEPLOYMENT-GUIDE.md#9-rollback-procedure)

---

## Multi-Worktree Strategy (Deprecated)

**Status:** Deprecated as of 2025-10-21 (all epics merged to main)

The Americano project previously used Git worktrees for parallel epic development. This is no longer needed.

**Historical Context:**
- Epic 3, 4, 5 developed in parallel worktrees
- Shared single PostgreSQL database
- Timestamp-based migration ownership
- Required `npx prisma db push --skip-generate` workaround

**Current Workflow:** Standard single-branch development on `main`

**See:** [DATABASE-MIGRATION-STRATEGY.md](./DATABASE-MIGRATION-STRATEGY.md) for historical reference

---

## Troubleshooting

### Issue 1: "Migration already exists in database"

**Symptom:**
```
Error: Migration '20251016xxx' already exists in the database
```

**Cause:** Migration already applied (e.g., by another developer or worktree)

**Solution:**
```bash
# Mark migration as applied without running
npx prisma migrate resolve --applied 20251016xxx
```

---

### Issue 2: "Database is out of sync with migration history"

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

# 3. If still failing, pull schema from database
npx prisma db pull

# 4. Create new migration to sync
npx prisma migrate dev --name sync_schema
```

---

### Issue 3: "Column does not exist" after migration

**Symptom:**
```
Error: column "newField" does not exist
```

**Cause:** Stale Prisma Client cache

**Solution:**
```bash
# 1. Regenerate Prisma Client
npx prisma generate

# 2. Clean build cache
rm -rf .next

# 3. Restart dev server
npm run dev
```

---

### Issue 4: Migration fails due to data constraints

**Symptom:**
```
Error: violates not-null constraint
```

**Cause:** Adding NOT NULL column to table with existing data

**Solution:**
See [Adding NOT NULL Column](#adding-not-null-column-to-existing-table)

---

## Best Practices

### 1. Always Review Generated SQL

```bash
# After running prisma migrate dev
cat prisma/migrations/XXXXXX_name/migration.sql

# Check for:
# - Correct table/column names
# - Expected indexes
# - Foreign key constraints
# - No unintended data loss
```

### 2. Test Migrations on Staging First

```bash
# Never deploy directly to production!
# Always test on staging:

DATABASE_URL=$STAGING_URL npx prisma migrate deploy

# Verify schema and data integrity
psql $STAGING_URL -c "\d+ \"TableName\""
```

### 3. Keep Migrations Small and Focused

**Good:**
```
20251023130000_add_user_email_verification
20251023140000_add_user_email_index
```

**Bad:**
```
20251023130000_big_update_with_many_changes
```

### 4. Never Edit Applied Migrations

**❌ Don't:**
```bash
# Edit migration file after it's been applied
vim prisma/migrations/20251023130000_name/migration.sql
```

**✅ Do:**
```bash
# Create new migration to fix issue
npx prisma migrate dev --name fix_previous_migration
```

### 5. Backup Before Production Migrations

```bash
# Always backup before deploying migrations
pg_dump $PROD_DATABASE_URL > backup-$(date +%Y%m%d_%H%M%S).sql

# Keep backups for 30 days minimum
```

---

## Migration Checklist Template

### Pre-Migration

- [ ] Schema changes tested locally
- [ ] Migration SQL reviewed
- [ ] Staging migration successful
- [ ] Database backup created
- [ ] Rollback plan documented
- [ ] Team notified of deployment

### Migration Execution

- [ ] `npx prisma migrate status` checked
- [ ] `npx prisma migrate deploy` executed
- [ ] `npx prisma validate` passed
- [ ] Critical queries tested
- [ ] Application smoke tests passed

### Post-Migration

- [ ] Schema matches expectations
- [ ] Data integrity verified
- [ ] Performance monitoring (slow queries)
- [ ] Team notified of completion
- [ ] Documentation updated

---

## Database Inspection Commands

### Check Migration Status

```bash
# List pending migrations
npx prisma migrate status

# Output:
# Database schema is up to date!
#
# Applied migrations:
# 20251014220648_init
# 20251016000000_create_vector_indexes
# 20251016231054_add_story_5_1_behavioral_pattern_models
```

### Inspect Database Schema

```bash
# Connect to database
psql $DATABASE_URL

# List all tables
\dt

# Describe specific table
\d+ "User"

# List all indexes
\di

# Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Check Applied Migrations

```sql
-- Query _prisma_migrations table
SELECT
  migration_name,
  finished_at,
  applied_steps_count
FROM _prisma_migrations
ORDER BY finished_at DESC;
```

---

## Related Documentation

### Migration Strategies
- [DATABASE-MIGRATION-STRATEGY.md](./DATABASE-MIGRATION-STRATEGY.md) - Comprehensive migration strategy (includes deprecated multi-worktree approach)
- [Data Models Summary](./data-models.md) - All 77 Prisma models documented

### Deployment
- [EPIC5-DEPLOYMENT-GUIDE.md](./EPIC5-DEPLOYMENT-GUIDE.md) - Production deployment guide
- [Development Environment Setup](./development-environment-setup.md) - Local setup guide

### Schema
- [Prisma Schema](../apps/web/prisma/schema.prisma) - Canonical schema definition
- [OpenAPI Spec](../apps/web/docs/api/openapi.yaml) - API contracts

---

## External Resources

**Prisma Documentation:**
- [Prisma Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Migration Workflows](https://www.prisma.io/docs/guides/migrate/developing-with-prisma-migrate)
- [Production Troubleshooting](https://www.prisma.io/docs/guides/migrate/production-troubleshooting)

**PostgreSQL Documentation:**
- [ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html)
- [CREATE INDEX](https://www.postgresql.org/docs/current/sql-createindex.html)
- [pg_dump](https://www.postgresql.org/docs/current/app-pgdump.html)

---

## Support

**Migration Issues:**
- Check [Troubleshooting](#troubleshooting) section first
- Review [DATABASE-MIGRATION-STRATEGY.md](./DATABASE-MIGRATION-STRATEGY.md)
- Consult [Prisma Discord](https://pris.ly/discord) for complex issues

**Schema Design:**
- Review [Data Models Summary](./data-models.md)
- Consult [Solution Architecture](./solution-architecture.md)

---

**Last Updated:** 2025-10-23T13:00:00-07:00
**Maintainer:** Database Optimizer
**Review Schedule:** After schema changes or deployment issues
