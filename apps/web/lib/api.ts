import { NextResponse } from "next/server";

import { resolveRequestUser as resolveAuthenticatedRequestUser } from "./auth/currentUser";

type UserPrisma = {
  userSession: {
    findFirst: (args: any) => Promise<{ userId: string } | null>;
  };
  user: {
    upsert: (args: any) => Promise<{ id: string }>;
  };
};

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function resolveRequestUser(prisma: UserPrisma, request: Request) {
  return resolveAuthenticatedRequestUser(prisma, request);
}
