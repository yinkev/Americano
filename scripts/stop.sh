#!/usr/bin/env bash
set -euo pipefail

RED='\033[1;91m'
CYAN='\033[1;96m'
GREEN='\033[1;92m'
HL_CYAN='\033[1;30;106m'
NC='\033[0m'

echo -e "${CYAN}[ ${WHITE}Stopping Americano${CYAN} ]${NC}"

kill_by_pattern() {
  local pat="$1"
  local pids
  pids=$(pgrep -f "$pat" || true)
  if [[ -n "${pids:-}" ]]; then
    echo -e "🧼 Tidying: $pat -> $pids"
    kill -15 $pids 2>/dev/null || true
    sleep 1
    kill -9 $pids 2>/dev/null || true
  fi
}

kill_by_port() {
  local port="$1"
  if lsof -ti tcp:"$port" >/dev/null 2>&1; then
    local pids
    pids=$(lsof -ti tcp:"$port")
    echo -e "🧼 Freeing port $port -> $pids"
    kill -15 $pids 2>/dev/null || true
    sleep 1
    kill -9 $pids 2>/dev/null || true
  fi
}

# Target known processes first
kill_by_pattern "next dev"
kill_by_pattern "apps/web.*next"
kill_by_pattern "uvicorn app.main:app"

# Then ensure ports are free
kill_by_port 3000
kill_by_port 8000

echo -e "${GREEN}✅ All stopped${NC}"
