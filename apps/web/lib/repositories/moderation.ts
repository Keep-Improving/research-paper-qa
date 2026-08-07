type ModerationTargetType = "discussion" | "reply" | "anchor" | "paper";

type CreateReportInput = {
  userId: string;
  targetType: ModerationTargetType;
  targetId: string;
  reason: string;
};

type ModerationPrisma = {
  moderationReport: {
    create: (args: any) => Promise<unknown>;
    findMany: (args: any) => Promise<unknown[]>;
  };
};

export async function createModerationReport(prisma: ModerationPrisma, input: CreateReportInput) {
  return prisma.moderationReport.create({
    data: {
      reporterUserId: input.userId,
      targetType: input.targetType,
      targetId: input.targetId,
      reason: input.reason
    }
  });
}

export async function listOpenReports(prisma: ModerationPrisma) {
  return prisma.moderationReport.findMany({
    where: { status: "open" },
    orderBy: [{ createdAt: "desc" }]
  });
}
