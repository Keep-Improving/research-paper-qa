// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MoreNav } from "./MoreNav";
import { LocaleProvider } from "./LocaleProvider";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() })
}));

afterEach(cleanup);

function renderMoreNav(role: string | null) {
  return render(
    <LocaleProvider initialLocale="en-US">
      <MoreNav user={role ? { role } : null} />
    </LocaleProvider>
  );
}

describe("MoreNav", () => {
  it("shows anchors but hides role-only links for an ordinary reader", () => {
    renderMoreNav("user");

    fireEvent.click(screen.getByRole("button", { name: "More" }));

    expect(screen.getByRole("link", { name: "Anchors" })).toHaveAttribute("href", "/anchors");
    expect(screen.queryByRole("link", { name: "Author workbench" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Moderation" })).not.toBeInTheDocument();
  });

  it("shows author links for researchers and moderation for admins", () => {
    const { rerender } = renderMoreNav("researcher");
    fireEvent.click(screen.getByRole("button", { name: "More" }));
    expect(screen.getByRole("link", { name: "Author workbench" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Moderation" })).not.toBeInTheDocument();

    rerender(
      <LocaleProvider initialLocale="en-US">
        <MoreNav user={{ role: "admin" }} />
      </LocaleProvider>
    );
    expect(screen.getByRole("link", { name: "Moderation" })).toBeInTheDocument();
  });
});
