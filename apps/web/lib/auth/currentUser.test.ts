import { afterEach, describe, expect, it, vi } from "vitest";

import { getCurrentUserId, resolveRequestUser } from "./currentUser";
import { hashSessionToken, sessionCookieName } from "./sessions";

const originalNodeEnv = process.env.NODE_ENV;

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("current user resolution", () => {
  it("resolves a user from a valid session cookie", async () => {
    const token = "session-token";
    const prisma = {
      userSession: {
        findFirst: vi.fn().mockResolvedValue({
          userId: "user-1",
          expiresAt: new Date(Date.now() + 10000)
        })
      }
    };

    await expect(getCurrentUserId(prisma, requestWithCookie(token))).resolves.toBe("user-1");
    expect(prisma.userSession.findFirst).toHaveBeenCalledWith({
      where: {
        tokenHash: hashSessionToken(token),
        expiresAt: {
          gt: expect.any(Date)
        }
      },
      select: {
        userId: true
      }
    });
  });

  it("returns null when no session is present", async () => {
    const prisma = {
      userSession: {
        findFirst: vi.fn()
      }
    };

    await expect(getCurrentUserId(prisma, new Request("http://localhost"))).resolves.toBeNull();
    expect(prisma.userSession.findFirst).not.toHaveBeenCalled();
  });

  it("keeps development header fallback outside production", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const prisma = {
      user: {
        upsert: vi.fn().mockResolvedValue({ id: "dev-user" })
      },
      userSession: {
        findFirst: vi.fn().mockResolvedValue(null)
      }
    };

    await expect(resolveRequestUser(prisma, new Request("http://localhost", {
      headers: {
        "x-user-id": "dev-user",
        "x-user-email": "dev@example.edu"
      }
    }))).resolves.toBe("dev-user");

    expect(prisma.user.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "dev-user" },
      update: { email: "dev@example.edu" }
    }));
  });

  it("does not allow header fallback in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const prisma = {
      user: {
        upsert: vi.fn()
      },
      userSession: {
        findFirst: vi.fn().mockResolvedValue(null)
      }
    };

    await expect(resolveRequestUser(prisma, new Request("https://example.test", {
      headers: {
        "x-user-id": "dev-user",
        "x-user-email": "dev@example.edu"
      }
    }))).rejects.toThrow("Authentication required");
    expect(prisma.user.upsert).not.toHaveBeenCalled();
  });
});

function requestWithCookie(token: string) {
  return new Request("http://localhost", {
    headers: {
      cookie: `${sessionCookieName}=${token}`
    }
  });
}
