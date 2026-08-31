import Link from "next/link";

import { AcademicShell } from "../../components/AcademicShell";
import { prisma } from "../../lib/prisma";
import { getServerMessages } from "../../lib/i18n/server";
import { DemoBadge } from "../../components/DemoBadge";
import { normalizeDoi, normalizeTitle } from "../../lib/repositories/papers";

export default async function PapersPage() {
  const { t } = await getServerMessages();
  const papers = await prisma.paper.findMany({
    orderBy: [{ updatedAt: "desc" }],
    take: 100
  });
  const uniquePapers = Array.from(
    new Map(papers.filter((paper) => !isObviousNonPaper(paper.title, paper.url)).map((paper) => [paper.doi ? `doi:${normalizeDoi(paper.doi)}` : `title:${canonicalTitle(paper.title, paper.identityTitle)}`, paper])).values()
  );

  return (
    <AcademicShell>
      <section className="panel stack">
        <div>
          <p className="page-kicker">{t("common.library")}</p>
          <h1 className="page-title">{t("papers.title")}</h1>
          <p className="page-summary">{t("common.browseStoredPapers")}</p>
        </div>
        <ul className="result-list">
          {uniquePapers.map((paper) => (
            <li className="result-row" key={paper.id}>
              <Link href={`/papers/${paper.id}`}>{paper.title}</Link>
              {paper.isDemo ? <DemoBadge /> : null}
              <p className="row-copy">{paper.authors.join(", ")}</p>
              <div className="meta-row">
                {paper.venue ? <span>{paper.venue}</span> : null}
                {paper.year ? <span>{paper.year}</span> : null}
                {paper.doi ? <span>{paper.doi}</span> : null}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </AcademicShell>
  );
}

function canonicalTitle(title: string, identityTitle?: string | null) {
  const value = identityTitle || normalizeTitle(title);
  return value.replace(/\s+(?:nature|pmc|pubmed|arxiv)$/i, "").trim();
}

function isObviousNonPaper(title: string, url?: string | null) {
  return /163\s*网易|邮箱|登录|github\.com|sign\s*in|log\s*in/i.test(`${title} ${url ?? ""}`);
}
