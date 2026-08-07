from datetime import UTC, datetime

from app.models.author_claim import PaperAuthorRole
from app.models.discussion import DiscussionKind, DiscussionStatus


def test_author_response_roles_are_limited_to_first_and_corresponding():
    assert PaperAuthorRole.FIRST_AUTHOR.can_author_respond is True
    assert PaperAuthorRole.CORRESPONDING_AUTHOR.can_author_respond is True
    assert PaperAuthorRole.CO_AUTHOR.can_author_respond is False


def test_discussion_status_has_disputed_marker():
    assert DiscussionStatus.DISPUTED.value == "disputed"
    assert DiscussionKind.AUTHOR_RESPONSE.value == "author_response"


def test_core_models_register_all_tables_after_single_model_import():
    import app.models.author_claim  # noqa: F401
    import app.models  # noqa: F401
    from app.db.base import Base

    assert set(Base.metadata.tables) == {
        "users",
        "papers",
        "paper_author_claims",
        "anchors",
        "discussion_items",
        "reactions",
        "collections",
        "moderation_reports",
        "notifications",
    }


def test_remaining_models_expose_required_status_and_user_fields():
    from app.models.collection import Collection
    from app.models.moderation import ModerationReport
    from app.models.reaction import Reaction

    assert "status" in Reaction.__table__.columns
    assert Reaction.__table__.columns["status"].default.arg == "active"
    assert Reaction.__table__.columns["status"].index is True

    assert "status" in Collection.__table__.columns
    assert Collection.__table__.columns["status"].default.arg == "active"
    assert Collection.__table__.columns["status"].index is True

    assert "user_id" in ModerationReport.__table__.columns
    assert "reporter_user_id" not in ModerationReport.__table__.columns


def test_timestamp_columns_are_timezone_aware_and_use_utc_defaults():
    import app.models  # noqa: F401
    from app.db.base import Base

    for table in Base.metadata.tables.values():
        for column_name in ("created_at", "updated_at"):
            if column_name not in table.columns:
                continue

            column = table.columns[column_name]

            assert column.type.timezone is True

            timestamp = column.default.arg(None)
            assert isinstance(timestamp, datetime)
            assert timestamp.tzinfo is UTC
