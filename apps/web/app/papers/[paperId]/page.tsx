import { AcademicShell } from "../../../components/AcademicShell";
import { CollectionButton } from "../../../components/DiscussionActions";
import { DiscussionPanel } from "../../../components/DiscussionPanel";
import { InlineHint } from "../../../components/InlineHint";
import { prisma } from "../../../lib/prisma";
import { listPaperDiscussions } from "../../../lib/repositories/discussions";
import { getServerMessages } from "../../../lib/i18n/server";

export default async function PaperDetailPage({
  params
}: {
  params: Promise<{ paperId: string }>;
}) {
  const { t } = await getServerMessages();
  const { paperId } = await params;
  const paper = await prisma.paper.findUnique({
    where: { id: paperId },
    include: {
      anchors: true
    }
  });

  if (!paper) {
    return (
      <AcademicShell>
        <section className="error-state">
          <h1 className="page-title">{t("common.paperNotFound")}</h1>
          <p>{t("common.notFoundBody")}</p>
        </section>
      </AcademicShell>
    );
  }

  const discussions = await listPaperDiscussions(prisma, paper.id);
  const anchors = paper.anchors;
  const authorResponses = discussions.filter((discussion) => discussion.isAuthorResponse);
  const hotDiscussions = [...discussions].sort((a, b) => b.heat - a.heat).slice(0, 2);
  const unanswered = discussions.filter((discussion) => discussion.status === "open" && discussion.answerCount === 0);
  const textAnchors = anchors.filter((anchor) => anchor.kind === "text");
  const figureAnchors = anchors.filter((anchor) => anchor.kind === "figure" || anchor.kind === "image");

  return (
    <AcademicShell>
      <div className="stack">
        <section className="panel stack">
          <div>
            <p className="page-kicker">{t("common.sharedPaperDiscussion")}</p>
            <h1 className="page-title">{paper.title}</h1>
            <p className="page-summary">{paper.abstract ?? t("common.noAbstract")}</p>
            <div className="meta-row">
              <span>{paper.authors.join(", ")}</span>
              {paper.venue ? <span>{paper.venue}</span> : null}
              {paper.year ? <span>{paper.year}</span> : null}
              {paper.doi ? <span>{paper.doi}</span> : null}
            </div>
          </div>
          <div className="toolbar">
            <CollectionButton label={t("common.addToCollection")} targetId={paper.id} targetType="paper" />
            <CollectionButton label={t("common.followPaper")} targetId={paper.id} targetType="paper" />
          </div>
          <InlineHint messageKey="hint.anchor" storageKey="paperqa-hint:anchor" />
        </section>

        <div className="two-column">
          <div className="stack">
            <DiscussionPanel discussions={discussions} />
            <section className="panel">
              <h2 className="section-title">{t("common.authorResponse")}</h2>
              <ul className="compact-list">
                {authorResponses.map((discussion) => (
                  <li key={discussion.id}>{discussion.title}</li>
                ))}
              </ul>
            </section>
          </div>

          <aside className="stack" aria-label="Paper summary sections">
            <section className="panel">
              <h2 className="section-title">{t("common.anchorGroups")}</h2>
              <h3>{t("common.textAnchors")}</h3>
              <ul className="compact-list">
                {textAnchors.map((anchor) => (
                  <li key={anchor.id}>{anchor.title ?? anchor.quoteText ?? anchor.id}</li>
                ))}
              </ul>
              <h3>{t("common.figureAnchors")}</h3>
              <ul className="compact-list">
                {figureAnchors.map((anchor) => (
                  <li key={anchor.id}>{anchor.title ?? anchor.imageAlt ?? anchor.id}</li>
                ))}
              </ul>
            </section>

            <section className="panel">
              <h2 className="section-title">{t("common.hotDiscussions")}</h2>
              <ul className="compact-list">
                {hotDiscussions.map((discussion) => (
                  <li key={discussion.id}>{discussion.title}</li>
                ))}
              </ul>
            </section>

            <section className="panel">
              <h2 className="section-title">{t("common.unansweredQuestions")}</h2>
              <ul className="compact-list">
                {unanswered.map((discussion) => (
                  <li key={discussion.id}>{discussion.title}</li>
                ))}
              </ul>
            </section>
          </aside>
        </div>
      </div>
    </AcademicShell>
  );
}
