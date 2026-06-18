from __future__ import annotations

from collections.abc import Iterator
from datetime import UTC, datetime, timedelta
from uuid import UUID

import app.models  # noqa: F401
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models.anchor import Anchor
from app.models.author_claim import AuthorClaimStatus, PaperAuthorClaim, PaperAuthorRole
from app.models.discussion import DiscussionItem, DiscussionKind, DiscussionStatus
from app.models.paper import Paper
from app.models.user import User


@pytest.fixture
def session() -> Iterator[Session]:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        future=True,
    )
    Base.metadata.create_all(engine)
    testing_session_local = sessionmaker(
        bind=engine,
        autoflush=False,
        autocommit=False,
        future=True,
    )
    db_session = testing_session_local()
    try:
        yield db_session
    finally:
        db_session.close()
        Base.metadata.drop_all(engine)


@pytest.fixture
def client(session: Session) -> Iterator[TestClient]:
    def override_get_db():
        try:
            yield session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()


@pytest.fixture
def paper(session: Session) -> Paper:
    paper = Paper(title="Anchored Discussion Paper", doi="10.1000/discussions")
    session.add(paper)
    session.commit()
    return paper


def create_user(session: Session, email: str = "user@example.org") -> User:
    user = User(email=email, display_name=email.split("@")[0])
    session.add(user)
    session.commit()
    return user


def auth_headers(user: User) -> dict[str, str]:
    return {"X-User-Id": str(user.id)}


def create_discussion(
    session: Session,
    *,
    paper: Paper,
    user: User,
    body: str,
    quote_text: str | None = None,
    anchor_kind: str = "text",
    page_number: int | None = None,
    kind: str = DiscussionKind.QUESTION.value,
    status: str = DiscussionStatus.OPEN.value,
    is_author_response: bool = False,
    created_at: datetime | None = None,
    updated_at: datetime | None = None,
) -> DiscussionItem:
    anchor = None
    if quote_text is not None or anchor_kind:
        anchor = Anchor(
            paper_id=paper.id,
            kind=anchor_kind,
            quote_text=quote_text,
            page_number=page_number,
        )
        session.add(anchor)
        session.flush()

    item = DiscussionItem(
        paper_id=paper.id,
        anchor_id=anchor.id if anchor else None,
        user_id=user.id,
        kind=kind,
        status=status,
        body=body,
        is_author_response=is_author_response,
        created_at=created_at or datetime.now(UTC),
        updated_at=updated_at or created_at or datetime.now(UTC),
    )
    session.add(item)
    session.commit()
    return item


def approve_claim(session: Session, *, paper: Paper, user: User, role: PaperAuthorRole) -> None:
    session.add(
        PaperAuthorClaim(
            paper_id=paper.id,
            user_id=user.id,
            role=role.value,
            evidence_type="orcid",
            status=AuthorClaimStatus.APPROVED.value,
        )
    )
    session.commit()


