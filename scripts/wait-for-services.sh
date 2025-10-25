#!/usr/bin/env bash
set -euo pipefail

# Colors (Soft playful)
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
TEAL='\033[0;36m'
PINK='\033[0;95m'
WHITE='\033[1;37m'
NC='\033[0m'
NC='\033[0m'

# Waits for Next.js (3000) and FastAPI (8000) to be up.
# Usage: scripts/wait-for-services.sh [timeout_seconds]

TIMEOUT="${1:-60}"
DEADLINE=$((SECONDS + TIMEOUT))

echo -e "🧭 ${TEAL}Waiting for services (timeout: ${TIMEOUT}s)${NC}"

ok() { :; }

draw_bar() {
  local elapsed=$1; local total=$2
  local width=36
  local filled=$(( elapsed * width / total ))
  (( filled>width )) && filled=$width
  local empty=$(( width - filled ))
  local bar=""
  for ((i=0;i<filled;i++)); do bar+="▰"; done
  for ((i=0;i<empty;i++)); do bar+="▱"; done
  printf "  ${PINK}[%s]${NC} ${WHITE}%3d%%%s\r" "$bar" $(( elapsed*100/total )) ""
}

NEXT_OK=false
API_OK=false

while (( SECONDS < DEADLINE )); do
  elapsed=$(( TIMEOUT - (DEADLINE - SECONDS) ))
  draw_bar "$elapsed" "$TIMEOUT"
  if ! $NEXT_OK; then
    if curl -fsS http://localhost:3000 >/dev/null 2>&1; then NEXT_OK=true; ok "Next.js"; fi
  fi
  if ! $API_OK; then
    if curl -fsS http://localhost:8000/health >/dev/null 2>&1; then API_OK=true; ok "FastAPI"; fi
  fi
  if $NEXT_OK && $API_OK; then printf "\n"; echo -e "🚀 ${WHITE}All systems go${NC}"; exit 0; fi
  sleep 1
done

printf "\n"; echo -e "⏱️ ${RED}Timed out after ${TIMEOUT}s${NC}" >&2
exit 1
