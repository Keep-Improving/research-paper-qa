# Public Auth and Deploy Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add real email/password accounts, session-cookie identity, and deployment readiness while preserving existing production data across future updates.

**Architecture:** The Next.js app keeps Prisma/Postgres as the source of truth. Email/password credentials are stored in a separate credential table linked one-to-one with `User`; sessions are stored as hashed opaque tokens in `UserSession` and sent to browsers as HTTP-only cookies. Production API identity is resolved from the session cookie, while the existing `x-user-id` fallback remains development-only.

**Tech Stack:** Next.js route handlers, React server/client components, Prisma/Postgres, Node `crypto`, Vitest, Playwright, Vercel + hosted Postgres.

---

## Data Preservation Policy

- Production data must be updated only through additive Prisma migrations and `prisma migrate deploy`.
- Never run `prisma migrate reset`, `prisma db push --force-reset`, database drop commands, table truncation, or bulk delete scripts against production.
- Prefer additive schema changes: new tables, nullable columns, new indexes, new enum values.
- Any destructive migration, required data rewrite, or large deletion must stop for user confirmation and include a backup/rollback plan.
- For local development, `prisma db push` is allowed only against local/dev databases; production must use migration files.

## Files

- Modify: `apps/web/prisma/schema.prisma` for `PasswordCredential` and `UserSession`.
- Create: `apps/web/lib/auth/passwords.ts` for PBKDF2 password hash/verify helpers.
- Create: `apps/web/lib/auth/sessions.ts` for session token creation, hashing, cookie names, and expiry.
- Create: `apps/web/lib/auth/currentUser.ts` for resolving the current user from cookies/headers.
- Modify: `apps/web/lib/api.ts` to delegate request user resolution to the auth layer.
- Create: `apps/web/app/api/auth/register/route.ts`.
- Create: `apps/web/app/api/auth/login/route.ts`.
- Create: `apps/web/app/api/auth/logout/route.ts`.
- Create: `apps/web/app/api/auth/me/route.ts`.
- Create: `apps/web/components/AuthForms.tsx`.
- Create: `apps/web/components/UserNav.tsx`.
- Modify: `apps/web/components/AcademicShell.tsx`.
- Create: `apps/web/app/login/page.tsx`.
- Create: `apps/web/app/register/page.tsx`.
- Modify: `apps/web/.env.example`.
- Create: `docs/deployment/public-server.md`.
- Modify: `docs/superpowers/specs/2026-06-20-public-sync-prd.md`.

## Tasks

### Task 1: Password and Session Helpers

**Files:**
- Create: `apps/web/lib/auth/passwords.ts`
- Create: `apps/web/lib/auth/sessions.ts`
- Test: `apps/web/lib/auth/passwords.test.ts`
- Test: `apps/web/lib/auth/sessions.test.ts`

- [ ] **Step 1: Write failing password tests**

```ts
import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./passwords";

describe("password auth", () => {
  it("verifies the original password and rejects a different password", async () => {
    const hash = await hashPassword("correct horse battery staple");
    await expect(verifyPassword("correct horse battery staple", hash)).resolves.toBe(true);
    await expect(verifyPassword("wrong password", hash)).resolves.toBe(false);
  });
});
```

- [ ] **Step 2: Write failing session tests**

```ts
import { describe, expect, it } from "vitest";
import { createSessionToken, hashSessionToken, sessionCookieName } from "./sessions";

describe("session tokens", () => {
  it("creates opaque tokens and stable hashes", () => {
    const token = createSessionToken();
    expect(token.length).toBeGreaterThan(40);
    expect(hashSessionToken(token)).toBe(hashSessionToken(token));
    expect(hashSessionToken(token)).not.toBe(token);
    expect(sessionCookieName).toBe("paperqa_session");
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm run test:unit --workspace apps/web -- lib/auth/passwords.test.ts lib/auth/sessions.test.ts`

Expected: FAIL because helper modules do not exist.

- [ ] **Step 4: Implement helpers**

