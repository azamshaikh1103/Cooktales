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
6. Point `www` and `api` DNS records to the server's public IP address.
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

Set a server scheduler to run this once each day:

```sh
POSTGRES_USER=cooktale POSTGRES_DB=cooktale sh deploy/backup-postgres.sh
```

Keep encrypted copies in a private S3 bucket and test restoring one backup before
calling the deployment ready.

## Updates

Build the new version, run `backend-migrate`, then restart the app containers.
Never use `prisma migrate reset` on the production server.
