# Authentication, origin protection, and staging plan

## Status

- Date: 2026-11-04
- Decision: use Cloudflare Authenticated Origin Pulls (AOP) for origin protection.
- Implementation status: Cloudflare global AOP is enabled. The matching Caddy
  enforcement code is ready but the production release is waiting for a
  server-file ownership repair before it can be verified live.
- Review scope: authentication source code, production Compose files, Caddy configuration, and deployment documentation.
- Review limit: source review only. No production or hosted-environment attack was performed.

## Confirmed issue: untrusted client IP headers

The authentication controller accepts `CF-Connecting-IP`, `X-Real-IP`, and `X-Forwarded-For` from an incoming request. The current Caddy configuration does not remove these headers before proxying. Caddy normally forwards request headers, and the production guide currently permits public traffic to Caddy on ports 80 and 443.

An attacker who reaches the origin directly could send a fake IP address. This weakens IP-based rate limits and the IP sent to Turnstile. It is not a confirmed account-takeover path by itself.

Relevant source:

- `deploy/Caddyfile`
- `docker-compose.production.yml`
- `deploy/PRODUCTION.md`
- `backend/src/modules/auth/auth.controller.ts`

## Chosen protection model

Use Cloudflare AOP and enforce it at Caddy. AOP uses a client certificate so the origin accepts HTTPS traffic only from Cloudflare. This prevents a direct request to the origin IP from bypassing Cloudflare.

The production origin must use Full or Full (strict) Cloudflare TLS mode. The
current setup uses Cloudflare's global AOP certificate. Cloudflare proxying
alone is not origin protection.

## Rollout plan

### 1. Prepare a staging environment

Create `staging.cooktale.in` as a separate environment before production changes.

It must have:

- A separate server or at least separate isolated compute, database, Redis, Docker project, and volumes.
- Separate staging-only JWT, email, OAuth, Turnstile, payment, and VAPID credentials.
- No production database copy or production user data. Use generated test accounts only.
- Test payment mode only. No live billing, payout, or production webhooks.
- Ads disabled, `noindex`, and an access gate for normal use.
- The same proxy, HTTPS, origin-protection, and application configuration shape as production.

### 2. Enable and enforce AOP on staging

- Configure Cloudflare AOP for `staging.cooktale.in`.
- Configure Caddy to require Cloudflare's client certificate for the staging hostname.
- Keep an emergency rollback path documented before enforcement.
- Validate that Cloudflare-routed traffic works and direct-origin traffic is refused.

### 3. Normalize client-IP headers

- At Caddy, discard incoming `CF-Connecting-IP`, `X-Real-IP`, and `X-Forwarded-For` before proxying to the backend.
- Set exactly one backend client-IP header from Cloudflare's authenticated request data.
- Change backend request metadata to read only that one normalized header.
- Do not trust client-supplied forwarding headers in application code.

### 4. Add regression tests

- A direct request with spoofed forwarding headers cannot create a new rate-limit identity.
- A valid Cloudflare-routed request supplies the expected client IP.
- Login, refresh, password reset, Turnstile, and admin magic-link flows retain their existing behaviour.

### 5. Promote to production

- Take a verified database backup first.
- Apply the same AOP and header changes during a maintenance window.
- Verify public CookTale and API traffic through Cloudflare.
- Verify the origin does not accept direct HTTPS requests.
- Monitor authentication failures and rate-limit events after release.

## Authentication source-review result

Protections confirmed in source:

- Passwords use bcrypt.
- Refresh tokens are hashed in storage and sent only in secure HTTP-only cookies.
- Access tokens expire quickly.
- Password-reset tokens and admin magic links are single-use.
- Unsafe authentication requests require a trusted Origin or Referer.
- Protected requests reject inactive or deleted users.
- Signup cannot assign an administrator role.

No confirmed source-level path was found to sign in as another user or become an administrator without an approved email link.

Hardening items to assess during implementation:

- Refresh-token rotation has a five-minute reuse window by design.
- An administrator's access-token role can remain effective until that short-lived token expires after a role change.

## Staging security-testing rules

Staging is for safe testing and regression checks, not a production clone.

- Test only systems and accounts owned by CookTale.
- Use fake data and test accounts.
- Keep the environment isolated from production credentials, data, payments, email audiences, and queues.
- Run destructive or high-volume checks only in a controlled test plan with limits and cleanup.
- Fix a confirmed issue in staging, add a regression test, then promote the same change to production.
