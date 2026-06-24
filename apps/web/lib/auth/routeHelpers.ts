import { NextResponse } from "next/server";

import { createSessionToken, getSessionCookieOptions, getSessionExpiry, hashSessionToken, sessionCookieName } from "./sessions";

type SessionPrisma = {
  userSession: {
    create: (args: any) => Promise<unknown>;
  };
};

export type PublicUser = {
  id: string;
  displayName: string;
  email: string;
  role: string;
};

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function publicUser(user: PublicUser) {
  return {
    id: user.id,
    displayName: user.displayName,
    email: user.email,
    role: user.role
  };
}

export async function createSessionResponse(prisma: SessionPrisma, user: PublicUser, status = 200) {
  const token = createSessionToken();
  const expiresAt = getSessionExpiry();

  await prisma.userSession.create({
    data: {
      userId: user.id,
      tokenHash: hashSessionToken(token),
      expiresAt
    }
  });

  const response = NextResponse.json(publicUser(user), { status });
  response.cookies.set(sessionCookieName, token, getSessionCookieOptions(expiresAt));
  return response;
}
