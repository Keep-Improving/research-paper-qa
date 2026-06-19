# Research Paper Q&A Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first working version of a research-paper discussion platform with a website, browser extension sidebar, shared backend API, paper-linked discussions, anchors, author-response permissions, filtering, sorting, and moderation foundations.

**Architecture:** Use a monorepo with a FastAPI backend, PostgreSQL with pgvector, a Next.js website, and a Vite React Manifest V3 browser extension. The website and extension both talk to the same API and render the same paper discussion data; the website owns cross-paper workflows and moderation while the extension owns in-reading paper detection and anchor capture.

**Tech Stack:** Python 3.12, FastAPI, SQLAlchemy 2, Alembic, PostgreSQL, pgvector, pytest, Next.js, React, TypeScript, Playwright, Vite, Chrome Manifest V3.

---

## 0. Repository Structure

Create this structure:

```text
research-paper-qa/
  apps/
    api/
      app/
        main.py
        core/config.py
        db/session.py
        db/base.py
        models/
        schemas/
        services/
        api/routes/
      tests/
      alembic/
      pyproject.toml
    web/
      app/
      components/
      lib/
      tests/
      package.json
    extension/
      src/
        background/
        content/
        sidebar/
        shared/
      tests/
      manifest.config.ts
      package.json
  packages/
    api-client/
      src/
      package.json
  docs/
    superpowers/
      specs/
      plans/
  docker-compose.yml
  README.md
```

Responsibility boundaries:

- `apps/api`: owns persistence, auth, permissions, discussion logic, paper matching, anchors, moderation, AI suggestion interfaces.
- `apps/web`: owns website pages, cross-paper search, collections, author certification, author workbench, moderation UI.
- `apps/extension`: owns paper detection, text selection capture, image/screenshot anchor capture, and sidebar discussion UI for one paper.
- `packages/api-client`: owns typed API calls shared by web and extension.

## Task 1: Initialize Monorepo and Tooling

**Files:**
- Create: `README.md`
- Create: `.gitignore`
- Create: `docker-compose.yml`
- Create: `apps/api/pyproject.toml`
- Create: `apps/web/package.json`
- Create: `apps/extension/package.json`
- Create: `packages/api-client/package.json`

**Task 1 completion note:** Code-quality review added minimal Next/Vite/API client scaffold files and ESLint config to make the package scripts point to real entries.

- [x] **Step 1: Write repository README**

Create `README.md`:

```markdown
# Research Paper Q&A

Research Paper Q&A is a scholarly discussion platform that links questions, comments, author responses, and citation anchors to individual papers.

## Apps

- `apps/api`: FastAPI backend.
- `apps/web`: Next.js web app.
- `apps/extension`: Manifest V3 browser extension.
- `packages/api-client`: shared TypeScript API client.

## First MVP

- Browser extension sidebar for full per-paper discussion.
- Website for search, collections, author certification, moderation, and paper detail pages.
- Shared backend for papers, anchors, discussions, votes, collections, reports, and notifications.
```

- [x] **Step 2: Add ignore rules**

Create `.gitignore`:

```gitignore
.venv/
__pycache__/
.pytest_cache/
.mypy_cache/
.ruff_cache/
node_modules/
.next/
dist/
build/
.env
.env.*
!.env.example
.superpowers/
*.pyc
```

- [x] **Step 3: Add local services**

Create `docker-compose.yml`:

```yaml
services:
  postgres:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_USER: paperqa
      POSTGRES_PASSWORD: paperqa
      POSTGRES_DB: paperqa
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

- [x] **Step 4: Add API project metadata**

Create `apps/api/pyproject.toml`:

```toml
[project]
name = "research-paper-qa-api"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = [
  "alembic>=1.13.0",
  "fastapi>=0.115.0",
  "psycopg[binary]>=3.2.0",
  "pydantic-settings>=2.6.0",
  "sqlalchemy>=2.0.0",
  "uvicorn[standard]>=0.30.0"
]

[project.optional-dependencies]
dev = [
  "httpx>=0.27.0",
  "pytest>=8.0.0",
  "pytest-asyncio>=0.23.0",
  "ruff>=0.7.0"
]

