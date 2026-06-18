from __future__ import annotations

from datetime import UTC, datetime
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
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )
