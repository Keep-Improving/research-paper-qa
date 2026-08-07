import Link from "next/link";

import { AcademicShell } from "../../components/AcademicShell";
import { prisma } from "../../lib/prisma";

export default async function AnchorsPage() {
  const anchors = await prisma.anchor.findMany({
    include: { paper: true },
    orderBy: [{ updatedAt: "desc" }],
    take: 100
  });

  return (
    <AcademicShell>
      <section className="panel stack">
        <div>
          <p className="page-kicker">Anchor index</p>
          <h1 className="page-title">Anchors</h1>
          <p className="page-summary">Browse quote, figure, and manual anchors only.</p>
        </div>
        <ul className="result-list">
          {anchors.map((anchor) => (
            <li className="result-row" key={anchor.id}>
              <Link href={`/anchors/${anchor.id}`}>{anchor.title ?? anchor.quoteText ?? anchor.id}</Link>
              <p className="row-copy">{anchor.quoteText ?? anchor.contextText ?? "No quote stored."}</p>
              <div className="meta-row">
                <span>{anchor.kind}</span>
                <span>{anchor.paper.title}</span>
                {anchor.pageNumber ? <span>Page {anchor.pageNumber}</span> : null}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </AcademicShell>
  );
}