[tool.ruff]
line-length = 100
```

- [x] **Step 5: Add web package metadata**

Create `apps/web/package.json`:

```json
{
  "name": "@research-paper-qa/web",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "test": "playwright test",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@playwright/test": "^1.50.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "typescript": "^5.7.0"
  }
}
```

- [x] **Step 6: Add extension package metadata**

Create `apps/extension/package.json`:

```json
{
  "name": "@research-paper-qa/extension",
  "private": true,
  "scripts": {
    "dev": "vite build --watch",
    "build": "vite build",
    "test": "vitest run"
  },
  "dependencies": {
    "@vitejs/plugin-react": "^4.3.0",
    "vite": "^6.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/chrome": "^0.0.300",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "^5.7.0",
    "vitest": "^2.1.0"
  }
}
```

- [x] **Step 7: Add shared API client package metadata**

Create `packages/api-client/package.json`:

```json
{
  "name": "@research-paper-qa/api-client",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "dependencies": {},
  "devDependencies": {
    "typescript": "^5.7.0",
    "vitest": "^2.1.0"
  }
}
```

- [x] **Step 8: Verify files exist**

Run:

```powershell
Get-ChildItem -Recurse README.md,.gitignore,docker-compose.yml,apps,packages | Select-Object FullName
```

Expected: the files listed in this task are present.

- [x] **Step 9: Commit**

```powershell
git add README.md .gitignore docker-compose.yml apps packages
git commit -m "chore: initialize monorepo"
```

## Task 2: Implement Backend App Skeleton

**Files:**
- Create: `apps/api/app/main.py`
- Create: `apps/api/app/core/config.py`
- Create: `apps/api/app/db/session.py`
- Create: `apps/api/app/db/base.py`
- Create: `apps/api/app/api/routes/health.py`
- Create: `apps/api/tests/test_health.py`

- [x] **Step 1: Write failing health test**

Create `apps/api/tests/test_health.py`:

```python
from fastapi.testclient import TestClient

from app.main import app


def test_health_returns_ok():
    client = TestClient(app)
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
```

- [x] **Step 2: Run test to verify it fails**

Run:

```powershell
cd apps/api
python -m pytest tests/test_health.py -v
```

Expected: FAIL because `app.main` or `/health` is not implemented.

- [x] **Step 3: Implement settings**

Create `apps/api/app/core/config.py`:

```python
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg://paperqa:paperqa@localhost:5432/paperqa"
    app_name: str = "Research Paper Q&A API"

    model_config = SettingsConfigDict(env_file=".env", env_prefix="PAPERQA_")


settings = Settings()
```

- [x] **Step 4: Implement database session**

Create `apps/api/app/db/session.py`:

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

engine = create_engine(settings.database_url, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
```

- [x] **Step 5: Implement declarative base**

Create `apps/api/app/db/base.py`:

```python
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass
```

- [x] **Step 6: Implement health route**

Create `apps/api/app/api/routes/health.py`:

```python
from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
```

- [x] **Step 7: Implement FastAPI app**

Create `apps/api/app/main.py`:

```python
from fastapi import FastAPI

from app.api.routes.health import router as health_router
from app.core.config import settings

app = FastAPI(title=settings.app_name)
app.include_router(health_router)
```

- [x] **Step 8: Run test to verify it passes**

Run:

```powershell
cd apps/api
python -m pytest tests/test_health.py -v
```

Expected: PASS.

- [x] **Step 9: Commit**

```powershell
git add apps/api
git commit -m "feat(api): add FastAPI skeleton"
```

**Task 2 quality note:** Added Python package markers, editable-install package discovery, and ignored local agent/install artifacts so the API skeleton imports cleanly from the repository root without committing generated files.

## Task 3: Implement Core Database Models and Migrations

**Files:**
- Create: `apps/api/app/models/user.py`
- Create: `apps/api/app/models/paper.py`
- Create: `apps/api/app/models/author_claim.py`
- Create: `apps/api/app/models/anchor.py`
- Create: `apps/api/app/models/discussion.py`
- Create: `apps/api/app/models/reaction.py`
- Create: `apps/api/app/models/collection.py`
- Create: `apps/api/app/models/moderation.py`
- Create: `apps/api/app/models/notification.py`
- Modify: `apps/api/app/db/base.py`
- Create: `apps/api/tests/test_models.py`

