import { describe, expect, it, vi } from "vitest";

import { matchPaper } from "./papers";

describe("matchPaper", () => {
  it("reuses an existing paper by normalized DOI before creating", async () => {
    const existingPaper = {
      id: "paper-1",
      title: "Existing paper",
      doi: "10.1000/example",
      arxivId: null,
      pmid: null,
      url: "https://example.test/paper",
      authors: [],
      venue: null,
      year: null,
      abstract: null,
      createdAt: new Date("2026-06-20T00:00:00Z"),
      updatedAt: new Date("2026-06-20T00:00:00Z")
    };
    const prisma = {
      paper: {
        findFirst: vi.fn().mockResolvedValue(existingPaper),
        create: vi.fn()
      }
    };

    await expect(
      matchPaper(prisma, {
        doi: "https://doi.org/10.1000/EXAMPLE",
        title: "Incoming paper",
        url: "https://example.test/new"
      })
    ).resolves.toEqual(existingPaper);

    expect(prisma.paper.findFirst).toHaveBeenCalledWith({
      where: {
        OR: [
          { doi: "10.1000/example" },
          { url: "https://example.test/new" }
        ]
      }
    });
    expect(prisma.paper.create).not.toHaveBeenCalled();
  });

  it("creates a paper when no identifier matches", async () => {
    const createdPaper = {
      id: "paper-new",
      title: "New paper",
      doi: null,
      arxivId: "2401.00001",
      pmid: null,
      url: "https://arxiv.org/abs/2401.00001",
      authors: [],
      venue: null,
      year: null,
      abstract: null,
      createdAt: new Date("2026-06-20T00:00:00Z"),
      updatedAt: new Date("2026-06-20T00:00:00Z")
    };
    const prisma = {
      paper: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue(createdPaper)
      }
    };

    await expect(
      matchPaper(prisma, {
        title: "New paper",
        arxivId: "2401.00001",
        url: "https://arxiv.org/abs/2401.00001"
      })
    ).resolves.toEqual(createdPaper);

    expect(prisma.paper.create).toHaveBeenCalledWith({
      data: {
        title: "New paper",
        doi: undefined,
        arxivId: "2401.00001",
        pmid: undefined,
        url: "https://arxiv.org/abs/2401.00001",
        authors: []
      }
    });
  });
});
