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
    let questionCreated = false;
    const createdDiscussion = {
        id: "discussion-1",
        paperId: "paper-1",
        body: "Does the selected evidence support this conclusion?",
        status: "open",
        authorName: "Reader",
        createdAt: "2026-06-20T00:00:00Z"
    };
    const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/papers/match")) {
        return new Response(JSON.stringify({ id: "paper-1", title: "Detected paper" }), { status: 200 });
      }
      if (url.endsWith("/papers/paper-1/discussions") && init?.method === "POST") {
        questionCreated = true;
        return new Response(JSON.stringify(createdDiscussion), { status: 201 });
      }
      if (url.endsWith("/papers/paper-1/discussions")) {
        return new Response(JSON.stringify(questionCreated ? [createdDiscussion] : []), { status: 200 });
      }
      throw new Error(`Unexpected request: ${init?.method ?? "GET"} ${url}`);
    });

    vi.stubGlobal("chrome", {
        runtime: {
        sendMessage: vi.fn().mockResolvedValue({ title: "Detected paper", url: "http://localhost:3000/", confidence: "high" })
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
    let matchAttempts = 0;
    let questionCreated = false;
    const createdDiscussion = {
        id: "discussion-2",
        paperId: "paper-2",
        body: "Retry after backend recovery",
        status: "open",
        authorName: "Reader",
        createdAt: "2026-06-20T00:00:00Z"
    };
    const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/papers/match")) {
        matchAttempts += 1;
        if (matchAttempts === 1) {
          return new Response("database not ready", { status: 500 });
        }
        return new Response(JSON.stringify({ id: "paper-2", title: "Detected paper" }), { status: 200 });
      }
      if (url.endsWith("/papers/paper-2/discussions") && init?.method === "POST") {
        questionCreated = true;
        return new Response(JSON.stringify(createdDiscussion), { status: 201 });
      }
      if (url.endsWith("/papers/paper-2/discussions")) {
        return new Response(JSON.stringify(questionCreated ? [createdDiscussion] : []), { status: 200 });
      }
      throw new Error(`Unexpected request: ${init?.method ?? "GET"} ${url}`);
    });

    vi.stubGlobal("chrome", {
      runtime: {
        sendMessage: vi.fn().mockResolvedValue({ title: "Detected paper", url: "http://localhost:3000/", confidence: "high" })
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

  it("clears an anchor draft before submitting", async () => {
    const fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/papers/match")) {
        return new Response(JSON.stringify({ id: "paper-1", title: "Detected paper" }), { status: 200 });
      }
      return new Response("[]", { status: 200 });
    });

    vi.stubGlobal("chrome", {
      runtime: { sendMessage: vi.fn().mockResolvedValue({ title: "Detected paper", url: "http://localhost:3000/", confidence: "high" }) },
      storage: { local: { get: vi.fn(async () => ({ "paperqa:apiBaseUrl": "https://api.example.test/api" })) } }
    });
    vi.stubGlobal("fetch", fetch);

    document.body.innerHTML = '<div id="root"></div>';
    await import("../src/sidebar/main");
    await screen.findAllByText("Detected paper");

    fireEvent.change(screen.getByLabelText("Manual anchor note"), { target: { value: "Figure 2" } });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(screen.getByText("Figure 2")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Clear anchor" }));
    expect(screen.queryByText("Figure 2")).not.toBeInTheDocument();
  });
});
