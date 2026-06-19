import { detectPaper } from "./paperDetection";
import { captureSelectionAnchor } from "./selectionAnchor";
import { createImageAnchorFromElement } from "./imageAnchor";

export { createImageAnchorFromElement, captureSelectionAnchor, detectPaper };

declare global {
  interface Window {
    paperQaContent?: {
      detectCurrentPaper: () => ReturnType<typeof detectPaper>;
      captureSelectionAnchor: () => ReturnType<typeof captureSelectionAnchor>;
      createImageAnchorFromElement: typeof createImageAnchorFromElement;
    };
  }
}

window.paperQaContent = {
  detectCurrentPaper: () => detectPaper(document, location),
  captureSelectionAnchor: () => captureSelectionAnchor(window, document),
  createImageAnchorFromElement
};

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "paperqa:capture-selection") {
    return false;
  }

  sendResponse({
    ok: true,
    anchor: captureSelectionAnchor(window, document)
  });
  return true;
});
