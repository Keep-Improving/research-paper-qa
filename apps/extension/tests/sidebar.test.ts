import { describe, expect, it } from "vitest";

import { SIDEBAR_TITLE } from "../src/sidebar/sidebarTitle";

describe("sidebar title", () => {
  it("uses the product name", () => {
    expect(SIDEBAR_TITLE).toBe("Research Paper Q&A");
  });
});
