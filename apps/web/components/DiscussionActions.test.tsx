import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ResponseThread } from "./DiscussionActions";

describe("ResponseThread", () => {
  it("renders deep replies once while capping visible nesting to two levels", () => {
    const html = renderToStaticMarkup(
      <ResponseThread
        discussionId="discussion-1"
        replies={[
          {
            id: "reply-1",
            discussionId: "discussion-1",
            parentReplyId: null,
            kind: "answer",
            body: "A11",
            authorName: "Reader",
            createdAt: "2026-06-20T08:00:00.000Z",
            isAuthorResponse: false
          },
          {
            id: "reply-2",
            discussionId: "discussion-1",
            parentReplyId: "reply-1",
            kind: "answer",
            body: "A@@",
            authorName: "Reader",
            createdAt: "2026-06-20T08:01:00.000Z",
            isAuthorResponse: false
          },
          {
            id: "reply-3",
            discussionId: "discussion-1",
            parentReplyId: "reply-2",
            kind: "answer",
            body: "A3",
            authorName: "Reader",
            createdAt: "2026-06-20T08:02:00.000Z",
            isAuthorResponse: false
          },
          {
            id: "reply-4",
            discussionId: "discussion-1",
            parentReplyId: "reply-3",
            kind: "answer",
            body: "A33",
            authorName: "Reader",
            createdAt: "2026-06-20T08:03:00.000Z",
            isAuthorResponse: false
          }
        ]}
      />
    );

    expect(html.match(/>A3</g)).toHaveLength(1);
    expect(html.match(/>A33</g)).toHaveLength(1);
    expect(html).toContain("Replying to Reader");
  });
});
