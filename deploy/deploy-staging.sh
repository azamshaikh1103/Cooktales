#!/bin/sh
# Staging uses the same application deployment, but never production secrets,
# state, or monitoring.
set -eu

repo_dir="/home/ec2-user/cooktale"
deploy_script="${COOKTALE_DEPLOY_SCRIPT:-$repo_dir/deploy/deploy-production.sh}"

exec env \
  COOKTALE_ENV_FILE="$repo_dir/.env.staging" \
  COOKTALE_STATE_DIR="$repo_dir/deploy/.state-staging" \
  COOKTALE_DEPLOY_LABEL="Staging" \
  COOKTALE_MONITORING_COMPOSE="" \
  sh "$deploy_script" "$@"
