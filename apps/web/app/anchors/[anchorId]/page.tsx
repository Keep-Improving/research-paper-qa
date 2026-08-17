import { AcademicShell } from "../../../components/AcademicShell";
import { AnchorPanel } from "../../../components/AnchorPanel";
import { prisma } from "../../../lib/prisma";
import { getServerMessages } from "../../../lib/i18n/server";

export default async function AnchorDetailPage({
  params
}: {
  params: Promise<{ anchorId: string }>;
}) {
  const { t } = await getServerMessages();
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
          <h1 className="page-title">{t("common.anchorNotFound")}</h1>
          <p>{t("common.notFoundBody")}</p>
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
