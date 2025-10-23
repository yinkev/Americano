#!/usr/bin/env bash
# Personal DB backup helper (Epic 4)
# Usage:
#   export DATABASE_URL="postgresql://user:pass@localhost:5432/americano"
#   ./scripts/db-backup.sh [optional_output_path]
#
# Default output: backups/americano_YYYYmmddHHMMSS.dump

set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "ERROR: DATABASE_URL is not set"
  exit 1
fi

timestamp="$(date +%Y%m%d%H%M%S)"
outpath="${1:-backups/americano_${timestamp}.dump}"

mkdir -p "$(dirname "$outpath")"

echo "==> Creating backup: $outpath"
pg_dump --no-owner --format=custom --file="$outpath" "$DATABASE_URL"

echo "==> Checksum:"
if command -v sha256sum >/dev/null 2>&1; then
  sha256sum "$outpath"
elif command -v shasum >/dev/null 2>&1; then
  shasum -a 256 "$outpath"
else
  echo "sha256 tool not found; skipping checksum."
fi

echo "==> Backup complete."