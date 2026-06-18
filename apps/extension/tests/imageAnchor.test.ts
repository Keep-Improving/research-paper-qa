import { describe, expect, it } from "vitest";

import { createImageAnchorFromElement } from "../src/content/imageAnchor";

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
});
