import type { TextAnchorDraft } from "../content/selectionAnchor";

type CaptureSelectionResponse =
  | {
      ok: true;
      anchor: TextAnchorDraft | null;
    }
  | {
      ok: false;
      error: string;
    };

export async function captureActiveTabSelection(): Promise<TextAnchorDraft | null> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id === undefined) {
    return null;
  }

  const response = (await chrome.tabs.sendMessage(tab.id, {
    type: "paperqa:capture-selection"
  })) as CaptureSelectionResponse;

  if (!response.ok) {
    throw new Error(response.error);
  }

  return response.anchor;
}
