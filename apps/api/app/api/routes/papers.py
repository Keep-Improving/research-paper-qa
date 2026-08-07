from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.paper import PaperIdentifyRequest, PaperRead
from app.services.paper_matching import identify_or_create_paper

router = APIRouter(prefix="/papers", tags=["papers"])


@router.post("/identify", response_model=PaperRead)
def identify_paper(
    request: PaperIdentifyRequest,
    session: Session = Depends(get_db),
) -> PaperRead:
    return identify_or_create_paper(session, request)
