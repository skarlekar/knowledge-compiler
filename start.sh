#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-3000}"

# Kill any process already listening on the port
existing_pid=$(lsof -ti tcp:"$PORT" 2>/dev/null || true)
if [ -n "$existing_pid" ]; then
  echo "Stopping existing server (PID $existing_pid) on port $PORT..."
  kill "$existing_pid"
  # Wait up to 3 seconds for the port to free
  for i in 1 2 3; do
    sleep 1
    lsof -ti tcp:"$PORT" >/dev/null 2>&1 || break
  done
fi

cd "$(dirname "$0")/src"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

echo "Starting server on http://localhost:${PORT}"
# Pass --allow-write to enable upload and import (disabled by default for safety)
# Usage: ./start.sh --allow-write
node server/index.js "$@"
