import { describe, expect, it } from "vitest";

import {
  createImageAnchorFromElement,
  createImageAnchorFromFile,
  createUrlOnlyImageAnchor
} from "../src/content/imageAnchor";

describe("createImageAnchorFromElement", () => {
  it("preserves source URL, alt text, nearby caption, and image URL", () => {
    document.body.innerHTML = `
      <figure>
        <img src="https://publisher.example/figure-1.png" alt="Kaplan-Meier survival curve">
        <figcaption>Figure 1. Survival differs across cohorts.</figcaption>
      </figure>
    `;

    const img = document.querySelector("img")!;

    expect(createImageAnchorFromElement(img)).toEqual({
      kind: "image",
      source_url: window.location.href,
      image_url: "https://publisher.example/figure-1.png",
      alt_text: "Kaplan-Meier survival curve",
      caption_text: "Figure 1. Survival differs across cohorts."
    });
  });

  it("creates an image anchor with file reference fields from a File", () => {
    const file = new File(["binary"], "figure.png", { type: "image/png" });

    expect(
      createImageAnchorFromFile(file, { createObjectUrl: () => "blob:test/figure" })
    ).toEqual({
      kind: "image",
      image_url: "blob:test/figure",
      file_name: "figure.png",
      file_type: "image/png",
      file_size: 6,
      blob_url: "blob:test/figure"
    });
  });

  it("creates URL-only image anchors without claiming the article source URL", () => {
    expect(createUrlOnlyImageAnchor("https://cdn.example/figure.png")).toEqual({
      kind: "image",
      image_url: "https://cdn.example/figure.png"
    });
  });
});
