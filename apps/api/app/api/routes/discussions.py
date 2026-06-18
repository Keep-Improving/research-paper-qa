from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.anchor import Anchor
from app.models.discussion import DiscussionItem
from app.models.paper import Paper
from app.models.reaction import Reaction
from app.schemas.anchor import AnchorRead
from app.schemas.discussion import (
    DiscussionCreate,
    DiscussionCreateResponse,
    DiscussionRead,
    DiscussionSort,
    ReactionCreate,
    ReactionRead,
)
from app.services.anchor_similarity import find_similar_discussions
from app.services.discussion_permissions import can_publish_author_response
from app.services.discussion_query import list_discussions

router = APIRouter(tags=["discussions"])


def get_current_user_id(x_user_id: UUID = Header(..., alias="X-User-Id")) -> UUID:
    return x_user_id


def _get_anchor(session: Session, anchor_id: UUID | None) -> Anchor | None:
    if anchor_id is None:
        return None
    return session.get(Anchor, anchor_id)


def _read_discussion(session: Session, item: DiscussionItem) -> DiscussionRead:
    anchor = _get_anchor(session, item.anchor_id)
    return DiscussionRead(
        id=item.id,
        paper_id=item.paper_id,
        anchor_id=item.anchor_id,
        parent_id=item.parent_id,
        user_id=item.user_id,
        kind=item.kind,
        status=item.status,
        body=item.body,
        is_author_response=item.is_author_response,
        is_pinned=item.is_pinned,
        is_hidden=item.is_hidden,
        created_at=item.created_at,
        updated_at=item.updated_at,
        anchor=AnchorRead.model_validate(anchor) if anchor else None,
    )


def _ensure_paper_exists(session: Session, paper_id: UUID) -> None:
    if session.get(Paper, paper_id) is None:
        raise HTTPException(status_code=404, detail="Paper not found")


@router.get("/papers/{paper_id}/discussions", response_model=list[DiscussionRead])
def get_paper_discussions(
    paper_id: UUID,
    status: str | None = None,
    kind: str | None = None,
    has_author_response: bool | None = None,
    anchor_kind: str | None = None,
    sort: DiscussionSort = Query(default="newest"),
    session: Session = Depends(get_db),
) -> list[DiscussionRead]:
    _ensure_paper_exists(session, paper_id)
    items = list_discussions(
        session,
        paper_id=paper_id,
        status=status,
        kind=kind,
        has_author_response=has_author_response,
        anchor_kind=anchor_kind,
        sort=sort,
    )
    return [_read_discussion(session, item) for item in items]


@router.post("/papers/{paper_id}/discussions", response_model=DiscussionCreateResponse)
def create_paper_discussion(
    paper_id: UUID,
    request: DiscussionCreate,
    session: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
) -> DiscussionCreateResponse:
    _ensure_paper_exists(session, paper_id)
    wants_author_response = request.is_author_response or request.kind == "author_response"
    if wants_author_response and not can_publish_author_response(
        session, user_id=user_id, paper_id=paper_id
    ):
        raise HTTPException(status_code=403, detail="Author response permission required")

    similar_quote = request.anchor.quote_text if request.anchor else None
    similar_items = find_similar_discussions(
        session,
        paper_id=paper_id,
        quote_text=similar_quote,
    )

    anchor = None
    if request.anchor is not None:
        anchor = Anchor(paper_id=paper_id, **request.anchor.model_dump())
        session.add(anchor)
        session.flush()

    item = DiscussionItem(
        paper_id=paper_id,
        anchor_id=anchor.id if anchor else None,
        parent_id=request.parent_id,
        user_id=user_id,
        kind=request.kind,
        status=request.status,
        body=request.body,
        is_author_response=request.is_author_response,
    )
    session.add(item)
    session.commit()
    session.refresh(item)

    return DiscussionCreateResponse(
        item=_read_discussion(session, item),
        similar_discussions=[_read_discussion(session, similar) for similar in similar_items],
    )


@router.get("/discussions/{discussion_id}", response_model=DiscussionRead)
def get_discussion(
    discussion_id: UUID,
    session: Session = Depends(get_db),
) -> DiscussionRead:
    item = session.get(DiscussionItem, discussion_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Discussion not found")
    return _read_discussion(session, item)


@router.post("/discussions/{discussion_id}/reactions", response_model=ReactionRead)
def create_discussion_reaction(
    discussion_id: UUID,
    request: ReactionCreate,
    session: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
) -> ReactionRead:
    item = session.get(DiscussionItem, discussion_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Discussion not found")

    reaction = Reaction(
        user_id=user_id,
        paper_id=item.paper_id,
        discussion_item_id=item.id,
        kind=request.kind,
    )
    session.add(reaction)
    session.commit()
    session.refresh(reaction)
    return ReactionRead.model_validate(reaction)