- [x] **Step 1: Write enum and relationship tests**

Create `apps/api/tests/test_models.py`:

```python
from app.models.author_claim import PaperAuthorRole
from app.models.discussion import DiscussionKind, DiscussionStatus


def test_author_response_roles_are_limited_to_first_and_corresponding():
    assert PaperAuthorRole.FIRST_AUTHOR.can_author_respond is True
    assert PaperAuthorRole.CORRESPONDING_AUTHOR.can_author_respond is True
    assert PaperAuthorRole.CO_AUTHOR.can_author_respond is False


def test_discussion_status_has_disputed_marker():
    assert DiscussionStatus.DISPUTED.value == "disputed"
    assert DiscussionKind.AUTHOR_RESPONSE.value == "author_response"
```

- [x] **Step 2: Run tests to verify they fail**

Run:

```powershell
cd apps/api
python -m pytest tests/test_models.py -v
```

Expected: FAIL because models do not exist.

- [x] **Step 3: Create user model**

Create `apps/api/app/models/user.py`:

```python
from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    display_name: Mapped[str] = mapped_column(String(120))
    institution: Mapped[str | None] = mapped_column(String(240), nullable=True)
    orcid: Mapped[str | None] = mapped_column(String(32), nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
```

- [x] **Step 4: Create paper model**

Create `apps/api/app/models/paper.py`:

```python
from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Paper(Base):
    __tablename__ = "papers"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    title: Mapped[str] = mapped_column(Text)
    doi: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True, index=True)
    arxiv_id: Mapped[str | None] = mapped_column(String(64), unique=True, nullable=True, index=True)
    pmid: Mapped[str | None] = mapped_column(String(64), unique=True, nullable=True, index=True)
    venue: Mapped[str | None] = mapped_column(String(255), nullable=True)
    publication_year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    canonical_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    abstract: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
```

- [x] **Step 5: Create author claim model**

Create `apps/api/app/models/author_claim.py`:

```python
from datetime import datetime
from enum import Enum
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class PaperAuthorRole(str, Enum):
    FIRST_AUTHOR = "first_author"
    CORRESPONDING_AUTHOR = "corresponding_author"
    CO_AUTHOR = "co_author"

    @property
    def can_author_respond(self) -> bool:
        return self in {self.FIRST_AUTHOR, self.CORRESPONDING_AUTHOR}


class AuthorClaimStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class PaperAuthorClaim(Base):
    __tablename__ = "paper_author_claims"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"), index=True)
    paper_id: Mapped[UUID] = mapped_column(ForeignKey("papers.id"), index=True)
    role: Mapped[str] = mapped_column(String(32))
    evidence_type: Mapped[str] = mapped_column(String(64))
    status: Mapped[str] = mapped_column(String(32), default=AuthorClaimStatus.PENDING.value)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
```

- [x] **Step 6: Create anchor model**

Create `apps/api/app/models/anchor.py`:

```python
from datetime import datetime
from enum import Enum
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class AnchorKind(str, Enum):
    PAPER = "paper"
    TEXT = "text"
    IMAGE = "image"
    SCREENSHOT = "screenshot"
    FIGURE = "figure"
    TABLE = "table"
    FORMULA = "formula"
    REFERENCE = "reference"
    MANUAL = "manual"


class Anchor(Base):
    __tablename__ = "anchors"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    paper_id: Mapped[UUID] = mapped_column(ForeignKey("papers.id"), index=True)
    kind: Mapped[str] = mapped_column(String(32), index=True)
    quote_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    context_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    page_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    section_label: Mapped[str | None] = mapped_column(String(120), nullable=True)
    figure_label: Mapped[str | None] = mapped_column(String(64), nullable=True)
    table_label: Mapped[str | None] = mapped_column(String(64), nullable=True)
    formula_label: Mapped[str | None] = mapped_column(String(64), nullable=True)
    reference_label: Mapped[str | None] = mapped_column(String(64), nullable=True)
    source_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    dom_path: Mapped[str | None] = mapped_column(Text, nullable=True)
    image_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    ocr_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
```

