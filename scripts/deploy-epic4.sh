#!/usr/bin/env bash
# Epic 4 Personal Deployment Orchestrator (Americano)
# Purpose: Run preflight, back up DB + verify restore, build the web app, and run smoke checks.
# Notes:
#   - This script does NOT start servers for you. Start the Python API and Next.js "start" in separate terminals as directed.
#   - Requirements: Node 18+, npm/pnpm, Python 3.11+, uvicorn, curl
#
# Usage:
#   chmod +x scripts/deploy-epic4.sh
#   ./scripts/deploy-epic4.sh
#
# Optional env:
#   API_URL           (default: http://localhost:8000)
#   WEB_URL           (default: http://localhost:3000)
#   GEMINI_EMBEDDING_DIM (recommended: 1536)
#
# References:
#   - Preflight: apps/web/scripts/preflight.ts
#   - Smoke:    apps/web/scripts/smoke.ts
#   - Status:   docs/bmm-workflow-status.md
#   - Runbook:  docs/deployments/epic4-deployment-plan.md
#   - Retro:    docs/retrospectives/epic-4-retro-2025-10-20.md

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." &>/dev/null && pwd)"
cd "$ROOT_DIR"

API_URL="${API_URL:-http://localhost:8000}"
WEB_URL="${WEB_URL:-http://localhost:3000}"

say()  { printf "\n\033[1;34m==> %s\033[0m\n" "$*"; }
warn() { printf "\033[1;33m[WARN]\033[0m %s\n" "$*"; }
err()  { printf "\033[1;31m[ERR]\033[0m  %s\n" "$*" 1>&2; }

need_env() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    err "Required env var not set: $name"
    exit 1
  fi
}

need_cmd() {
  local name="$1"
  if ! command -v "$name" >/dev/null 2>&1; then
    err "Required command not found: $name"
    exit 1
  fi
}

say "Pre-flight validation"
need_cmd node
need_cmd npm
need_cmd curl
need_cmd python3

say "Checking required environment variables"
# Minimal required for embedding client; recommend DIM pin
need_env GEMINI_API_KEY
if [[ -z "${DATABASE_URL:-}" ]]; then
  warn "DATABASE_URL not set; backup/verify will be skipped"
fi
if [[ -z "${GEMINI_EMBEDDING_DIM:-}" ]]; then
  warn "GEMINI_EMBEDDING_DIM not set; using recommended 1536 is advised to match pgvector schema"
fi

say "Running preflight checks (env + DB vector dims)"
( cd apps/web && npm run preflight )

if [[ -n "${DATABASE_URL:-}" ]]; then
  say "Creating DB backup (custom dump format)"
  ./scripts/db-backup.sh

  say "Verifying backup via temp-DB restore + vector dims check"
  ./scripts/db-verify-restore.sh
else
  warn "Skipping DB backup + verify (DATABASE_URL missing)"
fi

say "Checking Python API health (expect 200 at ${API_URL}/analytics/health)"
if curl -fsS "${API_URL}/analytics/health" >/dev/null 2>&1; then
  say "Python API is up"
else
  warn "Python API is not responding. Start it in another terminal:"
  cat <<'PYAPI'
  # Terminal A (API)
  cd apps/api
  # If uvicorn installed globally:
  uvicorn main:app --host 0.0.0.0 --port 8000
  # Or specify module path explicitly if needed:
  # uvicorn apps.api.main:app --host 0.0.0.0 --port 8000
PYAPI
fi

say "Building Next.js app (production)"
( cd apps/web && npm run build )

cat <<WEBSTART

==> Start Next.js (production) in another terminal:

  # Terminal B (Web)
  cd apps/web
  npm run start
  # App should be available at: ${WEB_URL}

WEBSTART

say "Running golden-path API smokes (non-destructive)"
( cd apps/web && API_URL="${API_URL}" npm run smoke || (err "Smoke checks failed"; exit 1) )

say "Deployment checks complete"

cat <<NEXTSTEPS

Next steps:
1) If API wasn't running, start it and re-run smokes:
   - API: see instructions above
   - Smokes: cd apps/web && API_URL=${API_URL} npm run smoke

2) If everything passes, record deployment in status file:
   - Update docs/bmm-workflow-status.md "Decisions Log" with deploy timestamp
   - Tag release (personal): v4.0.0-personal

References:
- Status:        docs/bmm-workflow-status.md
- Runbook:       docs/deployments/epic4-deployment-plan.md
- Release Notes: docs/releases/epic4-release-notes.md
- Retro:         docs/retrospectives/epic-4-retro-2025-10-20.md

All done.
NEXTSTEPS