def test_ordinary_logged_in_user_can_create_question_with_text_anchor(
    client: TestClient, paper: Paper, session: Session
):
    user = create_user(session)

    response = client.post(
        f"/papers/{paper.id}/discussions",
        headers=auth_headers(user),
        json={
            "kind": "question",
            "body": "How should this claim be interpreted?",
            "anchor": {
                "kind": "text",
                "quote_text": "important quoted claim",
                "context_text": "context around the important quoted claim",
                "page_number": 3,
                "section_label": "Results",
            },
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["similar_discussions"] == []
    assert data["item"]["kind"] == "question"
    assert data["item"]["paper_id"] == str(paper.id)
    assert data["item"]["user_id"] == str(user.id)
    assert data["item"]["anchor"]["kind"] == "text"
    assert data["item"]["anchor"]["quote_text"] == "important quoted claim"
    assert data["item"]["anchor"]["page_number"] == 3


def test_create_question_returns_similar_existing_discussions_for_same_quote(
    client: TestClient, paper: Paper, session: Session
):
    user = create_user(session)
    existing = create_discussion(
        session,
        paper=paper,
        user=user,
        body="Existing question",
        quote_text=" Important   QUOTED Claim ",
    )

    response = client.post(
        f"/papers/{paper.id}/discussions",
        headers=auth_headers(user),
        json={
            "kind": "question",
            "body": "New question",
            "anchor": {"kind": "text", "quote_text": "important quoted claim"},
        },
    )

    assert response.status_code == 200
    similar_ids = [UUID(item["id"]) for item in response.json()["similar_discussions"]]
    assert similar_ids == [existing.id]


def test_list_discussions_filters_by_status_kind_author_response_and_anchor_kind(
    client: TestClient, paper: Paper, session: Session
):
    user = create_user(session)
    matching = create_discussion(
        session,
        paper=paper,
        user=user,
        body="Matching author response question",
        quote_text="filtered quote",
        kind=DiscussionKind.QUESTION.value,
        status=DiscussionStatus.OPEN.value,
        is_author_response=True,
    )
    create_discussion(
        session,
        paper=paper,
        user=user,
        body="Wrong status",
        quote_text="filtered quote",
        status=DiscussionStatus.RESOLVED.value,
        is_author_response=True,
    )
    create_discussion(
        session,
        paper=paper,
        user=user,
        body="Wrong kind",
        quote_text="filtered quote",
        kind=DiscussionKind.COMMENT.value,
        is_author_response=True,
    )
    create_discussion(
        session,
        paper=paper,
        user=user,
        body="Wrong author flag",
        quote_text="filtered quote",
        is_author_response=False,
    )
    create_discussion(
        session,
        paper=paper,
        user=user,
        body="Wrong anchor kind",
        quote_text="filtered quote",
        anchor_kind="figure",
        is_author_response=True,
    )

    response = client.get(
        f"/papers/{paper.id}/discussions",
        params={
            "status": "open",
            "kind": "question",
            "has_author_response": "true",
            "anchor_kind": "text",
        },
    )

    assert response.status_code == 200
    assert [UUID(item["id"]) for item in response.json()] == [matching.id]


def test_list_discussions_supports_required_sorts(
    client: TestClient, paper: Paper, session: Session
):
    user = create_user(session)
    now = datetime.now(UTC)
    newer = create_discussion(
        session,
        paper=paper,
        user=user,
        body="newer",
        quote_text="newer quote",
        page_number=9,
        created_at=now,
        updated_at=now,
    )
    older = create_discussion(
        session,
        paper=paper,
        user=user,
        body="older",
        quote_text="older quote",
        page_number=2,
        created_at=now - timedelta(days=1),
        updated_at=now - timedelta(hours=1),
    )

    newest = client.get(f"/papers/{paper.id}/discussions", params={"sort": "newest"})
    assert newest.status_code == 200
    assert [UUID(item["id"]) for item in newest.json()] == [newer.id, older.id]

    anchor_position = client.get(
        f"/papers/{paper.id}/discussions", params={"sort": "anchor_position"}
    )
    assert anchor_position.status_code == 200
    assert [UUID(item["id"]) for item in anchor_position.json()] == [older.id, newer.id]

    for sort in ["active", "votes", "heat", "dispute"]:
        response = client.get(f"/papers/{paper.id}/discussions", params={"sort": sort})
        assert response.status_code == 200
        assert [UUID(item["id"]) for item in response.json()] == [newer.id, older.id]


def test_first_author_with_approved_claim_can_create_author_response(
    client: TestClient, paper: Paper, session: Session
):
    user = create_user(session)
    approve_claim(session, paper=paper, user=user, role=PaperAuthorRole.FIRST_AUTHOR)

    response = client.post(
        f"/papers/{paper.id}/discussions",
        headers=auth_headers(user),
        json={
            "kind": "author_response",
            "body": "Author clarification",
            "is_author_response": True,
        },
    )

    assert response.status_code == 200
    assert response.json()["item"]["is_author_response"] is True
    assert response.json()["item"]["kind"] == "author_response"


def test_corresponding_author_with_approved_claim_can_create_author_response(
    client: TestClient, paper: Paper, session: Session
):
    user = create_user(session)
    approve_claim(session, paper=paper, user=user, role=PaperAuthorRole.CORRESPONDING_AUTHOR)

    response = client.post(
        f"/papers/{paper.id}/discussions",
        headers=auth_headers(user),
        json={
            "kind": "author_response",
            "body": "Corresponding author clarification",
            "is_author_response": True,
        },
    )

    assert response.status_code == 200
    assert response.json()["item"]["is_author_response"] is True


def test_co_author_claim_cannot_create_author_response(
    client: TestClient, paper: Paper, session: Session
):
    user = create_user(session)
    approve_claim(session, paper=paper, user=user, role=PaperAuthorRole.CO_AUTHOR)

    response = client.post(
        f"/papers/{paper.id}/discussions",
        headers=auth_headers(user),
        json={
            "kind": "author_response",
            "body": "Co-author clarification",
            "is_author_response": True,
        },
    )

    assert response.status_code == 403


def test_first_author_can_create_normal_question_without_author_response_flag(
    client: TestClient, paper: Paper, session: Session
):
    user = create_user(session)
    approve_claim(session, paper=paper, user=user, role=PaperAuthorRole.FIRST_AUTHOR)

    response = client.post(
        f"/papers/{paper.id}/discussions",
        headers=auth_headers(user),
        json={
            "kind": "question",
            "body": "Normal author question",
            "is_author_response": False,
        },
    )

    assert response.status_code == 200
    assert response.json()["item"]["kind"] == "question"
    assert response.json()["item"]["is_author_response"] is False
