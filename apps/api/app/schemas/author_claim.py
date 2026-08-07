from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict


PaperAuthorRoleValue = Literal["first_author", "corresponding_author", "co_author"]
AuthorClaimDecisionValue = Literal["approved", "rejected"]


class AuthorClaimCreate(BaseModel):
    paper_id: UUID
    role: PaperAuthorRoleValue
    evidence_type: str


class AuthorClaimDecision(BaseModel):
    status: AuthorClaimDecisionValue


class AuthorClaimRead(BaseModel):
    id: UUID
    user_id: UUID
    paper_id: UUID
    role: str
    evidence_type: str
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AuthorResponsePermissionRead(BaseModel):
    paper_id: UUID
    user_id: UUID
    can_publish_author_response: bool
