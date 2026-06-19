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
from app.models.author_claim import AuthorClaimStatus, PaperAuthorClaim, PaperAuthorRole
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
    paper = Paper(title="Author Claim Paper", doi="10.1000/author-claims")
    session.add(paper)
    session.commit()
    return paper


def create_user(session: Session, email: str = "author@example.org") -> User:
    user = User(email=email, display_name=email.split("@")[0])
    session.add(user)
    session.commit()
    return user


def auth_headers(user: User) -> dict[str, str]:
    return {"X-User-Id": str(user.id)}


def admin_headers(user: User) -> dict[str, str]:
    return {"X-Admin-User-Id": str(user.id)}


def submit_claim(client: TestClient, paper: Paper, user: User, role: str):
    return client.post(
        "/author/claims",
        headers=auth_headers(user),
        json={
            "paper_id": str(paper.id),
            "role": role,
            "evidence_type": "orcid",
        },
    )


def test_user_can_submit_pending_author_claim(
    client: TestClient, paper: Paper, session: Session
):
    user = create_user(session)

    response = submit_claim(client, paper, user, PaperAuthorRole.FIRST_AUTHOR.value)

    assert response.status_code == 200
    data = response.json()
    assert data["paper_id"] == str(paper.id)
    assert data["user_id"] == str(user.id)
    assert data["role"] == "first_author"
    assert data["status"] == "pending"


def test_current_user_can_list_their_claims(
    client: TestClient, paper: Paper, session: Session
):
    user = create_user(session)
    other_user = create_user(session, "other@example.org")
    submit_claim(client, paper, user, PaperAuthorRole.CORRESPONDING_AUTHOR.value)
    submit_claim(client, paper, other_user, PaperAuthorRole.FIRST_AUTHOR.value)

    response = client.get("/author/claims/me", headers=auth_headers(user))

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["user_id"] == str(user.id)
    assert data[0]["role"] == "corresponding_author"


def test_admin_can_approve_and_reject_claims(
    client: TestClient, paper: Paper, session: Session
):
    author = create_user(session)
    admin = create_user(session, "admin@example.org")
    approve_response = submit_claim(client, paper, author, PaperAuthorRole.FIRST_AUTHOR.value)
    reject_response = submit_claim(client, paper, author, PaperAuthorRole.CO_AUTHOR.value)

    approved = client.post(
        f"/admin/author-claims/{approve_response.json()['id']}/decision",
        headers=admin_headers(admin),
        json={"status": "approved"},
    )
    rejected = client.post(
        f"/admin/author-claims/{reject_response.json()['id']}/decision",
        headers=admin_headers(admin),
        json={"status": "rejected"},
    )

    assert approved.status_code == 200
    assert approved.json()["status"] == "approved"
    assert rejected.status_code == 200
    assert rejected.json()["status"] == "rejected"


def test_author_response_permission_only_for_approved_first_or_corresponding_claims(
    client: TestClient, paper: Paper, session: Session
):
    first_author = create_user(session, "first@example.org")
    corresponding_author = create_user(session, "corresponding@example.org")
    pending_first_author = create_user(session, "pending@example.org")
    co_author = create_user(session, "coauthor@example.org")
    admin = create_user(session, "admin@example.org")

    for user, role in [
        (first_author, PaperAuthorRole.FIRST_AUTHOR.value),
        (corresponding_author, PaperAuthorRole.CORRESPONDING_AUTHOR.value),
        (pending_first_author, PaperAuthorRole.FIRST_AUTHOR.value),
        (co_author, PaperAuthorRole.CO_AUTHOR.value),
    ]:
        claim_response = submit_claim(client, paper, user, role)
        if user is not pending_first_author:
            client.post(
                f"/admin/author-claims/{claim_response.json()['id']}/decision",
                headers=admin_headers(admin),
                json={"status": "approved"},
            )

    checks = [
        (first_author, True),
        (corresponding_author, True),
        (pending_first_author, False),
        (co_author, False),
    ]
    for user, expected in checks:
        response = client.get(
            f"/papers/{paper.id}/author-response-permission",
            headers=auth_headers(user),
        )
        assert response.status_code == 200
        assert response.json()["can_publish_author_response"] is expected


def test_admin_decision_requires_admin_header(
    client: TestClient, paper: Paper, session: Session
):
    user = create_user(session)
    claim_response = submit_claim(client, paper, user, PaperAuthorRole.FIRST_AUTHOR.value)

    response = client.post(
        f"/admin/author-claims/{claim_response.json()['id']}/decision",
        json={"status": "approved"},
    )

    assert response.status_code == 422


def test_approving_missing_claim_returns_404(client: TestClient, session: Session):
    admin = create_user(session, "admin@example.org")

    response = client.post(
        "/admin/author-claims/00000000-0000-0000-0000-000000000000/decision",
        headers=admin_headers(admin),
        json={"status": "approved"},
    )

    assert response.status_code == 404


def test_submitting_claim_for_missing_paper_returns_404(client: TestClient, session: Session):
    user = create_user(session)

    response = client.post(
        "/author/claims",
        headers=auth_headers(user),
        json={
            "paper_id": "00000000-0000-0000-0000-000000000000",
            "role": "first_author",
            "evidence_type": "orcid",
        },
    )

    assert response.status_code == 404


def test_invalid_role_is_rejected(client: TestClient, paper: Paper, session: Session):
    user = create_user(session)

    response = submit_claim(client, paper, user, "senior_author")

    assert response.status_code == 422


def test_service_persists_claim_status_change(
    client: TestClient, paper: Paper, session: Session
):
    user = create_user(session)
    admin = create_user(session, "admin@example.org")
    claim_response = submit_claim(client, paper, user, PaperAuthorRole.FIRST_AUTHOR.value)
    claim_id = UUID(claim_response.json()["id"])

    client.post(
        f"/admin/author-claims/{claim_id}/decision",
        headers=admin_headers(admin),
        json={"status": "approved"},
    )

    claim = session.get(PaperAuthorClaim, claim_id)
    assert claim is not None
    assert claim.status == AuthorClaimStatus.APPROVED.value
