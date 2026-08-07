import Link from "next/link";

export type AuthorWorkbenchDiscussion = {
  id: string;
  title: string;
  body: string;
  heat: number;
  votes: number;
  createdAt: string;
  anchorTitle?: string | null;
};

export type AuthorWorkbenchPaper = {
  id: string;
  title: string;
  venue?: string | null;
  year?: number | null;
  canPublishAuthorResponse: boolean;
  discussions: AuthorWorkbenchDiscussion[];
};

type AuthorWorkbenchProps = {
  papers: AuthorWorkbenchPaper[];
  userEmail?: string | null;
  emailVerified?: boolean;
};

export function AuthorWorkbench({ papers, userEmail, emailVerified = false }: AuthorWorkbenchProps) {
  const hasAnyPermission = papers.some((paper) => paper.canPublishAuthorResponse);
  const discussions = papers
    .flatMap((paper) =>
      paper.discussions.map((discussion) => ({
        ...discussion,
        paper
      }))
    )
    .sort((left, right) => right.heat - left.heat);

  return (
    <div className="stack">
      <section className="panel stack">
        <div>
          <p className="page-kicker">Author workflow</p>
          <h1 className="page-title">Author workbench</h1>
          <p className="page-summary">
            Review unanswered, high-heat questions only when your verified account email matches a verified first-author or
            corresponding-author identity.
          </p>
        </div>

        <div className="status-strip">
          <div>
            <strong>{userEmail ?? "Not signed in"}</strong>
            <p className="row-copy">
              {!userEmail
                ? "Sign in to check author response eligibility"
                : !emailVerified
                  ? "Verify this email before author-response permissions are enabled"
                  : hasAnyPermission
                    ? `${papers.filter((paper) => paper.canPublishAuthorResponse).length} verified paper(s)`
                    : "No verified author email match"}
            </p>
          </div>
          <span className={`badge ${hasAnyPermission ? "badge-author" : "badge-unresolved"}`}>
            Author response permission: {hasAnyPermission ? "Approved" : "Not eligible"}
          </span>
        </div>
      </section>

      <section className="panel stack" aria-label="High heat unanswered questions">
        <div className="toolbar">
          <h2 className="section-title">High-heat unanswered questions</h2>
          <span className="badge">Sorted by heat</span>
        </div>

        {discussions.length === 0 ? (
          <div className="empty-state">
            <p>No eligible author questions yet.</p>
          </div>
        ) : (
          <ul className="discussion-list">
            {discussions.map((discussion) => (
              <li className="discussion-row" key={discussion.id}>
                <div className="toolbar row-toolbar">
                  <Link href={`/discussions/${discussion.id}`}>{discussion.title}</Link>
                  <div className="toolbar">
                    {discussion.paper.canPublishAuthorResponse ? (
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
                  <span>{discussion.paper.title}</span>
                  <span>Heat {discussion.heat}</span>
                  <span>{discussion.votes} votes</span>
                  <span>{discussion.createdAt}</span>
                  {discussion.anchorTitle ? <span>{discussion.anchorTitle}</span> : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
