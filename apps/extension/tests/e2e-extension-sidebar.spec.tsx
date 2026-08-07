import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createUrlOnlyImageAnchor } from "../src/content/imageAnchor";
import { detectPaper } from "../src/content/paperDetection";
import { captureSelectionAnchor } from "../src/content/selectionAnchor";
import { Sidebar, type SidebarDiscussion } from "../src/sidebar/Sidebar";

afterEach(() => {
  cleanup();
});

const paper = {
  id: "paper-transformer",
  title: "Attention Is All You Need",
  doi: "10.48550/arXiv.1706.03762"
};

const discussions: SidebarDiscussion[] = [
  {
    id: "author-response",
    paperId: paper.id,
    kind: "author_response",
    status: "author_responded",
    body: "Verified author response about the scaling term.",
    authorName: "A. Vaswani",
    createdAt: "2026-06-19T09:00:00.000Z",
    heat: 12,
    isAuthorResponse: true,
    anchor: { kind: "text", quoteText: "softmax(QK^T / sqrt(dk))V" }
  },
  {
    id: "hot-question",
    paperId: paper.id,
    kind: "question",
    status: "open",
    body: "Are residual paths applied before normalization?",
    authorName: "Reader",
    createdAt: "2026-06-19T08:00:00.000Z",
    heat: 104,
    anchor: { kind: "figure", quoteText: "Figure 1" }
  }
];

describe("Extension end-to-end sidebar workflow", () => {
  it("detects fixture papers, captures text anchors, handles image fallback, filters, sorts, and submits", async () => {
    document.head.innerHTML = `
      <meta name="citation_doi" content="10.48550/arXiv.1706.03762">
      <meta name="citation_title" content="Attention Is All You Need">
    `;
    document.body.innerHTML = `<article><p id="claim">Attention(Q, K, V) = softmax(QK^T / sqrt(dk))V stabilizes gradients.</p></article>`;

    const detected = detectPaper(document, new URL("https://arxiv.org/abs/1706.03762"));
    expect(detected).toMatchObject({
      doi: "10.48550/arxiv.1706.03762"
    });

    const doc = document.implementation.createHTMLDocument("paper fixture");
    doc.body.innerHTML = `<article><p id="claim">Attention(Q, K, V) = softmax(QK^T / sqrt(dk))V stabilizes gradients.</p></article>`;
    const paragraph = doc.getElementById("claim");
    const range = doc.createRange();
    range.selectNodeContents(paragraph!);
    const selection = {
      rangeCount: 1,
      isCollapsed: false,
      toString: () => "Attention(Q, K, V) = softmax(QK^T / sqrt(dk))V",
      getRangeAt: () => range
    } as unknown as Selection;
    const win = {
      getSelection: () => selection,
      location: { href: "https://arxiv.org/abs/1706.03762" }
    } as unknown as Window;
    const textAnchor = captureSelectionAnchor(win, doc);
    expect(textAnchor?.quote_text).toContain("Attention(Q, K, V)");

    const droppedImage = createUrlOnlyImageAnchor("blob:figure-1");
    expect(droppedImage.image_url).toBe("blob:figure-1");

    const onCreateDiscussion = vi.fn().mockResolvedValue(undefined);
    document.body.innerHTML = "";
    render(
      <Sidebar
        paper={paper}
        initialDiscussions={discussions}
        anchorDraft={{
          kind: "text",
          quoteText: textAnchor!.quote_text,
          contextText: textAnchor!.context_text,
          sourceUrl: textAnchor!.source_url
        }}
        similarQuestionPrompt={<p>Similar question found for this anchor.</p>}
        onCreateDiscussion={onCreateDiscussion}
      />
    );

    expect(screen.getByText("Similar question found for this anchor.")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Sort discussions"), { target: { value: "heat" } });
    expect(orderedDiscussionIds()).toEqual(["hot-question", "author-response"]);

    fireEvent.change(screen.getByLabelText("Participant"), { target: { value: "author_response" } });
    expect(screen.getByText("Verified author response about the scaling term.")).toBeInTheDocument();
    expect(screen.queryByText("Are residual paths applied before normalization?")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Question body"), {
      target: { value: "Does the same scaling hold when head dimensions vary?" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit question" }));

    expect(onCreateDiscussion).toHaveBeenCalledWith({
      paperId: paper.id,
      body: "Does the same scaling hold when head dimensions vary?",
      anchor: expect.objectContaining({ kind: "text" })
    });
  });
});

function orderedDiscussionIds() {
  return screen
    .getAllByRole("article")
    .map((article) => within(article).getByTestId("discussion-id").textContent);
}
