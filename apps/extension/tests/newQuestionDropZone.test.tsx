import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";

import { NewQuestionDropZone } from "../src/sidebar/NewQuestionDropZone";

function renderDropZone(onImageAnchor = vi.fn()) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);

  act(() => {
    root.render(
      <NewQuestionDropZone
        onUseSelection={() => null}
        onImageAnchor={onImageAnchor}
        onManualAnchor={() => undefined}
      />
    );
  });

  return {
    container,
    root,
    zone: container.querySelector<HTMLElement>("[aria-label='New question anchor']")!,
    onImageAnchor
  };
}

function dropWithDataTransfer(
  zone: HTMLElement,
  dataTransfer: Partial<DataTransfer> & { getData: (format: string) => string }
) {
  const event = new Event("drop", { bubbles: true, cancelable: true });
  Object.defineProperty(event, "dataTransfer", { value: dataTransfer });

  act(() => {
    zone.dispatchEvent(event);
  });
}

describe("NewQuestionDropZone", () => {
  it("handles dropped image files and passes file reference fields", () => {
    const onImageAnchor = vi.fn();
    const { root, zone } = renderDropZone(onImageAnchor);
    const file = new File(["image"], "figure.png", { type: "image/png" });

    dropWithDataTransfer(zone, {
      files: [file] as unknown as FileList,
      getData: () => ""
    });

    expect(onImageAnchor).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "image",
        file_name: "figure.png",
        file_type: "image/png",
        file_size: 5
      })
    );

    act(() => root.unmount());
  });

  it("handles URI image drops as URL-only anchors without article source_url", () => {
    const onImageAnchor = vi.fn();
    const { root, zone } = renderDropZone(onImageAnchor);

    dropWithDataTransfer(zone, {
      files: [] as unknown as FileList,
      getData: (format) =>
        format === "text/uri-list" ? "https://cdn.example/figure.png" : ""
    });

    expect(onImageAnchor).toHaveBeenCalledWith({
      kind: "image",
      image_url: "https://cdn.example/figure.png"
    });

    act(() => root.unmount());
  });
});
