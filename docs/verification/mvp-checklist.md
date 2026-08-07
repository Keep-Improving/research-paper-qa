# MVP Verification Checklist

## Automated Checks

- [x] API health, paper matching, anchored discussions, author claims, collections, moderation, and notifications.
  Command: `apps\api\.venv\Scripts\python.exe -W error::DeprecationWarning -m pytest -q apps/api/tests`

- [x] Website search, paper detail, discussion detail, anchor detail, author workflow, collections, moderation, and E2E paper discussion flow.
  Command: `cd apps/web; npm test`

- [x] Browser extension paper detection, text anchor capture, image anchor fallback, full sidebar discussion list, filters, sorting, composer, and E2E sidebar flow.
  Command: `cd apps/extension; npm test`

- [x] Website production build and TypeScript integration.
  Command: `cd apps/web; npm run build`

- [x] Website lint and workspace TypeScript checks.
  Commands: `cd apps/web; npm run lint` and `npm run typecheck`

## PRD Acceptance Criteria

- [x] Extension identifies papers or enters manual fallback on fixture arXiv/PubMed/DOI-style pages.
  Covered by: `apps/extension/tests/paperDetection.test.ts`, `apps/extension/tests/e2e-extension-sidebar.spec.tsx`.

- [x] Extension sidebar shows the full discussion list for one paper and supports filtering, sorting, asking, author responses, anchor previews, loading, empty, and error states.
  Covered by: `apps/extension/tests/sidebar.test.tsx`.

- [x] Users can create a question from selected text with a citation anchor.
  Covered by: `apps/extension/tests/selectionAnchor.test.ts`, `apps/extension/tests/sidebar.test.tsx`, `apps/extension/tests/e2e-extension-sidebar.spec.tsx`.

- [x] Users can create image or screenshot-style anchors with fallback metadata.
  Covered by: `apps/extension/tests/imageAnchor.test.ts`, `apps/extension/tests/newQuestionDropZone.test.tsx`.

- [x] Website searches papers and discussions, opens paper detail pages, and shows data consistent with the extension sample records.
  Covered by: `apps/web/tests/paper-pages.spec.ts`, `apps/web/tests/e2e-paper-discussion.spec.ts`.

- [x] Approved first authors and corresponding authors can publish author responses; co-authors and pending claims cannot.
  Covered by: `apps/api/tests/test_author_claims.py`, `apps/api/tests/test_discussions.py`, `apps/web/tests/author-pages.spec.ts`.

- [x] Author users can still ask normal questions without automatically receiving an author-response label.
  Covered by: `apps/api/tests/test_discussions.py`.

- [x] Similar question or similar anchor prompt is present in the anchored question flow.
  Covered by: `apps/api/tests/test_discussions.py`, `apps/extension/tests/e2e-extension-sidebar.spec.tsx`.

- [x] AI is suggestion-only for governance and never deletes or publishes content automatically.
  Covered by: `apps/api/tests/test_moderation.py`; implementation uses deterministic `ai_risk_label` suggestions only.

- [x] Admins can process reports, hide or restore content, link duplicates, and mark disputes without bulk deletion.
  Covered by: `apps/api/tests/test_moderation.py`, `apps/web/tests/moderation-pages.spec.ts`.

- [x] Key website flows have error or empty states.
  Covered by: `apps/web/tests/paper-pages.spec.ts`, `apps/extension/tests/sidebar.test.tsx`.

## Manual Browser Checks

- [x] Start the website and inspect pages for console errors.
  Command used: `cd apps/web; npm run dev -- --hostname 127.0.0.1 --port 3000`
  Checked pages: `/author/claims`, `/author/workbench`, `/collections`, `/moderation`, `/papers/paper-transformer`.

- [x] Confirm moderation UI exposes reversible actions but no delete or bulk-delete controls.
  Checked by: Playwright browser script and `apps/web/tests/moderation-pages.spec.ts`.

## Known Follow-Ups

- [ ] Replace explicit header auth seams with real authentication and authorization middleware.
- [ ] Connect website author, collection, moderation, and notification pages to the shared API client after auth is available.
- [ ] Add production embedding-backed semantic similarity behind the existing anchor/discussion similarity service.
- [ ] Test the unpacked browser extension in Chrome against live publisher/PDF pages during packaging.
