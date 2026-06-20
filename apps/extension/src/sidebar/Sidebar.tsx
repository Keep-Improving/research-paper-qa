import { useMemo, useState } from "react";

import type { ImageAnchorDraft } from "../content/imageAnchor";
import type { TextAnchorDraft } from "../content/selectionAnchor";
import { DiscussionComposer } from "./DiscussionComposer";
import { DiscussionFilters } from "./DiscussionFilters";
import { DiscussionList } from "./DiscussionList";
import { NewQuestionDropZone, type ManualAnchorDraft } from "./NewQuestionDropZone";
import { SIDEBAR_TITLE } from "./sidebarTitle";

export type SidebarPaper = {
  id: string;
  title: string;
  doi?: string;
  arxivId?: string;
  pmid?: string;
};

export type SidebarAnchor = {
  kind: "paper" | "text" | "image" | "screenshot" | "figure" | "table" | "formula" | "reference" | "manual";
  quoteText?: string;
  contextText?: string;
  sectionLabel?: string;
  sourceUrl?: string;
  imageUrl?: string;
  note?: string;
};

export type SidebarAnchorDraft = SidebarAnchor;

export type SidebarDiscussion = {
  id: string;
  paperId: string;
  kind: "question" | "answer" | "comment" | "author_response" | "correction" | "replication_note";
  status: "open" | "answered" | "resolved" | "author_responded" | "disputed" | "hidden";
  body: string;
  authorName: string;
  createdAt: string;
  heat?: number;
  answerCount?: number;
  commentCount?: number;
  isAuthorResponse?: boolean;
  anchor?: SidebarAnchor;
  replies?: SidebarReply[];
};

export type SidebarReply = {
  id: string;
  discussionId: string;
  parentReplyId?: string | null;
  kind: "answer" | "comment" | "author_response" | "correction" | "replication_note";
  body: string;
  authorName: string;
  createdAt: string;
  isAuthorResponse?: boolean;
};

export type SidebarCreateDiscussionInput = {
  paperId: string;
  body: string;
  anchor?: SidebarAnchorDraft;
};

export type DiscussionKindFilter = "all" | "question" | "answer" | "comment" | "author_response";
export type DiscussionStatusFilter = "all" | "open" | "answered" | "resolved" | "author_responded" | "disputed";
export type DiscussionAnchorFilter =
  | "all"
  | "text"
  | "image"
  | "screenshot"
  | "figure"
  | "table"
  | "formula"
  | "reference"
  | "manual";
export type DiscussionParticipantFilter = "all" | "author_response";
export type DiscussionSortMode = "newest" | "heat";

export type DiscussionFiltersState = {
  kind: DiscussionKindFilter;
  status: DiscussionStatusFilter;
  anchor: DiscussionAnchorFilter;
  participant: DiscussionParticipantFilter;
};

type SidebarProps = {
  paper?: SidebarPaper;
  initialDiscussions?: SidebarDiscussion[];
  anchorDraft?: SidebarAnchorDraft | null;
  anchorCaptureError?: string;
  loadState?: "loading" | "ready" | "error";
  errorMessage?: string;
  similarQuestionPrompt?: React.ReactNode;
  onUseSelection?: () => SidebarAnchorDraft | null | void | Promise<SidebarAnchorDraft | null | void>;
  onCreateDiscussion?: (input: SidebarCreateDiscussionInput) => void | Promise<void>;
  onCreateReply?: (discussionId: string, body: string, kind: "answer", parentReplyId?: string | null) => void | Promise<void>;
  onVoteDiscussion?: (discussionId: string) => void | Promise<void>;
  onReportDiscussion?: (discussionId: string) => void | Promise<void>;
  onSelectDiscussion?: (discussionId: string) => SidebarDiscussion | Promise<SidebarDiscussion>;
  onRetryAnchorCapture?: () => void;
};

const fallbackPaper: SidebarPaper = {
  id: "detected-paper",
  title: "Detected paper"
};

