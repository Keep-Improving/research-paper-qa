import { describe, expect, it } from "vitest";

import { detectPaper } from "../src/content/paperDetection";

function docFrom(html: string, title = ""): Document {
  const doc = document.implementation.createHTMLDocument();
  doc.head.innerHTML = html;
  doc.title = title;
  return doc;
}

describe("detectPaper", () => {
  it("detects and normalizes a DOI meta tag", () => {
    const doc = docFrom('<meta name="doi" content="10.1000/xyz">');

    expect(detectPaper(doc, { href: "https://publisher.example/article" })).toMatchObject({
      doi: "10.1000/xyz",
      url: "https://publisher.example/article",
      confidence: "high"
    });
  });

  it("detects and normalizes a citation DOI meta tag", () => {
    const doc = docFrom('<meta name="citation_doi" content="https://doi.org/10.1000/ABC">');

    expect(detectPaper(doc, { href: "https://publisher.example/article" }).doi).toBe("10.1000/abc");
  });

  it("detects an arXiv paper URL", () => {
    const result = detectPaper(docFrom(""), { href: "https://arxiv.org/abs/2401.12345" });

    expect(result).toMatchObject({ arxivId: "2401.12345", confidence: "high" });
  });

  it("detects a PubMed paper URL", () => {
    const result = detectPaper(docFrom(""), {
      href: "https://pubmed.ncbi.nlm.nih.gov/12345678/"
    });

    expect(result).toMatchObject({ pmid: "12345678", confidence: "high" });
  });

  it("detects and normalizes a DOI landing URL", () => {
    const result = detectPaper(docFrom(""), { href: "https://doi.org/10.1000/XYZ" });

    expect(result).toMatchObject({ doi: "10.1000/xyz", confidence: "high" });
  });

  it("falls back to document.title with low confidence", () => {
    const doc = docFrom("", "A Paper Title - Journal Site");

    expect(detectPaper(doc, { href: "https://example.test/paper" })).toEqual({
      title: "A Paper Title - Journal Site",
      url: "https://example.test/paper",
      confidence: "low"
    });
  });
});
