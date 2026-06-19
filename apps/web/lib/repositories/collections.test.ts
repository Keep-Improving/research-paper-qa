import { describe, expect, it, vi } from "vitest";

import { addCollectionItem, listUserCollections } from "./collections";

describe("collection repository", () => {
  it("upserts a collection item for the current user", async () => {
    const prisma = {
      collectionItem: {
        upsert: vi.fn().mockResolvedValue({
          id: "collection-1",
          userId: "user-1",
          targetType: "paper",
          targetId: "paper-1",
          note: "Read later",
          createdAt: new Date("2026-06-20T00:00:00Z")
        })
      }
    };

    await expect(addCollectionItem(prisma, {
      userId: "user-1",
      targetType: "paper",
      targetId: "paper-1",
      note: "Read later"
    })).resolves.toMatchObject({
      id: "collection-1",
      targetType: "paper",
      targetId: "paper-1"
    });

    expect(prisma.collectionItem.upsert).toHaveBeenCalledWith({
      where: {
        userId_targetType_targetId: {
          userId: "user-1",
          targetType: "paper",
          targetId: "paper-1"
        }
      },
      update: {
        note: "Read later"
      },
      create: {
        userId: "user-1",
        targetType: "paper",
        targetId: "paper-1",
        note: "Read later"
      }
    });
  });

  it("lists a user's collection items newest first", async () => {
    const prisma = {
      collectionItem: {
        findMany: vi.fn().mockResolvedValue([])
      }
    };

    await expect(listUserCollections(prisma, "user-1")).resolves.toEqual([]);

    expect(prisma.collectionItem.findMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      orderBy: [{ createdAt: "desc" }]
    });
  });
});
