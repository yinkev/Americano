Baseline migration generated from the current Prisma schema.
- Use `npx prisma migrate deploy --schema apps/web/prisma/schema.prisma` on a fresh database.
- Existing local dev DB uses `db push` via Makefile; this migration is not applied locally.
- Vector indexes remain managed via `apps/web/prisma/vector-indexes.sql`.
