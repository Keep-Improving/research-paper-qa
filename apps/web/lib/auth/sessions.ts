import { createHash, randomBytes } from "node:crypto";

export const sessionCookieName = "paperqa_session";
export const sessionDurationMs = 1000 * 60 * 60 * 24 * 30;

export function createSessionToken() {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function getSessionExpiry(now = new Date()) {
  return new Date(now.getTime() + sessionDurationMs);
}

export function getSessionCookieOptions(expires: Date) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires
  };
}