Use Node `crypto.pbkdf2` with random salt and `timingSafeEqual`; use `randomBytes(32).toString("base64url")` for sessions and SHA-256 for token hashes.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm run test:unit --workspace apps/web -- lib/auth/passwords.test.ts lib/auth/sessions.test.ts`

Expected: PASS.

### Task 2: Auth Data Model

**Files:**
- Modify: `apps/web/prisma/schema.prisma`

- [ ] **Step 1: Add auth models additively**

Add `PasswordCredential` and `UserSession` without modifying existing user rows. These are new tables only.

- [ ] **Step 2: Validate and generate Prisma client**

Run: `npm run db:generate --workspace apps/web`

Expected: Prisma Client generation succeeds.

- [ ] **Step 3: Sync local dev database**

Run: `npm exec --workspace apps/web -- prisma db push`

Expected: local database schema sync succeeds. This is for local dev only; production must use migration/deploy workflow.

### Task 3: Current User Resolution

**Files:**
- Create: `apps/web/lib/auth/currentUser.ts`
- Modify: `apps/web/lib/api.ts`
- Test: `apps/web/lib/auth/currentUser.test.ts`

- [ ] **Step 1: Write failing tests**

Cover: session cookie resolves user; expired sessions fail; development header fallback works when `NODE_ENV !== "production"`; production does not allow header fallback.

- [ ] **Step 2: Implement current user helpers**

Expose `getCurrentUserId(prisma, request)` and `resolveRequestUser(prisma, request)`.

- [ ] **Step 3: Run tests**

Run: `npm run test:unit --workspace apps/web -- lib/auth/currentUser.test.ts`

Expected: PASS.

### Task 4: Auth API Routes

**Files:**
- Create: `apps/web/app/api/auth/register/route.ts`
- Create: `apps/web/app/api/auth/login/route.ts`
- Create: `apps/web/app/api/auth/logout/route.ts`
- Create: `apps/web/app/api/auth/me/route.ts`
- Test: `apps/web/app/api/auth/auth-routes.test.ts`

- [ ] **Step 1: Write failing route tests**

Cover successful register, duplicate email rejection, login success, login failure, logout cookie clearing, and `/me` session lookup.

- [ ] **Step 2: Implement routes**

Register creates `User`, `PasswordCredential`, and `UserSession`. Login verifies password and creates a session. Logout expires/deletes current session.

- [ ] **Step 3: Run tests**

Run: `npm run test:unit --workspace apps/web -- app/api/auth/auth-routes.test.ts`

Expected: PASS.

### Task 5: Login/Register UI and Nav

**Files:**
- Create: `apps/web/components/AuthForms.tsx`
- Create: `apps/web/components/UserNav.tsx`
- Modify: `apps/web/components/AcademicShell.tsx`
- Create: `apps/web/app/login/page.tsx`
- Create: `apps/web/app/register/page.tsx`
- Test: `apps/web/components/AuthForms.test.tsx`

- [ ] **Step 1: Write failing component tests**

Test that forms submit to `/api/auth/login` and `/api/auth/register`, and that nav shows login/register or user/logout state.

- [ ] **Step 2: Implement UI**

Use restrained academic styling already present in `globals.css`. Forms should show errors and redirect to `/` on success.

- [ ] **Step 3: Run tests**

Run: `npm run test:unit --workspace apps/web -- components/AuthForms.test.tsx`

Expected: PASS.

### Task 6: Deployment Documentation and PRD Status

**Files:**
- Modify: `apps/web/.env.example`
- Create: `docs/deployment/public-server.md`
- Modify: `docs/superpowers/specs/2026-06-20-public-sync-prd.md`

- [ ] **Step 1: Document required env vars**

Include `DATABASE_URL`, `AUTH_SESSION_SECRET`, `NEXT_PUBLIC_API_BASE_URL`, and production deployment notes.

- [ ] **Step 2: Document data preservation workflow**

Include backup-before-destructive-change policy, `prisma migrate deploy`, and forbidden commands for production.

- [ ] **Step 3: Update PRD status**

Mark login/public-server readiness as partial and note that actual public deployment requires configured hosted Postgres and Vercel credentials.

### Task 7: Verification and Deploy Attempt

**Files:**
- No code files unless verification exposes a bug.

- [ ] **Step 1: Run full unit tests**

Run: `npm run test:unit --workspace apps/web`

Expected: all tests pass.

- [ ] **Step 2: Run build**

Run: `npm run build --workspace apps/web`

Expected: build succeeds.

- [ ] **Step 3: Browser smoke**

Open local site, register a user, submit a question/reply, confirm `/api/auth/me` returns that user, and confirm no console/page errors.

- [ ] **Step 4: Try Vercel preview deployment**

Run: `vercel deploy apps/web -y` if CLI is authenticated. If not authenticated, stop and report the exact login/claim step needed.

Expected: either preview URL is returned, or deployment is blocked only by missing account credentials/env vars.
