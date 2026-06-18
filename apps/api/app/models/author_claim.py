from __future__ import annotations

from datetime import datetime
from enum import Enum
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class PaperAuthorRole(str, Enum):
    FIRST_AUTHOR = "first_author"
    CORRESPONDING_AUTHOR = "corresponding_author"
    CO_AUTHOR = "co_author"

    @property
    def can_author_respond(self) -> bool:
        return self in {self.FIRST_AUTHOR, self.CORRESPONDING_AUTHOR}


class AuthorClaimStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class PaperAuthorClaim(Base):
    __tablename__ = "paper_author_claims"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"), index=True)
    paper_id: Mapped[UUID] = mapped_column(ForeignKey("papers.id"), index=True)
    role: Mapped[str] = mapped_column(String(32))
    evidence_type: Mapped[str] = mapped_column(String(64))
    status: Mapped[str] = mapped_column(String(32), default=AuthorClaimStatus.PENDING.value)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
