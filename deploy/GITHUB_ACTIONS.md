# GitHub Actions deployment setup

The project has two workflows:

- **CI** runs automatically for every pull request and push to `main`.
- **Deploy production** is manual. It refuses a commit that is not on `main` or
  that has not passed CI.

Production deployment uses AWS Systems Manager (SSM). This means GitHub can ask
AWS to run the server deployment without exposing a public SSH port.

The frontend build is a required release check. The existing full frontend lint
command currently reports old formatting and accessibility issues across many
unrelated pages, so it is intentionally not used as a release gate until that
separate cleanup is completed. Backend lint remains required.

## One-time AWS setup

1. Attach an instance role to the CookTale server with the AWS-managed policy
   `AmazonSSMManagedInstanceCore`.
2. Confirm the server appears as a managed node in AWS Systems Manager.
3. Create an AWS IAM OpenID Connect provider for `token.actions.githubusercontent.com` if the AWS account does not already have one.
4. Create a role for GitHub Actions that only trusts this repository's
   `main` branch and `production` environment. Give it permission to call
   `ssm:SendCommand` and `ssm:GetCommandInvocation` only for the CookTale
   server and the `AWS-RunShellScript` document.

## One-time GitHub setup

1. In **Settings → Environments**, create `production` and add yourself as a
   required reviewer. This makes every deployment wait for your approval.
2. In **Settings → Secrets and variables → Actions**, add:

   - `AWS_DEPLOY_ROLE_ARN` — the IAM role created above.
   - `AWS_PRODUCTION_INSTANCE_ID` — the CookTale server's AWS instance ID.

No database password, Drive credential, or application secret is stored in
GitHub. Those stay only in the server's private `.env.production` and
administrator-only files.

## Normal release

1. Push work or merge a pull request into `main`.
2. Wait for all three CI checks to pass.
3. Open **Actions → Deploy production → Run workflow**.
4. Approve the `production` environment request.
5. GitHub shows the server output and marks the deployment successful only
   after the API health check passes.

## If a deployment fails

The script stops and reports the failure. It does not reset the database and
does not automatically roll back after database migrations, because automatic
rollback could make the application and database disagree. Review the GitHub
log first, then make a deliberate recovery decision.
