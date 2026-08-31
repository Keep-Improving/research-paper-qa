import { beforeEach, describe, expect, it, vi } from "vitest";

type MessageListener = (
  message: unknown,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: unknown) => void
) => boolean | void;

describe("background selection capture", () => {
  let onMessage: MessageListener;
  let onActivated: (activeInfo: chrome.tabs.TabActiveInfo) => void;
  let query: ReturnType<typeof vi.fn>;
  let get: ReturnType<typeof vi.fn>;
  let sendMessage: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.resetModules();
    query = vi.fn();
    get = vi.fn();
    sendMessage = vi.fn();

    vi.stubGlobal("chrome", {
      action: {
        onClicked: {
          addListener: vi.fn()
        }
      },
      runtime: {
        onInstalled: {
          addListener: vi.fn()
        },
        onMessage: {
          addListener: vi.fn((listener: MessageListener) => {
            onMessage = listener;
          })
        }
      },
      sidePanel: {
        open: vi.fn(),
        setPanelBehavior: vi.fn()
      },
      tabs: {
        get,
        onActivated: {
          addListener: vi.fn((listener: (activeInfo: chrome.tabs.TabActiveInfo) => void) => {
            onActivated = listener;
          })
        },
        query,
        sendMessage
      }
    });

    await import("../src/background/index");
  });

  it("forwards side panel selection capture to the active normal tab", async () => {
    query.mockResolvedValue([{ id: 42, url: "https://pmc.ncbi.nlm.nih.gov/articles/test/" }]);
    sendMessage.mockResolvedValue({
      ok: true,
      anchor: {
        kind: "text",
        quote_text: "selected passage",
        source_url: "https://pmc.ncbi.nlm.nih.gov/articles/test/"
      }
    });

    const sendResponse = vi.fn();
    const keepsPortOpen = onMessage(
      { type: "paperqa:capture-active-tab-selection" },
      {} as chrome.runtime.MessageSender,
      sendResponse
    );

    expect(keepsPortOpen).toBe(true);
    await vi.waitFor(() => expect(sendResponse).toHaveBeenCalled());
    expect(query).toHaveBeenCalledWith({
      active: true,
      lastFocusedWindow: true,
      windowType: "normal"
    });
    expect(sendMessage).toHaveBeenCalledWith(42, { type: "paperqa:capture-selection" });
    expect(sendResponse).toHaveBeenCalledWith({
      ok: true,
      anchor: {
        kind: "text",
        quote_text: "selected passage",
        source_url: "https://pmc.ncbi.nlm.nih.gov/articles/test/"
      }
    });
  });

  it("forwards current paper detection to the active normal tab", async () => {
    query.mockResolvedValue([{ id: 42, url: "https://nature.com/articles/example" }]);
    sendMessage.mockResolvedValue({ doi: "10.1000/example", title: "Example", url: "https://nature.com/articles/example", confidence: "high" });

    const sendResponse = vi.fn();
    expect(onMessage({ type: "paperqa:get-current-paper" }, {} as chrome.runtime.MessageSender, sendResponse)).toBe(true);
    await vi.waitFor(() => expect(sendResponse).toHaveBeenCalledWith(expect.objectContaining({ doi: "10.1000/example" })));
    expect(sendMessage).toHaveBeenCalledWith(42, { type: "paperqa:detect-paper" });
  });

  it("returns a visible failure when no active page tab is available", async () => {
    query.mockResolvedValue([]);

    const sendResponse = vi.fn();
    onMessage(
      { type: "paperqa:capture-active-tab-selection" },
      {} as chrome.runtime.MessageSender,
      sendResponse
    );

    await vi.waitFor(() => expect(sendResponse).toHaveBeenCalled());
    expect(sendMessage).not.toHaveBeenCalled();
    expect(sendResponse).toHaveBeenCalledWith({
      ok: false,
      error: "Open a paper tab, select text, then try Use selection again."
    });
  });

  it("uses the last capturable page tab when an extension page is active", async () => {
    get.mockResolvedValue({
      id: 7,
      url: "https://pmc.ncbi.nlm.nih.gov/articles/test/"
    });
    onActivated({ tabId: 7, windowId: 1 });

    await vi.waitFor(() => expect(get).toHaveBeenCalledWith(7));
    query.mockResolvedValue([{ id: 99, url: "chrome-extension://abc/src/sidebar/index.html" }]);
    sendMessage.mockResolvedValue({
      ok: true,
      anchor: {
        kind: "text",
        quote_text: "remembered tab selection",
        source_url: "https://pmc.ncbi.nlm.nih.gov/articles/test/"
      }
    });

    const sendResponse = vi.fn();
    onMessage(
      { type: "paperqa:capture-active-tab-selection" },
      {} as chrome.runtime.MessageSender,
      sendResponse
    );

    await vi.waitFor(() => expect(sendResponse).toHaveBeenCalled());
    expect(sendMessage).toHaveBeenCalledWith(7, { type: "paperqa:capture-selection" });
  });

  it("falls back to another capturable normal tab when the active tab is an extension page", async () => {
    query
      .mockResolvedValueOnce([{ id: 99, url: "chrome-extension://abc/src/sidebar/index.html" }])
      .mockResolvedValueOnce([
        { id: 99, url: "chrome-extension://abc/src/sidebar/index.html" },
        { id: 42, url: "https://pmc.ncbi.nlm.nih.gov/articles/test/" }
      ]);
    sendMessage.mockResolvedValue({
      ok: true,
      anchor: {
        kind: "text",
        quote_text: "fallback tab selection",
        source_url: "https://pmc.ncbi.nlm.nih.gov/articles/test/"
      }
    });

    const sendResponse = vi.fn();
    onMessage(
      { type: "paperqa:capture-active-tab-selection" },
      {} as chrome.runtime.MessageSender,
      sendResponse
    );

    await vi.waitFor(() => expect(sendResponse).toHaveBeenCalled());
    expect(query).toHaveBeenNthCalledWith(2, { windowType: "normal" });
    expect(sendMessage).toHaveBeenCalledWith(42, { type: "paperqa:capture-selection" });
  });
});
