# Public Server Deployment

This project is currently safe to run locally and can be deployed to a public Node/Next host such as Vercel after a hosted Postgres database is configured.

## Required Services

- Vercel or another public HTTPS Next.js host.
- Hosted Postgres such as Neon Postgres or Supabase Postgres.
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
5. Set the extension API base URL to `https://your-public-domain.example/api`.
6. Register a real user on the public website.
7. Create a question from the website and confirm it persists after redeploy.
8. Configure the extension to the same public API and confirm the question is visible there.
