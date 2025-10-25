#!/bin/bash
set -e
cd "$(dirname "$0")"
make stop
echo "Americano services stopped."
