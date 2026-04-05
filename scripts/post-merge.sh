#!/bin/bash
set -e

echo "==> Installing dependencies..."
npm install --prefer-offline --no-audit --no-fund

echo "==> Generating Prisma client..."
npx prisma generate

echo "==> Syncing database schema..."
npx prisma db push --accept-data-loss

echo "==> Post-merge setup complete."
