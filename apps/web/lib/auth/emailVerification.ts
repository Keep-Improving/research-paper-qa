import { createHash, randomBytes } from "node:crypto";

export const emailVerificationDurationMs = 1000 * 60 * 60 * 24;

export function createEmailVerificationToken() {
  return randomBytes(32).toString("base64url");
}

export function hashEmailVerificationToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function getEmailVerificationExpiry(now = new Date()) {
  return new Date(now.getTime() + emailVerificationDurationMs);
}

export function buildVerificationUrl(request: Request, token: string) {
  const url = new URL(request.url);
  return `${url.origin}/verify-email?token=${encodeURIComponent(token)}`;
}
