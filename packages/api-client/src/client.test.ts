import { describe, expect, it, vi } from "vitest";

import { PaperQaClient } from "./client.js";
import type { DiscussionCreate, DiscussionFilter, PaperIdentifyRequest } from "./types.js";

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

describe("PaperQaClient", () => {
  it("posts JSON to match a paper", async () => {
    const paper = {
      id: "paper-1",
      title: "Reliable paper matching",
      doi: "10.1000/example",
      arxiv_id: null,
      pmid: null,
      venue: "Journal",
      publication_year: 2026,
      canonical_url: "https://example.test/paper",
      abstract: null,
      created_at: "2026-06-19T00:00:00Z",
    };
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(paper));
    const client = new PaperQaClient({ baseUrl: "https://api.example.test/", fetchImpl });
    const input: PaperIdentifyRequest = {
      doi: "10.1000/example",
      title: "Reliable paper matching",
      url: "https://example.test/paper",
    };

    await expect(client.matchPaper(input)).resolves.toEqual(paper);

    expect(fetchImpl).toHaveBeenCalledWith("https://api.example.test/papers/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  });

  it("gets discussions with encoded filters and sort query params", async () => {
    const discussions = [
      {
        id: "discussion-1",
        paper_id: "paper 1",
        anchor_id: "anchor-1",
        parent_id: null,
        user_id: "user-1",
        kind: "question",
        status: "open",
        body: "How was this measured?",
        is_author_response: false,
        is_pinned: false,
        is_hidden: false,
        created_at: "2026-06-19T00:00:00Z",
        updated_at: "2026-06-19T00:00:00Z",
        anchor: {
          id: "anchor-1",
          paper_id: "paper 1",
          kind: "text",
          quote_text: "measured signal",
          context_text: null,
          page_number: 2,
          section_label: "Methods",
          figure_label: null,
          table_label: null,
          formula_label: null,
          reference_label: null,
          source_url: null,
          dom_path: null,
          image_url: null,
          ocr_text: null,
          created_at: "2026-06-19T00:00:00Z",
        },
        similar_discussions: [],
        reaction_counts: { upvote: 2 },
      },
    ];
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(discussions));
    const client = new PaperQaClient({ baseUrl: "https://api.example.test/", fetchImpl });
    const filter: DiscussionFilter = {
      status: "open",
      kind: "question",
      has_author_response: true,
      anchor_kind: "text",
      sort: "anchor_position",
    };

    await expect(client.listDiscussions("paper 1", filter)).resolves.toEqual(discussions);

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.example.test/papers/paper%201/discussions?status=open&kind=question&has_author_response=true&anchor_kind=text&sort=anchor_position",
      { method: "GET" },
    );
  });

  it("posts JSON with X-User-Id to create a discussion", async () => {
    const created = {
      item: {
        id: "discussion-1",
        paper_id: "paper-1",
        anchor_id: null,
        parent_id: null,
        user_id: "user-1",
        kind: "question",
        status: "open",
        body: "What explains this result?",
        is_author_response: false,
        is_pinned: false,
        is_hidden: false,
        created_at: "2026-06-19T00:00:00Z",
        updated_at: "2026-06-19T00:00:00Z",
        anchor: null,
        similar_discussions: [],
        reaction_counts: {},
      },
      similar_discussions: [],
    };
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(created, { status: 201 }));
    const client = new PaperQaClient({ baseUrl: "https://api.example.test", fetchImpl });
    const input: DiscussionCreate = {
      kind: "question",
      body: "What explains this result?",
    };

    await expect(client.createDiscussion("paper-1", "user-1", input)).resolves.toEqual(created);

    expect(fetchImpl).toHaveBeenCalledWith("https://api.example.test/papers/paper-1/discussions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-Id": "user-1",
      },
      body: JSON.stringify(input),
    });
  });

  it("gets a discussion detail", async () => {
    const detail = {
      id: "discussion-1",
      replies: [],
    };
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(detail));
    const client = new PaperQaClient({ baseUrl: "https://api.example.test", fetchImpl });

    await expect(client.getDiscussion("discussion-1")).resolves.toEqual(detail);

    expect(fetchImpl).toHaveBeenCalledWith("https://api.example.test/discussions/discussion-1", {
      method: "GET",
    });
  });

  it("creates a reply with X-User-Id", async () => {
    const reply = { id: "reply-1", body: "Answer" };
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(reply, { status: 201 }));
    const client = new PaperQaClient({ baseUrl: "https://api.example.test", fetchImpl });

    await expect(client.createReply("discussion-1", "user-1", {
      kind: "answer",
      body: "Answer",
    })).resolves.toEqual(reply);

    expect(fetchImpl).toHaveBeenCalledWith("https://api.example.test/discussions/discussion-1/replies", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-Id": "user-1",
      },
      body: JSON.stringify({ kind: "answer", body: "Answer" }),
    });
  });

  it("creates a vote for a discussion", async () => {
    const vote = { id: "vote-1", value: "helpful" };
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(vote, { status: 201 }));
    const client = new PaperQaClient({ baseUrl: "https://api.example.test", fetchImpl });

    await expect(client.createVote("user-1", {
      discussionId: "discussion-1",
      value: "helpful",
    })).resolves.toEqual(vote);

    expect(fetchImpl).toHaveBeenCalledWith("https://api.example.test/votes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-Id": "user-1",
      },
      body: JSON.stringify({ discussionId: "discussion-1", value: "helpful" }),
    });
  });

  it("adds a collection item", async () => {
    const item = { id: "collection-1", targetType: "paper", targetId: "paper-1" };
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(item, { status: 201 }));
    const client = new PaperQaClient({ baseUrl: "https://api.example.test", fetchImpl });

    await expect(client.addCollectionItem("user-1", {
      targetType: "paper",
      targetId: "paper-1",
    })).resolves.toEqual(item);

    expect(fetchImpl).toHaveBeenCalledWith("https://api.example.test/collections", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-Id": "user-1",
      },
      body: JSON.stringify({ targetType: "paper", targetId: "paper-1" }),
    });
  });

  it("reports a discussion", async () => {
    const report = { id: "report-1", status: "open" };
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(report, { status: 201 }));
    const client = new PaperQaClient({ baseUrl: "https://api.example.test", fetchImpl });

    await expect(client.createReport("user-1", {
      targetType: "discussion",
      targetId: "discussion-1",
      reason: "Needs review",
    })).resolves.toEqual(report);

    expect(fetchImpl).toHaveBeenCalledWith("https://api.example.test/reports", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-Id": "user-1",
      },
      body: JSON.stringify({ targetType: "discussion", targetId: "discussion-1", reason: "Needs review" }),
    });
  });

  it("throws status and response text on non-2xx responses", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response("not found", { status: 404 }));
    const client = new PaperQaClient({ baseUrl: "https://api.example.test", fetchImpl });

    await expect(client.listDiscussions("missing")).rejects.toThrow("Request failed with status 404: not found");
  });
});
