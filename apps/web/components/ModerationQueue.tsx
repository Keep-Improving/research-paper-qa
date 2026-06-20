import Link from "next/link";
import { getAnchor, getDiscussion } from "./sampleData";

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

export function CollectionsOverview({
  anchors = [],
  discussions = [],
  papers = []
}: {
  anchors?: Array<{ id: string; title: string | null; position: string | null; quoteText: string | null }>;
  discussions?: Array<{ id: string; title: string; body: string }>;
  papers?: Array<{ id: string; title: string }>;
}) {
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
        {papers.length === 0 ? <p className="row-copy">No saved papers yet.</p> : null}
        {papers.map((paper) => (
          <div className="result-row" key={paper.id}>
            <Link href={`/papers/${paper.id}`}>{paper.title}</Link>
            <p className="row-copy">Label: reading list</p>
          </div>
        ))}
      </section>

      <section className="panel stack" aria-label="Saved questions">
        <div className="toolbar">
          <h2 className="section-title">Saved questions</h2>
          <span className="badge badge-anchor">Active</span>
        </div>
        {discussions.length === 0 ? <p className="row-copy">No saved questions yet.</p> : null}
        {discussions.map((discussion) => (
          <div className="result-row" key={discussion.id}>
            <Link href={`/discussions/${discussion.id}`}>{discussion.title}</Link>
            <p className="row-copy">{discussion.body}</p>
          </div>
        ))}
      </section>

      <section className="panel stack" aria-label="Saved anchors">
        <div className="toolbar">
          <h2 className="section-title">Saved anchors</h2>
          <span className="badge badge-author">Active</span>
        </div>
        {anchors.length === 0 ? <p className="row-copy">No saved anchors yet.</p> : null}
        {anchors.map((anchor) => (
          <div className="result-row" key={anchor.id}>
            <Link href={`/anchors/${anchor.id}`}>{anchor.title ?? anchor.quoteText ?? anchor.id}</Link>
            <p className="row-copy">{anchor.position ?? "No position stored."}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
