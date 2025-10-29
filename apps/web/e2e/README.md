# E2E Smoke Tests (Playwright)

This folder contains minimal smoke tests for the web app.

## Health Page

Test file: `apps/web/e2e/health.spec.ts`

### Run Locally

1) Start the dev server in another terminal:

```
pnpm --filter @americano/web dev
```

2) Run the smoke test (uses BASE_URL if set, else http://localhost:3000):

```
BASE_URL=http://localhost:3000 npx playwright test apps/web/e2e/health.spec.ts
```

If your Playwright config is already set up with a webServer and baseURL, you can also run:

```
npx playwright test -g "health smoke"
```

