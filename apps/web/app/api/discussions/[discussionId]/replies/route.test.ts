import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "./route";

vi.mock("../../../../../lib/prisma", () => ({
  prisma: {
    user: {
      upsert: vi.fn(),
      findUnique: vi.fn()
    },
    discussion: {
      findUnique: vi.fn()
    },
    paperAuthorIdentity: {
      findFirst: vi.fn()
    },
    discussionReply: {
      create: vi.fn()
    }
  }
}));

const { prisma } = await import("../../../../../lib/prisma");

describe("discussion replies API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prisma.user.upsert.mockResolvedValue({ id: "user-reader" });
    prisma.discussion.findUnique.mockResolvedValue({ id: "discussion-1", paperId: "paper-1" });
    prisma.user.findUnique.mockResolvedValue({ id: "user-reader", email: "reader@example.edu", emailVerifiedAt: null });
    prisma.paperAuthorIdentity.findFirst.mockResolvedValue(null);
    prisma.discussionReply.create.mockResolvedValue({
      id: "reply-1",
      discussionId: "discussion-1",
      parentReplyId: null,
      kind: "author_response",
      body: "Author clarification",
      authorUserId: "user-author",
      isAuthorResponse: true,
      createdAt: new Date("2026-06-20T00:00:00Z"),
      updatedAt: new Date("2026-06-20T00:00:00Z"),
      author: { displayName: "Author" },
      votes: []
    });
  });

  it("rejects author responses from users without a verified paper-author email identity", async () => {
    const response = await POST(jsonRequest({
      body: "Author clarification",
      kind: "author_response"
    }), routeContext("discussion-1"));

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: "Verified first-author or corresponding-author email is required for author responses."
    });
    expect(prisma.discussionReply.create).not.toHaveBeenCalled();
  });

  it("rejects author responses when the matching account email is not verified", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: "user-author", email: "Author@Example.edu", emailVerifiedAt: null });

    const response = await POST(jsonRequest(
      {
        body: "Author clarification",
        isAuthorResponse: true
      },
      {
        "x-user-id": "user-author",
        "x-user-email": "Author@Example.edu"
      }
    ), routeContext("discussion-1"));

    expect(response.status).toBe(403);
    expect(prisma.paperAuthorIdentity.findFirst).not.toHaveBeenCalled();
  });

  it("creates author responses for users whose verified email matches a verified paper-author identity", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: "user-author",
      email: "Author@Example.edu",
      emailVerifiedAt: new Date("2026-06-25T00:00:00Z")
    });
    prisma.paperAuthorIdentity.findFirst.mockResolvedValue({ id: "identity-1" });

    const response = await POST(jsonRequest(
      {
        body: "Author clarification",
        isAuthorResponse: true
      },
      {
        "x-user-id": "user-author",
        "x-user-email": "Author@Example.edu"
      }
    ), routeContext("discussion-1"));

    expect(response.status).toBe(201);
    expect(prisma.paperAuthorIdentity.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        paperId: "paper-1",
        normalizedEmail: "author@example.edu",
        status: "verified"
      })
    }));
    expect(prisma.discussionReply.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        kind: "author_response",
        isAuthorResponse: true,
        authorUserId: "user-author"
      })
    }));
  });
});

function jsonRequest(body: unknown, headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/discussions/discussion-1/replies", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...headers
    },
    body: JSON.stringify(body)
  });
}

function routeContext(discussionId: string) {
  return {
    params: Promise.resolve({ discussionId })
  };
}
