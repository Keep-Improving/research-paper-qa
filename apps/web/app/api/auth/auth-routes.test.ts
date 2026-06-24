import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../lib/prisma", () => ({
  prisma: {
    user: {
      create: vi.fn(),
      findUnique: vi.fn()
    },
    passwordCredential: {
      create: vi.fn(),
      findFirst: vi.fn()
    },
    userSession: {
      create: vi.fn(),
      findFirst: vi.fn(),
      deleteMany: vi.fn()
    },
    $transaction: vi.fn(async (callback) => callback(prisma))
  }
}));

const { prisma } = await import("../../../lib/prisma");
const registerRoute = await import("./register/route");
const loginRoute = await import("./login/route");
const logoutRoute = await import("./logout/route");
const meRoute = await import("./me/route");

describe("auth API routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prisma.user.create.mockResolvedValue({
      id: "user-1",
      displayName: "Ada Lovelace",
      email: "ada@example.edu",
      role: "user"
    });
    prisma.passwordCredential.create.mockResolvedValue({ id: "credential-1" });
    prisma.userSession.create.mockResolvedValue({
      id: "session-1",
      userId: "user-1"
    });
    prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      displayName: "Ada Lovelace",
      email: "ada@example.edu",
      role: "user"
    });
  });

  it("registers a user and sets a session cookie", async () => {
    const response = await registerRoute.POST(jsonRequest({
      displayName: "Ada Lovelace",
      email: "ada@example.edu",
      password: "long-enough-password"
    }));

    expect(response.status).toBe(201);
    expect(response.headers.get("set-cookie")).toContain("paperqa_session=");
    expect(await response.json()).toMatchObject({
      id: "user-1",
      email: "ada@example.edu"
    });
    expect(prisma.user.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        displayName: "Ada Lovelace",
        email: "ada@example.edu"
      })
    }));
  });

  it("rejects duplicate registration emails", async () => {
    prisma.user.create.mockRejectedValue({ code: "P2002" });
    prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      displayName: "Ada Lovelace",
      email: "ada@example.edu",
      role: "user",
      passwordCredential: { id: "credential-1" }
    });

    const response = await registerRoute.POST(jsonRequest({
      displayName: "Ada Lovelace",
      email: "ada@example.edu",
      password: "long-enough-password"
    }));

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "Email is already registered" });
  });

  it("adds credentials to an existing user that has no password login yet", async () => {
    prisma.user.create.mockRejectedValue({ code: "P2002" });
    prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      displayName: "Ada Lovelace",
      email: "ada@example.edu",
      role: "user",
      passwordCredential: null
    });

    const response = await registerRoute.POST(jsonRequest({
      displayName: "Ada Lovelace",
      email: "ada@example.edu",
      password: "long-enough-password"
    }));

    expect(response.status).toBe(201);
    expect(prisma.passwordCredential.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        userId: "user-1"
      })
    }));
    expect(response.headers.get("set-cookie")).toContain("paperqa_session=");
  });

  it("logs in with valid credentials", async () => {
    const { hashPassword } = await import("../../../lib/auth/passwords");
    prisma.passwordCredential.findFirst.mockResolvedValue({
      userId: "user-1",
      passwordHash: await hashPassword("long-enough-password"),
      user: {
        id: "user-1",
        displayName: "Ada Lovelace",
        email: "ada@example.edu",
        role: "user"
      }
    });

    const response = await loginRoute.POST(jsonRequest({
      email: "ada@example.edu",
      password: "long-enough-password"
    }));

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("paperqa_session=");
    expect(await response.json()).toMatchObject({
      id: "user-1",
      email: "ada@example.edu"
    });
  });

  it("rejects invalid login credentials", async () => {
    prisma.passwordCredential.findFirst.mockResolvedValue(null);

    const response = await loginRoute.POST(jsonRequest({
      email: "ada@example.edu",
      password: "wrong-password"
    }));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Invalid email or password" });
  });

  it("returns current user from session", async () => {
    prisma.userSession.findFirst.mockResolvedValue({ userId: "user-1" });

    const response = await meRoute.GET(new Request("http://localhost/api/auth/me", {
      headers: {
        cookie: "paperqa_session=session-token"
      }
    }));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      id: "user-1",
      email: "ada@example.edu"
    });
  });

  it("logs out and clears the session cookie", async () => {
    prisma.userSession.deleteMany.mockResolvedValue({ count: 1 });

    const response = await logoutRoute.POST(new Request("http://localhost/api/auth/logout", {
      method: "POST",
      headers: {
        cookie: "paperqa_session=session-token"
      }
    }));

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("paperqa_session=");
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });
});

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/auth", {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(body)
  });
}
