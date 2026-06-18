from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.schemas.anchor import AnchorCreate, AnchorRead


DiscussionSort = Literal["newest", "active", "votes", "heat", "dispute", "anchor_position"]


class DiscussionCreate(BaseModel):
    kind: str
    body: str
    status: str = "open"
    anchor: AnchorCreate | None = None
    parent_id: UUID | None = None
    is_author_response: bool = False


class DiscussionRead(BaseModel):
    id: UUID
    paper_id: UUID
    anchor_id: UUID | None
    parent_id: UUID | None
    user_id: UUID
    kind: str
    status: str
    body: str
    is_author_response: bool
    is_pinned: bool
    is_hidden: bool
    created_at: datetime
    updated_at: datetime
    anchor: AnchorRead | None = None

    model_config = ConfigDict(from_attributes=True)


class DiscussionCreateResponse(BaseModel):
    item: DiscussionRead
    similar_discussions: list[DiscussionRead]


class ReactionCreate(BaseModel):
    kind: str


class ReactionRead(BaseModel):
    id: UUID
    kind: str

    model_config = ConfigDict(from_attributes=True)