- [x] **Step 7: Create discussion model**

Create `apps/api/app/models/discussion.py`:

```python
from datetime import datetime
from enum import Enum
from uuid import UUID, uuid4

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class DiscussionKind(str, Enum):
    QUESTION = "question"
    ANSWER = "answer"
    COMMENT = "comment"
    AUTHOR_RESPONSE = "author_response"
    CORRECTION = "correction"
    REPLICATION_NOTE = "replication_note"


class DiscussionStatus(str, Enum):
    OPEN = "open"
    ANSWERED = "answered"
    RESOLVED = "resolved"
    AUTHOR_RESPONDED = "author_responded"
    DISPUTED = "disputed"
    HIDDEN = "hidden"


class DiscussionItem(Base):
    __tablename__ = "discussion_items"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    paper_id: Mapped[UUID] = mapped_column(ForeignKey("papers.id"), index=True)
    anchor_id: Mapped[UUID | None] = mapped_column(ForeignKey("anchors.id"), nullable=True, index=True)
    parent_id: Mapped[UUID | None] = mapped_column(ForeignKey("discussion_items.id"), nullable=True)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"), index=True)
    kind: Mapped[str] = mapped_column(String(32), index=True)
    status: Mapped[str] = mapped_column(String(32), default=DiscussionStatus.OPEN.value, index=True)
    body: Mapped[str] = mapped_column(Text)
    is_author_response: Mapped[bool] = mapped_column(Boolean, default=False)
    is_pinned: Mapped[bool] = mapped_column(Boolean, default=False)
    is_hidden: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
```

- [x] **Step 8: Create remaining models**

Create `apps/api/app/models/reaction.py`, `collection.py`, `moderation.py`, and `notification.py` with focused SQLAlchemy models for reactions, saved items, reports, and notifications. Use the field names from the PRD exactly: `user_id`, `paper_id`, `discussion_item_id`, `anchor_id`, `kind`, `status`, `created_at`.

- [x] **Step 9: Export model imports through base**

Modify `apps/api/app/db/base.py`:

```python
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


from app.models.anchor import Anchor  # noqa: E402,F401
from app.models.author_claim import PaperAuthorClaim  # noqa: E402,F401
from app.models.collection import Collection  # noqa: E402,F401
from app.models.discussion import DiscussionItem  # noqa: E402,F401
from app.models.moderation import ModerationReport  # noqa: E402,F401
from app.models.notification import Notification  # noqa: E402,F401
from app.models.paper import Paper  # noqa: E402,F401
from app.models.reaction import Reaction  # noqa: E402,F401
from app.models.user import User  # noqa: E402,F401
```

- [x] **Step 10: Run tests**

Run:

```powershell
cd apps/api
python -m pytest tests/test_models.py -v
```

Expected: PASS.

- [x] **Step 11: Commit**

```powershell
git add apps/api/app/models apps/api/app/db/base.py apps/api/tests/test_models.py
git commit -m "feat(api): add core data models"
```

**Task 3 quality note:** Model imports moved to `app.models`, leaving `db/base.py` as only the `DeclarativeBase` definition. Metadata table registration is regression-tested after importing `app.models.author_claim` before `app.models`.

## Task 4: Implement Paper Matching API

**Files:**
- Create: `apps/api/app/schemas/paper.py`
- Create: `apps/api/app/services/paper_matching.py`
- Create: `apps/api/app/api/routes/papers.py`
- Modify: `apps/api/app/main.py`
- Create: `apps/api/tests/test_paper_matching.py`

- [x] **Step 1: Write paper matching tests**

Create tests for DOI normalization, arXiv ID matching, PMID matching, and fallback creation for title/URL records. Use FastAPI `TestClient` and a test database fixture.

- [x] **Step 2: Implement schemas**

Define `PaperIdentifyRequest`, `PaperRead`, and `PaperCreate` in `schemas/paper.py`.

- [x] **Step 3: Implement matching service**

Implement `identify_or_create_paper(session, request)` with this priority:

1. Normalize DOI and match `Paper.doi`.
2. Match `Paper.arxiv_id`.
3. Match `Paper.pmid`.
4. Create paper from title and URL with no stable identifier.

- [x] **Step 4: Implement route**

