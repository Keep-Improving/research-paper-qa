from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.collection import Collection
from app.schemas.collection import CollectionCreate, CollectionRead

router = APIRouter(tags=["collections"])


def get_current_user_id(x_user_id: UUID = Header(..., alias="X-User-Id")) -> UUID:
    return x_user_id


@router.post("/collections", response_model=CollectionRead)
def save_collection_item(
    request: CollectionCreate,
    session: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
) -> CollectionRead:
    item = Collection(user_id=user_id, **request.model_dump())
    session.add(item)
    session.commit()
    session.refresh(item)
    return CollectionRead.model_validate(item)


@router.get("/collections/me", response_model=list[CollectionRead])
def list_my_collection_items(
    session: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
) -> list[CollectionRead]:
    statement = (
        select(Collection)
        .where(Collection.user_id == user_id)
        .order_by(Collection.created_at.asc(), Collection.id.asc())
    )
    return [CollectionRead.model_validate(item) for item in session.scalars(statement).all()]


@router.post("/collections/{collection_id}/archive", response_model=CollectionRead)
def archive_collection_item(
    collection_id: UUID,
    session: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
) -> CollectionRead:
    item = session.get(Collection, collection_id)
    if item is None or item.user_id != user_id:
        raise HTTPException(status_code=404, detail="Collection item not found")

    item.status = "archived"
    session.add(item)
    session.commit()
    session.refresh(item)
    return CollectionRead.model_validate(item)
