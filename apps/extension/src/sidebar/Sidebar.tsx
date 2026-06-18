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
};

export type SidebarCreateDiscussionInput = {
  paperId: string;
  body: string;
  anchor?: SidebarAnchorDraft;
};

export type DiscussionFilterMode = "all" | "author_response";
export type DiscussionSortMode = "newest" | "heat";

type SidebarProps = {
  paper?: SidebarPaper;
  initialDiscussions?: SidebarDiscussion[];
  anchorDraft?: SidebarAnchorDraft | null;
  anchorCaptureError?: string;
  loadState?: "loading" | "ready" | "error";
  errorMessage?: string;
  similarQuestionPrompt?: React.ReactNode;
  onCreateDiscussion?: (input: SidebarCreateDiscussionInput) => void | Promise<void>;
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
  onCreateDiscussion,
  onRetryAnchorCapture
}: SidebarProps) {
  const [filter, setFilter] = useState<DiscussionFilterMode>("all");
  const [sort, setSort] = useState<DiscussionSortMode>("newest");
  const [draft, setDraft] = useState<SidebarAnchorDraft | null>(anchorDraft);

  const visibleDiscussions = useMemo(() => {
    const filtered = initialDiscussions.filter((discussion) => {
      if (filter === "author_response") {
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
  }, [filter, initialDiscussions, sort]);

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
        onUseSelection={() => null}
        onImageAnchor={(anchor) => setDraft(normalizeImageAnchor(anchor))}
        onManualAnchor={(anchor) => setDraft(normalizeManualAnchor(anchor))}
      />

      <DiscussionComposer
        paper={paper}
        anchorDraft={draft}
        anchorCaptureError={anchorCaptureError}
        similarQuestionPrompt={similarQuestionPrompt}
        onCreateDiscussion={onCreateDiscussion}
        onRetryAnchorCapture={onRetryAnchorCapture}
      />

      <DiscussionFilters
        filter={filter}
        sort={sort}
        onFilterChange={setFilter}
        onSortChange={setSort}
      />

      <DiscussionList
        discussions={visibleDiscussions}
        loadState={loadState}
        errorMessage={errorMessage}
      />
    </main>
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
  }
};
