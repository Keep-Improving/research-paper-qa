import Link from "next/link";

import { AcademicShell } from "../../components/AcademicShell";
import { DiscussionBadges } from "../../components/DiscussionPanel";
import { prisma } from "../../lib/prisma";
import { listSearchDiscussions } from "../../lib/repositories/discussions";
import { getServerMessages } from "../../lib/i18n/server";

export default async function QuestionsPage() {
  const { t } = await getServerMessages();
  const discussions = await listSearchDiscussions(prisma);

  return (
    <AcademicShell>
      <section className="panel stack">
        <div>
          <p className="page-kicker">{t("questions.kicker")}</p>
          <h1 className="page-title">{t("questions.title")}</h1>
          <p className="page-summary">{t("common.browseDiscussionQuestions")}</p>
        </div>
        <ul className="discussion-list">
          {discussions.map((discussion) => (
            <li className="discussion-row" key={discussion.id}>
              <Link href={`/discussions/${discussion.id}`}>{discussion.title}</Link>
              <p className="row-copy">{discussion.body}</p>
              <DiscussionBadges discussion={discussion} />
              <div className="meta-row">
                <span>{discussion.answerCount + discussion.commentCount} {t("common.responses")}</span>
                <span>{t("common.heat")} {discussion.heat}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </AcademicShell>
  );
}
