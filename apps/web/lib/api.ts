import { NextResponse } from "next/server";

type UserPrisma = {
  user: {
    upsert: (args: any) => Promise<{ id: string }>;
  };
};

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function resolveRequestUser(prisma: UserPrisma, request: Request) {
  const userId = request.headers.get("x-user-id")?.trim() || "user-reader";
  const userEmail = request.headers.get("x-user-email")?.trim();

  await prisma.user.upsert({
    where: { id: userId },
    update: userEmail ? { email: userEmail } : {},
    create: {
      id: userId,
      displayName: userId === "user-reader" ? "Reader" : userId,
      email: userEmail || `${userId}@local.paperqa`
    }
  });

  return userId;
}
