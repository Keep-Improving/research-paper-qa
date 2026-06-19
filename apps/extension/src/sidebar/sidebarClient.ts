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
  const response = (await chrome.runtime.sendMessage({
    type: "paperqa:capture-active-tab-selection"
  })) as CaptureSelectionResponse;

  if (!response.ok) {
    throw new Error(response.error);
  }

  return response.anchor;
}
