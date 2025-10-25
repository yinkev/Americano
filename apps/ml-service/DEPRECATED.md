---
title: Prisma Python Deprecation
status: deprecated
updated: 2025-10-24T11:10:00-07:00
owners: ["Americano Core"]
depends_on: []
affects: ["apps/ml-service/app", "apps/web/prisma"]
related_adrs: ["docs/architecture/ADR-006-motion-standard.md"]
---

Summary
- Prisma Python is removed from the ML service runtime. SQLAlchemy Core + psycopg v3 is the supported path.

Why
- Prisma Python is archived and not maintained. Keeping it increased breakage risk and made local setup brittle.

What changed
- DB access in ML service now goes through repository adapters in `app/db` using a single engine built from `DATABASE_URL`.
- `DB_ADAPTER=sqlalchemy` in `apps/ml-service/.env` is the default.
- Old generated prisma artifacts under `src/generated/prisma/` were deleted.
- Tests referencing Prisma are temporarily skipped and will be migrated.

What to do instead
- Use `app/db/core.py:session()` to obtain a SQLAlchemy session.
- Use `app/db/predictions_repo.py` and `app/db/interventions_repo.py` for read paths.

Migration notes
- No API shape changes. `/predictions`, `/interventions`, `/analytics` preserve the same response models.

