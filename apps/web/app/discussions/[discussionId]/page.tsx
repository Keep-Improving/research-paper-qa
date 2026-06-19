import { AcademicShell } from "../../../components/AcademicShell";
import { DiscussionBadges } from "../../../components/DiscussionPanel";
import { CollectionButton, ReplyForm, ReportButton, VoteButton } from "../../../components/DiscussionActions";
import { prisma } from "../../../lib/prisma";
import { getDiscussionDetail } from "../../../lib/repositories/discussions";

export default async function DiscussionDetailPage({
  params
}: {
  params: Promise<{ discussionId: string }>;
}) {
  const { discussionId } = await params;
  const discussion = await getDiscussionDetail(prisma, discussionId);

  if (!discussion) {
    return (
      <AcademicShell>
        <section className="error-state">
          <h1 className="page-title">Discussion not found</h1>
          <p>We could not find this discussion in the shared database.</p>
        </section>
      </AcademicShell>
    );
  }

  const paper = await prisma.paper.findUnique({ where: { id: discussion.paperId } });
  const anchor = discussion.anchor as { kind?: string; title?: string | null; quoteText?: string | null; contextText?: string | null; imageUrl?: string | null } | null;
  const answers = discussion.replies.filter((reply) => reply.kind === "answer");
  const comments = discussion.replies.filter((reply) => reply.kind === "comment");
  const authorResponses = discussion.replies.filter((reply) => reply.isAuthorResponse);

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
            <span>{discussion.authorName}</span>
            <span>{discussion.createdAt}</span>
            <span>{discussion.answerCount} answers</span>
            <span>{discussion.commentCount} comments</span>
            <span>Heat {discussion.heat}</span>
          </div>
          <div className="toolbar">
            <VoteButton discussionId={discussion.id} />
            <CollectionButton label="Save discussion" targetId={discussion.id} targetType="discussion" />
            <ReportButton targetId={discussion.id} targetType="discussion" />
          </div>
        </section>

        {anchor ? (
          <section className="panel stack">
            <h2 className="section-title">Anchor</h2>
            {anchor.quoteText ? <blockquote className="anchor-quote">{anchor.quoteText}</blockquote> : null}
            {anchor.contextText ? <p className="row-copy">{anchor.contextText}</p> : null}
            {anchor.imageUrl ? <img alt={anchor.title ?? "Discussion anchor"} className="anchor-image" src={anchor.imageUrl} /> : null}
          </section>
        ) : null}

        <section className="panel">
          <h2 className="section-title">Answers</h2>
          <ul className="compact-list">
            {answers.map((answer) => (
              <li key={answer.id}>
                <strong>{answer.authorName}</strong>
                <p className="row-copy">{answer.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel">
          <h2 className="section-title">Comments</h2>
          <ul className="compact-list">
            {comments.map((comment) => (
              <li key={comment.id}>
                <strong>{comment.authorName}</strong>
                <p className="row-copy">{comment.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel">
          <h2 className="section-title">Author response area</h2>
          {authorResponses.length > 0 ? (
            <ul className="compact-list">
              {authorResponses.map((reply) => (
                <li key={reply.id}>{reply.body}</li>
              ))}
            </ul>
          ) : (
            <p className="row-copy">No verified author response has been posted for this question.</p>
          )}
        </section>

        <ReplyForm discussionId={discussion.id} />
      </div>
    </AcademicShell>
  );
}
