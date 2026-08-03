#!/bin/sh
set -e

cd /app/backend

if [ "$RESET_DB" = "1" ]; then
  echo "WARNING: RESET_DB=1 wipes all user data. Remove this variable after initial setup."
  npx prisma db push --force-reset --accept-data-loss
else
  echo "Running database migrations..."
  if ! npx prisma migrate deploy; then
    echo "migrate deploy failed — applying schema with db push (data preserved when possible)..."
    npx prisma db push
  fi
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
