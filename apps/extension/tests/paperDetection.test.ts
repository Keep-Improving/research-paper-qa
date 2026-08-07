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

  it("falls back with low confidence when a DOI meta tag contains trailing content", () => {
    const doc = docFrom('<meta name="doi" content="10.1000/foo bar">', "Fallback Title");

    expect(detectPaper(doc, { href: "https://publisher.example/article" })).toEqual({
      title: "Fallback Title",
      url: "https://publisher.example/article",
      confidence: "low"
    });
  });

  it("does not normalize DOI meta values or URLs that contain whitespace", () => {
    const metaResult = detectPaper(docFrom('<meta name="doi" content="10.1000/foo bar">'), {
      href: "https://publisher.example/article"
    });
    const urlResult = detectPaper(docFrom(""), {
      href: "https://doi.org/10.1000/foo%20bar"
    });

    expect(metaResult.doi).toBeUndefined();
    expect(metaResult.confidence).toBe("low");
    expect(urlResult.doi).toBeUndefined();
    expect(urlResult.confidence).toBe("low");
  });

  it("detects an arXiv paper URL", () => {
    const result = detectPaper(docFrom(""), { href: "https://arxiv.org/abs/2401.12345" });

    expect(result).toMatchObject({ arxivId: "2401.12345", confidence: "high" });
  });

  it("normalizes an arXiv PDF URL without dropping a version suffix", () => {
    expect(
      detectPaper(docFrom(""), { href: "https://arxiv.org/pdf/2401.12345.pdf" }).arxivId
    ).toBe("2401.12345");
    expect(
      detectPaper(docFrom(""), { href: "https://arxiv.org/pdf/2401.12345v2.pdf" }).arxivId
    ).toBe("2401.12345v2");
  });

  it("does not set high-confidence arXiv IDs for invalid arXiv-like URLs", () => {
    const result = detectPaper(docFrom("", "Not a paper"), {
      href: "https://arxiv.org/pdf/not-an-id.pdf"
    });

    expect(result.arxivId).toBeUndefined();
    expect(result.confidence).toBe("low");
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

  it("normalizes a DOI landing URL with query and hash", () => {
    const result = detectPaper(docFrom(""), {
      href: "https://doi.org/10.1000/XYZ?download=1#section"
    });

    expect(result).toMatchObject({ doi: "10.1000/xyz", confidence: "high" });
  });

  it("does not overmatch DOI landing paths with trailing punctuation or invalid DOI values", () => {
    expect(detectPaper(docFrom(""), { href: "https://doi.org/10.1000/xyz)." }).doi).toBe(
      "10.1000/xyz"
    );

    const invalid = detectPaper(docFrom("", "Invalid DOI"), {
      href: "https://doi.org/not-a-doi/10.1000"
    });
    expect(invalid.doi).toBeUndefined();
    expect(invalid.confidence).toBe("low");
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
