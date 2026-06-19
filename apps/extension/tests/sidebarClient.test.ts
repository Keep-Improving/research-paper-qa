import { describe, expect, it, vi } from "vitest";

import { captureActiveTabSelection } from "../src/sidebar/sidebarClient";

describe("captureActiveTabSelection", () => {
  it("requests the current active tab selection from the content script", async () => {
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
      tabs: {
        query: vi.fn().mockResolvedValue([{ id: 42 }]),
        sendMessage
      }
    });

    await expect(captureActiveTabSelection()).resolves.toEqual({
      kind: "text",
      quote_text: "selected passage",
      context_text: "context around selected passage",
      source_url: "https://example.test/paper"
    });
    expect(sendMessage).toHaveBeenCalledWith(42, { type: "paperqa:capture-selection" });
  });

  it("returns null when there is no selected text", async () => {
    vi.stubGlobal("chrome", {
      tabs: {
        query: vi.fn().mockResolvedValue([{ id: 42 }]),
        sendMessage: vi.fn().mockResolvedValue({ ok: true, anchor: null })
      }
    });

    await expect(captureActiveTabSelection()).resolves.toBeNull();
  });
});
