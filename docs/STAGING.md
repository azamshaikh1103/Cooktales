# Staging playground

`staging.cooktale.in` is CookTale's safe place to build, test, and try to break
new work before it reaches real users.

## Release rule

- Push to `main` -> CI runs -> the same commit deploys automatically to staging
  (once `STAGING_DEPLOY_ENABLED` is `true`, see "Setup checklist").
- Production does **not** change from a push.
- Production changes only when a successful `main` commit is manually deployed
  and approved in the `production` GitHub environment.
- You can always run **Actions -> Deploy staging -> Run workflow** by hand
  (from `main`). That is how the first staging deployment is made, and how you
  redeploy `main` without a new push.

## Safety rule

- Staging has its own server, database, Redis data, Docker volumes, and secrets.
- Never copy production environment files, passwords, tokens, payments, or push
  subscriptions into staging.
- Use provider test settings only. Live email, billing, payouts, notifications,
  analytics, and ads stay off.
- The staging proxy sends `noindex` so search engines do not list it.
- Test Cloudflare Authenticated Origin Pulls on staging before enabling Caddy
  certificate enforcement in production. Direct traffic to the staging server
  remains blocked by its firewall.

## Hostnames (important)

| Purpose | Name |
| --- | --- |
| Website | `staging.cooktale.in` |
| API | `api-staging.cooktale.in` |

The API name uses a **hyphen**, not `api.staging...`. Cloudflare's free
Universal certificate covers `cooktale.in` and `*.cooktale.in` only, one level
deep. A two-level name such as `api.staging.cooktale.in` has no certificate, so
every browser request to it fails the TLS handshake and the staging site cannot
reach its API.

## Test data

- Use one staging-only test user.
- Copy only two selected public recipes and two selected public stories.
- Reassign those copies to the staging test user.
- Do not copy real user profiles, email addresses, password hashes, sessions,
  messages, payments, admin actions, or push subscriptions.

## Setup checklist

1. Install Docker and Git on the staging server and clone this public repository
   to `/home/ec2-user/cooktale`.
2. Generate a new `.env.staging` from `.env.staging.example` on that server. The
   example already uses the hostnames above; `NEXT_PUBLIC_API_URL` is baked into
   the website at build time, so a change needs a redeploy.
3. Cloudflare DNS: add proxied records for `staging.cooktale.in` and
   `api-staging.cooktale.in` pointing at the staging server, then allow
   Cloudflare networks only in the staging firewall.
4. AWS: create a **staging** deploy role (see "AWS deploy role" below). Do not
   reuse the production role: its trust policy and permissions are limited to
   production on purpose.
5. GitHub: create the `staging` environment (Settings -> Environments) and add
   these **repository secrets**:
   - `AWS_STAGING_DEPLOY_ROLE_ARN`: the ARN of the staging role
   - `AWS_STAGING_INSTANCE_ID`: the staging server's EC2 instance id
6. Run **Actions -> Deploy staging -> Run workflow** once, from `main`. Confirm
   the run succeeds and `https://staging.cooktale.in` shows the new version.
7. Set the repository variable `STAGING_DEPLOY_ENABLED=true`. From now on every
   green push to `main` deploys to staging automatically. Set it back to
   anything else to pause automatic staging deploys.

## AWS deploy role

Create an IAM role for GitHub OIDC (identity provider
`token.actions.githubusercontent.com`, audience `sts.amazonaws.com`), for
example `CookTaleGitHubStagingDeployRole`.

Trust policy: the job runs in the `staging` environment, so its token subject
ends in `:environment:staging`. Allow only that subject, both in the name form
and the id form GitHub may send:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::<ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": { "token.actions.githubusercontent.com:aud": "sts.amazonaws.com" },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": [
            "repo:<OWNER>/Cooktales:environment:staging",
            "repo:<OWNER>@<OWNER_ID>/Cooktales@<REPO_ID>:environment:staging"
          ]
        }
      }
    }
  ]
}
```

Permissions policy: send a shell command to the **staging instance only**, and
read the result:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DeployStagingOnly",
      "Effect": "Allow",
      "Action": "ssm:SendCommand",
      "Resource": [
        "arn:aws:ssm:ap-south-1::document/AWS-RunShellScript",
        "arn:aws:ec2:ap-south-1:<ACCOUNT_ID>:instance/<STAGING_INSTANCE_ID>"
      ]
    },
    {
      "Sid": "ReadCommandResult",
      "Effect": "Allow",
      "Action": "ssm:GetCommandInvocation",
      "Resource": "*"
    }
  ]
}
```

The staging server also needs its instance role to include
`AmazonSSMManagedInstanceCore` and Systems Manager must show it as **Online**
(Fleet Manager -> Managed nodes).

## Troubleshooting

**"Deploy staging" shows as skipped.** The automatic run is skipped unless the
repository variable `STAGING_DEPLOY_ENABLED` is `true`. Use the manual run
until step 7 is done.

**The run fails at "Configure AWS access through GitHub OIDC".** The role's
trust policy does not allow the `staging` environment subject, or
`AWS_STAGING_DEPLOY_ROLE_ARN` is missing or wrong.

**The run fails at "Deploy the approved commit through SSM".** The role's
permissions policy does not name the staging instance, the instance is not
Online in Systems Manager, or the server's git checkout has local changes
(the script refuses to deploy over them).

**Staging loads but nothing works (no login, no recipes).** The website is
calling an API hostname that has no valid certificate or no DNS record. Check
`NEXT_PUBLIC_API_URL` in `.env.staging` on the server and the Cloudflare record
for `api-staging.cooktale.in`, then redeploy.
