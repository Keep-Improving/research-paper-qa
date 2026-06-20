import { describe, expect, it, vi } from "vitest";

import { createDiscussionReply, createQuestion, createVote, getDiscussionDetail, listPaperDiscussions, listSearchDiscussions } from "./discussions";

describe("discussion repository", () => {
  it("creates an anchor-backed question in one transaction", async () => {
    const discussion = {
      id: "discussion-1",
      paperId: "paper-1",
      anchorId: "anchor-1",
      title: "How was this measured?",
      body: "How was this measured?",
      status: "open",
      authorUserId: "user-1",
      isHidden: false,
      createdAt: new Date("2026-06-20T00:00:00Z"),
      updatedAt: new Date("2026-06-20T00:00:00Z"),
      anchor: {
        id: "anchor-1",
        kind: "text",
        quoteText: "measured signal"
      },
      author: {
        displayName: "Reader"
      },
      replies: [],
      votes: []
    };
    const tx = {
      anchor: {
        create: vi.fn().mockResolvedValue({ id: "anchor-1" })
      },
      discussion: {
        create: vi.fn().mockResolvedValue(discussion)
      }
    };
    const prisma = {
      $transaction: vi.fn(async (callback: (tx: typeof tx) => Promise<unknown>) => callback(tx))
    };

    await expect(
      createQuestion(prisma, {
        paperId: "paper-1",
        userId: "user-1",
        body: "How was this measured?",
        anchor: {
          kind: "text",
          quoteText: "measured signal",
          contextText: "The measured signal increased."
        }
      })
    ).resolves.toMatchObject({
      id: "discussion-1",
      body: "How was this measured?",
      anchor: {
        quoteText: "measured signal"
      }
    });

    expect(tx.anchor.create).toHaveBeenCalledWith({
      data: {
        paperId: "paper-1",
        kind: "text",
        quoteText: "measured signal",
        contextText: "The measured signal increased.",
        sourceUrl: undefined,
        imageUrl: undefined,
        note: undefined
      }
    });
    expect(tx.discussion.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        paperId: "paper-1",
        authorUserId: "user-1",
        anchorId: "anchor-1",
        title: "How was this measured?",
        body: "How was this measured?"
      })
    }));
  });

  it("lists visible paper discussions with reply and vote counts", async () => {
    const prisma = {
      discussion: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "discussion-1",
            paperId: "paper-1",
            anchorId: null,
            title: "Question title",
            body: "Question body",
            status: "open",
            authorUserId: "user-1",
            isHidden: false,
            createdAt: new Date("2026-06-20T00:00:00Z"),
            updatedAt: new Date("2026-06-20T00:00:00Z"),
            anchor: null,
            author: { displayName: "Reader" },
            replies: [{ kind: "answer" }, { kind: "comment" }],
            votes: [{ value: "up" }, { value: "helpful" }]
          }
        ])
      }
    };

    await expect(listPaperDiscussions(prisma, "paper-1")).resolves.toEqual([
      expect.objectContaining({
        id: "discussion-1",
        answerCount: 1,
        commentCount: 1,
        heat: 4
      })
    ]);

    expect(prisma.discussion.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        paperId: "paper-1",
        isHidden: false
      }
    }));
  });

  it("searches visible discussions across title, body, paper, anchors, and replies", async () => {
    const prisma = {
      discussion: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "discussion-1",
            paperId: "paper-1",
            anchorId: null,
            title: "Question title",
            body: "Question body",
            status: "open",
            authorUserId: "user-1",
            isHidden: false,
            createdAt: new Date("2026-06-20T00:00:00Z"),
            updatedAt: new Date("2026-06-20T00:00:00Z"),
            anchor: null,
            author: { displayName: "Reader" },
            replies: [{ kind: "answer" }],
            votes: []
          }
        ])
      }
    };

    await expect(listSearchDiscussions(prisma, "mitochondria")).resolves.toEqual([
      expect.objectContaining({
        id: "discussion-1",
        answerCount: 1
      })
    ]);

    expect(prisma.discussion.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        isHidden: false,
        OR: expect.arrayContaining([
          { title: { contains: "mitochondria", mode: "insensitive" } },
          { body: { contains: "mitochondria", mode: "insensitive" } }
        ])
      }),
      take: 50
    }));
  });

  it("loads discussion detail with visible replies", async () => {
    const prisma = {
      discussion: {
        findFirst: vi.fn().mockResolvedValue({
          id: "discussion-1",
          paperId: "paper-1",
          anchorId: "anchor-1",
          title: "Question title",
          body: "Question body",
          status: "open",
          authorUserId: "user-1",
          isHidden: false,
          createdAt: new Date("2026-06-20T00:00:00Z"),
          updatedAt: new Date("2026-06-20T00:00:00Z"),
          anchor: { id: "anchor-1", quoteText: "quoted text" },
          author: { displayName: "Reader" },
          replies: [
            {
              id: "reply-1",
              kind: "answer",
              body: "An answer",
              authorUserId: "user-2",
              isAuthorResponse: false,
              createdAt: new Date("2026-06-20T01:00:00Z"),
              updatedAt: new Date("2026-06-20T01:00:00Z"),
              author: { displayName: "Responder" },
              votes: [{ value: "helpful" }]
            }
          ],
          votes: [{ value: "up" }]
        })
      }
    };

    await expect(getDiscussionDetail(prisma, "discussion-1")).resolves.toMatchObject({
      id: "discussion-1",
      replies: [
        {
          id: "reply-1",
          body: "An answer",
          helpfulCount: 1
        }
      ]
    });

    expect(prisma.discussion.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        id: "discussion-1",
        isHidden: false
      }
    }));
  });

  it("creates a visible answer reply", async () => {
    const prisma = {
      discussionReply: {
        create: vi.fn().mockResolvedValue({
          id: "reply-1",
          discussionId: "discussion-1",
          parentReplyId: null,
          kind: "answer",
          body: "This is the answer.",
          authorUserId: "user-2",
          isAuthorResponse: false,
          isHidden: false,
          createdAt: new Date("2026-06-20T01:00:00Z"),
          updatedAt: new Date("2026-06-20T01:00:00Z"),
          author: { displayName: "Responder" },
          votes: []
        })
      }
    };

    await expect(createDiscussionReply(prisma, {
      discussionId: "discussion-1",
      userId: "user-2",
      kind: "answer",
      body: "This is the answer."
    })).resolves.toMatchObject({
      id: "reply-1",
      kind: "answer",
      body: "This is the answer.",
      isAuthorResponse: false
    });

    expect(prisma.discussionReply.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        discussionId: "discussion-1",
        authorUserId: "user-2",
        kind: "answer",
        body: "This is the answer.",
        isAuthorResponse: false
      })
    }));
  });

  it("upserts one vote for a user and discussion", async () => {
    const prisma = {
      vote: {
        upsert: vi.fn().mockResolvedValue({
          id: "vote-1",
          discussionId: "discussion-1",
          replyId: null,
          userId: "user-1",
          value: "helpful",
          createdAt: new Date("2026-06-20T00:00:00Z")
        })
      }
    };

    await expect(createVote(prisma, {
      userId: "user-1",
      discussionId: "discussion-1",
      value: "helpful"
    })).resolves.toMatchObject({
      id: "vote-1",
      value: "helpful"
    });

    expect(prisma.vote.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        discussionId_userId_value: {
          discussionId: "discussion-1",
          userId: "user-1",
          value: "helpful"
        }
      }
    }));
  });
});
