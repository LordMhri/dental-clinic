#!/bin/sh
set -e

echo "⏳ [sys-core-service] Checking database connection and synchronizing schema..."
npx prisma db push --skip-generate

echo "🚀 [sys-core-service] Database schema synchronized. Starting application..."
exec "$@"
