import { AcademicShell } from "../components/AcademicShell";
import { PaperSearch } from "../components/PaperSearch";

export default async function HomePage({
  searchParams
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;

  return (
    <AcademicShell>
      <PaperSearch q={q} />
    </AcademicShell>
  );
}
