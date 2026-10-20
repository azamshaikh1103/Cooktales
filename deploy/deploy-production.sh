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

# Containers can be created before their web processes are ready to accept a
# request. Wait for a real response so a healthy deployment is not reported as
# failed simply because the first probe was a fraction too early.
wait_for() {
  label="$1"
  shift
  attempt=0

  until "$@"; do
    attempt=$((attempt + 1))
    if [ "$attempt" -ge 24 ]; then
      echo "$label did not become ready." >&2
      return 1
    fi
    sleep 5
  done
}

available_disk_kb() {
  df -Pk / | awk 'NR == 2 { print $4 }'
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

# A fresh frontend build needs working space. Only clear unused Docker build
# cache and dangling images when the server is low on disk space; never remove
# running containers, named volumes, or database data.
minimum_disk_kb=3000000
if [ "$(available_disk_kb)" -lt "$minimum_disk_kb" ]; then
  echo "Low disk space detected; clearing unused Docker build cache."
  docker builder prune --all --force
  docker image prune --force
fi

if [ "$(available_disk_kb)" -lt "$minimum_disk_kb" ]; then
  echo "Not enough free disk space for a safe frontend build." >&2
  exit 1
fi

# Build before replacing the running application. Migrations are additive-only
# and use Prisma's production-safe 'migrate deploy' command.
docker compose --env-file "$env_file" -f "$compose_file" build
# The frontend is what users see. Rebuild it without cache so a changed route
# cannot be hidden behind an older Docker image.
docker compose --env-file "$env_file" -f "$compose_file" build --no-cache frontend
docker compose --env-file "$env_file" -f "$compose_file" up -d postgres redis
# This script can be launched by automation. Do not let the one-off migration
# container inherit that automation input; otherwise it can consume the rest of
# this deployment script before the frontend and proxy are recreated.
docker compose --env-file "$env_file" -f "$compose_file" --profile maintenance run --rm backend-migrate </dev/null
# Recreate every application container from the newly built images. Database
# and Redis are deliberately excluded so deployment never clears their data.
docker compose --env-file "$env_file" -f "$compose_file" up -d --remove-orphans --force-recreate \
  backend backend-worker frontend caddy

wait_for "Frontend HTTP server" \
  docker compose --env-file "$env_file" -f "$compose_file" exec -T frontend \
  node -e "fetch('http://127.0.0.1:3000/auth/google/callback', { signal: AbortSignal.timeout(10000) }).then((response) => process.exit(response.status === 200 ? 0 : 1)).catch(() => process.exit(1))"

wait_for "Caddy reverse proxy" \
  docker compose --env-file "$env_file" -f "$compose_file" exec -T caddy \
  sh -c "wget -q -S -O /dev/null --header='Host: \$DOMAIN' http://127.0.0.1/auth/google/callback 2>&1 | awk '/HTTP\\// { status=\$2 } END { print status }' | grep -qx 200"

frontend_revision="$(docker compose --env-file "$env_file" -f "$compose_file" exec -T frontend cat /app/.build-revision)"
if [ "$frontend_revision" != "$commit" ]; then
  echo "Frontend image does not match the approved commit." >&2
  exit 1
fi

frontend_callback_status="$(docker compose --env-file "$env_file" -f "$compose_file" exec -T frontend \
  node -e "fetch('http://127.0.0.1:3000/auth/google/callback', { signal: AbortSignal.timeout(10000) }).then((response) => process.stdout.write(String(response.status))).catch(() => process.exit(1))")"
if [ "$frontend_callback_status" != "200" ]; then
  echo "Frontend callback route is not available." >&2
  exit 1
fi

# A version label proves only that the build received a commit argument. Prove
# the new frontend actually renders that commit and the AdSense files too.
frontend_homepage="$(docker compose --env-file "$env_file" -f "$compose_file" exec -T frontend \
  node -e "fetch('http://127.0.0.1:3000/', { signal: AbortSignal.timeout(10000) }).then(async (response) => { process.stdout.write(await response.text()); process.exit(response.ok ? 0 : 1); }).catch(() => process.exit(1))")"
printf '%s' "$frontend_homepage" | grep -F "name=\"cooktale-build-revision\" content=\"$commit\"" >/dev/null
printf '%s' "$frontend_homepage" | grep -F 'name="google-adsense-account" content="ca-pub-6574614841664693"' >/dev/null

frontend_ads_txt="$(docker compose --env-file "$env_file" -f "$compose_file" exec -T frontend \
  node -e "fetch('http://127.0.0.1:3000/ads.txt', { signal: AbortSignal.timeout(10000) }).then(async (response) => { process.stdout.write(await response.text()); process.exit(response.ok ? 0 : 1); }).catch(() => process.exit(1))")"
printf '%s' "$frontend_ads_txt" | grep -Fx 'google.com, pub-6574614841664693, DIRECT, f08c47fec0942fa0' >/dev/null

caddy_callback_status="$(docker compose --env-file "$env_file" -f "$compose_file" exec -T caddy \
  sh -c "wget -q -S -O /dev/null --header='Host: \$DOMAIN' http://127.0.0.1/auth/google/callback 2>&1 | awk '/HTTP\\// { status=\$2 } END { print status }'")"
if [ "$caddy_callback_status" != "200" ]; then
  echo "Reverse proxy does not serve the frontend callback route." >&2
  exit 1
fi

caddy_homepage="$(docker compose --env-file "$env_file" -f "$compose_file" exec -T caddy \
  sh -c "wget -qO- --header='Host: \$DOMAIN' http://127.0.0.1/")"
printf '%s' "$caddy_homepage" | grep -F "name=\"cooktale-build-revision\" content=\"$commit\"" >/dev/null
printf '%s' "$caddy_homepage" | grep -F 'name="google-adsense-account" content="ca-pub-6574614841664693"' >/dev/null

# Confirm the actual API process is responding before calling the deployment a success.
attempt=0
until docker compose --env-file "$env_file" -f "$compose_file" exec -T backend \
  node -e "fetch('http://127.0.0.1:4000/api/v1/health', { signal: AbortSignal.timeout(10000) }).then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 24 ]; then
    echo "Deployment did not pass the API health check." >&2
    exit 1
  fi
  sleep 5
done

printf '%s\n' "$commit" > "$state_dir/current-deploy-commit"
echo "Production deployment successful: $commit"
