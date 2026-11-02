#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
npm ci --include=dev
npm run prisma:generate
echo "Dependencies and generated client refreshed. No schema, content or admin changes were made."
echo "Use the documented explicit release commands after backup and target review."
