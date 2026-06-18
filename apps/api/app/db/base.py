import sys

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


_is_imported_from_model = any(
    module_name.startswith("app.models.") and getattr(module.__spec__, "_initializing", False)
    for module_name, module in sys.modules.items()
    if module is not None and getattr(module, "__spec__", None) is not None
)

if not _is_imported_from_model:
    from app.models.anchor import Anchor  # noqa: E402,F401
    from app.models.author_claim import PaperAuthorClaim  # noqa: E402,F401
    from app.models.collection import Collection  # noqa: E402,F401
    from app.models.discussion import DiscussionItem  # noqa: E402,F401
    from app.models.moderation import ModerationReport  # noqa: E402,F401
    from app.models.notification import Notification  # noqa: E402,F401
    from app.models.paper import Paper  # noqa: E402,F401
    from app.models.reaction import Reaction  # noqa: E402,F401
    from app.models.user import User  # noqa: E402,F401
