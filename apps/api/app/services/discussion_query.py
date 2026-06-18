from uuid import UUID

from sqlalchemy import Select, case, func, select
from sqlalchemy.orm import Session

from app.models.anchor import Anchor
from app.models.discussion import DiscussionItem, DiscussionStatus
from app.models.reaction import Reaction, ReactionKind


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
    if sort == "votes":
        vote_counts = (
            select(
                Reaction.discussion_item_id.label("discussion_item_id"),
                func.sum(
                    case(
                        (Reaction.kind == ReactionKind.UPVOTE.value, 1),
                        (Reaction.kind == ReactionKind.DOWNVOTE.value, -1),
                        else_=0,
                    )
                ).label("vote_score"),
            )
            .where(Reaction.discussion_item_id.is_not(None), Reaction.status == "active")
            .group_by(Reaction.discussion_item_id)
            .subquery()
        )
        return (
            statement.outerjoin(
                vote_counts,
                DiscussionItem.id == vote_counts.c.discussion_item_id,
            )
            .order_by(
                func.coalesce(vote_counts.c.vote_score, 0).desc(),
                DiscussionItem.created_at.desc(),
                DiscussionItem.id.desc(),
            )
        )
    if sort == "heat":
        reply_counts = (
            select(
                DiscussionItem.parent_id.label("parent_id"),
                func.count(DiscussionItem.id).label("reply_count"),
            )
            .where(DiscussionItem.parent_id.is_not(None))
            .group_by(DiscussionItem.parent_id)
            .subquery()
        )
        reaction_counts = (
            select(
                Reaction.discussion_item_id.label("discussion_item_id"),
                func.count(Reaction.id).label("reaction_count"),
            )
            .where(Reaction.discussion_item_id.is_not(None), Reaction.status == "active")
            .group_by(Reaction.discussion_item_id)
            .subquery()
        )
        heat_score = func.coalesce(reply_counts.c.reply_count, 0) + func.coalesce(
            reaction_counts.c.reaction_count, 0
        )
        return (
            statement.outerjoin(reply_counts, DiscussionItem.id == reply_counts.c.parent_id)
            .outerjoin(
                reaction_counts,
                DiscussionItem.id == reaction_counts.c.discussion_item_id,
            )
            .order_by(
                heat_score.desc(),
                DiscussionItem.updated_at.desc(),
                DiscussionItem.id.desc(),
            )
        )
    if sort == "dispute":
        downvote_counts = (
            select(
                Reaction.discussion_item_id.label("discussion_item_id"),
                func.count(Reaction.id).label("downvote_count"),
            )
            .where(
                Reaction.discussion_item_id.is_not(None),
                Reaction.status == "active",
                Reaction.kind == ReactionKind.DOWNVOTE.value,
            )
            .group_by(Reaction.discussion_item_id)
            .subquery()
        )
        dispute_score = (
            case((DiscussionItem.status == DiscussionStatus.DISPUTED.value, 1000), else_=0)
            + func.coalesce(downvote_counts.c.downvote_count, 0)
        )
        return (
            statement.outerjoin(
                downvote_counts,
                DiscussionItem.id == downvote_counts.c.discussion_item_id,
            )
            .order_by(
                dispute_score.desc(),
                DiscussionItem.updated_at.desc(),
                DiscussionItem.id.desc(),
            )
        )
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
