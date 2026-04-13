#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/src"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

echo "Starting server on http://localhost:${PORT:-3000}"
node server/index.js
