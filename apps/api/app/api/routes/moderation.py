from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.discussion import DiscussionItem, DiscussionStatus
from app.models.moderation import ModerationReport, ModerationStatus
from app.schemas.moderation import (
    ModerationActionCreate,
    ModerationReportCreate,
    ModerationReportRead,
)
from app.services.moderation_scoring import suggest_ai_risk_label

router = APIRouter(tags=["moderation"])


def get_current_user_id(x_user_id: UUID = Header(..., alias="X-User-Id")) -> UUID:
    return x_user_id


def get_admin_user_id(x_admin_user_id: UUID = Header(..., alias="X-Admin-User-Id")) -> UUID:
    return x_admin_user_id


@router.post("/moderation/reports", response_model=ModerationReportRead)
def create_moderation_report(
    request: ModerationReportCreate,
    session: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
) -> ModerationReportRead:
    report = ModerationReport(
        user_id=user_id,
        paper_id=request.paper_id,
        discussion_item_id=request.discussion_item_id,
        anchor_id=request.anchor_id,
        kind=request.kind,
        details=request.details,
        ai_risk_label=suggest_ai_risk_label(request.kind, request.details),
    )
    session.add(report)
    session.commit()
    session.refresh(report)
    return ModerationReportRead.model_validate(report)


@router.get("/admin/moderation/reports", response_model=list[ModerationReportRead])
def list_moderation_reports(
    session: Session = Depends(get_db),
    _admin_user_id: UUID = Depends(get_admin_user_id),
) -> list[ModerationReportRead]:
    statement = select(ModerationReport).order_by(
        ModerationReport.created_at.desc(),
        ModerationReport.id.desc(),
    )
    return [ModerationReportRead.model_validate(report) for report in session.scalars(statement).all()]


@router.post("/admin/moderation/reports/{report_id}/action", response_model=ModerationReportRead)
def apply_moderation_action(
    report_id: UUID,
    request: ModerationActionCreate,
    session: Session = Depends(get_db),
    _admin_user_id: UUID = Depends(get_admin_user_id),
) -> ModerationReportRead:
    report = session.get(ModerationReport, report_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Moderation report not found")

    discussion = (
        session.get(DiscussionItem, report.discussion_item_id)
        if report.discussion_item_id is not None
        else None
    )
    if request.action in {"hide", "restore", "mark_disputed", "link_duplicate"} and discussion is None:
        raise HTTPException(status_code=404, detail="Discussion not found")

    if request.action == "hide":
        discussion.is_hidden = True
        session.add(discussion)
    elif request.action == "restore":
        discussion.is_hidden = False
        session.add(discussion)
    elif request.action == "mark_disputed":
        discussion.status = DiscussionStatus.DISPUTED.value
        session.add(discussion)
    elif request.action == "link_duplicate":
        if request.duplicate_of_discussion_id is None:
            raise HTTPException(status_code=422, detail="duplicate_of_discussion_id is required")
        if session.get(DiscussionItem, request.duplicate_of_discussion_id) is None:
            raise HTTPException(status_code=404, detail="Duplicate target not found")
        report.duplicate_of_discussion_id = request.duplicate_of_discussion_id
    elif request.action == "resolve":
        report.status = ModerationStatus.RESOLVED.value
    elif request.action == "reject":
        report.status = ModerationStatus.REJECTED.value

    report.moderator_note = request.moderator_note
    session.add(report)
    session.commit()
    session.refresh(report)
    return ModerationReportRead.model_validate(report)
