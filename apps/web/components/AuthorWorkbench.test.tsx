import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AuthorWorkbench } from "./AuthorWorkbench";

const paper = {
  id: "paper-transformer",
  title: "Attention Is All You Need",
  venue: "NeurIPS",
  year: 2017,
  canPublishAuthorResponse: false,
  discussions: [
    {
      id: "discussion-figure-residual",
      title: "Are the residual paths in Figure 1 applied before or after normalization?",
      body: "The diagram is compact.",
      heat: 104,
      votes: 9,
      createdAt: "2026-06-17T00:00:00.000Z",
      anchorTitle: "Figure 1 model architecture"
    }
  ]
};

describe("AuthorWorkbench", () => {
  it("does not approve author responses without verified author identity", () => {
    const html = renderToStaticMarkup(
      <AuthorWorkbench
        papers={[paper]}
        userEmail="reader@example.edu"
      />
    );

    expect(html).toContain("Author response permission: Not eligible");
    expect(html).not.toContain("Author response</button>");
    expect(html).toContain("Ask as reader");
  });

  it("shows author response actions only for verified first or corresponding authors", () => {
    const html = renderToStaticMarkup(
      <AuthorWorkbench
        papers={[{ ...paper, canPublishAuthorResponse: true }]}
        userEmail="author@example.test"
      />
    );

    expect(html).toContain("Author response permission: Approved");
    expect(html).toContain("Author response</button>");
  });
});
