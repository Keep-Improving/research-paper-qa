import { jsonError } from "../../../../lib/api";
import { hashEmailVerificationToken } from "../../../../lib/auth/emailVerification";
import { prisma } from "../../../../lib/prisma";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token.trim() : "";

  if (!token) {
    return jsonError("Verification token is required");
  }

  const tokenHash = hashEmailVerificationToken(token);
  const record = await prisma.emailVerificationToken.findFirst({
    where: {
      tokenHash,
      usedAt: null,
      expiresAt: {
        gt: new Date()
      }
    },
    select: {
      id: true,
      userId: true
    }
  });

  if (!record) {
    return jsonError("Verification link is invalid or expired", 400);
  }

  const verifiedAt = new Date();
  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { emailVerifiedAt: verifiedAt }
    }),
    prisma.emailVerificationToken.update({
      where: { id: record.id },
      data: { usedAt: verifiedAt }
    })
  ]);

  return Response.json({ ok: true, emailVerified: true });
}
