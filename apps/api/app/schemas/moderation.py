from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict


ModerationReportKindValue = Literal["spam", "abuse", "factual_error", "duplicate", "other"]
ModerationActionValue = Literal["hide", "restore", "mark_disputed", "link_duplicate", "resolve", "reject"]


class ModerationReportCreate(BaseModel):
    paper_id: UUID | None = None
    discussion_item_id: UUID | None = None
    anchor_id: UUID | None = None
    kind: ModerationReportKindValue
    details: str | None = None


class ModerationActionCreate(BaseModel):
    action: ModerationActionValue
    moderator_note: str | None = None
    duplicate_of_discussion_id: UUID | None = None


class ModerationReportRead(BaseModel):
    id: UUID
    user_id: UUID
    paper_id: UUID | None
    discussion_item_id: UUID | None
    duplicate_of_discussion_id: UUID | None
    anchor_id: UUID | None
    kind: str
    status: str
    details: str | None
    ai_risk_label: str | None
    moderator_note: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
