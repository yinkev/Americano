# Burnout Risk Assessment - Migration Instructions

## Prerequisites
- Ensure PostgreSQL database is running
- Backup your database before running migrations

## Step 1: Run Prisma Migration

```bash
cd /Users/kyin/Projects/Americano-epic5/apps/web

# Create and apply migration
npx prisma migrate dev --name add_burnout_risk_models

# Generate Prisma Client
npx prisma generate
```

## Step 2: Verify Migration

```bash
# Check database schema
npx prisma studio

# Verify new tables exist:
# - cognitive_load_metrics
# - burnout_risk_assessments
```

## Step 3: Restart Development Server

```bash
# Stop current server (Ctrl+C)
# Start fresh
pnpm dev
```

## Step 4: Test the Endpoint

```bash
# Replace USER_ID with actual user ID from database
curl "http://localhost:3000/api/analytics/burnout-risk?userId=USER_ID"
```

## Expected Response

```json
{
  "success": true,
  "data": {
    "riskScore": 25,
    "riskLevel": "LOW",
    "contributingFactors": [...],
    "warningSignals": [...],
    "recommendations": [...],
    "assessmentDate": "2025-10-17T...",
    "confidence": 0.85,
    "metadata": {...}
  }
}
```

## Troubleshooting

### Migration Fails
```bash
# Reset migration (development only!)
npx prisma migrate reset

# Rerun migration
npx prisma migrate dev --name add_burnout_risk_models
```

### Type Errors
```bash
# Regenerate Prisma Client
npx prisma generate

# Restart TypeScript server in IDE
```

### API Returns Error
- Check console logs for detailed error messages
- Verify user has sufficient data (>5 study sessions, >7 days)
- Check database connection

## Next Steps

After successful migration:

1. **Create test user data** if database is empty
2. **Test with real user data** for accuracy validation
3. **Monitor performance** (should be <500ms)
4. **Set up caching** for production use

---

**Status:** Ready to migrate
**Estimated Time:** 2-3 minutes
