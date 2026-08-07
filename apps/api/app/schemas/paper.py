from uuid import UUID

from pydantic import BaseModel, ConfigDict


class PaperIdentifyRequest(BaseModel):
    title: str | None = None
    doi: str | None = None
    arxiv_id: str | None = None
    pmid: str | None = None
    url: str | None = None


class PaperCreate(BaseModel):
    title: str
    doi: str | None = None
    arxiv_id: str | None = None
    pmid: str | None = None
    canonical_url: str | None = None
    venue: str | None = None
    publication_year: int | None = None
    abstract: str | None = None


class PaperRead(BaseModel):
    id: UUID
    title: str
    doi: str | None
    arxiv_id: str | None
    pmid: str | None
    venue: str | None
    publication_year: int | None
    canonical_url: str | None
    abstract: str | None

    model_config = ConfigDict(from_attributes=True)
