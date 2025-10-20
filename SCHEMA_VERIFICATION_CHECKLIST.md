# Schema Verification Checklist - Epic 5 Database

**Created:** 2025-10-17  
**Status:** READY FOR TEAM DISTRIBUTION  
**Verified By:** Database Optimization Specialist  

---

## For All Team Members

### Pre-Development Checklist

- [ ] **Read SCHEMA_VERIFICATION_SUMMARY.txt** (5 min)
  - Quick reference of all findings
  - Implementation priorities
  - No action items for this

- [ ] **Run Schema Validation** (1 min)
  ```bash
  npx prisma validate
  # Expected: "The schema at prisma/schema.prisma is valid 🚀"
  ```

- [ ] **Verify Prisma Client** (1 min)
  ```bash
  ls -la src/generated/prisma/
  # Expected: Index.d.ts, index.js, index.d.ts files exist
  ```

---

## For TypeScript/Frontend Developers

### Type System Integration

- [ ] **Review model type definitions**
  - All 20 Epic 5 models have generated types
  - Import from: `import { BehavioralPattern } from '@/generated/prisma'`

- [ ] **Verify relationship types**
  - UserLearningProfile has `userId` as unique field (1:1 relation)
  - Recommendation has `appliedRecommendations` array (1:N)
  - PersonalizationExperiment has `variants` as JSON (flexible)

- [ ] **Check enum type exports**
  ```typescript
  import { BehavioralPatternType, PersonalizationContext } from '@/generated/prisma'
  ```

- [ ] **Component props should use generated types**
  ```typescript
  interface BehavioralInsightCardProps {
    insight: BehavioralInsight  // Use generated type
    onAcknowledge: (id: string) => Promise<void>
  }
  ```

---

## For Backend API Developers

### Query Implementation

- [ ] **Use indexed fields in WHERE clauses**
  - Always include `userId` in behavioral queries
  - Combine with timestamp for time-range queries
  - Filter by `status` for state-based retrieval

- [ ] **Follow index-aware query patterns**
  ```typescript
  // ✅ GOOD - Uses indexed fields
  const patterns = await prisma.behavioralPattern.findMany({
    where: {
      userId,
      patternType: BehavioralPatternType.OPTIMAL_STUDY_TIME,
      confidence: { gte: 0.7 }
    },
    orderBy: { confidence: 'desc' }
  })

  // ❌ AVOID - Uses unindexed fields in WHERE
  const patterns = await prisma.behavioralPattern.findMany({
    where: {
      evidence: { contains: 'morning' }  // JSON search - expensive
    }
  })
  ```

- [ ] **Use include() for relationships**
  ```typescript
  const insight = await prisma.behavioralInsight.findUnique({
    where: { id },
    include: {
      insightPatterns: {
        include: {
          pattern: true  // Automatically uses indexed relationships
        }
      }
    }
  })
  ```

- [ ] **Implement pagination with cursor**
  ```typescript
  const insights = await prisma.behavioralInsight.findMany({
    where: { userId },
    skip: 0,
    take: 20,
    orderBy: { createdAt: 'desc' }  // Uses index
  })
  ```

- [ ] **Batch operations within limits**
  - Max 1000 inserts per batch
  - Max 500 updates per batch
  - Max 500 deletes per batch
  - (Configured in prisma-config.ts)

### Common Query Patterns

- [ ] **Get user's recent insights** (createdAt index)
  ```typescript
  await prisma.behavioralInsight.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 10
  })
  ```

- [ ] **Get unacknowledged insights** (acknowledgedAt index)
  ```typescript
  await prisma.behavioralInsight.findMany({
    where: { userId, acknowledgedAt: null },
    orderBy: { createdAt: 'desc' }
  })
  ```

- [ ] **Get active personalization config** (userId + isActive + context indexes)
  ```typescript
  await prisma.personalizationConfig.findFirst({
    where: { userId, isActive: true, context: 'MISSION' }
  })
  ```

- [ ] **Rank recommendations** (userId + priorityScore indexes)
  ```typescript
  await prisma.recommendation.findMany({
    where: { userId, status: 'PENDING' },
    orderBy: { priorityScore: 'desc' },
    take: 5
  })
  ```

---

## For QA/Testing

### Schema Integrity Tests

- [ ] **Verify model count**
  ```bash
  # 20+ Epic 5 models should exist
  grep "^model" prisma/schema.prisma | wc -l
  ```

- [ ] **Test cascade delete**
  ```typescript
  // Create user with behavioral data
  const user = await prisma.user.create({ data: { email: 'test@test.com' } })
  
  // Create behavioral data
  await prisma.behavioralPattern.create({
    data: { userId: user.id, patternType: 'OPTIMAL_STUDY_TIME', ... }
  })
  
  // Delete user - should cascade delete patterns
  await prisma.user.delete({ where: { id: user.id } })
  
  // Verify pattern is deleted
  const patterns = await prisma.behavioralPattern.findMany({
    where: { userId: user.id }
  })
  expect(patterns).toHaveLength(0)
  ```

- [ ] **Test unique constraints**
  ```typescript
  // PersonalizationPreferences: userId is unique
  await prisma.personalizationPreferences.create({
    data: { userId: 'user1', ... }
  })
  
  // Should fail
  expect(
    prisma.personalizationPreferences.create({
      data: { userId: 'user1', ... }  // Duplicate
    })
  ).rejects.toThrow('Unique constraint failed')
  ```

- [ ] **Test composite indexes**
  ```typescript
  // PersonalizationEffectiveness: unique on (configId, startDate, endDate)
  const record1 = await prisma.personalizationEffectiveness.create({
    data: {
      configId: 'config1',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-01-08'),
      ...
    }
  })
  
  // Should fail - duplicate composite key
  expect(
    prisma.personalizationEffectiveness.create({
      data: {
        configId: 'config1',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-08'),
        ...
      }
    })
  ).rejects.toThrow()
  ```

