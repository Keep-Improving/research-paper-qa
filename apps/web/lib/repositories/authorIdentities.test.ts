import { describe, expect, it, vi } from "vitest";

import {
  buildAuthorIdentityCandidatesFromText,
  canCreateAuthorResponse,
  normalizeEmail,
  upsertPaperAuthorIdentity
} from "./authorIdentities";

describe("author identity repository", () => {
  it("normalizes emails for exact identity matching", () => {
    expect(normalizeEmail("  AUTHOR@Example.EDU ")).toBe("author@example.edu");
  });

  it("upserts a verified corresponding-author identity with a normalized email", async () => {
    const prisma = {
      paperAuthorIdentity: {
        upsert: vi.fn().mockResolvedValue({
          id: "identity-1",
          paperId: "paper-1",
          role: "corresponding_author",
          email: "Author@Example.edu",
          normalizedEmail: "author@example.edu",
          status: "verified"
        })
      }
    };

    await upsertPaperAuthorIdentity(prisma, {
      paperId: "paper-1",
      role: "corresponding_author",
      email: "Author@Example.edu",
      source: "manual_seed"
    });

    expect(prisma.paperAuthorIdentity.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        paperId_normalizedEmail_role: {
          paperId: "paper-1",
          normalizedEmail: "author@example.edu",
          role: "corresponding_author"
        }
      },
      create: expect.objectContaining({
        paperId: "paper-1",
        role: "corresponding_author",
        email: "Author@Example.edu",
        normalizedEmail: "author@example.edu",
        status: "verified"
      })
    }));
  });

  it("allows author responses when the verified user email matches a verified corresponding-author identity", async () => {
    const prisma = {
      discussion: {
        findUnique: vi.fn().mockResolvedValue({ id: "discussion-1", paperId: "paper-1" })
      },
      user: {
        findUnique: vi.fn().mockResolvedValue({
          id: "user-author",
          email: "AUTHOR@example.edu",
          emailVerifiedAt: new Date("2026-06-25T00:00:00Z")
        })
      },
      paperAuthorIdentity: {
        findFirst: vi.fn().mockResolvedValue({ id: "identity-1" })
      }
    };

    await expect(canCreateAuthorResponse(prisma, {
      discussionId: "discussion-1",
      userId: "user-author"
    })).resolves.toBe(true);

    expect(prisma.paperAuthorIdentity.findFirst).toHaveBeenCalledWith({
      where: {
        paperId: "paper-1",
        normalizedEmail: "author@example.edu",
        status: "verified",
        role: {
          in: ["corresponding_author", "first_author"]
        }
      }
    });
  });

  it("denies author responses when there is no verified first-author email identity", async () => {
    const prisma = {
      discussion: {
        findUnique: vi.fn().mockResolvedValue({ id: "discussion-1", paperId: "paper-1" })
      },
      user: {
        findUnique: vi.fn().mockResolvedValue({
          id: "user-first",
          email: "first@example.edu",
          emailVerifiedAt: new Date("2026-06-25T00:00:00Z")
        })
      },
      paperAuthorIdentity: {
        findFirst: vi.fn().mockResolvedValue(null)
      }
    };

    await expect(canCreateAuthorResponse(prisma, {
      discussionId: "discussion-1",
      userId: "user-first"
    })).resolves.toBe(false);
  });

  it("denies author responses when the account email has not been verified", async () => {
    const prisma = {
      discussion: {
        findUnique: vi.fn().mockResolvedValue({ id: "discussion-1", paperId: "paper-1" })
      },
      user: {
        findUnique: vi.fn().mockResolvedValue({
          id: "user-author",
          email: "author@example.edu",
          emailVerifiedAt: null
        })
      },
      paperAuthorIdentity: {
        findFirst: vi.fn().mockResolvedValue({ id: "identity-1" })
      }
    };

    await expect(canCreateAuthorResponse(prisma, {
      discussionId: "discussion-1",
      userId: "user-author"
    })).resolves.toBe(false);
    expect(prisma.paperAuthorIdentity.findFirst).not.toHaveBeenCalled();
  });

  it("extracts corresponding author candidates but does not infer first-author identity from name alone", () => {
    const candidates = buildAuthorIdentityCandidatesFromText({
      paperId: "paper-1",
      firstAuthorName: "Ada Lovelace",
      text: "Ada Lovelace and B. Turing. Correspondence: author@example.edu"
    });

    expect(candidates).toEqual([
      expect.objectContaining({
        paperId: "paper-1",
        role: "corresponding_author",
        email: "author@example.edu"
      })
    ]);
    expect(candidates.some((candidate) => candidate.role === "first_author")).toBe(false);
  });
});
