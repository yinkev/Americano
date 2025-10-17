# Quick Merge Reference Card

**Full plan:** See [MULTI-WORKTREE-MERGE-PLAN.md](./MULTI-WORKTREE-MERGE-PLAN.md)

---

## Quick Commands (Copy-Paste Ready)

### Merge Epic 3 (First)
```bash
cd /Users/kyin/Projects/Americano
git checkout main && git pull
git merge feature/epic-3-knowledge-graph
# Fix schema conflicts in editor
npx prisma format
npx prisma migrate dev --name epic_3_knowledge_graph_merge
npx prisma generate && npm run type-check
git add . && git commit -m "Merge Epic 3"
git push origin main
```

### Merge Epic 4 (Second)
```bash
cd /Users/kyin/Projects/Americano
git checkout main && git pull
git merge feature/epic-4-understanding-validation
# Fix schema conflicts in editor
rm -rf apps/web/prisma/migrations/20251016*
npx prisma format
npx prisma migrate dev --name epic_4_validation_merge
npx prisma generate && npm run type-check
git add . && git commit -m "Merge Epic 4"
git push origin main
```

### Merge Epic 5 (Third)
```bash
cd /Users/kyin/Projects/Americano
git checkout main && git pull
git merge feature/epic-5-behavioral-twin
# Fix schema conflicts in editor
rm -rf apps/web/prisma/migrations/*epic5*
npx prisma format
npx prisma migrate dev --name epic_5_behavioral_merge
npx prisma generate && npm run type-check
git add . && git commit -m "Merge Epic 5"
git push origin main
```

---

## Schema Conflict Resolution (30 seconds)

1. Open `apps/web/prisma/schema.prisma`
2. Find conflict markers: `<<<<<<<`, `=======`, `>>>>>>>`
3. **Keep ALL models** (delete markers only)
4. Add section comments:
   ```prisma
   // ============ Epic 3 ============
   // ============ Epic 4 ============
   // ============ Epic 5 ============
   ```
5. Save and run: `npx prisma format`

---

## Troubleshooting

### "Migration already applied"
```bash
# Skip that migration
npx prisma migrate resolve --applied {migration_name}
```

### TypeScript errors after merge
```bash
npx prisma generate
npm run type-check
```

### Need to abort merge
```bash
git merge --abort
```

---

## Recommended Order
1. Epic 3 (knowledge graph foundation)
2. Epic 4 (uses Epic 3 for search)
3. Epic 5 (uses Epic 4 validation data)

**Total time:** ~4 hours for all 3 epics
