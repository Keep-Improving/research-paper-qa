import { NextResponse } from "next/server";

import { hashSessionToken, sessionCookieName } from "../../../../lib/auth/sessions";
import { prisma } from "../../../../lib/prisma";

export async function POST(request: Request) {
  const token = getCookie(request, sessionCookieName);
  if (token) {
    await prisma.userSession.deleteMany({
      where: {
        tokenHash: hashSessionToken(token)
      }
    });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(sessionCookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
  return response;
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
