type PaperMatchInput = {
  title?: string | null;
  doi?: string | null;
  arxivId?: string | null;
  arxiv_id?: string | null;
  pmid?: string | null;
  url?: string | null;
};

type PaperPrisma = {
  paper: {
    findFirst: (args: any) => Promise<unknown>;
    create: (args: any) => Promise<unknown>;
  };
};

export async function matchPaper(prisma: PaperPrisma, input: PaperMatchInput) {
  const doi = normalizeDoi(input.doi ?? undefined);
  const arxivId = input.arxivId ?? input.arxiv_id ?? undefined;
  const pmid = input.pmid ?? undefined;
  const url = input.url ?? undefined;
  const identifiers: Array<Record<string, string>> = [];
  if (doi) identifiers.push({ doi });
  if (arxivId) identifiers.push({ arxivId });
  if (pmid) identifiers.push({ pmid });
  if (url) identifiers.push({ url });

  if (identifiers.length > 0) {
    const existing = await prisma.paper.findFirst({
      where: {
        OR: identifiers
      }
    });

    if (existing) {
      return existing;
    }
  }

  return prisma.paper.create({
    data: {
      title: input.title?.trim() || url || doi || arxivId || pmid || "Untitled paper",
      doi,
      arxivId,
      pmid,
      url,
      authors: []
    }
  });
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
