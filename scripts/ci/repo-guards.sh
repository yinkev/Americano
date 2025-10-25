#!/usr/bin/env bash
set -euo pipefail

echo "Running repository guard checks..."

# 1) Disallow alternate lockfiles
if [ -f "pnpm-lock.yaml" ] || [ -f "yarn.lock" ]; then
  echo "Found disallowed lockfile (pnpm-lock.yaml or yarn.lock). Use npm lockfile only."
  exit 1
fi

# 1b) Disallow nested package-lock.json files
if rg -n "package-lock.json" --glob "**/package-lock.json" | grep -v "^package-lock.json:" >/dev/null 2>&1; then
  echo "Found nested package-lock.json files. Keep a single lockfile at repo root."
  rg -n "package-lock.json" --glob "**/package-lock.json" | grep -v "^package-lock.json:" || true
  exit 1
fi

# 2) Disallow framer-motion dependency
if rg -n '"framer-motion"' --glob "**/package*.json" >/dev/null 2>&1; then
  echo "Detected disallowed dependency: framer-motion. Use motion (motion.dev) instead."
  rg -n '"framer-motion"' --glob "**/package*.json" || true
  exit 1
fi

# 3) Prisma version consistency (@prisma/client and prisma)
node scripts/ci/check-prisma-versions.mjs

echo "All repo guard checks passed."
