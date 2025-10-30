#!/usr/bin/env bash
set -euo pipefail
ROOT=docs
while IFS='|' read -r FROM TO; do
  FROM_ESC=$(printf '%s' "$FROM" | sed 's/[\/[\&]/\\&/g')
  TO_ESC=$(printf '%s' "$TO" | sed 's/[\/[\&]/\\&/g')
  find "$ROOT" -name '*.md' -not -path 'docs/deprecated/*' -print0 | xargs -0 -I{} sed -i '' -e "s#](\(\./\)\{0,1\}$FROM_ESC)#]($TO_ESC)#g" {}
done < docs/_migration/.move-list-active.tmp
