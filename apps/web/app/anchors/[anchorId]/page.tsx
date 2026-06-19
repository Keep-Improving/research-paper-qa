import { AcademicShell } from "../../../components/AcademicShell";
import { AnchorPanel } from "../../../components/AnchorPanel";
import { getAnchor } from "../../../components/sampleData";

export default async function AnchorDetailPage({
  params
}: {
  params: Promise<{ anchorId: string }>;
}) {
  const { anchorId } = await params;
  const anchor = getAnchor(anchorId);

  if (!anchor) {
    return (
      <AcademicShell>
        <section className="error-state">
          <h1 className="page-title">Anchor not found</h1>
          <p>We could not find sample UI data for this anchor.</p>
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
