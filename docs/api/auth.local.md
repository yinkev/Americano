# Auth, CORS, and OpenAPI (local scan)

## Security
- No explicit FastAPI security dependencies (OAuth2/JWT/APIKey) detected in source.
- Likely unauthenticated APIs for now or auth handled upstream (e.g., reverse proxy/session).

## CORS (apps/api/main.py)
- docs_url: /docs
- redoc_url: /redoc
- openapi_url: /openapi.json (default)
- allow_origins: None
- allow_credentials: True
- allow_methods: ['*']
- allow_headers: ['*']
