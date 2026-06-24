import { hashSessionToken, sessionCookieName } from "./sessions";

type CurrentUserPrisma = {
  userSession: {
    findFirst: (args: any) => Promise<{ userId: string } | null>;
  };
};

type RequestUserPrisma = CurrentUserPrisma & {
  user: {
    upsert: (args: any) => Promise<{ id: string }>;
  };
};

export class AuthenticationRequiredError extends Error {
  constructor() {
    super("Authentication required");
    this.name = "AuthenticationRequiredError";
  }
}

export async function getCurrentUserId(prisma: CurrentUserPrisma, request: Request) {
  const token = getCookie(request, sessionCookieName);
  if (!token) {
    return null;
  }

  const session = await prisma.userSession.findFirst({
    where: {
      tokenHash: hashSessionToken(token),
      expiresAt: {
        gt: new Date()
      }
    },
    select: {
      userId: true
    }
  });

  return session?.userId ?? null;
}

export async function resolveRequestUser(prisma: RequestUserPrisma, request: Request) {
  const sessionUserId = await getCurrentUserId(prisma, request);
  if (sessionUserId) {
    return sessionUserId;
  }

  if (process.env.NODE_ENV === "production") {
    throw new AuthenticationRequiredError();
  }

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

function getCookie(request: Request, name: string) {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) {
    return null;
  }

  for (const part of cookieHeader.split(";")) {
    const [rawName, ...rawValue] = part.trim().split("=");
    if (rawName === name) {
      return decodeURIComponent(rawValue.join("="));
    }
  }

  return null;
}
