#!/bin/sh
set -eu
umask 077

# This script creates an encrypted PostgreSQL backup and uploads it to a
# private Google Drive remote configured with rclone. It never uses S3.
#
# Required private server file: /etc/cooktale/backup.env
#   RCLONE_REMOTE=cooktale-drive
#   BACKUP_PASSPHRASE_FILE=/etc/cooktale/backup-passphrase

script_dir="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
repo_dir="$(CDPATH= cd -- "$script_dir/.." && pwd)"
config_file="${BACKUP_CONFIG_FILE:-/etc/cooktale/backup.env}"

if [ ! -r "$config_file" ]; then
  echo "Backup configuration is missing: $config_file" >&2
  exit 1
fi

# This file is created and readable only by the server administrator.
# shellcheck source=/dev/null
. "$config_file"

: "${RCLONE_REMOTE:?RCLONE_REMOTE is required}"
: "${BACKUP_PASSPHRASE_FILE:?BACKUP_PASSPHRASE_FILE is required}"

if [ ! -r "$BACKUP_PASSPHRASE_FILE" ]; then
  echo "Backup passphrase file is missing or unreadable." >&2
  exit 1
fi

if ! command -v rclone >/dev/null 2>&1 || ! command -v gpg >/dev/null 2>&1; then
  echo "Both rclone and gpg must be installed before running backups." >&2
  exit 1
fi

timestamp="$(date -u +%Y-%m-%dT%H-%M-%SZ)"
archive_name="cooktale-$timestamp.sql.gz.gpg"
work_dir="$(mktemp -d)"
dump_file="$work_dir/cooktale.sql.gz"
encrypted_file="$work_dir/$archive_name"
remote_path="${RCLONE_REMOTE%/}:CookTale-backups/daily"

cleanup() {
  rm -rf "$work_dir"
}

trap cleanup EXIT HUP INT TERM

cd "$repo_dir"
docker compose --env-file .env.production -f docker-compose.production.yml exec -T postgres \
  sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB"' | gzip > "$dump_file"

gpg --batch --yes --pinentry-mode loopback \
  --passphrase-file "$BACKUP_PASSPHRASE_FILE" \
  --symmetric --cipher-algo AES256 \
  --output "$encrypted_file" "$dump_file"

rclone copyto "$encrypted_file" "$remote_path/$archive_name" --checksum
rclone lsf "$remote_path" --files-only | grep -Fx "$archive_name" >/dev/null

echo "Encrypted backup uploaded successfully: $archive_name"
