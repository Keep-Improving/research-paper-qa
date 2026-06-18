from __future__ import annotations

from datetime import UTC, datetime
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
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )
