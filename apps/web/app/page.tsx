import { AcademicShell } from "../components/AcademicShell";
import { PaperSearch } from "../components/PaperSearch";
import { prisma } from "../lib/prisma";
import { listSearchDiscussions } from "../lib/repositories/discussions";

export default async function HomePage({
  searchParams
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const paperWhere = query
    ? {
        OR: [
          { title: { contains: query, mode: "insensitive" as const } },
          { doi: { contains: query, mode: "insensitive" as const } },
          { venue: { contains: query, mode: "insensitive" as const } },
          { abstract: { contains: query, mode: "insensitive" as const } }
        ]
      }
    : {};
  const [papers, discussions] = await Promise.all([
    prisma.paper.findMany({
      where: paperWhere,
      orderBy: [{ updatedAt: "desc" }],
      take: 50
    }),
    listSearchDiscussions(prisma, query)
  ]);

  return (
    <AcademicShell>
      <PaperSearch
        q={q}
        papers={papers.map((paper) => ({
          id: paper.id,
          title: paper.title,
          authors: paper.authors,
          venue: paper.venue,
          year: paper.year,
          doi: paper.doi,
          abstract: paper.abstract,
          isDemo: paper.isDemo
        }))}
        discussions={discussions}
      />
    </AcademicShell>
  );
}
