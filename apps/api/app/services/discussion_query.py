from uuid import UUID

from sqlalchemy import Select, case, select
from sqlalchemy.orm import Session

from app.models.anchor import Anchor
from app.models.discussion import DiscussionItem


def build_discussion_query(
    *,
    paper_id: UUID,
    status: str | None = None,
    kind: str | None = None,
    has_author_response: bool | None = None,
    anchor_kind: str | None = None,
    sort: str = "newest",
) -> Select[tuple[DiscussionItem]]:
    statement = select(DiscussionItem).where(DiscussionItem.paper_id == paper_id)

    if anchor_kind is not None or sort == "anchor_position":
        statement = statement.outerjoin(Anchor, DiscussionItem.anchor_id == Anchor.id)

    if status is not None:
        statement = statement.where(DiscussionItem.status == status)
    if kind is not None:
        statement = statement.where(DiscussionItem.kind == kind)
    if has_author_response is not None:
        statement = statement.where(DiscussionItem.is_author_response.is_(has_author_response))
    if anchor_kind is not None:
        statement = statement.where(Anchor.kind == anchor_kind)

    if sort == "active":
        return statement.order_by(DiscussionItem.updated_at.desc(), DiscussionItem.id.desc())
    if sort == "anchor_position":
        return statement.order_by(
            case((Anchor.page_number.is_(None), 1), else_=0),
            Anchor.page_number.asc(),
            DiscussionItem.created_at.desc(),
            DiscussionItem.id.desc(),
        )

    return statement.order_by(DiscussionItem.created_at.desc(), DiscussionItem.id.desc())


def list_discussions(
    session: Session,
    *,
    paper_id: UUID,
    status: str | None = None,
    kind: str | None = None,
    has_author_response: bool | None = None,
    anchor_kind: str | None = None,
    sort: str = "newest",
) -> list[DiscussionItem]:
    statement = build_discussion_query(
        paper_id=paper_id,
        status=status,
        kind=kind,
        has_author_response=has_author_response,
        anchor_kind=anchor_kind,
        sort=sort,
    )
    return list(session.execute(statement).scalars().all())
