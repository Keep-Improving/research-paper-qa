# Public Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the prototype's split static/local-storage data with a shared public API backed by Postgres/Prisma, then connect the website and extension to the same discussion data.

**Architecture:** Next.js will expose public API routes and use Prisma for Postgres persistence. The website will read/write through server-side data access and client actions against those API routes. The extension will use a shared `packages/api-client` client configured with an API base URL and will keep `chrome.storage.local` only for settings/drafts.

**Tech Stack:** Next.js 16, React 19, Prisma, Postgres, Vitest, Playwright, Chrome MV3.

---

## File Structure

- `apps/web/prisma/schema.prisma`: Prisma data model for users, papers, anchors, discussions, replies, votes, collections, claims, reports.
- `apps/web/prisma/seed.ts`: Seed real database rows equivalent to current sample records.
- `apps/web/lib/prisma.ts`: Prisma singleton.
- `apps/web/lib/repositories/*.ts`: Focused data-access modules.
- `apps/web/lib/mappers.ts`: DB-to-UI/API mapping functions.
- `apps/web/app/api/**/route.ts`: Public API routes used by web and extension.
- `packages/api-client/src/*`: Shared typed client for website tests and extension runtime.
- `apps/web/components/*`: Replace sampleData reads and no-op buttons with API-backed data/actions.
- `apps/extension/src/sidebar/*`: Replace local storage as source of truth, add detail/interaction views.
- `docs/superpowers/specs/2026-06-20-public-sync-prd.md`: Update completion statuses as milestones land.

---

## Tasks

### Task 1: Prisma Schema And Seed
- [ ] Install Prisma dependencies in `apps/web`.
- [ ] Add Postgres Prisma schema with PRD models.
- [ ] Add seed script with current sample data as database rows.
- [ ] Add `.env.example` documenting `DATABASE_URL` and public API URL.
- [ ] Run Prisma generate.
- [ ] Commit schema and seed.

### Task 2: Core API Routes
- [ ] Add repository functions for paper matching, discussion listing, discussion creation, detail lookup, replies, votes, collections, claims, moderation.
- [ ] Add API route tests or focused repository tests first.
- [ ] Implement `/api/papers`, `/api/papers/match`, `/api/papers/[paperId]`, `/api/papers/[paperId]/discussions`, `/api/discussions/[discussionId]`, replies, votes, collections, claims, moderation.
- [ ] Verify API with real DB-backed flow.
- [ ] Commit API layer.

### Task 3: Shared API Client
- [ ] Extend `packages/api-client` to PRD routes and response types.
- [ ] Update tests for match paper, create discussion, detail, reply, vote, collection, moderation.
- [ ] Commit client updates.

### Task 4: Website Real Data Wiring
- [ ] Convert search, paper detail, discussion detail, collections, author claim, workbench, moderation to API/DB-backed data.
- [ ] Replace no-op buttons with real client components/actions.
- [ ] Keep empty/error/loading states.
- [ ] Update Playwright tests to verify state changes, not only visibility.
- [ ] Commit website wiring.

### Task 5: Extension Real Sync And Detail Interaction
- [ ] Add extension API settings and default base URL.
- [ ] Use paper detection -> `/api/papers/match` on sidebar load.
- [ ] List discussions from API.
- [ ] Create questions via API and refresh from API.
- [ ] Add discussion detail view with answer/comment/vote/report/open-in-web.
- [ ] Keep local storage only for settings/drafts/retry.
- [ ] Add extension tests and browser smoke proving plugin-created question appears through website API.
- [ ] Commit extension wiring.

### Task 6: Verification And Docs
- [ ] Run web lint/build/tests, extension build/tests, api-client tests, workspace typecheck.
- [ ] Run browser smoke against website and extension.
- [ ] Update PRD status table from pending to complete/partial.
- [ ] Add deployment notes for Vercel + Postgres.
- [ ] Commit docs/status updates.
