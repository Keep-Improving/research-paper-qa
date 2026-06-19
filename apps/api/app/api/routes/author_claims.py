from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.author_claim import (
    AuthorClaimCreate,
    AuthorClaimDecision,
    AuthorClaimRead,
    AuthorResponsePermissionRead,
)
from app.services.author_claims import (
    create_author_claim,
    decide_author_claim,
    get_author_response_permission,
    list_user_author_claims,
    paper_exists,
)

router = APIRouter(tags=["author-claims"])


def get_current_user_id(x_user_id: UUID = Header(..., alias="X-User-Id")) -> UUID:
    return x_user_id


def get_admin_user_id(x_admin_user_id: UUID = Header(..., alias="X-Admin-User-Id")) -> UUID:
    return x_admin_user_id


@router.post("/author/claims", response_model=AuthorClaimRead)
def submit_author_claim(
    request: AuthorClaimCreate,
    session: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
) -> AuthorClaimRead:
    if not paper_exists(session, request.paper_id):
        raise HTTPException(status_code=404, detail="Paper not found")

    claim = create_author_claim(session, user_id=user_id, request=request)
    return AuthorClaimRead.model_validate(claim)


@router.get("/author/claims/me", response_model=list[AuthorClaimRead])
def get_my_author_claims(
    session: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
) -> list[AuthorClaimRead]:
    claims = list_user_author_claims(session, user_id=user_id)
    return [AuthorClaimRead.model_validate(claim) for claim in claims]


@router.post("/admin/author-claims/{claim_id}/decision", response_model=AuthorClaimRead)
def decide_claim(
    claim_id: UUID,
    request: AuthorClaimDecision,
    session: Session = Depends(get_db),
    _admin_user_id: UUID = Depends(get_admin_user_id),
) -> AuthorClaimRead:
    claim = decide_author_claim(session, claim_id=claim_id, status=request.status)
    if claim is None:
        raise HTTPException(status_code=404, detail="Author claim not found")
    return AuthorClaimRead.model_validate(claim)


@router.get(
    "/papers/{paper_id}/author-response-permission",
    response_model=AuthorResponsePermissionRead,
)
def get_paper_author_response_permission(
    paper_id: UUID,
    session: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
) -> AuthorResponsePermissionRead:
    if not paper_exists(session, paper_id):
        raise HTTPException(status_code=404, detail="Paper not found")

    return AuthorResponsePermissionRead(
        paper_id=paper_id,
        user_id=user_id,
        can_publish_author_response=get_author_response_permission(
            session,
            user_id=user_id,
            paper_id=paper_id,
        ),
    )
