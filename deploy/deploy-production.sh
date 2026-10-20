#!/bin/sh
# Safe, manual production deployment entry point. It is called by GitHub Actions
# through AWS Systems Manager, so production SSH does not need to be exposed.
set -eu

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 <approved-git-commit>" >&2
  exit 64
fi

commit="$1"
repo_dir="/home/ec2-user/cooktale"
env_file="$repo_dir/.env.production"
compose_file="$repo_dir/docker-compose.production.yml"
state_dir="$repo_dir/deploy/.state"

if [ ! -d "$repo_dir/.git" ] || [ ! -r "$env_file" ] || [ ! -r "$compose_file" ]; then
  echo "Production repository or private environment file is missing." >&2
  exit 1
fi

cd "$repo_dir"

# SSM commands run as root, while this repository is intentionally owned by
# the non-root application user. Keep Git operations under that user so the
# deployment never changes repository ownership or trips Git's safety check.
git_ec2() {
  sudo -u ec2-user git -C "$repo_dir" "$@"
}

# Never overwrite a server-side change unexpectedly. The private .env.production
# file is ignored by Git and is therefore unaffected by this check.
git_ec2 diff --quiet
git_ec2 diff --cached --quiet

git_ec2 fetch --prune origin main
git_ec2 cat-file -e "$commit^{commit}"
git_ec2 merge-base --is-ancestor "$commit" origin/main

previous_commit="$(git_ec2 rev-parse HEAD)"
mkdir -p "$state_dir"
printf '%s\n' "$previous_commit" > "$state_dir/previous-deploy-commit"

git_ec2 checkout --detach "$commit"

# Give the frontend image a new build identity for every approved commit. This
# prevents Docker from reusing an older frontend image when source changes.
export APP_REVISION="$commit"

# Build before replacing the running application. Migrations are additive-only
# and use Prisma's production-safe 'migrate deploy' command.
docker compose --env-file "$env_file" -f "$compose_file" build
# The frontend is what users see. Rebuild it without cache so a changed route
# cannot be hidden behind an older Docker image.
docker compose --env-file "$env_file" -f "$compose_file" build --no-cache frontend
docker compose --env-file "$env_file" -f "$compose_file" up -d postgres redis
docker compose --env-file "$env_file" -f "$compose_file" --profile maintenance run --rm backend-migrate
# Recreate every application container from the newly built images. Database
# and Redis are deliberately excluded so deployment never clears their data.
docker compose --env-file "$env_file" -f "$compose_file" up -d --remove-orphans --force-recreate \
  backend backend-worker frontend caddy

frontend_revision="$(docker compose --env-file "$env_file" -f "$compose_file" exec -T frontend cat /app/.build-revision)"
if [ "$frontend_revision" != "$commit" ]; then
  echo "Frontend image does not match the approved commit." >&2
  exit 1
fi

frontend_callback_status="$(docker compose --env-file "$env_file" -f "$compose_file" exec -T frontend \
  node -e "fetch('http://127.0.0.1:3000/auth/google/callback').then((response) => process.stdout.write(String(response.status))).catch(() => process.exit(1))")"
if [ "$frontend_callback_status" != "200" ]; then
  echo "Frontend callback route is not available." >&2
  exit 1
fi

caddy_callback_status="$(docker compose --env-file "$env_file" -f "$compose_file" exec -T caddy \
  sh -c "wget -q -S -O /dev/null --header='Host: \$DOMAIN' http://127.0.0.1/auth/google/callback 2>&1 | awk '/HTTP\\// { status=\$2 } END { print status }'")"
if [ "$caddy_callback_status" != "200" ]; then
  echo "Reverse proxy does not serve the frontend callback route." >&2
  exit 1
fi

# Confirm the actual API process is responding before calling the deployment a success.
attempt=0
until docker compose --env-file "$env_file" -f "$compose_file" exec -T backend \
  node -e "fetch('http://127.0.0.1:4000/api/v1/health').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 24 ]; then
    echo "Deployment did not pass the API health check." >&2
    exit 1
  fi
  sleep 5
done

printf '%s\n' "$commit" > "$state_dir/current-deploy-commit"
echo "Production deployment successful: $commit"