Add `POST /papers/identify` in `routes/papers.py`.

- [x] **Step 5: Run tests**

Run:

```powershell
cd apps/api
python -m pytest tests/test_paper_matching.py -v
```

Expected: PASS.

- [x] **Step 6: Commit**

```powershell
git add apps/api
git commit -m "feat(api): add paper identification"
```

**Task 4 quality note:** API model timestamp defaults are timezone-aware UTC values, API dev dependencies use `httpx2` to match the current Starlette `TestClient`, and full API tests pass with `DeprecationWarning` treated as errors.

## Task 5: Implement Discussion, Anchor, Filter, and Sort APIs

**Files:**
- Create: `apps/api/app/schemas/anchor.py`
- Create: `apps/api/app/schemas/discussion.py`
- Create: `apps/api/app/services/anchor_similarity.py`
- Create: `apps/api/app/services/discussion_permissions.py`
- Create: `apps/api/app/services/discussion_query.py`
- Create: `apps/api/app/api/routes/discussions.py`
- Modify: `apps/api/app/main.py`
- Create: `apps/api/tests/test_discussions.py`

- [x] **Step 1: Write discussion API tests**

Test these behaviors:

- Logged-in ordinary user can create a question with a text anchor.
- Creating a question returns similar existing discussions for the same quote text.
- Discussion list can filter by `status=open`, `kind=question`, `has_author_response=true`, and `anchor_kind=text`.
- Discussion list can sort by `newest`, `active`, `votes`, `heat`, `dispute`, and `anchor_position`.

- [x] **Step 2: Write author response permission tests**

Test these behaviors:

- First author claim with approved status can create `author_response`.
- Corresponding author claim with approved status can create `author_response`.
- Co-author claim cannot create `author_response`.
- First author can still create a normal question without `is_author_response`.

- [x] **Step 3: Implement anchor schemas**

Define `AnchorCreate` and `AnchorRead` with fields from `Anchor`.

- [x] **Step 4: Implement discussion schemas**

Define `DiscussionCreate`, `DiscussionRead`, `DiscussionFilter`, and `DiscussionSort`.

- [x] **Step 5: Implement permission service**

Implement:

```python
def can_publish_author_response(session, *, user_id: UUID, paper_id: UUID) -> bool:
    ...
```

Return true only for approved first-author or corresponding-author claims.

- [x] **Step 6: Implement query service**

Implement filters and sort expressions. For heat and dispute in MVP, use deterministic stored counts or query-time counts from reactions and comments. Do not use random scores.

- [x] **Step 7: Implement routes**

Add:

- `GET /papers/{paper_id}/discussions`
- `POST /papers/{paper_id}/discussions`
- `GET /discussions/{discussion_id}`
- `POST /discussions/{discussion_id}/reactions`

- [x] **Step 8: Run tests**

Run:

```powershell
cd apps/api
python -m pytest tests/test_discussions.py -v
```

Expected: PASS.

- [x] **Step 9: Commit**

```powershell
git add apps/api
git commit -m "feat(api): add anchored discussions"
```

**Task 5 quality note:** Discussion routes use an explicit `X-User-Id` header dependency as the current auth seam until the real authentication system is implemented. Review fixes made `votes`, `heat`, and `dispute` deterministic count-based sorts, canonicalized author-response `kind`/`is_author_response` storage after permission succeeds, and validated reaction kinds at schema level.

## Task 6: Implement Shared TypeScript API Client

**Files:**
- Create: `packages/api-client/src/types.ts`
- Create: `packages/api-client/src/client.ts`
- Create: `packages/api-client/src/index.ts`
- Create: `packages/api-client/src/client.test.ts`

- [x] **Step 1: Write client tests**

Test that the client calls:

- `POST /papers/identify`
- `GET /papers/{paperId}/discussions`
- `POST /papers/{paperId}/discussions`

- [x] **Step 2: Implement shared types**

Define `Paper`, `Anchor`, `DiscussionItem`, `DiscussionFilter`, `DiscussionSort`, and request types matching backend schema names.

- [x] **Step 3: Implement API client**

Implement a small `PaperQaClient` class with `fetch` injection for testability.

- [x] **Step 4: Run tests**

