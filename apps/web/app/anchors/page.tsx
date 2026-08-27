import Link from "next/link";

import { AcademicShell } from "../../components/AcademicShell";
import { prisma } from "../../lib/prisma";
import { getServerMessages } from "../../lib/i18n/server";
import { DemoBadge } from "../../components/DemoBadge";

export default async function AnchorsPage() {
  const { t } = await getServerMessages();
  const anchors = await prisma.anchor.findMany({
    include: { paper: true },
    orderBy: [{ updatedAt: "desc" }],
    take: 100
  });

  return (
    <AcademicShell>
      <section className="panel stack">
        <div>
          <p className="page-kicker">{t("anchors.kicker")}</p>
          <h1 className="page-title">{t("anchors.title")}</h1>
          <p className="page-summary">{t("common.browseAnchorsOnly")}</p>
        </div>
        <ul className="result-list">
          {anchors.map((anchor) => (
            <li className="result-row" key={anchor.id}>
              <Link href={`/anchors/${anchor.id}`}>{anchor.title ?? anchor.quoteText ?? anchor.id}</Link>
              {anchor.isDemo ? <DemoBadge /> : null}
              <p className="row-copy">{anchor.quoteText ?? anchor.contextText ?? t("common.noQuote")}</p>
              <div className="meta-row">
                <span>{anchor.kind}</span>
                <span>{anchor.paper.title}</span>
                {anchor.pageNumber ? <span>{t("common.page")} {anchor.pageNumber}</span> : null}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </AcademicShell>
  );
}
