from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.paper import Paper
from app.schemas.paper import PaperIdentifyRequest


def normalize_doi(value: str | None) -> str | None:
    if value is None:
        return None

    normalized = value.strip()
    prefixes = ("doi:", "https://doi.org/", "http://dx.doi.org/")
    lowered = normalized.lower()
    for prefix in prefixes:
        if lowered.startswith(prefix):
            normalized = normalized[len(prefix) :]
            break

    normalized = normalized.strip().lower()
    return normalized or None


def identify_or_create_paper(session: Session, request: PaperIdentifyRequest) -> Paper:
    doi = normalize_doi(request.doi)
    arxiv_id = request.arxiv_id.strip() if request.arxiv_id else None
    pmid = request.pmid.strip() if request.pmid else None
    canonical_url = request.url.strip() if request.url else None

    if doi:
        paper = session.scalar(select(Paper).where(Paper.doi == doi))
        if paper:
            return paper

    if arxiv_id:
        paper = session.scalar(select(Paper).where(Paper.arxiv_id == arxiv_id))
        if paper:
            return paper

    if pmid:
        paper = session.scalar(select(Paper).where(Paper.pmid == pmid))
        if paper:
            return paper

    title = (request.title or "").strip() or doi or arxiv_id or pmid or canonical_url
    paper = Paper(
        title=title,
        doi=doi,
        arxiv_id=arxiv_id,
        pmid=pmid,
        canonical_url=canonical_url,
    )
    session.add(paper)
    session.commit()
    session.refresh(paper)
    return paper
