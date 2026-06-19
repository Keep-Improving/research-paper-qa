import Link from "next/link";
import { getAnchorForDiscussion, sampleDiscussions, samplePapers } from "./sampleData";

type AuthorWorkbenchProps = {
  claim?: string;
};

function hasAuthorResponsePermission(claim?: string) {
  return claim !== "co_author" && claim !== "none";
}

export function AuthorWorkbench({ claim }: AuthorWorkbenchProps) {
  const canPublishAuthorResponse = hasAuthorResponsePermission(claim);
  const paper = samplePapers[0];
  const unanswered = sampleDiscussions
    .filter((discussion) => discussion.isUnresolved)
    .sort((a, b) => b.heat - a.heat);

  return (
    <div className="stack">
      <section className="panel stack">
        <div>
          <p className="page-kicker">Author workflow</p>
          <h1 className="page-title">Author workbench</h1>
          <p className="page-summary">
            Review unanswered, high-heat questions on papers where the current user has an author
            claim. Author response actions are shown only for approved first-author or
            corresponding-author permissions.
          </p>
        </div>

        <div className="status-strip">
          <div>
            <strong>{paper.title}</strong>
            <p className="row-copy">{paper.venue} {paper.year}</p>
          </div>
          <span className={`badge ${canPublishAuthorResponse ? "badge-author" : "badge-unresolved"}`}>
            Author response permission: {canPublishAuthorResponse ? "Approved" : "Not eligible"}
          </span>
        </div>
      </section>

      <section className="panel stack" aria-label="High heat unanswered questions">
        <div className="toolbar">
          <h2 className="section-title">High-heat unanswered questions</h2>
          <span className="badge">Sorted by heat</span>
        </div>

        <ul className="discussion-list">
          {unanswered.map((discussion) => {
            const anchor = getAnchorForDiscussion(discussion);

            return (
              <li className="discussion-row" key={discussion.id}>
                <div className="toolbar row-toolbar">
                  <Link href={`/discussions/${discussion.id}`}>{discussion.title}</Link>
                  <div className="toolbar">
                    {canPublishAuthorResponse ? (
                      <button className="button button-primary" type="button">
                        Author response
                      </button>
                    ) : null}
                    <button className="button" type="button">
                      Ask as reader
                    </button>
                  </div>
                </div>
                <p className="row-copy">{discussion.body}</p>
                <div className="meta-row">
                  <span>Heat {discussion.heat}</span>
                  <span>{discussion.votes} votes</span>
                  <span>{discussion.createdAt}</span>
                  {anchor ? <span>{anchor.title}</span> : null}
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
