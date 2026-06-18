from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.anchor import Anchor
from app.models.discussion import DiscussionItem


def normalize_quote_text(value: str) -> str:
    return " ".join(value.casefold().split())


def find_similar_discussions(
    session: Session,
    *,
    paper_id: UUID,
    quote_text: str | None,
    exclude_discussion_id: UUID | None = None,
) -> list[DiscussionItem]:
    if not quote_text:
        return []

    normalized_quote = normalize_quote_text(quote_text)
    statement = (
        select(DiscussionItem, Anchor.quote_text)
        .join(Anchor, DiscussionItem.anchor_id == Anchor.id)
        .where(DiscussionItem.paper_id == paper_id)
        .order_by(DiscussionItem.created_at.desc(), DiscussionItem.id.desc())
    )
    if exclude_discussion_id is not None:
        statement = statement.where(DiscussionItem.id != exclude_discussion_id)

    rows = session.execute(statement).all()
    return [
        item
        for item, candidate_quote in rows
        if normalize_quote_text(candidate_quote or "") == normalized_quote
    ]
