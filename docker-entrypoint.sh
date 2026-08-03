#!/bin/sh
set -e

cd /app/backend

if [ "$RESET_DB" = "1" ]; then
  echo "RESET_DB=1 — wiping database and reapplying migrations..."
  npx prisma migrate reset --force
else
  echo "Running database migrations..."
  npx prisma migrate deploy 2>/dev/null || npx prisma db push --accept-data-loss
fi

echo "Starting backend on port 3000..."
export BACKEND_PORT=3000
node dist/main &
BACKEND_PID=$!

NGINX_PORT="${PORT:-8080}"
echo "Starting nginx on port ${NGINX_PORT}..."
sed "s/listen 8080/listen ${NGINX_PORT}/" /etc/nginx/sites-available/default > /tmp/nginx.conf \
  && mv /tmp/nginx.conf /etc/nginx/sites-available/default
nginx -g 'daemon off;' &
NGINX_PID=$!

wait $BACKEND_PID $NGINX_PID
