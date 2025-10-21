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
- [Database Troubleshooting Guide](./troubleshooting/database-issues.md)
- [Database Schema Fix - Oct 20, 2025](../DATABASE-SCHEMA-FIX-2025-10-20.md)