Run:

```powershell
cd packages/api-client
npm test
```

Expected: PASS.

**Task 6 quality note:** api-client dev test stack audit passes after updating Vitest. Root TypeScript workspace config added so root `npx tsc --noEmit` runs the intended compiler.

- [x] **Step 5: Commit**

```powershell
git add packages/api-client
git commit -m "feat(client): add shared API client"
```

## Task 7: Implement Browser Extension Paper Detection and Anchor Capture

**Files:**
- Create: `apps/extension/src/content/paperDetection.ts`
- Create: `apps/extension/src/content/selectionAnchor.ts`
- Create: `apps/extension/src/content/imageAnchor.ts`
- Create: `apps/extension/src/content/index.ts`
- Create: `apps/extension/src/sidebar/Sidebar.tsx`
- Create: `apps/extension/src/sidebar/NewQuestionDropZone.tsx`
- Create: `apps/extension/tests/paperDetection.test.ts`
- Create: `apps/extension/tests/selectionAnchor.test.ts`

- [x] **Step 1: Write paper detection tests**

Test DOI meta tag detection, citation DOI detection, arXiv URL detection, PubMed URL detection, DOI landing URL detection, and title fallback.

- [x] **Step 2: Implement paper detection**

Implement `detectPaper(document, location)` returning DOI, arXiv ID, PMID, title, URL, and confidence.

- [x] **Step 3: Write selection anchor tests**

Test selected text capture includes quote text, context text, source URL, and optional DOM path.

- [x] **Step 4: Implement selection anchor capture**

Implement `captureSelectionAnchor(window, document)`.

- [x] **Step 5: Implement image/screenshot anchor input model**

Implement drag handling for images and a screenshot fallback action. Preserve source URL, alt text, nearby caption if available, and image blob reference when accessible.

- [x] **Step 6: Implement sidebar drop zone**

Create a compact academic-style drop zone that accepts current selection, dragged image, or manual anchor fields.

- [x] **Step 7: Run extension tests**

Run:

```powershell
cd apps/extension
npm test
```

Expected: PASS.

- [x] **Step 8: Commit**

```powershell
git add apps/extension
git commit -m "feat(extension): add paper detection and anchor capture"
```

**Task 7 quality note:** Extension Vitest was upgraded to `^4.1.9`, jsdom was added for DOM-based content-script tests, and `npm audit --audit-level=moderate` reports 0 vulnerabilities. Review hardening now covers DOI/arXiv normalization, invalid DOI fallback confidence, centered selection context clipping including long selected quotes, and file-backed image anchors including URL-only image drops that do not claim an article `source_url`.

## Task 8: Implement Extension Sidebar Discussion UI

**Files:**
- Create: `apps/extension/src/sidebar/DiscussionList.tsx`
- Create: `apps/extension/src/sidebar/DiscussionFilters.tsx`
- Create: `apps/extension/src/sidebar/DiscussionComposer.tsx`
- Create: `apps/extension/src/sidebar/AuthorResponseBadge.tsx`
- Modify: `apps/extension/src/sidebar/Sidebar.tsx`
- Create: `apps/extension/tests/sidebar.test.tsx`

- [x] **Step 1: Write sidebar interaction tests**

Test that the sidebar can:

- Render full discussion list for one paper.
- Filter by author response.
- Sort by newest and heat.
- Create a question from a text anchor draft.
- Show manual fallback when anchor capture fails.

- [x] **Step 2: Implement filters**

Create compact segmented controls and menus for content type, state, anchor type, participant, and sort. Use stable dimensions to avoid sidebar layout jumps.

- [x] **Step 3: Implement discussion list**

Render questions, answers, comments, author responses, and anchor previews. Keep typography compact and readable.

- [x] **Step 4: Implement composer**

Support question body, anchor preview, similar-question prompt, submit, loading, empty, and error states.

- [x] **Step 5: Run tests**

Run:

```powershell
cd apps/extension
npm test
```

Expected: PASS.

- [x] **Step 6: Commit**

```powershell
git add apps/extension
git commit -m "feat(extension): add discussion sidebar"
```

