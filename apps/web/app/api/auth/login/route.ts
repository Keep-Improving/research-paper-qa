import { jsonError } from "../../../../lib/api";
import { verifyPassword } from "../../../../lib/auth/passwords";
import { createSessionResponse, normalizeEmail } from "../../../../lib/auth/routeHelpers";
import { prisma } from "../../../../lib/prisma";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? normalizeEmail(body.email) : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    return jsonError("Email and password are required");
  }

  const credential = await prisma.passwordCredential.findFirst({
    where: {
      user: {
        email
      }
    },
    include: {
      user: true
    }
  });

  if (!credential || !(await verifyPassword(password, credential.passwordHash))) {
    return jsonError("Invalid email or password", 401);
  }

  return createSessionResponse(prisma, credential.user);
}
