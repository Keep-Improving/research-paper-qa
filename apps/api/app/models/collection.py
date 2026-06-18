from __future__ import annotations

from datetime import UTC, datetime
from enum import Enum
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class CollectionItemKind(str, Enum):
    PAPER = "paper"
    DISCUSSION = "discussion"
    ANCHOR = "anchor"


class Collection(Base):
    __tablename__ = "collections"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"), index=True)
    paper_id: Mapped[UUID | None] = mapped_column(ForeignKey("papers.id"), nullable=True, index=True)
    discussion_item_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("discussion_items.id"), nullable=True, index=True
    )
    anchor_id: Mapped[UUID | None] = mapped_column(ForeignKey("anchors.id"), nullable=True, index=True)
    kind: Mapped[str] = mapped_column(String(32), index=True)
    status: Mapped[str] = mapped_column(String(32), default="active", index=True)
    label: Mapped[str | None] = mapped_column(String(120), nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )
