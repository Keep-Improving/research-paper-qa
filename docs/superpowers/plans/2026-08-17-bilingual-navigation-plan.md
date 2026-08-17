# 中英双语与研究者优先导航 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为网站建立浏览器语言自动识别、可持久化的中英界面切换，并将普通研究者的一级导航简化为“搜索、论文、问题、我的”。

**Architecture:** 服务端从 `locale` cookie 或 `Accept-Language` 解析初始语言，客户端 `LocaleProvider` 提供翻译函数和即时切换；所有界面文案集中在双语字典中，数据库内容保持原文。`AcademicShell` 只显示普通用户核心入口，`/me` 聚合个人数据并按服务端权限显示作者功能，轻量提示使用本地存储关闭。

**Tech Stack:** Next.js App Router 16、React 19、TypeScript、Prisma/Postgres、Vitest、Testing Library、Playwright CLI。

---

### Task 1: 建立语言解析与翻译字典

**Files:**
- Create: `apps/web/lib/i18n/messages/zh-CN.ts`
- Create: `apps/web/lib/i18n/messages/en-US.ts`
- Create: `apps/web/lib/i18n/types.ts`
- Create: `apps/web/lib/i18n/locale.ts`
- Create: `apps/web/lib/i18n/locale.test.ts`
- Modify: `apps/web/app/layout.tsx`

- [ ] **Step 1: Write failing locale tests**

覆盖 cookie 优先、中文 `Accept-Language`、英文 fallback 和不支持语言 fallback：

```ts
it("prefers a supported cookie locale", () => {
  expect(resolveLocale({ cookie: "en-US", acceptLanguage: "zh-CN" })).toBe("en-US");
});

it("detects Chinese browser language when no cookie exists", () => {
  expect(resolveLocale({ cookie: null, acceptLanguage: "zh-CN,zh;q=0.9" })).toBe("zh-CN");
});

it("falls back to English for unsupported languages", () => {
  expect(resolveLocale({ cookie: null, acceptLanguage: "fr-FR" })).toBe("en-US");
});
```

- [ ] **Step 2: Run the focused test and confirm it fails**

Run: `npm run test:unit --workspace apps/web -- lib/i18n/locale.test.ts`
Expected: FAIL because `resolveLocale` and the locale types do not exist.

- [ ] **Step 3: Implement locale resolution and message dictionaries**

Define `Locale = "zh-CN" | "en-US"`, `DEFAULT_LOCALE = "en-US"`, `LOCALE_COOKIE = "paperqa-locale"`, and `resolveLocale({ cookie, acceptLanguage })`. Add keys for shell navigation, authentication labels, page headings, search hints, personal workspace sections, and the two onboarding hints. Keep keys identical in both dictionaries and type the English dictionary as the canonical message shape.

- [ ] **Step 4: Pass the resolved locale from the root layout**

In `apps/web/app/layout.tsx`, read `cookies()` and `headers()`, call `resolveLocale`, set `<html lang={locale}>`, and pass the locale to a new provider wrapper. Do not translate database values or change route URLs.

- [ ] **Step 5: Run tests and typecheck**

Run: `npm run test:unit --workspace apps/web -- lib/i18n/locale.test.ts` and `npm run typecheck`.
Expected: focused locale tests and TypeScript complete successfully.

- [ ] **Step 6: Commit**

```bash
git add apps/web/lib/i18n apps/web/app/layout.tsx
git commit -m "feat: add locale detection and message dictionaries"
```

### Task 2: Add client provider and language toggle

**Files:**
- Create: `apps/web/components/LocaleProvider.tsx`
- Create: `apps/web/components/LanguageToggle.tsx`
- Create: `apps/web/components/LanguageToggle.test.tsx`
- Modify: `apps/web/app/layout.tsx`
- Modify: `apps/web/app/globals.css`

- [ ] **Step 1: Write a failing toggle test**

Render the toggle with `zh-CN`, click the English control, assert the cookie is written to `paperqa-locale=en-US`, and assert the provider's locale changes. Add a second assertion that the active language has `aria-pressed="true"`.

- [ ] **Step 2: Run the focused test and confirm it fails**

Run: `npm run test:unit --workspace apps/web -- components/LanguageToggle.test.tsx`
Expected: FAIL because the provider and toggle are not implemented.

- [ ] **Step 3: Implement provider and cookie-backed switching**

`LocaleProvider` accepts `initialLocale`, exposes `locale` and `t(key)`, and updates `document.cookie` with `Path=/; Max-Age=31536000; SameSite=Lax` before calling `router.refresh()`. `LanguageToggle` renders two icon-free text segments as a compact segmented control with `aria-label="Language"`, `aria-pressed`, and visible `中文`/`EN` labels.

- [ ] **Step 4: Integrate the provider and style it**

Wrap the app body with `LocaleProvider` in `layout.tsx`, render `LanguageToggle` from `AcademicShell`, and add stable focus/active styles in `globals.css`. Preserve mobile wrapping without changing the shell height unexpectedly.

- [ ] **Step 5: Run focused tests and typecheck**

