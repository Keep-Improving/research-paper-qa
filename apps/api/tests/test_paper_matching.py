import app.models  # noqa: F401
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models.paper import Paper
from app.schemas.paper import PaperIdentifyRequest
from app.services.paper_matching import identify_or_create_paper, normalize_doi


def make_session() -> Session:
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
    return testing_session_local()


def test_doi_normalization_matches_existing_paper():
    session = make_session()
    stored = Paper(title="Existing DOI Paper", doi="10.1000/xyz")
    session.add(stored)
    session.commit()

    assert normalize_doi("https://doi.org/10.1000/XYZ") == "10.1000/xyz"
    assert normalize_doi("doi:10.1000/xyz") == "10.1000/xyz"

    first = identify_or_create_paper(
        session,
        PaperIdentifyRequest(title="Different Title", doi="https://doi.org/10.1000/XYZ"),
    )
    second = identify_or_create_paper(
        session,
        PaperIdentifyRequest(title="Different Title", doi="doi:10.1000/xyz"),
    )

    assert first.id == stored.id
    assert second.id == stored.id
    assert session.query(Paper).count() == 1


def test_arxiv_id_matches_existing_paper():
    session = make_session()
    stored = Paper(title="Existing arXiv Paper", arxiv_id="2401.12345")
    session.add(stored)
    session.commit()

    result = identify_or_create_paper(
        session,
        PaperIdentifyRequest(title="New Title", arxiv_id="2401.12345"),
    )

    assert result.id == stored.id
    assert session.query(Paper).count() == 1


def test_pmid_matches_existing_paper():
    session = make_session()
    stored = Paper(title="Existing PMID Paper", pmid="12345678")
    session.add(stored)
    session.commit()

    result = identify_or_create_paper(
        session,
        PaperIdentifyRequest(title="New Title", pmid="12345678"),
    )

    assert result.id == stored.id
    assert session.query(Paper).count() == 1


def test_title_and_url_fallback_creates_paper_without_stable_identifier():
    session = make_session()

    result = identify_or_create_paper(
        session,
        PaperIdentifyRequest(
            title="Fallback Paper",
            url="https://example.org/paper",
        ),
    )

    assert result.id is not None
    assert result.title == "Fallback Paper"
    assert result.doi is None
    assert result.arxiv_id is None
    assert result.pmid is None
    assert result.canonical_url == "https://example.org/paper"
    assert session.query(Paper).count() == 1


def test_identify_route_returns_created_paper_json():
    session = make_session()

    def override_get_db():
        try:
            yield session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)

    try:
        response = client.post(
            "/papers/identify",
            json={
                "title": "Example Paper",
                "doi": "https://doi.org/10.1000/XYZ",
                "arxiv_id": None,
                "pmid": None,
                "url": "https://example.org/paper",
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    data = response.json()
    assert data["id"]
    assert data["title"] == "Example Paper"
    assert data["doi"] == "10.1000/xyz"
    assert data["arxiv_id"] is None
    assert data["pmid"] is None
    assert data["canonical_url"] == "https://example.org/paper"
