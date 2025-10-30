# Backend API testing

## Route schema checks

Use FastAPI TestClient to validate presence/absence of paths in the OpenAPI schema without hitting DB-dependent handlers.

- Test added: `apps/api/tests/test_analytics_paths.py`
  - Ensures `/analytics/understanding/comparison` exists
  - Ensures `/analytics/analytics/understanding/comparison` does not exist

## Run locally

```bash
cd apps/api
pytest -q
```

If your environment requires a virtualenv, activate it first.

> Note: Many analytics endpoints depend on a live database. The route-path test intentionally validates paths via OpenAPI only to avoid DB requirements.

