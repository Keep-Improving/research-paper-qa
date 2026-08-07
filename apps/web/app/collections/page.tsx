import { AcademicShell } from "../../components/AcademicShell";
import { CollectionsOverview } from "../../components/ModerationQueue";
import { prisma } from "../../lib/prisma";
import { listUserCollections } from "../../lib/repositories/collections";

export default async function CollectionsPage() {
  const collections = await listUserCollections(prisma, "user-reader");
  const [papers, discussions, anchors] = await Promise.all([
    prisma.paper.findMany({
      where: {
        id: { in: collections.filter((item) => item.targetType === "paper").map((item) => item.targetId) }
      }
    }),
    prisma.discussion.findMany({
      where: {
        id: { in: collections.filter((item) => item.targetType === "discussion").map((item) => item.targetId) },
        isHidden: false
      }
    }),
    prisma.anchor.findMany({
      where: {
        id: { in: collections.filter((item) => item.targetType === "anchor").map((item) => item.targetId) }
      }
    })
  ]);

  return (
    <AcademicShell>
      <CollectionsOverview anchors={anchors} discussions={discussions} papers={papers} />
    </AcademicShell>
  );
}
