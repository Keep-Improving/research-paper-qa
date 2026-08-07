import { describe, expect, it, vi } from "vitest";

import { createModerationReport, listOpenReports } from "./moderation";

describe("moderation repository", () => {
  it("creates a report for a target", async () => {
    const prisma = {
      moderationReport: {
        create: vi.fn().mockResolvedValue({
          id: "report-1",
          targetType: "discussion",
          targetId: "discussion-1",
          reporterUserId: "user-1",
          reason: "Needs review",
          status: "open",
          action: "none",
          createdAt: new Date("2026-06-20T00:00:00Z"),
          updatedAt: new Date("2026-06-20T00:00:00Z")
        })
      }
    };

    await expect(createModerationReport(prisma, {
      userId: "user-1",
      targetType: "discussion",
      targetId: "discussion-1",
      reason: "Needs review"
    })).resolves.toMatchObject({
      id: "report-1",
      status: "open"
    });

    expect(prisma.moderationReport.create).toHaveBeenCalledWith({
      data: {
        reporterUserId: "user-1",
        targetType: "discussion",
        targetId: "discussion-1",
        reason: "Needs review"
      }
    });
  });

  it("lists open reports newest first", async () => {
    const prisma = {
      moderationReport: {
        findMany: vi.fn().mockResolvedValue([])
      }
    };

    await expect(listOpenReports(prisma)).resolves.toEqual([]);

    expect(prisma.moderationReport.findMany).toHaveBeenCalledWith({
      where: { status: "open" },
      orderBy: [{ createdAt: "desc" }]
    });
  });
});
