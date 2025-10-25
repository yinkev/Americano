#!/bin/bash
set -e
cd "$(dirname "$0")"

CYAN='\033[0;36m'; WHITE='\033[1;37m'; NC='\033[0m'
echo -e "${CYAN}[ ${WHITE}Americano Live Logs${CYAN} ]${NC}"

echo -e "   ${WHITE}ml.log${NC}"
tail -n 80 -f ml.log & ML_PID=$!
echo ""
echo -e "   ${WHITE}web.log${NC}"
tail -n 80 -f web.log & WEB_PID=$!

trap 'kill $ML_PID $WEB_PID 2>/dev/null || true' INT TERM EXIT
wait