export function Sidebar({
  paper = fallbackPaper,
  initialDiscussions = [],
  anchorDraft = null,
  anchorCaptureError,
  loadState = "ready",
  errorMessage,
  similarQuestionPrompt,
  onUseSelection,
  onCreateDiscussion,
  onCreateReply,
  onVoteDiscussion,
  onReportDiscussion,
  onSelectDiscussion,
  onRetryAnchorCapture
}: SidebarProps) {
  const [filters, setFilters] = useState<DiscussionFiltersState>({
    kind: "all",
    status: "all",
    anchor: "all",
    participant: "all"
  });
  const [sort, setSort] = useState<DiscussionSortMode>("newest");
  const [draft, setDraft] = useState<SidebarAnchorDraft | null>(anchorDraft);
  const [selectionError, setSelectionError] = useState<string | undefined>(anchorCaptureError);
  const [selectedDiscussion, setSelectedDiscussion] = useState<SidebarDiscussion | null>(null);
  const [detailError, setDetailError] = useState<string | undefined>();

  const visibleDiscussions = useMemo(() => {
    const filtered = initialDiscussions.filter((discussion) => {
      if (filters.kind !== "all" && discussion.kind !== filters.kind) {
        return false;
      }

      if (filters.status !== "all" && discussion.status !== filters.status) {
        return false;
      }

      if (filters.anchor !== "all" && discussion.anchor?.kind !== filters.anchor) {
        return false;
      }

      if (filters.participant === "author_response") {
        return discussion.isAuthorResponse || discussion.kind === "author_response";
      }

      return true;
    });

    return [...filtered].sort((left, right) => {
      if (sort === "heat") {
        return (right.heat ?? 0) - (left.heat ?? 0);
      }

      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    });
  }, [filters, initialDiscussions, sort]);

  async function useSelection() {
    try {
      setSelectionError(undefined);
      const anchor = await onUseSelection?.();
      if (anchor) {
        setDraft(normalizeSelectionAnchor(anchor));
        return;
      }
      setSelectionError("No selected text was captured. Select text in the paper tab, then try again.");
    } catch (error) {
      setSelectionError(error instanceof Error ? error.message : "Selection capture failed.");
    }
  }

  async function selectDiscussion(discussion: SidebarDiscussion) {
    setSelectedDiscussion(discussion);
    setDetailError(undefined);

    if (!onSelectDiscussion) {
      return;
    }

    try {
      const detail = await onSelectDiscussion(discussion.id);
      setSelectedDiscussion(detail);
    } catch (error) {
      setDetailError(error instanceof Error ? error.message : "Discussion detail could not be loaded.");
    }
  }

  async function createReplyAndRefresh(discussionId: string, body: string, kind: "answer", parentReplyId?: string | null) {
    await onCreateReply?.(discussionId, body, kind, parentReplyId);

    if (onSelectDiscussion) {
      const detail = await onSelectDiscussion(discussionId);
      setSelectedDiscussion(detail);
    }
  }

  return (
    <main style={styles.shell}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>{SIDEBAR_TITLE}</h1>
          <p style={styles.paperTitle}>{paper.title}</p>
        </div>
        <PaperIdentifier paper={paper} />
      </header>

      <NewQuestionDropZone
        onUseSelection={onUseSelection ? useSelection : undefined}
        onImageAnchor={(anchor) => setDraft(normalizeImageAnchor(anchor))}
        onManualAnchor={(anchor) => setDraft(normalizeManualAnchor(anchor))}
      />

      <DiscussionComposer
        paper={paper}
        anchorDraft={draft}
        anchorCaptureError={selectionError}
        similarQuestionPrompt={similarQuestionPrompt}
        onCreateDiscussion={onCreateDiscussion}
        onRetryAnchorCapture={onRetryAnchorCapture}
      />

      <DiscussionFilters
        filters={filters}
        sort={sort}
        onFiltersChange={setFilters}
        onSortChange={setSort}
      />

      <DiscussionList
        discussions={visibleDiscussions}
        loadState={loadState}
        errorMessage={errorMessage}
        onSelectDiscussion={selectDiscussion}
      />

      {selectedDiscussion ? (
        <DiscussionDetail
          discussion={selectedDiscussion}
          detailError={detailError}
          onBack={() => setSelectedDiscussion(null)}
          onCreateReply={createReplyAndRefresh}
          onReportDiscussion={onReportDiscussion}
          onVoteDiscussion={onVoteDiscussion}
        />
      ) : null}
    </main>
  );
}

