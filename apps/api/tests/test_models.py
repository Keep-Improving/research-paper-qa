from app.models.author_claim import PaperAuthorRole
from app.models.discussion import DiscussionKind, DiscussionStatus


def test_author_response_roles_are_limited_to_first_and_corresponding():
    assert PaperAuthorRole.FIRST_AUTHOR.can_author_respond is True
    assert PaperAuthorRole.CORRESPONDING_AUTHOR.can_author_respond is True
    assert PaperAuthorRole.CO_AUTHOR.can_author_respond is False


def test_discussion_status_has_disputed_marker():
    assert DiscussionStatus.DISPUTED.value == "disputed"
    assert DiscussionKind.AUTHOR_RESPONSE.value == "author_response"
