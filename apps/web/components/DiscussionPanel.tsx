import Link from "next/link";
import { getAnchorForDiscussion, type DiscussionRecord } from "./sampleData";

type DiscussionPanelProps = {
  discussions: DiscussionRecord[];
  showFilters?: boolean;
};

function statusLabel(status: DiscussionRecord["status"]) {
  return status.replace("_", " ");
}

export function DiscussionBadges({ discussion }: { discussion: DiscussionRecord }) {
  const anchor = getAnchorForDiscussion(discussion);

  return (
    <div className="badge-row" aria-label={`Badges for ${discussion.title}`}>
      {discussion.hasAuthorResponse ? <span className="badge badge-author">Author response</span> : null}
      {discussion.isDisputed ? <span className="badge badge-disputed">Disputed</span> : null}
      {discussion.isUnresolved ? <span className="badge badge-unresolved">Unresolved</span> : null}
      {anchor ? <span className="badge badge-anchor">{anchor.kind} anchor</span> : null}
      <span className="badge">{statusLabel(discussion.status)}</span>
    </div>
  );
}

export function DiscussionPanel({ discussions, showFilters = true }: DiscussionPanelProps) {
  const visibleDiscussions = discussions;

  return (
    <section className="panel stack" aria-label="Discussion list">
      {showFilters ? (
        <div className="toolbar" role="group" aria-label="Discussion filters">
          <button className="filter-button" type="button" aria-pressed="true">
            All
          </button>
          <button className="filter-button" type="button">
            Author responses
          </button>
          <button className="filter-button" type="button">
            Unanswered
          </button>
          <button className="filter-button" type="button">
            Disputed
          </button>
          <select aria-label="Sort discussions" className="filter-button" defaultValue="heat">
            <option value="heat">Heat</option>
            <option value="newest">Newest</option>
            <option value="anchor">Anchor position</option>
          </select>
        </div>
      ) : null}

      {visibleDiscussions.length === 0 ? (
        <div className="empty-state">
          <strong>No discussions yet</strong>
          <p className="row-copy">Questions and author responses will appear when readers add them.</p>
        </div>
      ) : (
        <ul className="discussion-list">
          {visibleDiscussions.map((discussion) => {
            const anchor = getAnchorForDiscussion(discussion);

            return (
              <li className="discussion-row" key={discussion.id}>
                <Link href={`/discussions/${discussion.id}`}>{discussion.title}</Link>
                <p className="row-copy">{discussion.body}</p>
                <DiscussionBadges discussion={discussion} />
                <div className="meta-row">
                  <span>{discussion.author}</span>
                  <span>{discussion.createdAt}</span>
                  <span>{discussion.votes} votes</span>
                  <span>Heat {discussion.heat}</span>
                  {anchor ? <span>Anchor: {anchor.title}</span> : null}
                </div>
                {discussion.authorResponse ? (
                  <p className="row-copy">
                    <strong>Author response note:</strong>{" "}
                    {discussion.authorResponse.replace("Verified author response: ", "")}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
