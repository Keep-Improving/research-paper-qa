from fastapi import FastAPI

from app.api.routes.author_claims import router as author_claims_router
from app.api.routes.collections import router as collections_router
from app.api.routes.discussions import router as discussions_router
from app.api.routes.health import router as health_router
from app.api.routes.moderation import router as moderation_router
from app.api.routes.notifications import router as notifications_router
from app.api.routes.papers import router as papers_router
from app.core.config import settings

app = FastAPI(title=settings.app_name)
app.include_router(health_router)
app.include_router(papers_router)
app.include_router(discussions_router)
app.include_router(author_claims_router)
app.include_router(collections_router)
app.include_router(moderation_router)
app.include_router(notifications_router)
