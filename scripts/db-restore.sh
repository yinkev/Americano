#!/usr/bin/env bash
# Personal DB restore helper (Epic 4)
# Usage:
#   export DATABASE_URL="postgresql://user:pass@localhost:5432/americano"
#   ./scripts/db-restore.sh path/to/backup.dump [--force]
#
# Restores into DATABASE_URL using pg_restore with --clean/--if-exists.

set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 path/to/backup.dump [--force]" >&2
  exit 2
fi

BACKUP="$1"
FORCE="${2:-}"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "ERROR: DATABASE_URL is not set" >&2
  exit 1
fi

if [[ ! -f "$BACKUP" ]]; then
  echo "ERROR: Backup file not found: $BACKUP" >&2
  exit 1
fi

if ! command -v pg_restore >/dev/null 2>&1; then
  echo "ERROR: pg_restore not found. Install PostgreSQL client tools." >&2
  exit 1
fi

if [[ "$FORCE" != "--force" ]]; then
  echo "WARNING: This will DROP and recreate objects in the target database:"
  echo "  $DATABASE_URL"
  read -r -p "Type RESTORE to proceed: " CONFIRM
  if [[ "$CONFIRM" != "RESTORE" ]]; then
    echo "Aborted."
    exit 130
  fi
fi

# Use available CPU cores for faster restore when supported
JOBS="$( (sysctl -n hw.ncpu 2>/dev/null || getconf _NPROCESSORS_ONLN || echo 2) )"

echo "==> Restoring from $BACKUP to $DATABASE_URL"
pg_restore \
  --clean --if-exists \
  --no-owner --no-privileges \
  --jobs="$JOBS" \
  --dbname="$DATABASE_URL" \
  "$BACKUP"

echo "==> Restore complete."