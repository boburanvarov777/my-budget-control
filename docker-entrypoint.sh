#!/bin/sh
set -e

cd /app/backend

# NOTE: Destructive resets are intentionally NOT supported here.
# `prisma db push --force-reset` drops every table and wipes all user data.
# It used to run whenever RESET_DB=1 was present, which silently destroyed
# production data on every deploy. If a reset is ever truly needed, run it
# manually and deliberately from a local shell — never from the entrypoint.
if [ -n "$RESET_DB" ]; then
  echo "############################################################"
  echo "# WARNING: RESET_DB is still set on this environment.       "
  echo "# It is now IGNORED — it used to wipe the whole database on "
  echo "# every single deploy. Delete the RESET_DB variable in      "
  echo "# Railway -> Variables so this warning goes away.           "
  echo "############################################################"
fi

echo "Running database migrations..."
if ! npx prisma migrate deploy; then
  echo "migrate deploy failed — applying schema with db push (non-destructive)..."
  # No --accept-data-loss: if the change would drop data, the deploy fails
  # loudly instead of quietly deleting rows.
  npx prisma db push
fi

echo "Starting backend on port 3000..."
export BACKEND_PORT=3000
MAIN_FILE=""
if [ -f dist/main.js ]; then
  MAIN_FILE="dist/main.js"
elif [ -f dist/src/main.js ]; then
  MAIN_FILE="dist/src/main.js"
else
  echo "Backend entry not found under dist/"
  ls -la dist/ || true
  exit 1
fi

node "$MAIN_FILE" &
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
  echo "WARNING: Backend health check failed — nginx will still start."
fi

if [ -n "${DATABASE_URL:-}" ] && [ "${BACKUP_ENABLED:-1}" = "1" ]; then
  BACKUP_DIR="${BACKUP_DIR:-/app/backups}"
  mkdir -p "$BACKUP_DIR"
  printf '%s\n' \
    '#!/bin/sh' \
    "export DATABASE_URL='$(printf '%s' "$DATABASE_URL" | sed "s/'/'\\\\''/g")'" \
    "export BACKUP_DIR='${BACKUP_DIR}'" \
    "export BACKUP_RETENTION_DAYS='${BACKUP_RETENTION_DAYS:-7}'" \
    'exec /app/scripts/backup-db.sh' \
    > /app/run-backup.sh
  chmod +x /app/run-backup.sh
  echo "0 3 * * * root /app/run-backup.sh >> /var/log/backup.log 2>&1" > /etc/cron.d/budget-backup
  chmod 0644 /etc/cron.d/budget-backup
  cron
  echo "Daily DB backup at 03:00 UTC -> ${BACKUP_DIR}"
fi

NGINX_PORT="${PORT:-8080}"
echo "Starting nginx on port ${NGINX_PORT}..."
sed "s/listen 8080/listen ${NGINX_PORT}/" /etc/nginx/sites-available/default > /tmp/nginx.conf \
  && mv /tmp/nginx.conf /etc/nginx/sites-available/default
nginx -g 'daemon off;' &
NGINX_PID=$!

wait $BACKEND_PID $NGINX_PID
