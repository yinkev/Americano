---
title: "Development Environment Setup - Americano"
description: "Quick reference guide for database schema management, Prisma Client regeneration, common troubleshooting fixes, and pre-commit checklist"
type: "Guide"
status: "Active"
version: "1.1"

owner: "Kevy"
dri_backup: "Winston (Architect)"
contributors: ["Development Team", "Database Optimizer"]
review_cadence: "Per Change"

created_date: "2025-10-20T00:00:00-07:00"
last_updated: "2025-10-23T12:00:00-07:00"
last_reviewed: "2025-10-23T12:00:00-07:00"
next_review_due: "2025-11-23"

depends_on:
  - apps/web/prisma/schema.prisma
  - docs/DATABASE-SCHEMA-FIX-2025-10-20.md
  - README.md
affects:
  - All developers
  - Development workflow
related_adrs: []

audience:
  - new-developers
  - experienced-devs
technical_level: "Beginner"
tags: ["development", "setup", "troubleshooting", "prisma", "database", "schema"]
keywords: ["Prisma Client", "schema.prisma", "migration", "regenerate", "dev server", "clean build"]
search_priority: "high"

lifecycle:
  stage: "Active"
  deprecation_date: null
  replacement_doc: null
  archive_after: null

metrics:
  word_count: 450
  reading_time_min: 2
  code_examples: 8
  last_link_check: "2025-10-23T12:00:00-07:00"
  broken_links: 0

changelog:
  - version: "1.1"
    date: "2025-10-23"
    author: "Kevy"
    changes:
      - "Added enhanced frontmatter for documentation refactor"
      - "Updated for current development workflow"
  - version: "1.0"
    date: "2025-10-20"
    author: "Development Team"
    changes:
      - "Initial development environment setup guide"
      - "Database schema management procedures"
      - "Common troubleshooting fixes"
---

# Development Environment Setup - Americano Epic 5

## Database Schema Management

### After Schema Changes
Always run this sequence after pulling schema changes or modifying `schema.prisma`:

1. **Regenerate Prisma Client:**
   ```bash
   cd apps/web
   npx prisma generate
   ```

2. **Restart Dev Server with Clean Build:**
   ```bash
   rm -rf .next
   npm run dev
   ```

3. **Verify Schema Sync:**
   ```bash
   # Check migration status
   npx prisma migrate status

   # Verify in database
   psql -d americano -c "\d+ table_name"
   ```

### Common Issues

**Symptom:** "column does not exist" errors despite schema having the column
**Cause:** Stale Prisma Client cache
**Fix:** Regenerate client + clean build + restart server

**Symptom:** "type does not exist" for enums
**Cause:** Database missing enum type definitions
**Fix:** Check manual SQL migrations were applied, regenerate client

### Pre-Commit Checklist
- [ ] `npx prisma generate` completed successfully
- [ ] Dev server restarted with clean `.next` directory
- [ ] Tested affected API endpoints
- [ ] No Prisma Client errors in server logs

## Quick Reference Commands

### Full Reset (when things are broken)
```bash
# 1. Stop all servers
killall node

# 2. Regenerate Prisma Client
cd apps/web
npx prisma generate

# 3. Clean build cache
rm -rf .next

# 4. Restart dev server
npm run dev

# 5. Test an endpoint
curl http://localhost:3000/api/health
```

### Verify Database State
```bash
# Check specific table columns
psql -d americano -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='lectures';"

# Check enum types
psql -d americano -c "SELECT typname FROM pg_type WHERE typtype = 'e';"

# Check migration status
npx prisma migrate status
```

## Related Documentation
- [Database Troubleshooting Guide](../troubleshooting/database-issues.md)
- `../DATABASE-SCHEMA-FIX-2025-10-20.md`