Run: `npm run test:unit --workspace apps/web -- components/LanguageToggle.test.tsx` and `npm run typecheck`.
Expected: PASS with no TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add apps/web/components/LocaleProvider.tsx apps/web/components/LanguageToggle.tsx apps/web/components/LanguageToggle.test.tsx apps/web/app/layout.tsx apps/web/app/globals.css
git commit -m "feat: add persistent language toggle"
```

### Task 3: Translate the shell and simplify role-aware navigation

**Files:**
- Create: `apps/web/components/MoreNav.tsx`
- Create: `apps/web/components/MoreNav.test.tsx`
- Modify: `apps/web/components/AcademicShell.tsx`
- Modify: `apps/web/components/UserNav.tsx`
- Modify: `apps/web/app/globals.css`

- [ ] **Step 1: Write failing navigation tests**

Test that a logged-out reader sees links for search, papers, questions, and “My”; that author/admin-only entries are absent for an ordinary user; and that an eligible author sees author workbench/claims under the secondary menu. Test the translated labels in both locales.

- [ ] **Step 2: Run the focused tests and confirm they fail**

Run: `npm run test:unit --workspace apps/web -- components/MoreNav.test.tsx`
Expected: FAIL because the simplified navigation and translated labels do not exist.

- [ ] **Step 3: Implement the simplified shell**

Replace the eight equal-weight links in `AcademicShell` with `/`, `/papers`, `/questions`, and `/me`. Move `/anchors` to `MoreNav`; show `/author/claims` and `/author/workbench` only for users with the corresponding author identity/role, and keep `/moderation` restricted to admins. Render the language toggle in the same topbar row.

- [ ] **Step 4: Translate authentication state labels**

Update `UserNav` to use `t()` for sign-in, register, verified/unverified status, and sign-out while preserving existing session and logout behavior.

- [ ] **Step 5: Run tests and typecheck**

Run: `npm run test:unit --workspace apps/web -- components/MoreNav.test.tsx` and `npm run typecheck`.
Expected: navigation tests and typecheck pass.

- [ ] **Step 6: Commit**

```bash
git add apps/web/components/AcademicShell.tsx apps/web/components/MoreNav.tsx apps/web/components/MoreNav.test.tsx apps/web/components/UserNav.tsx apps/web/app/globals.css
git commit -m "feat: simplify reader navigation by role"
```

### Task 4: Add the “我的” personal workspace

**Files:**
- Create: `apps/web/app/me/page.tsx`
- Create: `apps/web/components/MyWorkspace.tsx`
- Create: `apps/web/components/MyWorkspace.test.tsx`
- Modify: `apps/web/lib/repositories/collections.ts`
- Modify: `apps/web/lib/repositories/discussions.ts`
- Modify: `apps/web/app/globals.css`

- [ ] **Step 1: Write failing workspace component tests**

Test rendering of saved papers/questions/anchors, the current user's questions/replies, the logged-out login prompt, and conditional author workbench/claims sections. Use plain typed props and real component rendering; do not add mock API behavior.

- [ ] **Step 2: Run the focused test and confirm it fails**

Run: `npm run test:unit --workspace apps/web -- components/MyWorkspace.test.tsx`
Expected: FAIL because `/me` and `MyWorkspace` do not exist.

- [ ] **Step 3: Add repository queries with explicit user scope**

Add read-only repository functions that accept the current `userId`, return collections and authored discussions ordered by `updatedAt desc`, and reuse existing Prisma selection shapes. Do not introduce new database tables or alter existing records.

- [ ] **Step 4: Implement the server page and component**

Resolve the session through the existing auth helper. For anonymous users, render the localized sign-in prompt. For authenticated users, load collections and the user's discussions in parallel, pass only serializable view data to `MyWorkspace`, and show author sections only when the existing verified identity/role checks allow them.

- [ ] **Step 5: Run tests and typecheck**

Run: `npm run test:unit --workspace apps/web -- components/MyWorkspace.test.tsx` and `npm run typecheck`.
Expected: workspace tests and typecheck pass.

- [ ] **Step 6: Commit**

```bash
git add apps/web/app/me apps/web/components/MyWorkspace.tsx apps/web/components/MyWorkspace.test.tsx apps/web/lib/repositories/collections.ts apps/web/lib/repositories/discussions.ts apps/web/app/globals.css
git commit -m "feat: add personal workspace page"
```

### Task 5: Add localized lightweight onboarding hints

**Files:**
- Create: `apps/web/components/InlineHint.tsx`
- Create: `apps/web/components/InlineHint.test.tsx`
- Modify: `apps/web/components/PaperSearch.tsx`
- Modify: `apps/web/app/papers/[paperId]/page.tsx`
- Modify: `apps/web/app/globals.css`

- [ ] **Step 1: Write failing hint tests**

Test that a hint renders localized text, can be dismissed, writes a namespaced local-storage key, and stays hidden after remount when dismissed.

- [ ] **Step 2: Run the focused test and confirm it fails**

Run: `npm run test:unit --workspace apps/web -- components/InlineHint.test.tsx`
Expected: FAIL because `InlineHint` does not exist.

- [ ] **Step 3: Implement the dismissible hint**

Use a client component with a stable key such as `paperqa-hint:search` or `paperqa-hint:anchor`. Read local storage only after mount to avoid hydration mismatch, expose a button with a translated accessible label, and render no hint after dismissal.

- [ ] **Step 4: Place the two hints**

Add the search hint below the home search input and the anchor-discussion hint on the paper detail page. Do not add a multi-step overlay, fake content, or database write.

- [ ] **Step 5: Run tests and typecheck**

Run: `npm run test:unit --workspace apps/web -- components/InlineHint.test.tsx` and `npm run typecheck`.
Expected: tests and typecheck pass.

- [ ] **Step 6: Commit**

```bash
git add apps/web/components/InlineHint.tsx apps/web/components/InlineHint.test.tsx apps/web/components/PaperSearch.tsx apps/web/app/papers/[paperId]/page.tsx apps/web/app/globals.css
git commit -m "feat: add localized reader guidance"
```

### Task 6: Migrate remaining page copy and verify end to end

**Files:**
- Modify: `apps/web/app/page.tsx`
- Modify: `apps/web/app/papers/page.tsx`
- Modify: `apps/web/app/papers/[paperId]/page.tsx`
- Modify: `apps/web/app/questions/page.tsx`
- Modify: `apps/web/app/anchors/page.tsx`
- Modify: `apps/web/app/anchors/[anchorId]/page.tsx`
- Modify: `apps/web/app/discussions/[discussionId]/page.tsx`
- Modify: `apps/web/app/collections/page.tsx`
- Modify: `apps/web/app/login/page.tsx`
- Modify: `apps/web/app/register/page.tsx`
- Modify: `apps/web/app/verify-email/page.tsx`
- Modify: `apps/web/app/author/claims/page.tsx`
- Modify: `apps/web/app/author/workbench/page.tsx`
- Modify: `apps/web/app/moderation/page.tsx`
- Modify: `apps/web/components/PaperSearch.tsx`
- Modify: `apps/web/components/AnchorPanel.tsx`
- Modify: `apps/web/components/DiscussionPanel.tsx`
- Modify: `apps/web/components/DiscussionActions.tsx`
- Modify: `apps/web/components/AuthForms.tsx`
- Modify: `apps/web/components/AuthorClaimForm.tsx`
- Modify: `apps/web/components/AuthorWorkbench.tsx`
- Modify: `apps/web/components/ModerationQueue.tsx`
- Modify: `apps/web/components/VerifyEmailPanel.tsx`
- Modify: `docs/superpowers/specs/2026-08-17-bilingual-navigation-design.md`

- [ ] **Step 1: Inventory untranslated interface strings**

Run `rg -n "(Search|Papers|Questions|Anchors|Collections|Sign in|Register|Author|Moderation|Browse|No |Save|Reply|Response)" apps/web/app apps/web/components` and map each result to a message key. Leave database values, URLs, API payload values, enum values, and test fixture content untouched.

- [ ] **Step 2: Migrate each page to `t()`**

Update login, register, verification, papers, questions, anchors, discussions, collections, author and moderation pages to read all interface labels from the dictionaries. Keep existing Prisma queries, forms, API routes, and authorization checks unchanged.

- [ ] **Step 3: Run the full local verification suite**

Run:

```bash
npm run typecheck
npm run test:unit --workspace apps/web
npm run build --workspace apps/web
```

Expected: typecheck succeeds, all unit tests pass, and the production build succeeds against a configured `DATABASE_URL` with migrations applied.

- [ ] **Step 4: Run browser interaction verification**

Start the web app with the real configured database and use Playwright CLI to verify:

1. Browser language selects the expected default.
2. Clicking `中 / EN` changes visible shell/page labels and survives reload.
3. Ordinary user sees the four reader links and `/me`, but no author/moderation links.
4. `/me` shows login prompt when anonymous and personal sections when authenticated.
5. Search and paper detail hints can be dismissed and stay hidden after reload.

Capture console errors and network failures; fix any regression before completion.

- [ ] **Step 5: Update the PRD status**

Append a dated implementation-status section to `docs/superpowers/specs/2026-06-20-public-sync-prd.md`, marking bilingual UI, simplified navigation, personal workspace, and browser verification as complete or explicitly noting any remaining production-only checks.

- [ ] **Step 6: Commit and push the completed feature**

```bash
git add apps/web docs/superpowers/specs/2026-06-20-public-sync-prd.md
git commit -m "feat: ship bilingual reader navigation"
git push origin main
```

## Self-review

- Locale detection, cookie persistence, and both dictionaries are covered by Tasks 1-2.
- The approved reader-first navigation and role-aware author/admin visibility are covered by Task 3.
- The approved “我的” aggregation is covered by Task 4.
- Both lightweight guidance hints and local dismissal are covered by Task 5.
- Full page copy migration, PRD status tracking, and browser verification are covered by Task 6.
- No task uses destructive database operations or invents mock API responses.
