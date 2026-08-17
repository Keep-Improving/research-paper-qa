import Link from "next/link";
import { getDiscussion } from "./sampleData";
import { useLocale } from "./LocaleProvider";

const moderationReports = [
  {
    id: "report-tokenizer-settings",
    discussionId: "discussion-bleu-dispute",
    kind: "factual_error",
    risk: "needs_factual_review",
    status: "open",
    details: "Reported evaluation setup needs a tokenizer clarification."
  },
  {
    id: "report-duplicate-residual",
    discussionId: "discussion-figure-residual",
    kind: "duplicate",
    risk: "possible_duplicate",
    status: "open",
    details: "May duplicate an existing architecture-order question."
  }
];

export function ModerationQueue() {
  const { t } = useLocale();
  return (
    <section className="panel stack">
      <div>
        <p className="page-kicker">{t("moderation.governance")}</p>
        <h1 className="page-title">{t("moderation.queue")}</h1>
        <p className="page-summary">{t("moderation.summary")}</p>
      </div>

      <ul className="discussion-list">
        {moderationReports.map((report) => {
          const discussion = getDiscussion(report.discussionId);

          return (
            <li className="discussion-row" key={report.id}>
              <div className="toolbar row-toolbar">
                <div className="badge-row">
                  <span className="badge badge-disputed">{report.kind}</span>
                  <span className="badge badge-anchor">{report.risk}</span>
                  <span className="badge">{report.status}</span>
                </div>
                <div className="toolbar">
                  <button className="button" type="button">
                    {t("moderation.hide")}
                  </button>
                  <button className="button" type="button">
                    {t("moderation.restore")}
                  </button>
                  <button className="button" type="button">
                    {t("moderation.markDisputed")}
                  </button>
                  <button className="button" type="button">
                    {t("moderation.linkDuplicate")}
                  </button>
                </div>
              </div>
              {discussion ? <Link href={`/discussions/${discussion.id}`}>{discussion.title}</Link> : null}
              <p className="row-copy">{report.details}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function CollectionsOverview({
  anchors = [],
  discussions = [],
  papers = []
}: {
  anchors?: Array<{ id: string; title: string | null; position: string | null; quoteText: string | null }>;
  discussions?: Array<{ id: string; title: string; body: string }>;
  papers?: Array<{ id: string; title: string }>;
}) {
  const { t } = useLocale();
  return (
    <div className="stack">
      <section className="panel stack">
        <div>
          <p className="page-kicker">{t("common.library")}</p>
          <h1 className="page-title">{t("collections.title")}</h1>
          <p className="page-summary">{t("collections.summary")}</p>
        </div>
      </section>

      <section className="panel stack" aria-label={t("my.savedPapers")}>
        <div className="toolbar">
          <h2 className="section-title">{t("my.savedPapers")}</h2>
          <span className="badge badge-author">{t("collections.active")}</span>
        </div>
        {papers.length === 0 ? <p className="row-copy">{t("collections.noSavedPapers")}</p> : null}
        {papers.map((paper) => (
          <div className="result-row" key={paper.id}>
            <Link href={`/papers/${paper.id}`}>{paper.title}</Link>
            <p className="row-copy">{t("collections.labelReadingList")}</p>
          </div>
        ))}
      </section>

      <section className="panel stack" aria-label={t("my.savedQuestions")}>
        <div className="toolbar">
          <h2 className="section-title">{t("my.savedQuestions")}</h2>
          <span className="badge badge-anchor">{t("collections.active")}</span>
        </div>
        {discussions.length === 0 ? <p className="row-copy">{t("collections.noSavedQuestions")}</p> : null}
        {discussions.map((discussion) => (
          <div className="result-row" key={discussion.id}>
            <Link href={`/discussions/${discussion.id}`}>{discussion.title}</Link>
            <p className="row-copy">{discussion.body}</p>
          </div>
        ))}
      </section>

      <section className="panel stack" aria-label={t("my.savedAnchors")}>
        <div className="toolbar">
          <h2 className="section-title">{t("my.savedAnchors")}</h2>
          <span className="badge badge-author">{t("collections.active")}</span>
        </div>
        {anchors.length === 0 ? <p className="row-copy">{t("collections.noSavedAnchors")}</p> : null}
        {anchors.map((anchor) => (
          <div className="result-row" key={anchor.id}>
            <Link href={`/anchors/${anchor.id}`}>{anchor.title ?? anchor.quoteText ?? anchor.id}</Link>
            <p className="row-copy">{anchor.position ?? t("common.noPosition")}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
