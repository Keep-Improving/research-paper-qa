// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { InlineHint } from "./InlineHint";
import { LocaleProvider } from "./LocaleProvider";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() })
}));

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("InlineHint", () => {
  it("dismisses and remembers a localized hint", () => {
    const { unmount } = render(
      <LocaleProvider initialLocale="en-US">
        <InlineHint storageKey="paperqa-hint:search" messageKey="search.hint" />
      </LocaleProvider>
    );

    expect(screen.getByText("Enter a paper title, DOI, or question keyword to begin.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Dismiss hint" }));
    expect(localStorage.getItem("paperqa-hint:search")).toBe("dismissed");
    expect(screen.queryByText("Enter a paper title, DOI, or question keyword to begin.")).not.toBeInTheDocument();

    unmount();
    render(
      <LocaleProvider initialLocale="en-US">
        <InlineHint storageKey="paperqa-hint:search" messageKey="search.hint" />
      </LocaleProvider>
    );
    expect(screen.queryByText("Enter a paper title, DOI, or question keyword to begin.")).not.toBeInTheDocument();
  });
});
