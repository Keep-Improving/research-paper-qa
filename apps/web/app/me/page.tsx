import { cookies } from "next/headers";

import { AcademicShell } from "../../components/AcademicShell";
import { MyWorkspace, type MyWorkspaceData } from "../../components/MyWorkspace";
import { getCurrentUserId } from "../../lib/auth/currentUser";
import { prisma } from "../../lib/prisma";
import { listUserCollections } from "../../lib/repositories/collections";
import { listUserDiscussions } from "../../lib/repositories/discussions";

export default async function MyPage() {
  const cookieStore = await cookies();
  const request = new Request("http://localhost/me", {
    headers: { cookie: cookieStore.toString() }
  });
  const userId = await getCurrentUserId(prisma, request);

  if (!userId) {
    return (
      <AcademicShell>
        <MyWorkspace data={null} />
      </AcademicShell>
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  });
  const collections = await listUserCollections(prisma, userId);
  const [papers, questions, anchors, discussions] = await Promise.all([
    prisma.paper.findMany({
      where: { id: { in: collections.filter((item) => item.targetType === "paper").map((item) => item.targetId) } },
      select: { id: true, title: true, isDemo: true }
    }),
    prisma.discussion.findMany({
      where: {
        id: { in: collections.filter((item) => item.targetType === "discussion").map((item) => item.targetId) },
        isHidden: false
      },
      select: { id: true, title: true, isDemo: true }
    }),
    prisma.anchor.findMany({
      where: { id: { in: collections.filter((item) => item.targetType === "anchor").map((item) => item.targetId) } },
      select: { id: true, title: true, quoteText: true, isDemo: true }
    }),
    listUserDiscussions(prisma, userId)
  ]);

  const data: MyWorkspaceData = {
    collections: {
      papers,
      questions,
      anchors: anchors.map((anchor) => ({
        id: anchor.id,
        title: anchor.title ?? anchor.quoteText ?? anchor.id,
        isDemo: anchor.isDemo
      }))
    },
    discussions,
    canUseAuthorTools: user?.role === "researcher" || user?.role === "admin"
  };

  return (
    <AcademicShell>
      <MyWorkspace data={data} />
    </AcademicShell>
  );
}
