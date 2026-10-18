#!/bin/sh
set -eu

# Run this from the repository root on the server. It creates a compressed
# database dump. A later server step uploads this file to private S3 storage.
backup_dir="deploy/backups"
timestamp="$(date -u +%Y-%m-%dT%H-%M-%SZ)"

mkdir -p "$backup_dir"
docker compose --env-file .env.production -f docker-compose.production.yml exec -T postgres \
  pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" | gzip > "$backup_dir/cooktale-$timestamp.sql.gz"

find "$backup_dir" -type f -name 'cooktale-*.sql.gz' -mtime +7 -delete
