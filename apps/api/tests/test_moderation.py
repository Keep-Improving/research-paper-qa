from __future__ import annotations

from collections.abc import Iterator
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


def create_user(session: Session, email: str = "user@example.org") -> User:
    user = User(email=email, display_name=email.split("@")[0])
    session.add(user)
    session.commit()
    return user


def auth_headers(user: User) -> dict[str, str]:
    return {"X-User-Id": str(user.id)}


def admin_headers(user: User) -> dict[str, str]:
    return {"X-Admin-User-Id": str(user.id)}


@pytest.fixture
def paper(session: Session) -> Paper:
    paper = Paper(title="Moderation Paper", doi="10.1000/moderation")
    session.add(paper)
    session.commit()
    return paper


@pytest.fixture
def anchor(session: Session, paper: Paper) -> Anchor:
    anchor = Anchor(paper_id=paper.id, kind="text", quote_text="quoted claim")
    session.add(anchor)
    session.commit()
    return anchor


@pytest.fixture
def discussion(session: Session, paper: Paper, anchor: Anchor) -> DiscussionItem:
    user = create_user(session, "discussion-author@example.org")
    discussion = DiscussionItem(
        paper_id=paper.id,
        anchor_id=anchor.id,
        user_id=user.id,
        kind=DiscussionKind.QUESTION.value,
        status=DiscussionStatus.OPEN.value,
        body="Question requiring moderation",
    )
    session.add(discussion)
    session.commit()
    return discussion


def test_user_can_save_and_archive_collection_items(
    client: TestClient,
    paper: Paper,
    anchor: Anchor,
    discussion: DiscussionItem,
    session: Session,
):
    user = create_user(session)
    saved_items = [
        {"kind": "paper", "paper_id": str(paper.id), "label": "reading list"},
        {"kind": "discussion", "discussion_item_id": str(discussion.id), "note": "follow up"},
        {"kind": "anchor", "anchor_id": str(anchor.id), "label": "methods"},
    ]

    created = [
        client.post("/collections", headers=auth_headers(user), json=item).json()
        for item in saved_items
    ]
    archive_response = client.post(
        f"/collections/{created[1]['id']}/archive",
        headers=auth_headers(user),
    )
    list_response = client.get("/collections/me", headers=auth_headers(user))

    assert archive_response.status_code == 200
    assert archive_response.json()["status"] == "archived"
    assert list_response.status_code == 200
    assert [item["kind"] for item in list_response.json()] == ["paper", "discussion", "anchor"]


def test_report_creation_stores_ai_risk_suggestion(
    client: TestClient, paper: Paper, discussion: DiscussionItem, session: Session
):
    reporter = create_user(session)

    response = client.post(
        "/moderation/reports",
        headers=auth_headers(reporter),
        json={
            "paper_id": str(paper.id),
            "discussion_item_id": str(discussion.id),
            "kind": "factual_error",
            "details": "The evaluation setup appears inconsistent.",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "open"
    assert data["ai_risk_label"] == "needs_factual_review"


def test_admin_can_hide_restore_mark_disputed_and_link_duplicate_discussion(
    client: TestClient, paper: Paper, discussion: DiscussionItem, session: Session
):
    reporter = create_user(session)
    admin = create_user(session, "admin@example.org")
    duplicate = DiscussionItem(
        paper_id=paper.id,
        user_id=reporter.id,
        kind=DiscussionKind.QUESTION.value,
        status=DiscussionStatus.OPEN.value,
        body="Earlier duplicate question",
    )
    session.add(duplicate)
    session.commit()
    report = client.post(
        "/moderation/reports",
        headers=auth_headers(reporter),
        json={
            "paper_id": str(paper.id),
            "discussion_item_id": str(discussion.id),
            "kind": "duplicate",
            "details": "This repeats an existing question.",
        },
    ).json()

    hide = client.post(
        f"/admin/moderation/reports/{report['id']}/action",
        headers=admin_headers(admin),
        json={"action": "hide", "moderator_note": "Temporarily hidden"},
    )
    assert hide.status_code == 200
    assert session.get(DiscussionItem, discussion.id).is_hidden is True

    restore = client.post(
        f"/admin/moderation/reports/{report['id']}/action",
        headers=admin_headers(admin),
        json={"action": "restore", "moderator_note": "Restored after review"},
    )
    assert restore.status_code == 200
    assert session.get(DiscussionItem, discussion.id).is_hidden is False

    disputed = client.post(
        f"/admin/moderation/reports/{report['id']}/action",
        headers=admin_headers(admin),
        json={"action": "mark_disputed", "moderator_note": "Needs clarification"},
    )
    assert disputed.status_code == 200
    assert session.get(DiscussionItem, discussion.id).status == DiscussionStatus.DISPUTED.value

    linked = client.post(
        f"/admin/moderation/reports/{report['id']}/action",
        headers=admin_headers(admin),
        json={
            "action": "link_duplicate",
            "duplicate_of_discussion_id": str(duplicate.id),
            "moderator_note": "Linked duplicate",
        },
    )

    assert linked.status_code == 200
    assert linked.json()["duplicate_of_discussion_id"] == str(duplicate.id)


def test_admin_can_list_report_queue(
    client: TestClient, paper: Paper, discussion: DiscussionItem, session: Session
):
    reporter = create_user(session)
    admin = create_user(session, "admin@example.org")
    client.post(
        "/moderation/reports",
        headers=auth_headers(reporter),
        json={
            "paper_id": str(paper.id),
            "discussion_item_id": str(discussion.id),
            "kind": "spam",
            "details": "Promotional text",
        },
    )

    response = client.get("/admin/moderation/reports", headers=admin_headers(admin))

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["kind"] == "spam"


def test_notification_api_creates_and_lists_user_notifications(
    client: TestClient, paper: Paper, discussion: DiscussionItem, anchor: Anchor, session: Session
):
    user = create_user(session)
    payloads = [
        {"kind": "reply", "discussion_item_id": str(discussion.id)},
        {"kind": "author_response", "paper_id": str(paper.id), "discussion_item_id": str(discussion.id)},
        {"kind": "followed_anchor_update", "paper_id": str(paper.id), "anchor_id": str(anchor.id)},
    ]

    for payload in payloads:
        response = client.post(
            "/notifications",
            headers=auth_headers(user),
            json={"user_id": str(user.id), **payload},
        )
        assert response.status_code == 200

    list_response = client.get("/notifications/me", headers=auth_headers(user))

    assert list_response.status_code == 200
    assert [item["kind"] for item in list_response.json()] == [
        "followed_anchor_update",
        "author_response",
        "reply",
    ]


def test_collection_requires_one_saved_target(client: TestClient, session: Session):
    user = create_user(session)

    response = client.post(
        "/collections",
        headers=auth_headers(user),
        json={"kind": "paper"},
    )

    assert response.status_code == 422
