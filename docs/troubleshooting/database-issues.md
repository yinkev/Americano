# Database Troubleshooting Guide

## Schema Synchronization Issues

### Quick Diagnosis
```bash
# 1. Check Prisma Client version matches schema
cat src/generated/prisma/package.json

# 2. Verify database columns exist
psql -d americano -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='table_name';"

# 3. Check migration history
npx prisma migrate status
```

### Resolution Steps
1. Stop all running dev servers (`killall node`)
2. Regenerate Prisma Client (`npx prisma generate`)
3. Clear build cache (`rm -rf .next`)
4. Restart dev server (`npm run dev`)
5. Test affected endpoints

### Prevention
- **Always** regenerate Prisma Client after schema changes
- **Always** restart dev server after Prisma regeneration
- **Never** commit schema changes without testing locally first

## Common Error Messages

### Error: "column does not exist"
```
Invalid `prisma.table.findMany()` invocation:
The column `table.column_name` does not exist in the current database.
```

**Diagnosis:**
- Prisma schema has the column, but Prisma Client or database doesn't
- Check: `psql -d americano -c "\d+ table_name"`

**Fix:**
1. If column exists in DB but error persists → Regenerate Prisma Client
2. If column missing from DB → Run pending migrations
3. Restart dev server with clean build

### Error: "type does not exist"
```
Error occurred during query execution:
type "public.EnumName" does not exist
```

**Diagnosis:**
- Database missing enum type definition
- Manual SQL migrations may not have been applied

**Fix:**
1. Check if enum exists: `psql -d americano -c "SELECT typname FROM pg_type WHERE typname='EnumName';"`
2. If missing, apply manual SQL migrations
3. Regenerate Prisma Client
4. Restart dev server

### Error: "prisma migrate status" says "up to date" but errors persist
```
Database schema is up to date!
(but APIs still failing with schema errors)
```

**Diagnosis:**
- Migration tracking out of sync with actual database state
- Prisma Client cache stale

**Fix:**
1. Verify actual database state with `psql` commands
2. Force regenerate Prisma Client
3. Clean build cache completely
4. Restart all servers

## Emergency Recovery

### Nuclear Option (when nothing else works)
```bash
# 1. Kill all processes
killall node
killall postgres  # Only if you know what you're doing!

# 2. Drop and recreate database (DESTRUCTIVE - dev only!)
psql -c "DROP DATABASE americano;"
psql -c "CREATE DATABASE americano;"

# 3. Run all migrations
cd apps/web
npx prisma migrate deploy

# 4. Seed database
npx prisma db seed

# 5. Generate client
npx prisma generate

# 6. Start fresh
rm -rf .next
npm run dev
```

**⚠️ WARNING:** This destroys all local data. Use only for development.

## Reference: October 20, 2025 Incident

### What Happened
Prisma Client was out of sync with database schema, causing all Epic 5 API endpoints to fail with "column does not exist" errors.

### Root Cause
1. Manual SQL migration file created but enum types not properly applied
2. Prisma Client generated against outdated schema state
3. Dev server running with cached, stale Prisma Client

### Resolution
1. Verified database columns exist with correct types
2. Regenerated Prisma Client: `npx prisma generate`
3. Restarted dev server with clean build
4. All APIs returned to 200 OK status

### Full Details
See `../../DATABASE-SCHEMA-FIX-2025-10-20.md`

## Prevention Checklist

When making schema changes:
- [ ] Modify `schema.prisma`
- [ ] Create migration: `npx prisma migrate dev --name descriptive_name`
- [ ] Verify migration applied: `npx prisma migrate status`
- [ ] Regenerate client: `npx prisma generate`
- [ ] Clean build: `rm -rf .next`
- [ ] Restart server: `npm run dev`
- [ ] Test affected endpoints
- [ ] Check server logs for Prisma errors
- [ ] Commit schema + migration files together

## Additional Resources
- [Development Environment Setup](../technical/development-environment-setup.md)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Epic 5 Database Schema](../../apps/web/prisma/schema.prisma)
