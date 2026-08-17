// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MyWorkspace, type MyWorkspaceData } from "./MyWorkspace";
import { LocaleProvider } from "./LocaleProvider";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() })
}));

const data: MyWorkspaceData = {
  collections: {
    papers: [{ id: "paper-1", title: "Attention Is All You Need" }],
    questions: [{ id: "discussion-1", title: "How does attention scale?" }],
    anchors: [{ id: "anchor-1", title: "Equation 1" }]
  },
  discussions: [
    {
      id: "discussion-2",
      title: "What changes in the ablation?",
      status: "open",
      myReplyCount: 1,
      updatedAt: "2026-08-17T08:00:00.000Z"
    }
  ],
  canUseAuthorTools: true
};

describe("MyWorkspace", () => {
  it("shows personal sections and author tools for an eligible user", () => {
    render(
      <LocaleProvider initialLocale="en-US">
        <MyWorkspace data={data} />
      </LocaleProvider>
    );

    expect(screen.getByRole("heading", { name: "My" })).toBeInTheDocument();
    expect(screen.getByText("Attention Is All You Need")).toBeInTheDocument();
    expect(screen.getByText("What changes in the ablation?")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Author workbench" })).toHaveAttribute("href", "/author/workbench");
  });

  it("shows a sign-in prompt when the viewer is anonymous", () => {
    render(
      <LocaleProvider initialLocale="zh-CN">
        <MyWorkspace data={null} />
      </LocaleProvider>
    );

    expect(screen.getByText("登录后即可同步收藏、提问和回复。")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "登录" })).toHaveAttribute("href", "/login");
  });
});
