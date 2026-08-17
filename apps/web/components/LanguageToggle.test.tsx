// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { LanguageToggle } from "./LanguageToggle";
import { LocaleProvider } from "./LocaleProvider";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh })
}));

afterEach(() => {
  refresh.mockReset();
  document.cookie = "paperqa-locale=; Max-Age=0; Path=/";
});

describe("LanguageToggle", () => {
  it("persists the selected language and marks it active", () => {
    render(
      <LocaleProvider initialLocale="zh-CN">
        <LanguageToggle />
      </LocaleProvider>
    );

    expect(screen.getByRole("group", { name: "语言" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "中文" })).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name: "EN" }));

    expect(document.cookie).toContain("paperqa-locale=en-US");
    expect(screen.getByRole("button", { name: "EN" })).toHaveAttribute("aria-pressed", "true");
    expect(refresh).toHaveBeenCalledOnce();
  });
});
