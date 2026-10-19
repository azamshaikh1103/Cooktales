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

# Never overwrite a server-side change unexpectedly. The private .env.production
# file is ignored by Git and is therefore unaffected by this check.
git diff --quiet
git diff --cached --quiet

git fetch --prune origin main
git cat-file -e "$commit^{commit}"
git merge-base --is-ancestor "$commit" origin/main

previous_commit="$(git rev-parse HEAD)"
mkdir -p "$state_dir"
printf '%s\n' "$previous_commit" > "$state_dir/previous-deploy-commit"

git checkout --detach "$commit"

# Build before replacing the running application. Migrations are additive-only
# and use Prisma's production-safe 'migrate deploy' command.
docker compose --env-file "$env_file" -f "$compose_file" build
docker compose --env-file "$env_file" -f "$compose_file" up -d postgres redis
docker compose --env-file "$env_file" -f "$compose_file" --profile maintenance run --rm backend-migrate
docker compose --env-file "$env_file" -f "$compose_file" up -d --remove-orphans

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
