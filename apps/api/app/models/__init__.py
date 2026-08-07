"""Database model classes."""

from app.models.anchor import Anchor, AnchorKind
from app.models.author_claim import AuthorClaimStatus, PaperAuthorClaim, PaperAuthorRole
from app.models.collection import Collection, CollectionItemKind
from app.models.discussion import DiscussionItem, DiscussionKind, DiscussionStatus
from app.models.moderation import ModerationReport, ModerationReportKind, ModerationStatus
from app.models.notification import Notification, NotificationKind
from app.models.paper import Paper
from app.models.reaction import Reaction, ReactionKind
from app.models.user import User

__all__ = [
    "Anchor",
    "AnchorKind",
    "AuthorClaimStatus",
    "Collection",
    "CollectionItemKind",
    "DiscussionItem",
    "DiscussionKind",
    "DiscussionStatus",
    "ModerationReport",
    "ModerationReportKind",
    "ModerationStatus",
    "Notification",
    "NotificationKind",
    "Paper",
    "PaperAuthorClaim",
    "PaperAuthorRole",
    "Reaction",
    "ReactionKind",
    "User",
]
