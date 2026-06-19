type CollectionTargetType = "paper" | "discussion" | "anchor";

type CollectionInput = {
  userId: string;
  targetType: CollectionTargetType;
  targetId: string;
  note?: string | null;
};

type CollectionPrisma = {
  collectionItem: {
    upsert: (args: any) => Promise<unknown>;
    findMany: (args: any) => Promise<unknown[]>;
  };
};

export async function addCollectionItem(prisma: CollectionPrisma, input: CollectionInput) {
  return prisma.collectionItem.upsert({
    where: {
      userId_targetType_targetId: {
        userId: input.userId,
        targetType: input.targetType,
        targetId: input.targetId
      }
    },
    update: {
      note: input.note ?? null
    },
    create: {
      userId: input.userId,
      targetType: input.targetType,
      targetId: input.targetId,
      note: input.note ?? null
    }
  });
}

export async function listUserCollections(prisma: CollectionPrisma, userId: string) {
  return prisma.collectionItem.findMany({
    where: { userId },
    orderBy: [{ createdAt: "desc" }]
  });
}
