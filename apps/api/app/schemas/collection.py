from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, model_validator


CollectionKindValue = Literal["paper", "discussion", "anchor"]


class CollectionCreate(BaseModel):
    kind: CollectionKindValue
    paper_id: UUID | None = None
    discussion_item_id: UUID | None = None
    anchor_id: UUID | None = None
    label: str | None = None
    note: str | None = None

    @model_validator(mode="after")
    def require_matching_target(self):
        targets = {
            "paper": self.paper_id,
            "discussion": self.discussion_item_id,
            "anchor": self.anchor_id,
        }
        if targets[self.kind] is None:
            raise ValueError(f"{self.kind} collection requires a matching target id")
        return self


class CollectionRead(BaseModel):
    id: UUID
    user_id: UUID
    paper_id: UUID | None
    discussion_item_id: UUID | None
    anchor_id: UUID | None
    kind: str
    status: str
    label: str | None
    note: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
