import { jsonError } from "../../../../lib/api";
import { hashPassword } from "../../../../lib/auth/passwords";
import { createSessionResponse, normalizeEmail } from "../../../../lib/auth/routeHelpers";
import { prisma } from "../../../../lib/prisma";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const displayName = typeof body?.displayName === "string" ? body.displayName.trim() : "";
  const email = typeof body?.email === "string" ? normalizeEmail(body.email) : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!displayName || !email || !email.includes("@") || password.length < 8) {
    return jsonError("Display name, valid email, and password with at least 8 characters are required");
  }

  try {
    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          displayName,
          email
        }
      });

      await tx.passwordCredential.create({
        data: {
          userId: createdUser.id,
          passwordHash: await hashPassword(password)
        }
      });

      return createdUser;
    });

    return createSessionResponse(prisma, user, 201);
  } catch (error: any) {
    if (error?.code === "P2002") {
      return jsonError("Email is already registered", 409);
    }

    throw error;
  }
}
