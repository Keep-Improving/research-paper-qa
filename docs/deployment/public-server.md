# Public Server Deployment

This project is currently safe to run locally and can be deployed to a public Node/Next host such as Vercel after a hosted Postgres database is configured.

## Required Services

- Vercel or another public HTTPS Next.js host.
- Hosted Postgres such as Neon Postgres or Supabase Postgres.
- Transactional email such as Resend, Postmark, SendGrid, or Supabase Auth email.
- A Chrome extension build configured with the deployed web API base URL.

## Required Environment Variables

Set these in the web host environment:

```bash
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_API_BASE_URL="https://your-public-domain.example/api"
AUTH_SESSION_SECRET="a-long-random-string"
```

`DATABASE_URL` must point to the hosted production Postgres database. Do not point production at a local `localhost` database.

## Data Preservation Rules

Production user data is preserved by keeping one hosted Postgres database and applying additive migrations to it.

Allowed production update command:

```bash
npm exec --workspace apps/web -- prisma migrate deploy
```

Forbidden against production:

```bash
npm exec --workspace apps/web -- prisma migrate reset
npm exec --workspace apps/web -- prisma db push --force-reset
DROP DATABASE ...
TRUNCATE TABLE ...
DELETE FROM ... # for bulk cleanup without an explicit reviewed plan
```

For future iterations, prefer additive changes:

- new tables
- nullable columns
- new indexes
- new enum values

Before any destructive schema change, export a database backup and write a rollback note. Large deletions or irreversible migrations require explicit user confirmation.

## Local Development

Local development may use `prisma db push` against a local/dev database. This is not the production update path.

```bash
npm run db:generate --workspace apps/web
npm exec --workspace apps/web -- prisma db push
npm run db:seed --workspace apps/web
npm run dev --workspace apps/web
```

## Public Deployment Checklist

1. Create hosted Postgres and copy its `DATABASE_URL`.
2. Configure Vercel environment variables.
3. Run production migration with `prisma migrate deploy` once migration files are present.
4. Deploy the web app.
5. Configure transactional email delivery for email verification links.
6. Set the extension API base URL to `https://your-public-domain.example/api`.
7. Register a real user on the public website.
8. Verify the account email before testing author-response privileges.
9. Create a question from the website and confirm it persists after redeploy.
10. Configure the extension to the same public API and confirm the question is visible there.

## Extension Cutover

Open the extension sidebar and set `API base URL` to your deployed `/api` endpoint, for example:

```text
https://your-public-domain.example/api
```

The value is stored in `chrome.storage.local` under `paperqa:apiBaseUrl`, so it survives browser restarts on that machine.

## Author Identity Safety

The workbench and author-response API check both conditions before enabling author-response privileges:

- the signed-in user's account email has been verified by token
- that normalized email matches a verified first-author or corresponding-author `PaperAuthorIdentity` for the paper

Email string matching alone is not enough for production author certification, because a user could type someone else's corresponding-author email during registration.

The development registration response includes `verificationUrl` so the local flow can be tested without an email provider. Production registration responses must not expose this token in JSON; connect a transactional email service and send the link only to the registered email address.
