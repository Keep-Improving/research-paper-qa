import { AcademicShell } from "../../../components/AcademicShell";
import { DiscussionBadges } from "../../../components/DiscussionPanel";
import { CollectionButton, ReplyForm, ReportButton, ResponseThread, VoteButton } from "../../../components/DiscussionActions";
import { prisma } from "../../../lib/prisma";
import { getDiscussionDetail } from "../../../lib/repositories/discussions";
import { getServerMessages } from "../../../lib/i18n/server";

export default async function DiscussionDetailPage({
  params
}: {
  params: Promise<{ discussionId: string }>;
}) {
  const { t } = await getServerMessages();
  const { discussionId } = await params;
  const discussion = await getDiscussionDetail(prisma, discussionId);

  if (!discussion) {
    return (
      <AcademicShell>
        <section className="error-state">
          <h1 className="page-title">{t("common.discussionNotFound")}</h1>
          <p>{t("common.notFoundBody")}</p>
        </section>
      </AcademicShell>
    );
  }

  const paper = await prisma.paper.findUnique({ where: { id: discussion.paperId } });
  const anchor = discussion.anchor as { kind?: string; title?: string | null; quoteText?: string | null; contextText?: string | null; imageUrl?: string | null } | null;
  const authorResponses = discussion.replies.filter((reply) => reply.isAuthorResponse);

  return (
    <AcademicShell>
      <div className="stack">
        <section className="panel stack">
          <div>
            <p className="page-kicker">{paper?.title ?? t("common.paperDiscussion")}</p>
            <h1 className="page-title">{discussion.title}</h1>
            <p className="page-summary">{discussion.body}</p>
            <div className="toolbar">
              <a className="button" href={`/papers/${discussion.paperId}`}>{t("common.backToPaper")}</a>
              <a className="button" href={`/?q=${encodeURIComponent(paper?.title ?? discussion.title)}`}>{t("common.allQuestionsForPaper")}</a>
            </div>
          </div>
          <DiscussionBadges discussion={discussion} />
          <div className="meta-row">
            <span>{discussion.authorName}</span>
            <span>{discussion.createdAt}</span>
            <span>{discussion.answerCount} {t("common.answers")}</span>
            <span>{discussion.commentCount} {t("common.comments")}</span>
            <span>{t("common.heat")} {discussion.heat}</span>
          </div>
          <div className="toolbar">
            <VoteButton discussionId={discussion.id} />
            <CollectionButton label={t("common.saveDiscussion")} targetId={discussion.id} targetType="discussion" />
            <ReportButton targetId={discussion.id} targetType="discussion" />
          </div>
        </section>

        {anchor ? (
          <section className="panel stack">
            <h2 className="section-title">{t("common.anchor")}</h2>
            {anchor.title ? <p className="section-kicker">{anchor.title}</p> : null}
            {anchor.quoteText ? <blockquote className="anchor-quote">{anchor.quoteText}</blockquote> : null}
            {anchor.contextText ? <p className="row-copy">{anchor.contextText}</p> : null}
            {anchor.imageUrl ? <img alt={anchor.title ?? t("common.anchor")} className="anchor-image" src={anchor.imageUrl} /> : null}
          </section>
        ) : null}

        <ResponseThread discussionId={discussion.id} replies={discussion.replies} />

        <section className="panel">
          <h2 className="section-title">{t("common.authorResponse")}</h2>
          {authorResponses.length > 0 ? (
            <ul className="compact-list">
              {authorResponses.map((reply) => (
                <li key={reply.id}>{reply.body}</li>
              ))}
            </ul>
          ) : (
            <p className="row-copy">{t("common.noAuthorResponse")}</p>
          )}
        </section>

        <ReplyForm discussionId={discussion.id} />
      </div>
    </AcademicShell>
  );
}