function DiscussionDetail({
  discussion,
  detailError,
  onBack,
  onCreateReply,
  onVoteDiscussion,
  onReportDiscussion
}: {
  discussion: SidebarDiscussion;
  detailError?: string;
  onBack: () => void;
  onCreateReply?: (discussionId: string, body: string, kind: "answer", parentReplyId?: string | null) => void | Promise<void>;
  onVoteDiscussion?: (discussionId: string) => void | Promise<void>;
  onReportDiscussion?: (discussionId: string) => void | Promise<void>;
}) {
  const [body, setBody] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const replyTarget = replyingTo ? (discussion.replies ?? []).find((reply) => reply.id === replyingTo) : null;

  async function submitReply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedBody = body.trim();
    if (!trimmedBody || !onCreateReply) return;

    setStatus("submitting");
    try {
      await onCreateReply(discussion.id, trimmedBody, "answer", replyingTo);
      setBody("");
      setReplyingTo(null);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section aria-label="Discussion detail" style={styles.detailPanel}>
      <button onClick={onBack} style={styles.secondaryButton} type="button">
        Back to list
      </button>
      <h2 style={styles.detailTitle}>{discussion.body}</h2>
      {discussion.anchor?.quoteText ? <q style={styles.detailQuote}>{discussion.anchor.quoteText}</q> : null}
      {detailError ? <div role="alert" style={styles.submitError}>{detailError}</div> : null}
      <div style={styles.detailToolbar}>
        <button onClick={() => onVoteDiscussion?.(discussion.id)} style={styles.secondaryButton} type="button">
          Helpful
        </button>
        <button onClick={() => onReportDiscussion?.(discussion.id)} style={styles.secondaryButton} type="button">
          Report
        </button>
        <a href={`http://localhost:3000/discussions/${discussion.id}`} style={styles.detailLink} target="_blank">
          Open web
        </a>
      </div>
      <ResponseList
        onReply={(replyId) => setReplyingTo(replyId)}
        replies={discussion.replies ?? []}
        replyingTo={replyingTo}
      />
      <form onSubmit={submitReply} style={styles.detailForm}>
        {replyTarget ? <p style={styles.replyEmpty}>Replying to {replyTarget.authorName}</p> : null}
        <textarea
          aria-label="Response body"
          onChange={(event) => setBody(event.currentTarget.value)}
          rows={3}
          style={styles.detailTextarea}
          value={body}
        />
        {status === "error" ? <div role="alert" style={styles.submitError}>Reply could not be submitted.</div> : null}
        <button disabled={status === "submitting" || body.trim().length === 0} style={styles.primaryButton} type="submit">
          {status === "submitting" ? "Submitting..." : "Submit reply"}
        </button>
      </form>
    </section>
  );
}

