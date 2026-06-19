import Link from "next/link";
import { getAnchor, getDiscussion, samplePapers } from "./sampleData";

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
  return (
    <section className="panel stack">
      <div>
        <p className="page-kicker">Governance</p>
        <h1 className="page-title">Moderation queue</h1>
        <p className="page-summary">
          Review reports, AI risk suggestions, duplicate links, and reversible content visibility
          changes. Destructive bulk removal is intentionally absent from this view.
        </p>
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
                    Hide
                  </button>
                  <button className="button" type="button">
                    Restore
                  </button>
                  <button className="button" type="button">
                    Mark disputed
                  </button>
                  <button className="button" type="button">
                    Link duplicate
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

export function CollectionsOverview() {
  const paper = samplePapers[0];
  const discussion = getDiscussion("discussion-attention-scale");
  const anchor = getAnchor("anchor-equation-scale");

  return (
    <div className="stack">
      <section className="panel stack">
        <div>
          <p className="page-kicker">Library</p>
          <h1 className="page-title">Collections</h1>
          <p className="page-summary">
            Track papers, discussion threads, and anchors that need follow-up. Archived items remain
            visible as non-destructive history.
          </p>
        </div>
      </section>

      <section className="panel stack" aria-label="Saved papers">
        <div className="toolbar">
          <h2 className="section-title">Saved papers</h2>
          <span className="badge badge-author">Active</span>
        </div>
        <div className="result-row">
          <Link href={`/papers/${paper.id}`}>{paper.title}</Link>
          <p className="row-copy">Label: reading list</p>
        </div>
      </section>

      <section className="panel stack" aria-label="Saved discussions">
        <div className="toolbar">
          <h2 className="section-title">Saved discussions</h2>
          <span className="badge badge-anchor">Archived</span>
        </div>
        {discussion ? (
          <div className="result-row">
            <Link href={`/discussions/${discussion.id}`}>{discussion.title}</Link>
            <p className="row-copy">Note: follow up after author clarification.</p>
          </div>
        ) : null}
      </section>

      <section className="panel stack" aria-label="Saved anchors">
        <div className="toolbar">
          <h2 className="section-title">Saved anchors</h2>
          <span className="badge badge-author">Active</span>
        </div>
        {anchor ? (
          <div className="result-row">
            <Link href={`/anchors/${anchor.id}`}>{anchor.title}</Link>
            <p className="row-copy">{anchor.position}</p>
          </div>
        ) : null}
      </section>
    </div>
  );
}
