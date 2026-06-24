import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "./passwords";

describe("password auth", () => {
  it("verifies the original password and rejects a different password", async () => {
    const hash = await hashPassword("correct horse battery staple");

    await expect(verifyPassword("correct horse battery staple", hash)).resolves.toBe(true);
    await expect(verifyPassword("wrong password", hash)).resolves.toBe(false);
  });

  it("rejects malformed password hashes", async () => {
    await expect(verifyPassword("anything", "not-a-real-hash")).resolves.toBe(false);
  });
});