function ResponseList({
  onReply,
  replies,
  replyingTo
}: {
  onReply: (replyId: string) => void;
  replies: SidebarReply[];
  replyingTo: string | null;
}) {
  const replyById = new Map(replies.map((reply) => [reply.id, reply]));
  const roots = replies.filter((reply) => !reply.parentReplyId);

  function childrenOf(replyId: string) {
    return replies.filter((reply) => reply.parentReplyId === replyId);
  }

  function collectDescendants(replyId: string): SidebarReply[] {
    return childrenOf(replyId).flatMap((child) => [child, ...collectDescendants(child.id)]);
  }

  return (
    <section aria-label="Responses" style={styles.replySection}>
      <h3 style={styles.replyTitle}>Responses</h3>
      {roots.length === 0 ? (
        <p style={styles.replyEmpty}>No responses yet.</p>
      ) : (
        <ul style={styles.replyList}>
          {roots.map((reply) => (
            <ResponseItem
              children={collectDescendants(reply.id)}
              key={reply.id}
              onReply={onReply}
              reply={reply}
              replyById={replyById}
              replyingTo={replyingTo}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function ResponseItem({
  children,
  onReply,
  reply,
  replyById,
  replyingTo
}: {
  children: SidebarReply[];
  onReply: (replyId: string) => void;
  reply: SidebarReply;
  replyById: Map<string, SidebarReply>;
  replyingTo: string | null;
}) {
  const replyTarget = reply.parentReplyId ? replyById.get(reply.parentReplyId)?.authorName ?? "a response" : null;

  return (
    <li style={styles.replyItem}>
      <div style={styles.replyHeader}>
        <div>
          <strong>{reply.authorName}</strong>
          {replyTarget ? <p style={styles.replyMeta}>Replying to {replyTarget}</p> : null}
        </div>
        <button
          aria-pressed={replyingTo === reply.id}
          onClick={() => onReply(reply.id)}
          style={styles.replyButton}
          type="button"
        >
          Reply to response
        </button>
      </div>
      <p style={styles.replyBody}>{reply.body}</p>
      {children.length > 0 ? (
        <ul style={styles.replyChildren}>
          {children.map((child) => (
            <li key={child.id} style={styles.replyChildItem}>
              <div style={styles.replyHeader}>
                <div>
                  <strong>{child.authorName}</strong>
                  <p style={styles.replyMeta}>Replying to {child.parentReplyId ? replyById.get(child.parentReplyId)?.authorName ?? "a response" : "a response"}</p>
                </div>
                <button
                  aria-pressed={replyingTo === child.id}
                  onClick={() => onReply(child.id)}
                  style={styles.replyButton}
                  type="button"
                >
                  Reply to response
                </button>
              </div>
              <p style={styles.replyBody}>{child.body}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function PaperIdentifier({ paper }: { paper: SidebarPaper }) {
  const label = paper.doi ? `DOI ${paper.doi}` : paper.arxivId ? `arXiv ${paper.arxivId}` : paper.pmid ? `PMID ${paper.pmid}` : "Local";

  return <span style={styles.identifier}>{label}</span>;
}

function normalizeImageAnchor(anchor: ImageAnchorDraft): SidebarAnchorDraft {
  return {
    kind: "image",
    sourceUrl: anchor.source_url,
    imageUrl: anchor.image_url,
    quoteText: anchor.caption_text || anchor.alt_text
  };
}

function normalizeManualAnchor(anchor: ManualAnchorDraft): SidebarAnchorDraft {
  return {
    kind: "manual",
    note: anchor.note,
    sourceUrl: anchor.source_url
  };
}

function normalizeSelectionAnchor(anchor: SidebarAnchorDraft | (TextAnchorDraft & Record<string, unknown>)): SidebarAnchorDraft {
  return {
    kind: anchor.kind,
    quoteText: "quoteText" in anchor ? anchor.quoteText : anchor.quote_text,
    contextText: "contextText" in anchor ? anchor.contextText : anchor.context_text,
    sectionLabel: "sectionLabel" in anchor ? anchor.sectionLabel : undefined,
    sourceUrl: "sourceUrl" in anchor ? anchor.sourceUrl : anchor.source_url,
    imageUrl: "imageUrl" in anchor ? anchor.imageUrl : undefined,
    note: "note" in anchor ? anchor.note : undefined
  };
}

const styles = {
  shell: {
    background: "#f3f4ef",
    color: "#1f2421",
    display: "grid",
    gap: 10,
    minHeight: "100vh",
    padding: 12,
    fontFamily:
      "ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif"
  },
  header: {
    alignItems: "start",
    borderBottom: "1px solid #d0d2cc",
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    gap: 10,
    paddingBottom: 10
  },
  title: {
    color: "#1f2421",
    fontSize: 18,
    lineHeight: 1.1,
    margin: 0
  },
  paperTitle: {
    color: "#4d554e",
    fontSize: 13,
    lineHeight: 1.3,
    margin: "4px 0 0"
  },
  identifier: {
    border: "1px solid #c4c8c0",
    borderRadius: 4,
    color: "#4d554e",
    fontSize: 11,
    fontWeight: 700,
    lineHeight: "20px",
    maxWidth: 104,
    overflow: "hidden",
    padding: "0 6px",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const
  },
  detailPanel: {
    background: "#ffffff",
    border: "1px solid #cfd3cc",
    borderRadius: 6,
    display: "grid",
    gap: 8,
    padding: 10
  },
  detailTitle: {
    color: "#1f2421",
    fontSize: 14,
    lineHeight: 1.35,
    margin: 0
  },
  detailQuote: {
    color: "#4f554e",
    fontSize: 12,
    lineHeight: 1.3
  },
  detailToolbar: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: 6
  },
  detailLink: {
    color: "#2f3a3f",
    fontSize: 12,
    fontWeight: 700,
    lineHeight: "28px"
  },
  detailForm: {
    display: "grid",
    gap: 6
  },
  replySection: {
    borderTop: "1px solid #eceee8",
    display: "grid",
    gap: 6,
    paddingTop: 8
  },
  replyTitle: {
    color: "#1f2421",
    fontSize: 13,
    lineHeight: 1.25,
    margin: 0
  },
  replyEmpty: {
    color: "#626961",
    fontSize: 12,
    margin: 0
  },
  replyList: {
    display: "grid",
    gap: 6,
    listStyle: "none",
    margin: 0,
    padding: 0
  },
  replyItem: {
    border: "1px solid #e2e5dd",
    borderRadius: 4,
    display: "grid",
    gap: 3,
    padding: 8
  },
  replyBody: {
    color: "#1f2421",
    fontSize: 12,
    lineHeight: 1.35,
    margin: 0
  },
  detailTextarea: {
    border: "1px solid #b9bdb8",
    borderRadius: 4,
    color: "#1f2421",
    fontSize: 13,
    lineHeight: 1.35,
    minHeight: 72,
    padding: 8,
    resize: "vertical" as const
  },
  replyHeader: {
    alignItems: "start",
    display: "flex",
    gap: 8,
    justifyContent: "space-between"
  },
  replyMeta: {
    color: "#626961",
    fontSize: 11,
    margin: "2px 0 0"
  },
  replyButton: {
    border: "1px solid #c4c8c0",
    borderRadius: 4,
    background: "#ffffff",
    color: "#3f4842",
    cursor: "pointer",
    fontSize: 11,
    fontWeight: 700,
    minHeight: 24,
    padding: "0 6px"
  },
  replyChildren: {
    borderLeft: "2px solid #e2e5dd",
    display: "grid",
    gap: 6,
    listStyle: "none",
    margin: "4px 0 0 8px",
    padding: "0 0 0 8px"
  },
  replyChildItem: {
    borderTop: "1px solid #eceee8",
    display: "grid",
    gap: 3,
    paddingTop: 6
  },
  primaryButton: {
    border: "1px solid #2f3a3f",
    borderRadius: 4,
    background: "#2f3a3f",
    color: "#ffffff",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 700,
    height: 30,
    justifySelf: "start",
    minWidth: 110,
    padding: "0 10px"
  },
  secondaryButton: {
    border: "1px solid #c4c8c0",
    borderRadius: 4,
    background: "#ffffff",
    color: "#3f4842",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 700,
    minHeight: 28,
    padding: "0 8px"
  },
  submitError: {
    color: "#7a2727",
    fontSize: 12
  }
};
