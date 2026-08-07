from uuid import UUID

from pydantic import BaseModel, ConfigDict


class AnchorCreate(BaseModel):
    kind: str
    quote_text: str | None = None
    context_text: str | None = None
    page_number: int | None = None
    section_label: str | None = None
    figure_label: str | None = None
    table_label: str | None = None
    formula_label: str | None = None
    reference_label: str | None = None
    source_url: str | None = None
    dom_path: str | None = None
    image_url: str | None = None
    ocr_text: str | None = None


class AnchorRead(BaseModel):
    id: UUID
    paper_id: UUID
    kind: str
    quote_text: str | None
    context_text: str | None
    page_number: int | None
    section_label: str | None
    figure_label: str | None
    table_label: str | None
    formula_label: str | None
    reference_label: str | None
    source_url: str | None
    dom_path: str | None
    image_url: str | None
    ocr_text: str | None

    model_config = ConfigDict(from_attributes=True)
