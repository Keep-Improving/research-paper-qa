import { AuthorResponseBadge } from "./AuthorResponseBadge";
import type { SidebarDiscussion } from "./Sidebar";

type DiscussionListProps = {
  discussions: SidebarDiscussion[];
  loadState: "loading" | "ready" | "error";
  errorMessage?: string;
};

export function DiscussionList({ discussions, loadState, errorMessage }: DiscussionListProps) {
  if (loadState === "loading") {
    return <StatusMessage>Loading discussions...</StatusMessage>;
  }

  if (loadState === "error") {
    return (
      <div role="alert" style={styles.error}>
        {errorMessage || "Could not load discussions."}
      </div>
    );
  }

  if (discussions.length === 0) {
    return <StatusMessage>No discussions yet for this paper.</StatusMessage>;
  }

  return (
    <section aria-label="Discussion list" style={styles.list}>
      {discussions.map((discussion) => (
        <article key={discussion.id} style={styles.item}>
          <span data-testid="discussion-id" hidden>
            {discussion.id}
          </span>
          <div style={styles.metaRow}>
            <span style={styles.kind}>{formatKind(discussion.kind)}</span>
            {(discussion.isAuthorResponse || discussion.kind === "author_response") && (
              <AuthorResponseBadge />
            )}
            <span style={styles.spacer} />
            <span style={styles.metric}>{discussion.heat ?? 0} heat</span>
          </div>
          <p style={styles.body}>{discussion.body}</p>
          <div style={styles.byline}>
            <span>{discussion.authorName}</span>
            <span>{formatDate(discussion.createdAt)}</span>
            <span>{discussion.answerCount ?? 0} answers</span>
            <span>{discussion.commentCount ?? 0} comments</span>
          </div>
          {discussion.anchor && (
            <div style={styles.anchor}>
              <span style={styles.anchorKind}>{discussion.anchor.kind}</span>
              {discussion.anchor.sectionLabel && <span>{discussion.anchor.sectionLabel}</span>}
              {discussion.anchor.quoteText && <q style={styles.quote}>{discussion.anchor.quoteText}</q>}
            </div>
          )}
        </article>
      ))}
    </section>
  );
}

function StatusMessage({ children }: { children: React.ReactNode }) {
  return <div style={styles.status}>{children}</div>;
}

function formatKind(kind: SidebarDiscussion["kind"]) {
  return kind.replace(/_/g, " ");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

const styles = {
  list: {
    display: "grid",
    gap: 8
  },
  item: {
    border: "1px solid #d6d8d1",
    borderRadius: 6,
    display: "grid",
    gap: 6,
    padding: 10,
    background: "#ffffff"
  },
  metaRow: {
    alignItems: "center",
    display: "flex",
    gap: 6,
    minHeight: 18
  },
  kind: {
    color: "#49514b",
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase" as const
  },
  spacer: {
    flex: 1
  },
  metric: {
    color: "#5b615d",
    fontSize: 11,
    whiteSpace: "nowrap" as const
  },
  body: {
    color: "#1f2421",
    fontSize: 13,
    lineHeight: 1.35,
    margin: 0
  },
  byline: {
    color: "#626961",
    display: "flex",
    flexWrap: "wrap" as const,
    gap: "4px 10px",
    fontSize: 11
  },
  anchor: {
    alignItems: "center",
    borderTop: "1px solid #eceee8",
    color: "#4f554e",
    display: "flex",
    gap: 6,
    minHeight: 24,
    overflow: "hidden",
    paddingTop: 6,
    fontSize: 12
  },
  anchorKind: {
    border: "1px solid #c7cbc4",
    borderRadius: 4,
    color: "#3f4842",
    fontSize: 11,
    fontWeight: 700,
    padding: "1px 5px",
    textTransform: "uppercase" as const
  },
  quote: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const
  },
  status: {
    border: "1px solid #d6d8d1",
    borderRadius: 6,
    color: "#565d56",
    fontSize: 13,
    padding: 12,
    background: "#ffffff"
  },
  error: {
    border: "1px solid #c99c9c",
    borderRadius: 6,
    color: "#6b2525",
    fontSize: 13,
    padding: 12,
    background: "#fffafa"
  }
};
