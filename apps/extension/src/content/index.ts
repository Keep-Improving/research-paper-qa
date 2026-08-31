import { detectPaper } from "./paperDetection";
import { createImageAnchorFromElement } from "./imageAnchor";
import { captureSelectionAnchor } from "./selectionAnchor";

export { captureSelectionAnchor, detectPaper };

declare global {
  interface Window {
    paperQaContent?: {
      detectCurrentPaper: () => ReturnType<typeof detectPaper>;
      captureSelectionAnchor: () => ReturnType<typeof captureSelectionAnchor>;
    };
  }
}

window.paperQaContent = {
  detectCurrentPaper: () => detectPaper(document, location),
  captureSelectionAnchor: () => captureSelectionAnchor(window, document)
};

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "paperqa:pick-image") {
    pickImage().then(sendResponse);
    return true;
  }
  if (message?.type !== "paperqa:capture-selection") {
    if (message?.type === "paperqa:detect-paper") {
      sendResponse(detectPaper(document, location));
      return true;
    }
    return false;
  }

  sendResponse({
    ok: true,
    anchor: captureSelectionAnchor(window, document)
  });
  return true;
});

function pickImage(): Promise<{ ok: true; anchor: ReturnType<typeof createImageAnchorFromElement> } | { ok: false; error: string }> {
  return new Promise((resolve) => {
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLImageElement)) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      document.removeEventListener("click", onClick, true);
      resolve({ ok: true, anchor: createImageAnchorFromElement(target) });
    };

    document.addEventListener("click", onClick, true);
    window.setTimeout(() => {
      document.removeEventListener("click", onClick, true);
      resolve({ ok: false, error: "No image selected." });
    }, 15000);
  });
}