### Performance Tests

- [ ] **Benchmark userId queries** (should be <100ms)
  ```typescript
  const start = Date.now()
  await prisma.behavioralPattern.findMany({ where: { userId } })
  console.log(`Query time: ${Date.now() - start}ms`)
  ```

- [ ] **Benchmark timestamp range queries** (should be <200ms)
  ```typescript
  const start = Date.now()
  await prisma.cognitiveLoadMetric.findMany({
    where: {
      userId,
      timestamp: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        lte: new Date()
      }
    }
  })
  console.log(`Range query time: ${Date.now() - start}ms`)
  ```

- [ ] **Verify no N+1 queries** (use DataLoader or include())
  ```typescript
  // ❌ BAD - N+1 queries
  const insights = await prisma.behavioralInsight.findMany({ where: { userId } })
  for (const insight of insights) {
    insight.patterns = await prisma.insightPattern.findMany({
      where: { insightId: insight.id }  // N queries!
    })
  }
  
  // ✅ GOOD - Single query with include
  const insights = await prisma.behavioralInsight.findMany({
    where: { userId },
    include: { insightPatterns: true }  // Eager load
  })
  ```

---

## For DevOps/Database Admins

### Database Preparation

- [ ] **Verify PostgreSQL version** (12+)
  ```bash
  psql --version
  ```

- [ ] **Install pgvector extension**
  ```bash
  CREATE EXTENSION IF NOT EXISTS vector;
  ```

- [ ] **Verify environment variables**
  ```bash
  echo $DATABASE_URL  # Should be set
  ```

- [ ] **Test database connection**
  ```bash
  npx prisma db execute --stdin
  SELECT version();
  ```

### Production Deployment

- [ ] **Run migrations** (if any)
  ```bash
  npx prisma migrate deploy
  ```

- [ ] **Analyze statistics**
  ```bash
  npx prisma db execute --stdin
  ANALYZE;
  ```

- [ ] **Verify indexes are built**
  ```bash
  npx prisma db execute --stdin
  SELECT indexname, idx_scan FROM pg_stat_user_indexes;
  ```

- [ ] **Set up monitoring queries**
  - Enable slow_query_log (1 second threshold)
  - Track index usage via pg_stat_user_indexes
  - Monitor connection pool exhaustion

### Backup & Recovery

- [ ] **Include schema in backups**
  ```bash
  pg_dump --schema-only $DATABASE_URL > schema-backup.sql
  ```

- [ ] **Test restore procedure**
  - Verify Prisma client still works after restore
  - Check index integrity

---

## For Optional: Package.json Cleanup

### Deprecation Fix (Not Critical)

- [ ] **Review PRISMA_CONFIG_OPTIMIZATION.md** (5 min)

- [ ] **Verify prisma.config.ts is loaded**
  ```bash
  npx prisma validate
  # Should output: "Prisma config detected, skipping environment variable loading"
  ```

- [ ] **Backup package.json**
  ```bash
  cp package.json package.json.backup
  ```

- [ ] **Remove deprecated entry** (OPTIONAL - only if confident)
  ```bash
  npm remove --save-dev prisma
  # OR manually edit package.json and remove the "prisma" line
  ```

- [ ] **Verify everything still works**
  ```bash
  npx prisma validate
  npx prisma generate
  npm test
  ```

- [ ] **Rollback if needed**
  ```bash
  npm install --save-dev prisma@^6.17.1
  # OR restore from backup
  ```

---

## For All: Post-Verification

### Final Checks

- [ ] **All three reports generated**
  - [ ] DATABASE_SCHEMA_VALIDATION_REPORT.md (comprehensive, 340+ lines)
  - [ ] PRISMA_CONFIG_OPTIMIZATION.md (deprecation guide)
  - [ ] INDEX_OPTIMIZATION_GUIDE.md (performance tuning)

- [ ] **Local environment verified**
  ```bash
  npx prisma validate
  npx prisma generate
  npm test (at least schema tests)
  ```

- [ ] **Team communicated**
  - [ ] Share SCHEMA_VERIFICATION_SUMMARY.txt with team
  - [ ] Point TypeScript agent to type definitions
  - [ ] Point backend team to query patterns
  - [ ] Brief QA on test scenarios

- [ ] **Confidence confirmed**
  - [ ] Schema is production-ready ✅
  - [ ] No critical issues identified ✅
  - [ ] All Epic 5 models present ✅
  - [ ] Index coverage complete ✅

---

## Summary by Role

| Role | Read | Action | Time |
|------|------|--------|------|
| TypeScript | INDEX_OPT + SUMMARY | No action | 10 min |
| Backend API | QUERY_PATTERNS + INDEX_OPT | Implement via indexes | 5 min read |
| QA | VALIDATION_REPORT | Plan test scenarios | 15 min |
| DevOps | VALIDATION_REPORT + OPTIMIZATION | Setup monitoring | 20 min |
| Frontend | SUMMARY | No action | 5 min |
| Optional All | PRISMA_CONFIG_OPTIMIZATION | Remove from package.json | 5 min |

---

## Sign-Off

When complete, mark checkboxes above and confirm:

- [ ] Team members notified
- [ ] Local environments updated
- [ ] Staging database prepared
- [ ] Production deployment plan finalized
- [ ] Monitoring configured
- [ ] Rollback procedure documented

**Status:** ✅ READY FOR PRODUCTION DEPLOYMENT

---

**Last Updated:** 2025-10-17
**Verification Date:** 2025-10-17
**Next Review:** After first month of production usage
