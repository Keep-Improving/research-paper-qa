import { describe, expect, it, vi } from "vitest";

import {
  captureActiveTabSelection,
  getCurrentPaper,
  createRemoteDiscussion,
  createRemoteReply,
  getApiBaseUrl,
  getRemoteDiscussion,
  listRemoteDiscussions,
  matchRemotePaper
} from "../src/sidebar/sidebarClient";

describe("captureActiveTabSelection", () => {
  it("requests current paper detection from the extension background", async () => {
    const sendMessage = vi.fn().mockResolvedValue({ doi: "10.1000/example", title: "Example", url: "https://example.test" });
    vi.stubGlobal("chrome", { runtime: { sendMessage } });
    await expect(getCurrentPaper()).resolves.toMatchObject({ doi: "10.1000/example" });
    expect(sendMessage).toHaveBeenCalledWith({ type: "paperqa:get-current-paper" });
  });
  it("requests selection capture from the extension background", async () => {
    const sendMessage = vi.fn().mockResolvedValue({
      ok: true,
      anchor: {
        kind: "text",
        quote_text: "selected passage",
        context_text: "context around selected passage",
        source_url: "https://example.test/paper"
      }
    });
    vi.stubGlobal("chrome", {
      runtime: {
        sendMessage
      }
    });

    await expect(captureActiveTabSelection()).resolves.toEqual({
      kind: "text",
      quote_text: "selected passage",
      context_text: "context around selected passage",
      source_url: "https://example.test/paper"
    });
    expect(sendMessage).toHaveBeenCalledWith({ type: "paperqa:capture-active-tab-selection" });
  });

  it("returns null when there is no selected text", async () => {
    vi.stubGlobal("chrome", {
      runtime: {
        sendMessage: vi.fn().mockResolvedValue({ ok: true, anchor: null })
      }
    });

    await expect(captureActiveTabSelection()).resolves.toBeNull();
  });

  it("throws a useful error when background capture fails", async () => {
    vi.stubGlobal("chrome", {
      runtime: {
        sendMessage: vi.fn().mockResolvedValue({
          ok: false,
          error: "Open a paper tab, then try Use selection again."
        })
      }
    });

    await expect(captureActiveTabSelection()).rejects.toThrow("Open a paper tab");
  });
});

describe("remote sidebar API client", () => {
  it("uses configured API base URL from chrome storage", async () => {
    vi.stubGlobal("chrome", {
      storage: {
        local: {
          get: vi.fn().mockResolvedValue({ "paperqa:apiBaseUrl": "https://paperqa.example/api/" })
        }
      }
    });

    await expect(getApiBaseUrl()).resolves.toBe("https://paperqa.example/api");
  });

  it("matches a detected paper through the public API", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      id: "paper-1",
      title: "Matched paper",
      doi: "10.1000/example"
    }), { status: 200 }));

    await expect(matchRemotePaper("https://api.example.test/api", {
      title: "Matched paper",
      doi: "10.1000/example",
      url: "https://example.test/paper"
    }, fetchImpl)).resolves.toMatchObject({
      id: "paper-1",
      title: "Matched paper"
    });

    expect(fetchImpl).toHaveBeenCalledWith("https://api.example.test/api/papers/match", expect.objectContaining({
      method: "POST"
    }));
  });

  it("lists and creates discussions through the public API", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([
        {
          id: "discussion-1",
          paperId: "paper-1",
          title: "Question",
          body: "Question body",
          status: "open",
          authorName: "Reader",
          createdAt: "2026-06-20T00:00:00Z",
          anchor: null,
          answerCount: 0,
          commentCount: 0,
          heat: 0
        }
      ]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        id: "discussion-2",
        paperId: "paper-1",
        body: "New question",
        status: "open"
      }), { status: 201 }));

    await expect(listRemoteDiscussions("https://api.example.test/api", "paper-1", fetchImpl)).resolves.toHaveLength(1);
    await expect(createRemoteDiscussion("https://api.example.test/api", {
      paperId: "paper-1",
      body: "New question"
    }, fetchImpl)).resolves.toMatchObject({
      id: "discussion-2"
    });

    expect(fetchImpl).toHaveBeenNthCalledWith(1, "https://api.example.test/api/papers/paper-1/discussions", { method: "GET" });
    expect(fetchImpl).toHaveBeenNthCalledWith(2, "https://api.example.test/api/papers/paper-1/discussions", expect.objectContaining({
      method: "POST",
      headers: expect.objectContaining({ "X-User-Id": "user-reader" })
    }));
  });

  it("loads a discussion detail with replies through the public API", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      id: "discussion-1",
      paperId: "paper-1",
      body: "Question body",
      status: "open",
      authorName: "Reader",
      createdAt: "2026-06-20T00:00:00Z",
      replies: [
        {
          id: "reply-1",
          discussionId: "discussion-1",
          parentReplyId: null,
          kind: "answer",
          body: "Answer body",
          authorName: "Responder",
          createdAt: "2026-06-20T01:00:00Z"
        }
      ]
    }), { status: 200 }));

    await expect(getRemoteDiscussion("https://api.example.test/api", "discussion-1", fetchImpl)).resolves.toMatchObject({
      id: "discussion-1",
      replies: [
        {
          id: "reply-1",
          kind: "answer",
          parentReplyId: null,
          body: "Answer body"
        }
      ]
    });

    expect(fetchImpl).toHaveBeenCalledWith("https://api.example.test/api/discussions/discussion-1", {
      method: "GET"
    });
  });

  it("creates a threaded response with parent reply id", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      id: "reply-2"
    }), { status: 201 }));

    await createRemoteReply("https://api.example.test/api", "discussion-1", "Nested response", "answer", "reply-1", fetchImpl);

    expect(fetchImpl).toHaveBeenCalledWith("https://api.example.test/api/discussions/discussion-1/replies", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({
        kind: "answer",
        body: "Nested response",
        parentReplyId: "reply-1"
      })
    }));
  });
});
