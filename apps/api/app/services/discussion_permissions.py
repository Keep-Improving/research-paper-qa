from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.author_claim import AuthorClaimStatus, PaperAuthorClaim, PaperAuthorRole


def can_publish_author_response(session: Session, *, user_id: UUID, paper_id: UUID) -> bool:
    allowed_roles = {
        PaperAuthorRole.FIRST_AUTHOR.value,
        PaperAuthorRole.CORRESPONDING_AUTHOR.value,
    }
    statement = select(PaperAuthorClaim.id).where(
        PaperAuthorClaim.user_id == user_id,
        PaperAuthorClaim.paper_id == paper_id,
        PaperAuthorClaim.status == AuthorClaimStatus.APPROVED.value,
        PaperAuthorClaim.role.in_(allowed_roles),
    )
    return session.execute(statement).first() is not None
