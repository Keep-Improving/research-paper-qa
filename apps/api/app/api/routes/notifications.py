from uuid import UUID

from fastapi import APIRouter, Depends, Header
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.notification import Notification
from app.schemas.notification import NotificationCreate, NotificationRead

router = APIRouter(tags=["notifications"])


def get_current_user_id(x_user_id: UUID = Header(..., alias="X-User-Id")) -> UUID:
    return x_user_id


@router.post("/notifications", response_model=NotificationRead)
def create_notification(
    request: NotificationCreate,
    session: Session = Depends(get_db),
    _user_id: UUID = Depends(get_current_user_id),
) -> NotificationRead:
    notification = Notification(**request.model_dump())
    session.add(notification)
    session.commit()
    session.refresh(notification)
    return NotificationRead.model_validate(notification)


@router.get("/notifications/me", response_model=list[NotificationRead])
def list_my_notifications(
    session: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
) -> list[NotificationRead]:
    statement = (
        select(Notification)
        .where(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc(), Notification.id.desc())
    )
    return [
        NotificationRead.model_validate(notification)
        for notification in session.scalars(statement).all()
    ]
