#!/bin/sh
# Daily PostgreSQL dump. Keeps the last BACKUP_RETENTION_DAYS files.
#
# Railway: mount a volume at /app/backups and set BACKUP_DIR=/app/backups.
# Manual:  DATABASE_URL=... ./scripts/backup-db.sh

set -eu

BACKUP_DIR="${BACKUP_DIR:-/app/backups}"
RETENTION="${BACKUP_RETENTION_DAYS:-7}"
STAMP="$(date -u +%Y-%m-%dT%H-%M-%SZ)"
OUT="${BACKUP_DIR}/budget-${STAMP}.sql.gz"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "backup-db: DATABASE_URL is not set" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"

echo "backup-db: writing ${OUT}"
pg_dump "$DATABASE_URL" --no-owner --no-acl | gzip -9 > "$OUT"

# Drop dumps older than RETENTION days.
find "$BACKUP_DIR" -name 'budget-*.sql.gz' -type f -mtime +"$RETENTION" -delete 2>/dev/null || true

COUNT="$(find "$BACKUP_DIR" -name 'budget-*.sql.gz' -type f | wc -l | tr -d ' ')"
echo "backup-db: done (${COUNT} dump(s) kept, retention ${RETENTION}d)"
