#!/usr/bin/env bash
set -euo pipefail

PATTERN='backdrop-blur|bg-gradient-to-|shadow-(md|lg|xl|2xl|\[|[0-9])'

if rg -n -e "$PATTERN" src \
  --glob '!**/*.svg' \
  --glob '!**/*.md' \
  --iglob '**/*.{ts,tsx,js,jsx,css}' --color never; then
  echo "Forbidden utilities detected (glass/gradients/shadows)." >&2
  exit 1
else
  echo "UI guard passed."
fi
