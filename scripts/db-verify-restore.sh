#!/usr/bin/env bash
# Verify backup & restore into a temporary database and validate pgvector dims
# Usage:
#   export DATABASE_URL="postgresql://user:pass@localhost:5432/americano"
#   export GEMINI_EMBEDDING_DIM="${GEMINI_EMBEDDING_DIM:-1536}"
#   ./scripts/db-verify-restore.sh [--keep]
#
# Steps:
#   1) pg_dump current DB to a temp file
#   2) Create temp DB (americano_verify_YYYYmmddHHMMSS)
#   3) pg_restore into temp DB
#   4) Validate content_chunks.embedding vector dims == GEMINI_EMBEDDING_DIM (default 1536)
#   5) Drop temp DB (unless --keep), remove temp dump
#
# Requirements: psql, pg_dump, pg_restore available in PATH

set -euo pipefail

KEEP="${1:-}"
EXPECTED_DIMS="${GEMINI_EMBEDDING_DIM:-1536}"

err() { echo "ERROR: $*" >&2; }
log() { echo "==> $*"; }

need_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    err "Required command not found: $1"
    exit 1
  fi
}

need_cmd psql
need_cmd pg_dump
need_cmd pg_restore
need_cmd date
need_cmd mktemp
need_cmd sed

if [[ -z "${DATABASE_URL:-}" ]]; then
  err "DATABASE_URL is not set"
  exit 1
fi

# Strip any query params to safely swap database name
URL_NO_PARAMS="${DATABASE_URL%%\?*}"
BASE_WITH_DB="${URL_NO_PARAMS}"
BASE_NO_DB="${BASE_WITH_DB%/*}"
SRC_DB_NAME="${BASE_WITH_DB##*/}"
ADMIN_URL="${BASE_NO_DB}/postgres"

timestamp="$(date +%Y%m%d%H%M%S)"
TMP_DB="americano_verify_${timestamp}"
TMP_URL="${BASE_NO_DB}/${TMP_DB}"

DUMP_FILE="$(mktemp -t americano_dump_${timestamp}_XXXXXX.dump)"

cleanup() {
  set +e
  if [[ "$KEEP" != "--keep" ]]; then
    log "Dropping temp database $TMP_DB"
    psql "$ADMIN_URL" -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS \\"$TMP_DB\\";" >/dev/null 2>&1
  else
    log "Keeping temp database $TMP_DB as requested (--keep)"
  fi
  if [[ -f "$DUMP_FILE" ]]; then
    rm -f "$DUMP_FILE"
  fi
  set -e
}
trap cleanup EXIT

log "Source database: $SRC_DB_NAME"
log "Admin URL: $ADMIN_URL"
log "Temp database: $TMP_DB"
log "Expected vector dims: $EXPECTED_DIMS"

log "Creating dump: $DUMP_FILE"
pg_dump --no-owner --format=custom --file="$DUMP_FILE" "$DATABASE_URL"

log "Creating temp database: $TMP_DB"
psql "$ADMIN_URL" -v ON_ERROR_STOP=1 -c "CREATE DATABASE \\"$TMP_DB\\" TEMPLATE template0;"

# Use available CPU cores for faster restore when supported
JOBS="$( (sysctl -n hw.ncpu 2>/dev/null || getconf _NPROCESSORS_ONLN || echo 2) )"

log "Restoring into temp database"
pg_restore \
  --clean --if-exists \
  --no-owner --no-privileges \
  --jobs="$JOBS" \
  --dbname="$TMP_URL" \
  "$DUMP_FILE"

log "Validating pgvector dimensions on content_chunks.embedding"
# For pgvector, dimensions are encoded in atttypmod (dims = atttypmod - 4)
SQL="SELECT (a.atttypmod - 4) AS dims
     FROM pg_attribute a
     JOIN pg_class c ON a.attrelid = c.oid
     WHERE c.relname = 'content_chunks'
       AND a.attname = 'embedding'
       AND a.attnum > 0
       AND NOT a.attisdropped
     LIMIT 1;"

dims="$(psql "$TMP_URL" -At -v ON_ERROR_STOP=1 -c "$SQL" | tr -d '[:space:]')"

if [[ -z "$dims" ]]; then
  err "Could not determine embedding vector dimension (is table/column present?)"
  exit 1
fi

log "Detected vector dims: $dims"
if [[ "$dims" != "$EXPECTED_DIMS" ]]; then
  err "Vector dimension mismatch. Expected $EXPECTED_DIMS, got $dims"
  err "Update GEMINI_EMBEDDING_DIM or fix DB schema/index before deploying."
  exit 2
fi

log "Backup + restore verification PASSED (vector dims = $dims)"
if [[ "$KEEP" == "--keep" ]]; then
  log "Temp DB preserved: $TMP_URL"
fi
