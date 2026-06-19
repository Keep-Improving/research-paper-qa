import { AcademicShell } from "../../../components/AcademicShell";
import { AuthorWorkbench } from "../../../components/AuthorWorkbench";

export default async function AuthorWorkbenchPage({
  searchParams
}: {
  searchParams: Promise<{ claim?: string }>;
}) {
  const { claim } = await searchParams;

  return (
    <AcademicShell>
      <AuthorWorkbench claim={claim} />
    </AcademicShell>
  );
}
