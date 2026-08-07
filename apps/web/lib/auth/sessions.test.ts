import { describe, expect, it } from "vitest";

import { createSessionToken, getSessionExpiry, hashSessionToken, sessionCookieName } from "./sessions";

describe("session tokens", () => {
  it("creates opaque tokens and stable hashes", () => {
    const token = createSessionToken();

    expect(token.length).toBeGreaterThan(40);
    expect(hashSessionToken(token)).toBe(hashSessionToken(token));
    expect(hashSessionToken(token)).not.toBe(token);
    expect(sessionCookieName).toBe("paperqa_session");
  });

  it("creates future expiration dates", () => {
    const now = new Date("2026-06-24T00:00:00.000Z");
    const expiry = getSessionExpiry(now);

    expect(expiry.getTime()).toBeGreaterThan(now.getTime());
  });
});
