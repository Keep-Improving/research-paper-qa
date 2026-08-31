chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

chrome.action.onClicked.addListener(async (tab) => {
  if (tab.id === undefined) {
    return;
  }

  rememberCapturableTab(tab);
  await chrome.sidePanel.open({ tabId: tab.id });
});

type CaptureSelectionResponse =
  | {
      ok: true;
      anchor: unknown;
    }
  | {
      ok: false;
      error: string;
    };

let lastCapturableTabId: number | undefined;

chrome.tabs.onActivated.addListener((activeInfo) => {
  void chrome.tabs.get(activeInfo.tabId).then(rememberCapturableTab).catch(() => {
    lastCapturableTabId = undefined;
  });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "paperqa:get-current-paper") {
    void getCurrentPaper().then(sendResponse).catch(() => sendResponse({ title: "Detected paper", url: "", confidence: "low" }));
    return true;
  }

  if (message?.type !== "paperqa:capture-active-tab-selection") {
    return false;
  }

  void captureActiveTabSelection()
    .then(sendResponse)
    .catch((error: unknown) => {
      sendResponse({
        ok: false,
        error: error instanceof Error ? error.message : "Selection capture failed."
      });
    });

  return true;
});

async function getCurrentPaper() {
  const tab = await getCaptureTargetTab();
  if (!tab?.id) {
    return { title: tab?.title ?? "Detected paper", url: tab?.url ?? "", confidence: "low" as const };
  }

  try {
    return await chrome.tabs.sendMessage(tab.id, { type: "paperqa:detect-paper" });
  } catch {
    return { title: tab.title ?? "Detected paper", url: tab.url ?? "", confidence: "low" as const };
  }
}

async function captureActiveTabSelection(): Promise<CaptureSelectionResponse> {
  const tab = await getCaptureTargetTab();

  if (tab?.id === undefined) {
    return {
      ok: false,
      error: "Open a paper tab, select text, then try Use selection again."
    };
  }

  try {
    return (await chrome.tabs.sendMessage(tab.id, {
      type: "paperqa:capture-selection"
    })) as CaptureSelectionResponse;
  } catch (error) {
    return {
      ok: false,
      error: readableCaptureError(error)
    };
  }
}

async function getCaptureTargetTab(): Promise<chrome.tabs.Tab | undefined> {
  const [activeTab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
    windowType: "normal"
  });

  if (isCapturableTab(activeTab)) {
    rememberCapturableTab(activeTab);
    return activeTab;
  }

  if (lastCapturableTabId === undefined) {
    return findFallbackCapturableTab();
  }

  try {
    const rememberedTab = await chrome.tabs.get(lastCapturableTabId);
    return isCapturableTab(rememberedTab) ? rememberedTab : undefined;
  } catch {
    lastCapturableTabId = undefined;
    return findFallbackCapturableTab();
  }
}

async function findFallbackCapturableTab() {
  const tabs = await chrome.tabs.query({ windowType: "normal" });
  const tab = tabs.find(isCapturableTab);
  rememberCapturableTab(tab);
  return tab;
}

function readableCaptureError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes("Receiving end does not exist")) {
    return "Refresh the paper tab, select text, then try Use selection again.";
  }

  return message || "Selection capture failed.";
}

function rememberCapturableTab(tab?: chrome.tabs.Tab) {
  if (isCapturableTab(tab)) {
    lastCapturableTabId = tab.id;
  }
}

function isCapturableTab(tab?: chrome.tabs.Tab): tab is chrome.tabs.Tab & { id: number; url: string } {
  return tab?.id !== undefined && tab.url !== undefined && /^(https?|file):\/\//i.test(tab.url);
}
