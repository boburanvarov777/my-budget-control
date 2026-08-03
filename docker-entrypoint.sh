#!/bin/sh
set -e

cd /app/backend
npx prisma migrate deploy || npx prisma db push

node dist/main &
BACKEND_PID=$!

nginx -g 'daemon off;' &
NGINX_PID=$!

wait $BACKEND_PID $NGINX_PID
