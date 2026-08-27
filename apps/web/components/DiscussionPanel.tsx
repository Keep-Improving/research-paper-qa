"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { useLocale } from "./LocaleProvider";
import { DemoBadge } from "./DemoBadge";

type DiscussionPanelProps = {
  discussions: DiscussionRecord[];
  showFilters?: boolean;
};

export type DiscussionRecord = {
  id: string;
  paperId: string;
  anchorId: string | null;
  title: string;
  body: string;
  status: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
  anchor: { kind?: string; title?: string | null; quoteText?: string | null } | null;
  answerCount: number;
  commentCount: number;
  isAuthorResponse: boolean;
  heat: number;
  isDemo?: boolean;
};

type DiscussionFilter = "all" | "author_response" | "unanswered" | "disputed";
type DiscussionSort = "newest" | "heat";

const filterOptions: { value: DiscussionFilter; key: "common.all" | "common.authorResponse" | "common.unanswered" | "common.disputed" }[] = [
  { key: "common.all", value: "all" },
  { key: "common.authorResponse", value: "author_response" },
  { key: "common.unanswered", value: "unanswered" },
  { key: "common.disputed", value: "disputed" }
];

function statusLabel(status: string) {
  return status.replace("_", " ");
}

function matchesFilter(discussion: DiscussionRecord, filter: DiscussionFilter) {
  if (filter === "author_response") {
    return discussion.isAuthorResponse;
  }

  if (filter === "unanswered") {
    return discussion.status === "open" && discussion.answerCount === 0;
  }

  if (filter === "disputed") {
    return discussion.status === "disputed";
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
  const { t } = useLocale();
  const anchor = discussion.anchor;

  return (
    <div className="badge-row" aria-label={discussion.title}>
      {discussion.isAuthorResponse ? <span className="badge badge-author">{t("common.authorResponse")}</span> : null}
      {discussion.isDemo ? <DemoBadge /> : null}
      {discussion.status === "disputed" ? <span className="badge badge-disputed">{t("common.disputed")}</span> : null}
      {discussion.status === "open" && discussion.answerCount === 0 ? <span className="badge badge-unresolved">{t("common.unresolved")}</span> : null}
      {anchor ? <span className="badge badge-anchor">{anchor.kind} anchor</span> : null}
      <span className="badge">{statusLabel(discussion.status)}</span>
    </div>
  );
}

export function DiscussionPanel({ discussions, showFilters = true }: DiscussionPanelProps) {
  const { t } = useLocale();
  const [filter, setFilter] = useState<DiscussionFilter>("all");
  const [sort, setSort] = useState<DiscussionSort>("newest");
  const visibleDiscussions = useMemo(
    () => discussions.filter((discussion) => matchesFilter(discussion, filter)).sort((a, b) => compareDiscussions(a, b, sort)),
    [discussions, filter, sort]
  );

  return (
    <section className="panel stack" aria-label={t("common.discussionFilters")}>
      {showFilters ? (
        <div className="toolbar" role="group" aria-label={t("common.discussionFilters")}>
          {filterOptions.map((option) => (
            <button
              aria-pressed={filter === option.value}
              className="filter-button"
              key={option.value}
              onClick={() => setFilter(option.value)}
              type="button"
            >
              {t(option.key)}
            </button>
          ))}
          <select
            aria-label={t("common.sortDiscussions")}
            className="filter-button"
            onChange={(event) => setSort(event.target.value as DiscussionSort)}
            value={sort}
          >
            <option value="newest">{t("common.newest")}</option>
            <option value="heat">{t("common.sortHeat")}</option>
          </select>
        </div>
      ) : null}

      {visibleDiscussions.length === 0 ? (
        <div className="empty-state">
          <strong>{t("common.noDiscussions")}</strong>
          <p className="row-copy">{t("common.discussionsWillAppear")}</p>
        </div>
      ) : (
        <ul className="discussion-list" data-testid="discussion-list">
          {visibleDiscussions.map((discussion) => {
            const anchor = discussion.anchor;

            return (
              <li className="discussion-row" data-testid={`discussion-row-${discussion.id}`} key={discussion.id}>
                <Link href={`/discussions/${discussion.id}`}>{discussion.title}</Link>
                <p className="row-copy">{discussion.body}</p>
                {discussion.isAuthorResponse ? (
                  <p className="row-copy">
                    <strong>{t("common.authorResponse")}:</strong> verified first or corresponding author response
                  </p>
                ) : null}
                <DiscussionBadges discussion={discussion} />
                <div className="meta-row">
                  <span>{discussion.authorName}</span>
                  <span>{discussion.createdAt}</span>
                  <span>{discussion.answerCount} {t("common.answers")}</span>
                  <span>{discussion.commentCount} {t("common.comments")}</span>
                  <span>{t("common.heat")} {discussion.heat}</span>
                  {anchor ? <span>{t("common.anchor")}: {anchor.title ?? anchor.quoteText ?? anchor.kind}</span> : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
