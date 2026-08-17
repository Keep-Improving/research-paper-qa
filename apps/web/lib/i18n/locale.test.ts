import { describe, expect, it } from "vitest";

import { resolveLocale } from "./locale";

describe("resolveLocale", () => {
  it("prefers a supported cookie locale", () => {
    expect(resolveLocale({ cookie: "en-US", acceptLanguage: "zh-CN" })).toBe("en-US");
  });

  it("detects Chinese browser language when no cookie exists", () => {
    expect(resolveLocale({ cookie: null, acceptLanguage: "zh-CN,zh;q=0.9" })).toBe("zh-CN");
  });

  it("falls back to English for unsupported languages", () => {
    expect(resolveLocale({ cookie: null, acceptLanguage: "fr-FR" })).toBe("en-US");
  });
});
