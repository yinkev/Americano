#!/bin/bash
set -e
cd "$(dirname "$0")"

# SOFT • PLAYFUL (compact)
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
PINK='\033[0;95m'
TEAL='\033[0;36m'
LILAC='\033[0;94m'
WHITE='\033[1;37m'
HL_SOFT='\033[30;47m'   # black on light gray
NC='\033[0m'

banner() {
  echo -e "${TEAL}┌──────────────────────────────────────┐${NC}"
  echo -e "${TEAL}│${NC}  ${WHITE}Americano • ᶘ ◕ᴥ◕ᶅ${NC}               ${TEAL}│${NC}"
  echo -e "${TEAL}└──────────────────────────────────────┘${NC}"
}

pad() { printf "\n\n"; }

banner
echo -e "✨ ${PINK}Starting (background)${NC}"

make daemon

echo -e "⏳ ${LILAC}Waiting (60s timeout)${NC}"
if bash scripts/wait-for-services.sh 60; then
  echo -e "✅ ${GREEN}Healthy — opening browser${NC}"
  if command -v open >/dev/null 2>&1; then
    open http://localhost:3000 || true
  elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open http://localhost:3000 || true
  fi
else
  echo -e "⚠️  ${RED}Still loading after 60s — opening browser anyway${NC}"
  if command -v open >/dev/null 2>&1; then
    open http://localhost:3000 || true
  elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open http://localhost:3000 || true
  fi
fi

echo -e "🎉 ${GREEN}Ready:${NC} ${WHITE}http://localhost:3000${NC} ✨  (Logs: View Americano Logs.command)"
