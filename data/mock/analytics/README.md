# Analytics Mock Contracts

This directory stores representative payloads for every analytics contract exposed by the
Americano platform. The canonical fixture file is [`contracts.json`](./contracts.json), which is
shared across runtimes:

- **TypeScript**: consumed through the helper utilities exported by
  `packages/api-client/src/mocks/analytics.ts` and wrapped with metadata-aware helpers in
  `apps/web/src/lib/mocks/analytics.ts`.
- **Python**: loaded via `services/ml-service/app/mock_data/analytics.py` to keep FastAPI mocks and
  background services aligned with the front-end experience.

Each payload intentionally mirrors the structures defined in `apps/web/src/types/api-generated.ts`.
When updating the fixtures, adjust both runtimes to keep the metadata (`source: "mock", version:
"2025-01"`) consistent.
