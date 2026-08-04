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

for i in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15; do
  if curl -sf "http://127.0.0.1:3000/api/health" >/dev/null 2>&1; then
    echo "Backend is ready."
    break
  fi
  if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
    echo "Backend process exited during startup."
    exit 1
  fi
  sleep 1
done

if ! curl -sf "http://127.0.0.1:3000/api/health" >/dev/null 2>&1; then
  echo "Backend failed health check."
  exit 1
fi

NGINX_PORT="${PORT:-8080}"
echo "Starting nginx on port ${NGINX_PORT}..."
sed "s/listen 8080/listen ${NGINX_PORT}/" /etc/nginx/sites-available/default > /tmp/nginx.conf \
  && mv /tmp/nginx.conf /etc/nginx/sites-available/default
nginx -g 'daemon off;' &
NGINX_PID=$!

wait $BACKEND_PID $NGINX_PID
