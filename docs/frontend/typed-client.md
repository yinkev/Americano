# Typed API client usage

This app uses a small `fetch` wrapper (`apps/web/src/lib/api/client.ts`) and consolidated TypeScript interfaces derived from FastAPI Pydantic models.

- Contracts live at `docs/api/contracts.ts` (mirrored to `packages/api-client/src/types.ts`).
- Prefer importing from the package mirror once published; during development, importing from `docs/api/contracts` is acceptable.

Example

```ts
import { api } from '@/lib/api/client'
import { endpoints } from '@/lib/api/endpoints'
import type { PromptGenerationRequest, PromptGenerationResponse } from '@/../../docs/api/contracts'

const body: PromptGenerationRequest = {
  objective_id: 'obj_demo',
  objective_text: 'Explain the conduction system',
}

const data = await api.post<PromptGenerationResponse>(
  endpoints.validation.generatePrompt(),
  body,
)
```

Base URL
- `NEXT_PUBLIC_API_BASE_URL` is preferred; falls back to `NEXT_PUBLIC_API_URL`; defaults to `/api`.

```bash
# apps/web/.env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

