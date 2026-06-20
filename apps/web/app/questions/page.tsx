import Link from "next/link";

import { AcademicShell } from "../../components/AcademicShell";
import { DiscussionBadges } from "../../components/DiscussionPanel";
import { prisma } from "../../lib/prisma";
import { listSearchDiscussions } from "../../lib/repositories/discussions";

export default async function QuestionsPage() {
  const discussions = await listSearchDiscussions(prisma);

  return (
    <AcademicShell>
      <section className="panel stack">
        <div>
          <p className="page-kicker">Discussion index</p>
          <h1 className="page-title">Questions</h1>
          <p className="page-summary">Browse discussion questions only.</p>
        </div>
        <ul className="discussion-list">
          {discussions.map((discussion) => (
            <li className="discussion-row" key={discussion.id}>
              <Link href={`/discussions/${discussion.id}`}>{discussion.title}</Link>
              <p className="row-copy">{discussion.body}</p>
              <DiscussionBadges discussion={discussion} />
              <div className="meta-row">
                <span>{discussion.answerCount + discussion.commentCount} responses</span>
                <span>Heat {discussion.heat}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </AcademicShell>
  );
}
