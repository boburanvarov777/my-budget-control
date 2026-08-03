#!/bin/sh
set -e

cd /app/backend

echo "Running database migrations..."
npx prisma migrate deploy 2>/dev/null || npx prisma db push --accept-data-loss

echo "Starting backend..."
node dist/main &
BACKEND_PID=$!

echo "Starting nginx on port 8080..."
nginx -g 'daemon off;' &
NGINX_PID=$!

wait $BACKEND_PID $NGINX_PID
