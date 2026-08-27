import { cookies } from "next/headers";

import { AcademicShell } from "../../../components/AcademicShell";
import { AuthorWorkbench, type AuthorWorkbenchPaper } from "../../../components/AuthorWorkbench";
import { getCurrentUserId } from "../../../lib/auth/currentUser";
import { normalizeEmail } from "../../../lib/repositories/authorIdentities";
import { prisma } from "../../../lib/prisma";

export default async function AuthorWorkbenchPage() {
  const cookieStore = await cookies();
  const request = new Request("http://localhost/author/workbench", {
    headers: {
      cookie: cookieStore.toString()
    }
  });
  const userId = await getCurrentUserId(prisma, request);
  const user = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, emailVerifiedAt: true }
      })
    : null;

  const papers = await loadWorkbenchPapers(user?.emailVerifiedAt ? user.email : null);

  return (
    <AcademicShell>
      <AuthorWorkbench papers={papers} userEmail={user?.email ?? null} emailVerified={Boolean(user?.emailVerifiedAt)} />
    </AcademicShell>
  );
}

async function loadWorkbenchPapers(userEmail: string | null): Promise<AuthorWorkbenchPaper[]> {
  const normalizedEmail = userEmail ? normalizeEmail(userEmail) : null;
  const papers = await prisma.paper.findMany({
    include: {
      authorIdentities: normalizedEmail
        ? {
            where: {
              normalizedEmail,
              status: "verified",
              role: {
                in: ["first_author", "corresponding_author"]
              }
            }
          }
        : false,
      discussions: {
        where: {
          isHidden: false,
          status: {
            in: ["open", "disputed"]
          }
        },
        include: {
          anchor: true,
          replies: true,
          votes: true
        },
        orderBy: [{ createdAt: "desc" }]
      }
    },
    orderBy: [{ updatedAt: "desc" }]
  });

  return papers
    .map((paper) => {
      const canPublishAuthorResponse = Boolean(normalizedEmail && paper.authorIdentities.length > 0);

      return {
        id: paper.id,
        title: paper.title,
        isDemo: paper.isDemo,
        venue: paper.venue,
        year: paper.year,
        canPublishAuthorResponse,
        discussions: paper.discussions.map((discussion) => ({
          id: discussion.id,
          title: discussion.title,
          body: discussion.body,
          heat: discussion.votes.length + discussion.replies.length,
          votes: discussion.votes.length,
          createdAt: discussion.createdAt.toISOString(),
          anchorTitle: discussion.anchor?.title ?? discussion.anchor?.quoteText ?? null
          ,isDemo: discussion.isDemo
        }))
      };
    })
    .filter((paper) => paper.canPublishAuthorResponse || paper.discussions.length > 0);
}
