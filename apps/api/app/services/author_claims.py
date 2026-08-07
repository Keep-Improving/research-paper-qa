from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.author_claim import AuthorClaimStatus, PaperAuthorClaim
from app.models.paper import Paper
from app.schemas.author_claim import AuthorClaimCreate
from app.services.discussion_permissions import can_publish_author_response


def paper_exists(session: Session, paper_id: UUID) -> bool:
    return session.get(Paper, paper_id) is not None


def create_author_claim(
    session: Session,
    *,
    user_id: UUID,
    request: AuthorClaimCreate,
) -> PaperAuthorClaim:
    claim = PaperAuthorClaim(
        user_id=user_id,
        paper_id=request.paper_id,
        role=request.role,
        evidence_type=request.evidence_type,
        status=AuthorClaimStatus.PENDING.value,
    )
    session.add(claim)
    session.commit()
    session.refresh(claim)
    return claim


def list_user_author_claims(session: Session, *, user_id: UUID) -> list[PaperAuthorClaim]:
    statement = (
        select(PaperAuthorClaim)
        .where(PaperAuthorClaim.user_id == user_id)
        .order_by(PaperAuthorClaim.created_at.desc(), PaperAuthorClaim.id.desc())
    )
    return list(session.scalars(statement).all())


def decide_author_claim(
    session: Session,
    *,
    claim_id: UUID,
    status: str,
) -> PaperAuthorClaim | None:
    claim = session.get(PaperAuthorClaim, claim_id)
    if claim is None:
        return None

    claim.status = status
    session.add(claim)
    session.commit()
    session.refresh(claim)
    return claim


def get_author_response_permission(
    session: Session,
    *,
    user_id: UUID,
    paper_id: UUID,
) -> bool:
    return can_publish_author_response(session, user_id=user_id, paper_id=paper_id)
