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
  it("posts JSON to identify a paper", async () => {
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

    await expect(client.identifyPaper(input)).resolves.toEqual(paper);

    expect(fetchImpl).toHaveBeenCalledWith("https://api.example.test/papers/identify", {
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

  it("throws status and response text on non-2xx responses", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response("not found", { status: 404 }));
    const client = new PaperQaClient({ baseUrl: "https://api.example.test", fetchImpl });

    await expect(client.listDiscussions("missing")).rejects.toThrow("Request failed with status 404: not found");
  });
});
