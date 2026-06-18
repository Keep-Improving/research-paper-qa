import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Sidebar, type SidebarDiscussion } from "../src/sidebar/Sidebar";

afterEach(() => {
  cleanup();
});

const paper = {
  id: "paper-1",
  title: "Mechanistic evidence for cell-state transitions",
  doi: "10.1000/example"
};

const discussions: SidebarDiscussion[] = [
  {
    id: "q-low",
    paperId: "paper-1",
    kind: "question",
    status: "open",
    body: "How does the perturbation affect the control cohort?",
    authorName: "A. Nguyen",
    createdAt: "2026-06-19T08:00:00.000Z",
    heat: 5,
    answerCount: 1,
    commentCount: 2,
    anchor: {
      kind: "text",
      quoteText: "control cohort",
      sectionLabel: "Results"
    }
  },
  {
    id: "q-author",
    paperId: "paper-1",
    kind: "author_response",
    status: "author_responded",
    body: "We used matched batch controls for the validation run.",
    authorName: "Paper Author",
    createdAt: "2026-06-19T09:00:00.000Z",
    heat: 12,
    isAuthorResponse: true,
    answerCount: 0,
    commentCount: 1,
    anchor: {
      kind: "figure",
      quoteText: "Figure 2B",
      sectionLabel: "Validation"
    }
  },
  {
    id: "q-hot",
    paperId: "paper-1",
    kind: "question",
    status: "open",
    body: "Can the inference be reproduced without the excluded samples?",
    authorName: "M. Patel",
    createdAt: "2026-06-19T07:00:00.000Z",
    heat: 40,
    answerCount: 3,
    commentCount: 5,
    anchor: {
      kind: "text",
      quoteText: "excluded samples",
      sectionLabel: "Methods"
    }
  }
];

describe("Sidebar discussion UI", () => {
  it("renders the full discussion list for one paper", () => {
    render(<Sidebar paper={paper} initialDiscussions={discussions} />);

    expect(screen.getByRole("heading", { name: "Research Paper Q&A" })).toBeInTheDocument();
    expect(screen.getByText(paper.title)).toBeInTheDocument();
    expect(screen.getByText("How does the perturbation affect the control cohort?")).toBeInTheDocument();
    expect(screen.getByText("We used matched batch controls for the validation run.")).toBeInTheDocument();
    expect(screen.getByText("Can the inference be reproduced without the excluded samples?")).toBeInTheDocument();
  });

  it("filters by author response", async () => {
    render(<Sidebar paper={paper} initialDiscussions={discussions} />);

    fireEvent.click(screen.getByRole("button", { name: "Author responses" }));

    expect(screen.getByText("We used matched batch controls for the validation run.")).toBeInTheDocument();
    expect(screen.queryByText("How does the perturbation affect the control cohort?")).not.toBeInTheDocument();
    expect(screen.queryByText("Can the inference be reproduced without the excluded samples?")).not.toBeInTheDocument();
  });

  it("sorts by newest and heat using component state", async () => {
    render(<Sidebar paper={paper} initialDiscussions={discussions} />);

    fireEvent.change(screen.getByLabelText("Sort discussions"), { target: { value: "newest" } });
    expect(orderedDiscussionIds()).toEqual(["q-author", "q-low", "q-hot"]);

    fireEvent.change(screen.getByLabelText("Sort discussions"), { target: { value: "heat" } });
    expect(orderedDiscussionIds()).toEqual(["q-hot", "q-author", "q-low"]);
  });

  it("creates a question from a text anchor draft through the composer callback seam", async () => {
    const onCreateDiscussion = vi.fn().mockResolvedValue(undefined);

    render(
      <Sidebar
        paper={paper}
        initialDiscussions={discussions}
        anchorDraft={{
          kind: "text",
          quoteText: "senescence-associated markers",
          contextText: "The authors report senescence-associated markers after treatment.",
          sourceUrl: "https://example.test/paper"
        }}
        onCreateDiscussion={onCreateDiscussion}
      />
    );

    expect(screen.getByText("senescence-associated markers")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Question body"), {
      target: { value: "Does this marker panel distinguish transient stress from stable senescence?" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit question" }));

    expect(onCreateDiscussion).toHaveBeenCalledWith({
      body: "Does this marker panel distinguish transient stress from stable senescence?",
      paperId: "paper-1",
      anchor: expect.objectContaining({
        kind: "text",
        quoteText: "senescence-associated markers"
      })
    });
  });

  it("shows manual fallback when anchor capture fails", async () => {
    const onRetryAnchorCapture = vi.fn();

    render(
      <Sidebar
        paper={paper}
        initialDiscussions={discussions}
        anchorDraft={null}
        anchorCaptureError="Selection could not be captured in this PDF viewer."
        onRetryAnchorCapture={onRetryAnchorCapture}
      />
    );

    expect(screen.getByText("Selection could not be captured in this PDF viewer.")).toBeInTheDocument();
    expect(screen.getByLabelText("Manual anchor note")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Retry capture" }));
    expect(onRetryAnchorCapture).toHaveBeenCalledTimes(1);
  });

  it("renders loading, empty, and error states", () => {
    const { rerender } = render(<Sidebar paper={paper} loadState="loading" initialDiscussions={[]} />);
    expect(screen.getByText("Loading discussions...")).toBeInTheDocument();

    rerender(<Sidebar paper={paper} loadState="ready" initialDiscussions={[]} />);
    expect(screen.getByText("No discussions yet for this paper.")).toBeInTheDocument();

    rerender(
      <Sidebar
        paper={paper}
        loadState="error"
        errorMessage="Could not load discussions."
        initialDiscussions={[]}
      />
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Could not load discussions.");
  });
});

function orderedDiscussionIds() {
  return screen
    .getAllByRole("article")
    .map((article) => within(article).getByTestId("discussion-id").textContent);
}
