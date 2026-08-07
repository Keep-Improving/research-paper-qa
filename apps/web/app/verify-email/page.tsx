import { AcademicShell } from "../../components/AcademicShell";
import { VerifyEmailPanel } from "../../components/VerifyEmailPanel";

type VerifyEmailPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const params = await searchParams;

  return (
    <AcademicShell>
      <VerifyEmailPanel token={params.token ?? ""} />
    </AcademicShell>
  );
}
