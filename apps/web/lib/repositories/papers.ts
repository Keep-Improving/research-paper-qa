type PaperMatchInput = {
  title?: string | null;
  doi?: string | null;
  arxivId?: string | null;
  arxiv_id?: string | null;
  pmid?: string | null;
  url?: string | null;
  manual?: boolean;
};

type PaperPrisma = {
  paper: {
    findFirst: (args: any) => Promise<unknown>;
    create: (args: any) => Promise<unknown>;
  };
  paperLink?: {
    upsert: (args: any) => Promise<unknown>;
  };
};

export async function matchPaper(prisma: PaperPrisma, input: PaperMatchInput) {
  const doi = normalizeDoi(input.doi ?? undefined);
  const arxivId = input.arxivId ?? input.arxiv_id ?? undefined;
  const pmid = input.pmid ?? undefined;
  const url = input.url ?? undefined;
  const manual = input.manual === true;
  const title = input.title?.trim() || url || doi || arxivId || pmid || "Untitled paper";
  const identityTitle = normalizeTitle(title);
  const identifiers: Array<Record<string, string>> = [];
  if (doi) identifiers.push({ doi });
  if (identityTitle) identifiers.push({ identityTitle });
  if (pmid) identifiers.push({ pmid });
  if (arxivId) identifiers.push({ arxivId });
  if (url) identifiers.push({ url });

  for (const where of identifiers) {
    const existing = await prisma.paper.findFirst({ where });
    if (existing) {
      if (url && prisma.paperLink) {
        await prisma.paperLink.upsert({ where: { url }, update: { isManual: manual || undefined }, create: { url, paperId: (existing as { id: string }).id, isManual: manual } });
      }
      return existing;
    }
  }

  const created = await prisma.paper.create({
    data: {
      title,
      identityTitle,
      doi,
      arxivId,
      pmid,
      url,
      authors: []
    }
  });
  if (url && prisma.paperLink) {
    await prisma.paperLink.upsert({ where: { url }, update: { isManual: manual || undefined }, create: { url, paperId: (created as { id: string }).id, isManual: manual } });
  }
  return created;
}

export function normalizeTitle(value: string) {
  return value.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

export function normalizeDoi(value?: string) {
  if (!value) {
    return undefined;
  }

  const cleaned = value
    .trim()
    .replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "")
    .replace(/^doi:\s*/i, "")
    .replace(/[?#].*$/, "")
    .replace(/[).,\];:]+$/, "")
    .toLowerCase();

  return cleaned || undefined;
}

export function isBlockedPaperUrl(value?: string | null) {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    const host = parsed.hostname.toLowerCase();
    return host === "github.com" || host.endsWith(".github.com") || host === "mail.163.com" || host === "mail.126.com" || host === "gmail.com" || host === "outlook.com" || host === "localhost" || host === "127.0.0.1";
  } catch {
    return false;
  }
}
