import { AcademicShell } from "../../../components/AcademicShell";
import { AnchorPanel } from "../../../components/AnchorPanel";
import { prisma } from "../../../lib/prisma";

export default async function AnchorDetailPage({
  params
}: {
  params: Promise<{ anchorId: string }>;
}) {
  const { anchorId } = await params;
  const anchor = await prisma.anchor.findUnique({
    where: { id: anchorId },
    include: {
      discussions: {
        where: { isHidden: false },
        include: { votes: true },
        orderBy: [{ createdAt: "desc" }]
      },
      paper: true
    }
  });

  if (!anchor) {
    return (
      <AcademicShell>
        <section className="error-state">
          <h1 className="page-title">Anchor not found</h1>
          <p>We could not find this anchor in the shared database.</p>
        </section>
      </AcademicShell>
    );
  }

  return (
    <AcademicShell>
      <AnchorPanel anchor={anchor} />
    </AcademicShell>
  );
}
