"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { getAnchorForDiscussion, type DiscussionRecord } from "./sampleData";

type DiscussionPanelProps = {
  discussions: DiscussionRecord[];
  showFilters?: boolean;
};

type DiscussionFilter = "all" | "author_response" | "unanswered" | "disputed";
type DiscussionSort = "newest" | "heat";

const filterOptions: { label: string; value: DiscussionFilter }[] = [
  { label: "All", value: "all" },
  { label: "Author responses", value: "author_response" },
  { label: "Unanswered", value: "unanswered" },
  { label: "Disputed", value: "disputed" }
];

function statusLabel(status: DiscussionRecord["status"]) {
  return status.replace("_", " ");
}

function matchesFilter(discussion: DiscussionRecord, filter: DiscussionFilter) {
  if (filter === "author_response") {
    return discussion.hasAuthorResponse;
  }

  if (filter === "unanswered") {
    return discussion.isUnresolved === true || (discussion.status === "open" && discussion.answers.length === 0);
  }

  if (filter === "disputed") {
    return discussion.isDisputed === true || discussion.status === "disputed";
  }

  return true;
}

function compareDiscussions(a: DiscussionRecord, b: DiscussionRecord, sort: DiscussionSort) {
  if (sort === "heat") {
    return b.heat - a.heat || b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id);
  }

  return b.createdAt.localeCompare(a.createdAt) || b.heat - a.heat || a.id.localeCompare(b.id);
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
  const [filter, setFilter] = useState<DiscussionFilter>("all");
  const [sort, setSort] = useState<DiscussionSort>("newest");
  const visibleDiscussions = useMemo(
    () => discussions.filter((discussion) => matchesFilter(discussion, filter)).sort((a, b) => compareDiscussions(a, b, sort)),
    [discussions, filter, sort]
  );

  return (
    <section className="panel stack" aria-label="Discussion list">
      {showFilters ? (
        <div className="toolbar" role="group" aria-label="Discussion filters">
          {filterOptions.map((option) => (
            <button
              aria-pressed={filter === option.value}
              className="filter-button"
              key={option.value}
              onClick={() => setFilter(option.value)}
              type="button"
            >
              {option.label}
            </button>
          ))}
          <select
            aria-label="Sort discussions"
            className="filter-button"
            onChange={(event) => setSort(event.target.value as DiscussionSort)}
            value={sort}
          >
            <option value="newest">Newest</option>
            <option value="heat">Heat</option>
          </select>
        </div>
      ) : null}

      {visibleDiscussions.length === 0 ? (
        <div className="empty-state">
          <strong>No discussions yet</strong>
          <p className="row-copy">Questions and author responses will appear when readers add them.</p>
        </div>
      ) : (
        <ul className="discussion-list" data-testid="discussion-list">
          {visibleDiscussions.map((discussion) => {
            const anchor = getAnchorForDiscussion(discussion);

            return (
              <li className="discussion-row" data-testid={`discussion-row-${discussion.id}`} key={discussion.id}>
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
