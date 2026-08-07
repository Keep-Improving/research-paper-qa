import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

describe("extension sidebar app", () => {
  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it("submits a question to the public API and refreshes the discussion list", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        id: "paper-1",
        title: "Detected paper"
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        id: "discussion-1",
        paperId: "paper-1",
        body: "Does the selected evidence support this conclusion?",
        status: "open",
        authorName: "Reader",
        createdAt: "2026-06-20T00:00:00Z"
      }), { status: 201 }))
      .mockResolvedValueOnce(new Response(JSON.stringify([
        {
          id: "discussion-1",
          paperId: "paper-1",
          body: "Does the selected evidence support this conclusion?",
          status: "open",
          authorName: "Reader",
          createdAt: "2026-06-20T00:00:00Z"
        }
      ]), { status: 200 }));

    vi.stubGlobal("chrome", {
      runtime: {
        sendMessage: vi.fn()
      },
      storage: {
        local: {
          get: vi.fn(async () => ({ "paperqa:apiBaseUrl": "https://api.example.test/api" }))
        }
      }
    });
    vi.stubGlobal("fetch", fetch);

    document.body.innerHTML = '<div id="root"></div>';
    await import("../src/sidebar/main");

    fireEvent.change(await screen.findByLabelText("Question body"), {
      target: { value: "Does the selected evidence support this conclusion?" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit question" }));

    expect(await screen.findByText("Does the selected evidence support this conclusion?")).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith("https://api.example.test/api/papers/paper-1/discussions", expect.objectContaining({
      method: "POST",
      headers: expect.objectContaining({ "X-User-Id": "user-reader" })
    }));
  });

  it("recovers from an initial API load failure before submitting", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response("database not ready", { status: 500 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        id: "paper-2",
        title: "Detected paper"
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        id: "discussion-2",
        paperId: "paper-2",
        body: "Retry after backend recovery",
        status: "open",
        authorName: "Reader",
        createdAt: "2026-06-20T00:00:00Z"
      }), { status: 201 }))
      .mockResolvedValueOnce(new Response(JSON.stringify([
        {
          id: "discussion-2",
          paperId: "paper-2",
          body: "Retry after backend recovery",
          status: "open",
          authorName: "Reader",
          createdAt: "2026-06-20T00:00:00Z"
        }
      ]), { status: 200 }));

    vi.stubGlobal("chrome", {
      runtime: {
        sendMessage: vi.fn()
      },
      storage: {
        local: {
          get: vi.fn(async () => ({ "paperqa:apiBaseUrl": "https://api.example.test/api" }))
        }
      }
    });
    vi.stubGlobal("fetch", fetch);

    document.body.innerHTML = '<div id="root"></div>';
    await import("../src/sidebar/main");

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

    fireEvent.change(screen.getByLabelText("Question body"), {
      target: { value: "Retry after backend recovery" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit question" }));

    expect(await screen.findByText("Retry after backend recovery")).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith("https://api.example.test/api/papers/paper-2/discussions", expect.objectContaining({
      method: "POST"
    }));
  });
});
