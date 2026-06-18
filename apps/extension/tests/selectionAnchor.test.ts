import { describe, expect, it } from "vitest";

import { captureSelectionAnchor } from "../src/content/selectionAnchor";

describe("captureSelectionAnchor", () => {
  it("returns null when there is no selected text", () => {
    const doc = document.implementation.createHTMLDocument("empty");

    expect(captureSelectionAnchor(window, doc)).toBeNull();
  });

  it("captures selected quote text with context, source URL, and DOM path", () => {
    const doc = document.implementation.createHTMLDocument("selection");
    doc.body.innerHTML = `
      <article>
        <p id="target">The methods section explains the normalization strategy in detail.</p>
      </article>
    `;
    const paragraph = doc.getElementById("target")!;
    const range = doc.createRange();
    range.setStart(paragraph.firstChild!, 4);
    range.setEnd(paragraph.firstChild!, 19);
    const selection = {
      rangeCount: 1,
      isCollapsed: false,
      toString: () => "methods section",
      getRangeAt: () => range
    } as unknown as Selection;
    const win = {
      getSelection: () => selection,
      location: { href: "https://publisher.example/paper" }
    } as unknown as Window;

    expect(captureSelectionAnchor(win, doc)).toEqual({
      kind: "text",
      quote_text: "methods section",
      context_text: "The methods section explains the normalization strategy in detail.",
      source_url: "https://publisher.example/paper",
      dom_path: "html > body > article > p#target"
    });
  });
});
