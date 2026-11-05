# Staging playground

`staging.cooktale.in` is CookTale's safe place to build, test, and try to break
new work before it reaches real users.

## Release rule

- Push to `main` → CI runs → the same commit deploys automatically to staging.
- Production does **not** change from a push.
- Production changes only when a successful `main` commit is manually deployed
  and approved in the `production` GitHub environment.
- Staging automatic deployment stays off until the server, isolated credentials,
  and GitHub staging settings are complete. Set the GitHub variable
  `STAGING_DEPLOY_ENABLED` to `true` only at that point.

## Safety rule

- Staging has its own server, database, Redis data, Docker volumes, and secrets.
- Never copy production environment files, passwords, tokens, payments, or push
  subscriptions into staging.
- Use provider test settings only. Live email, billing, payouts, notifications,
  analytics, and ads stay off.
- The staging proxy sends `noindex` so search engines do not list it.
- Cloudflare Authenticated Origin Pulls protects staging in the same way as
  production. Direct traffic to the server remains blocked.

## Test data

- Use one staging-only test user.
- Copy only two selected public recipes and two selected public stories.
- Reassign those copies to the staging test user.
- Do not copy real user profiles, email addresses, password hashes, sessions,
  messages, payments, admin actions, or push subscriptions.

## Setup checklist

1. Install Docker and Git on the staging server and clone this public repository.
2. Generate a new `.env.staging` from `.env.staging.example` on that server.
3. Add separate staging AWS credentials and the `staging` GitHub environment.
4. Add `AWS_STAGING_DEPLOY_ROLE_ARN` and `AWS_STAGING_INSTANCE_ID` as GitHub
   repository secrets.
5. Add proxied Cloudflare DNS records for `staging.cooktale.in` and
   `api.staging.cooktale.in`, then allow Cloudflare networks only in the staging
   firewall.
6. Set `STAGING_DEPLOY_ENABLED=true` in GitHub after the first successful
   staging deployment.
