import { AcademicShell } from "../../../components/AcademicShell";
import { AnchorPanel } from "../../../components/AnchorPanel";
import { DiscussionBadges } from "../../../components/DiscussionPanel";
import {
  getAnchorForDiscussion,
  getDiscussion,
  getPaper,
  sampleDiscussions
} from "../../../components/sampleData";

export default async function DiscussionDetailPage({
  params
}: {
  params: Promise<{ discussionId: string }>;
}) {
  const { discussionId } = await params;
  const discussion = getDiscussion(discussionId);

  if (!discussion) {
    return (
      <AcademicShell>
        <section className="error-state">
          <h1 className="page-title">Discussion not found</h1>
          <p>We could not find sample UI data for this discussion.</p>
        </section>
      </AcademicShell>
    );
  }

  const paper = getPaper(discussion.paperId);
  const anchor = getAnchorForDiscussion(discussion);
  const related = sampleDiscussions.filter(
    (item) => item.id !== discussion.id && item.anchorId === discussion.anchorId
  );

  return (
    <AcademicShell>
      <div className="stack">
        <section className="panel stack">
          <div>
            <p className="page-kicker">{paper?.title ?? "Paper discussion"}</p>
            <h1 className="page-title">{discussion.title}</h1>
            <p className="page-summary">{discussion.body}</p>
          </div>
          <DiscussionBadges discussion={discussion} />
          <div className="meta-row">
            <span>{discussion.author}</span>
            <span>{discussion.createdAt}</span>
            <span>{discussion.votes} votes</span>
            <span>Heat {discussion.heat}</span>
          </div>
        </section>

        {anchor ? <AnchorPanel anchor={anchor} showRelated={false} /> : null}

        <section className="panel">
          <h2 className="section-title">Related answers</h2>
          <ul className="compact-list">
            {discussion.answers.map((answer) => (
              <li key={answer}>{answer}</li>
            ))}
            {related.map((item) => (
              <li key={item.id}>{item.title}</li>
            ))}
          </ul>
        </section>

        <section className="panel">
          <h2 className="section-title">Comments</h2>
          <ul className="compact-list">
            {discussion.comments.map((comment) => (
              <li key={comment}>{comment}</li>
            ))}
          </ul>
        </section>

        <section className="panel">
          <h2 className="section-title">Author response area</h2>
          {discussion.authorResponse ? (
            <p>{discussion.authorResponse}</p>
          ) : (
            <p className="row-copy">No verified author response has been posted for this question.</p>
          )}
        </section>
      </div>
    </AcademicShell>
  );
}
