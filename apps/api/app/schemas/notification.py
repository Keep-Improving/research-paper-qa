from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict


NotificationKindValue = Literal[
    "reply",
    "author_response",
    "followed_anchor_update",
    "author_claim_result",
]


class NotificationCreate(BaseModel):
    user_id: UUID
    kind: NotificationKindValue
    paper_id: UUID | None = None
    discussion_item_id: UUID | None = None
    anchor_id: UUID | None = None


class NotificationRead(BaseModel):
    id: UUID
    user_id: UUID
    paper_id: UUID | None
    discussion_item_id: UUID | None
    anchor_id: UUID | None
    kind: str
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
