export type DetectedPaper = {
  doi?: string;
  arxivId?: string;
  pmid?: string;
  title?: string;
  url: string;
  confidence: "high" | "medium" | "low";
};

export function normalizeDoi(value: string): string {
  const cleaned = value
    .trim()
    .replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "")
    .replace(/^doi:\s*/i, "")
    .replace(/^https?:\/\/doi\.org\//i, "")
    .replace(/[?#].*$/, "")
    .replace(/[).,\];:]+$/, "")
    .toLowerCase();

  return isDoi(cleaned) ? cleaned : "";
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
  const parsedUrl = parseUrl(url);
  if (parsedUrl && /^(?:dx\.)?doi\.org$/i.test(parsedUrl.hostname)) {
    const doi = normalizeDoi(decodeURIComponent(parsedUrl.pathname.replace(/^\/+/, "")));
    return doi || undefined;
  }

  const inlineDoiMatch = url.match(/(10\.\d{4,9}\/[^\s?#]+)/i);
  const inlineDoi = inlineDoiMatch ? normalizeDoi(inlineDoiMatch[1]) : "";
  return inlineDoi || undefined;
}

function matchArxivUrl(url: string): string | undefined {
  const parsedUrl = parseUrl(url);
  if (!parsedUrl || parsedUrl.hostname.toLowerCase() !== "arxiv.org") {
    return undefined;
  }

  const match = parsedUrl.pathname.match(/^\/(?:abs|pdf)\/([^/]+)$/i);
  const candidate = match?.[1]?.replace(/\.pdf$/i, "");
  return candidate && isArxivId(candidate) ? candidate : undefined;
}

function matchPubMedUrl(url: string): string | undefined {
  return url.match(/^https?:\/\/pubmed\.ncbi\.nlm\.nih\.gov\/(\d+)\/?/i)?.[1];
}

function compactPaper(paper: DetectedPaper): DetectedPaper {
  return Object.fromEntries(
    Object.entries(paper).filter(([, value]) => value !== undefined && value !== "")
  ) as DetectedPaper;
}

function parseUrl(url: string): URL | undefined {
  try {
    return new URL(url);
  } catch {
    return undefined;
  }
}

function isDoi(value: string): boolean {
  return /^10\.\d{4,9}\/.+$/i.test(value);
}

function isArxivId(value: string): boolean {
  return /^(?:\d{4}\.\d{4,5}|[a-z-]+(?:\.[A-Z]{2})?\/\d{7})(?:v\d+)?$/i.test(value);
}
