# CookTale production deployment

This setup is for one small EC2 server. It runs the website, API, worker,
database and Redis in separate containers. Only Caddy is reachable from the
internet; PostgreSQL and Redis stay private inside Docker.

## Before the first start

1. Use an Ubuntu or Amazon Linux EC2 server with at least 2 GB RAM.
2. Install Docker Engine and Docker Compose.
3. Copy `.env.production.example` to `.env.production` on the server.
4. Replace every `replace-with...` value with a long random value.
5. Fill the required Cloudinary, Google, Resend, VAPID and Lemon Squeezy values.
6. In Cloudflare, point `cooktale.in`, `www`, and `api` to the server's stable
   public IP address. Keep the proxy enabled.
7. In the AWS firewall, allow only ports 80 and 443 to everyone. Restrict SSH to
   your own IP address.

## Safe first deployment

```sh
docker compose --env-file .env.production -f docker-compose.production.yml build
docker compose --env-file .env.production -f docker-compose.production.yml up -d postgres redis
docker compose --env-file .env.production -f docker-compose.production.yml --profile maintenance run --rm backend-migrate
docker compose --env-file .env.production -f docker-compose.production.yml up -d
```

`backend-migrate` uses `prisma migrate deploy`. It applies normal saved database
changes and does not reset or delete the database.

## Daily backup

This uses Google Drive only; it does not use S3. The backup is encrypted on the
server before it is uploaded, so Drive never receives a readable database file.

1. Install `rclone` and `gpg` on the server.
2. Connect a private Google Drive `rclone` remote named `cooktale-drive`.
3. Create `/etc/cooktale/backup-passphrase` with a long recovery passphrase and
   make it readable only by the server administrator. Save that passphrase in
   your password manager too: without it, a Drive backup cannot be restored.
4. Create `/etc/cooktale/backup.env` with:

```sh
RCLONE_REMOTE=cooktale-drive
BACKUP_PASSPHRASE_FILE=/etc/cooktale/backup-passphrase
```

5. Test one manual backup, then schedule it daily as the server administrator:

```sh
sh deploy/backup-postgres.sh
```

The script checks that the encrypted upload exists in Drive. It does not delete
old Drive backups automatically. Set a retention rule only after a successful
restore test.

## Updates

Build the new version, run `backend-migrate`, then restart the app containers.
Never use `prisma migrate reset` on the production server.
