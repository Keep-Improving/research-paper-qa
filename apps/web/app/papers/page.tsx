import Link from "next/link";

import { AcademicShell } from "../../components/AcademicShell";
import { prisma } from "../../lib/prisma";

export default async function PapersPage() {
  const papers = await prisma.paper.findMany({
    orderBy: [{ updatedAt: "desc" }],
    take: 100
  });

  return (
    <AcademicShell>
      <section className="panel stack">
        <div>
          <p className="page-kicker">Library</p>
          <h1 className="page-title">Papers</h1>
          <p className="page-summary">Browse stored papers only.</p>
        </div>
        <ul className="result-list">
          {papers.map((paper) => (
            <li className="result-row" key={paper.id}>
              <Link href={`/papers/${paper.id}`}>{paper.title}</Link>
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
