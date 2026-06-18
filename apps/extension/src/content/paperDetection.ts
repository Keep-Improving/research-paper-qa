export type DetectedPaper = {
  doi?: string;
  arxivId?: string;
  pmid?: string;
  title?: string;
  url: string;
  confidence: "high" | "medium" | "low";
};

export function normalizeDoi(value: string): string {
  return value
    .trim()
    .replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "")
    .replace(/^doi:\s*/i, "")
    .replace(/^https?:\/\/doi\.org\//i, "")
    .toLowerCase();
}

export function detectPaper(
  document: Document,
  locationLike: Pick<Location, "href">
): DetectedPaper {
  const url = locationLike.href;
  const metaDoi = readMeta(document, ["doi", "dc.identifier", "citation_doi"]);
  const doiFromUrl = matchDoiUrl(url);
  const arxivId = matchArxivUrl(url);
  const pmid = matchPubMedUrl(url);
  const title = document.title.trim() || undefined;

  if (metaDoi) {
    return compactPaper({ doi: normalizeDoi(metaDoi), title, url, confidence: "high" });
  }

  if (doiFromUrl) {
    return compactPaper({ doi: normalizeDoi(doiFromUrl), title, url, confidence: "high" });
  }

  if (arxivId) {
    return compactPaper({ arxivId, title, url, confidence: "high" });
  }

  if (pmid) {
    return compactPaper({ pmid, title, url, confidence: "high" });
  }

  return compactPaper({ title, url, confidence: title ? "low" : "low" });
}

function readMeta(document: Document, names: string[]): string | undefined {
  for (const name of names) {
    const selector = [
      `meta[name="${name}"]`,
      `meta[name="${name.toUpperCase()}"]`,
      `meta[property="${name}"]`
    ].join(",");
    const content = document.querySelector<HTMLMetaElement>(selector)?.content.trim();
    if (content) {
      return content;
    }
  }
  return undefined;
}

function matchDoiUrl(url: string): string | undefined {
  const doiUrlMatch = url.match(/^https?:\/\/(?:dx\.)?doi\.org\/(.+)$/i);
  if (doiUrlMatch?.[1]) {
    return doiUrlMatch[1];
  }

  const inlineDoiMatch = url.match(/(10\.\d{4,9}\/[^\s?#]+)/i);
  return inlineDoiMatch?.[1];
}

function matchArxivUrl(url: string): string | undefined {
  return url.match(/^https?:\/\/arxiv\.org\/(?:abs|pdf)\/([^?#/]+)(?:\.pdf)?/i)?.[1];
}

function matchPubMedUrl(url: string): string | undefined {
  return url.match(/^https?:\/\/pubmed\.ncbi\.nlm\.nih\.gov\/(\d+)\/?/i)?.[1];
}

function compactPaper(paper: DetectedPaper): DetectedPaper {
  return Object.fromEntries(
    Object.entries(paper).filter(([, value]) => value !== undefined && value !== "")
  ) as DetectedPaper;
}