**Task 8 quality note:** Sidebar UI uses restrained academic styling with compact borders, stable filter/button dimensions, Use selection is wired through an optional callback with a disabled unavailable fallback, filters cover kind/status/anchor/participant/sort, and anchored question composition, manual anchor fallback, plus loading/empty/error states remain covered.

## Task 9: Implement Website Core Pages

**Files:**
- Create: `apps/web/app/page.tsx`
- Create: `apps/web/app/papers/[paperId]/page.tsx`
- Create: `apps/web/app/discussions/[discussionId]/page.tsx`
- Create: `apps/web/app/anchors/[anchorId]/page.tsx`
- Create: `apps/web/components/PaperSearch.tsx`
- Create: `apps/web/components/DiscussionPanel.tsx`
- Create: `apps/web/components/AnchorPanel.tsx`
- Create: `apps/web/components/AcademicShell.tsx`
- Create: `apps/web/tests/paper-pages.spec.ts`

- [x] **Step 1: Write Playwright page tests**

Test search page, paper detail discussion filters, question detail anchor display, and empty/error states.

- [x] **Step 2: Implement academic shell**

Use a restrained academic tool style:

- Neutral background.
- Compact navigation.
- Dense but readable list rows.
- Semantic badges for author response, disputed, unresolved, and anchor type.
- No marketing hero.
- No decorative gradients or nested cards.

- [x] **Step 3: Implement search page**

Search papers, questions, author responses, and anchors. Empty state explains that records appear after papers are collected or detected.

- [x] **Step 4: Implement paper detail page**

Render metadata, collection action, discussion filters, discussion list, anchor grouping, author responses, hot and unanswered questions.

- [x] **Step 5: Implement detail pages**

Render question detail and anchor detail pages with related discussions.

- [x] **Step 6: Run Playwright**

Run:

```powershell
cd apps/web
npm test
```

Expected: PASS.

- [x] **Step 7: Commit**

```powershell
git add apps/web
git commit -m "feat(web): add core research discussion pages"
```

**Task 9 quality note:** Website uses a restrained academic shell with compact navigation and dense research-tool rows, no marketing hero, no decorative gradients, and no nested cards. Empty/error states and paper detail discussion filters/sort are covered by Playwright tests, including an initial newest-order assertion before switching to heat order. Discussion filters and newest/heat sorting are stateful in the web UI. UI uses clearly labeled sample UI data only; no mock API calls or fake fetch responses were added. `npm audit --audit-level=moderate` reports the known `postcss <8.5.10` advisory through `next@16.2.9`; `npm audit fix --force` proposes a breaking downgrade to `next@9.3.3`, and a direct override would replace a Next-managed transitive dependency, so this task records the exception instead of applying an unsupported dependency rewrite.

## Task 10: Implement Author Certification and Author Workbench

**Files:**
- Create: `apps/api/app/api/routes/author_claims.py`
- Create: `apps/api/app/services/author_claims.py`
- Create: `apps/api/tests/test_author_claims.py`
- Create: `apps/web/app/author/claims/page.tsx`
- Create: `apps/web/app/author/workbench/page.tsx`
- Create: `apps/web/components/AuthorClaimForm.tsx`
- Create: `apps/web/components/AuthorWorkbench.tsx`

- [ ] **Step 1: Write backend tests**

Test claim creation, admin approval, first/corresponding author response permission, and co-author denial.

- [ ] **Step 2: Implement author claim API**

Add endpoints for submitting claims, listing current user claims, and admin approval/rejection.

- [ ] **Step 3: Write web tests**

Test claim form role selection, evidence submission, approval state display, and workbench list of high-heat unanswered questions.

- [ ] **Step 4: Implement website pages**

Add author claim form and workbench. The author response action appears only when the API says the user has permission.

- [ ] **Step 5: Run tests**

Run:

```powershell
cd apps/api
python -m pytest tests/test_author_claims.py -v
cd ../web
npm test
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add apps/api apps/web
git commit -m "feat: add author certification workflow"
```

## Task 11: Implement Collections, Notifications, and Moderation Foundations

