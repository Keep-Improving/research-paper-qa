import { describe, expect, it, vi } from "vitest";

import { captureActiveTabSelection } from "../src/sidebar/sidebarClient";

describe("captureActiveTabSelection", () => {
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
