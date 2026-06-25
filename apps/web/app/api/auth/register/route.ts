import { jsonError } from "../../../../lib/api";
import {
  buildVerificationUrl,
  createEmailVerificationToken,
  getEmailVerificationExpiry,
  hashEmailVerificationToken
} from "../../../../lib/auth/emailVerification";
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
    const verificationToken = createEmailVerificationToken();
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

      await tx.emailVerificationToken.create({
        data: {
          userId: createdUser.id,
          tokenHash: hashEmailVerificationToken(verificationToken),
          expiresAt: getEmailVerificationExpiry()
        }
      });

      return createdUser;
    });

    return createSessionResponse(prisma, user, 201, buildVerificationResponse(request, verificationToken));
  } catch (error: any) {
    if (error?.code === "P2002") {
      const existingUser = await prisma.user.findUnique({
        where: { email },
        include: {
          passwordCredential: true
        }
      });

      if (existingUser && !existingUser.passwordCredential) {
        const verificationToken = createEmailVerificationToken();
        await prisma.passwordCredential.create({
          data: {
            userId: existingUser.id,
            passwordHash: await hashPassword(password)
          }
        });

        if (!existingUser.emailVerifiedAt) {
          await prisma.emailVerificationToken.create({
            data: {
              userId: existingUser.id,
              tokenHash: hashEmailVerificationToken(verificationToken),
              expiresAt: getEmailVerificationExpiry()
            }
          });
        }

        return createSessionResponse(
          prisma,
          existingUser,
          201,
          existingUser.emailVerifiedAt ? undefined : buildVerificationResponse(request, verificationToken)
        );
      }

      return jsonError("Email is already registered", 409);
    }

    throw error;
  }
}

function buildVerificationResponse(request: Request, token: string) {
  return {
    emailVerificationRequired: true,
    ...(process.env.NODE_ENV === "production" ? {} : { verificationUrl: buildVerificationUrl(request, token) })
  };
}