**Files:**
- Create: `apps/api/app/api/routes/collections.py`
- Create: `apps/api/app/api/routes/moderation.py`
- Create: `apps/api/app/api/routes/notifications.py`
- Create: `apps/api/app/services/moderation_scoring.py`
- Create: `apps/api/tests/test_moderation.py`
- Create: `apps/web/app/collections/page.tsx`
- Create: `apps/web/app/moderation/page.tsx`
- Create: `apps/web/components/ModerationQueue.tsx`

- [ ] **Step 1: Write API tests**

Test saving papers/questions/anchors, report creation, AI-risk suggestion storage, admin hide/restore, duplicate discussion linking, and notification creation.

- [ ] **Step 2: Implement collections API**

Support saving and unsaving papers, discussions, and anchors with optional user labels.

- [ ] **Step 3: Implement moderation API**

Support report queue, hide/restore, disputed marker override, duplicate linking, and admin notes.

- [ ] **Step 4: Implement notification API**

Create notifications for replies, author responses, and followed-anchor updates.

- [ ] **Step 5: Implement web pages**

Add collections page and moderation queue with clear status labels and no destructive bulk delete. Any large deletion or removal operation must require user-selected items and explicit confirmation.

- [ ] **Step 6: Run tests**

Run:

```powershell
cd apps/api
python -m pytest tests/test_moderation.py -v
cd ../web
npm test
```

Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
git add apps/api apps/web
git commit -m "feat: add collections and moderation foundations"
```

## Task 12: End-to-End Verification

**Files:**
- Create: `apps/web/tests/e2e-paper-discussion.spec.ts`
- Create: `apps/extension/tests/e2e-extension-sidebar.spec.ts`
- Create: `docs/verification/mvp-checklist.md`

- [ ] **Step 1: Write website E2E test**

Test a user searches a paper, opens the paper page, creates an anchored question, sees similar question prompt, filters author responses, and saves the paper.

- [ ] **Step 2: Write extension E2E test**

Test arXiv/PubMed/DOI fixture pages, paper detection, text selection anchor creation, image fallback, full sidebar discussion list, filter/sort, and submit question.

- [ ] **Step 3: Write verification checklist**

Create `docs/verification/mvp-checklist.md` with all PRD acceptance criteria copied as checkboxes and a command or manual browser check for each one.

- [ ] **Step 4: Run full backend tests**

Run:

```powershell
cd apps/api
python -m pytest -v
```

Expected: PASS.

- [ ] **Step 5: Run web tests**

Run:

```powershell
cd apps/web
npm test
```

Expected: PASS.

- [ ] **Step 6: Run extension tests**

Run:

```powershell
cd apps/extension
npm test
```

Expected: PASS.

- [ ] **Step 7: Start dev servers and inspect UI**

Run API and website locally, load extension unpacked in Chrome, and use Playwright or browser automation to verify:

- No console errors on search, paper detail, question detail, author workbench, and moderation pages.
- Sidebar opens on fixture paper pages.
- Filters and sorting do not break layout.
- Anchor capture failure paths show manual fallback.

- [ ] **Step 8: Commit**

```powershell
git add apps docs/verification
git commit -m "test: add MVP end-to-end verification"
```

## Self-Review

Spec coverage:

- Browser extension full sidebar discussion: Tasks 7 and 8.
- Independent website for search, collections, author workflow, moderation: Tasks 9, 10, 11.
- Paper matching by DOI, arXiv, PMID, URL, title: Task 4.
- Text, image, screenshot, manual anchors: Tasks 5, 7, 8.
- Similar anchors and similar questions: Tasks 5 and 12.
- First-author and corresponding-author response permission: Tasks 3, 5, 10.
- Co-author denial for author response: Tasks 3, 5, 10.
- Ordinary author interaction without author-response label: Tasks 5 and 10.
- Disputed status and dispute sorting: Tasks 3, 5, 11.
- AI as suggestion-only governance helper: Tasks 11 and 12.
- Academic UI style: Tasks 8, 9, 10, 11, 12.

Known implementation risks:

- Browser extension DOM and PDF selection support varies by publisher and PDF viewer, so text selection must be the stable path and image capture must have manual fallback.
- Real author certification needs an operational policy for ORCID, institutional email, and manual review before production use.
- Semantic similarity needs embeddings and pgvector in production; MVP can begin with deterministic exact/text similarity tests and add embeddings behind the same service interface.
