import { useState } from "react";

import type { SidebarAnchorDraft, SidebarCreateDiscussionInput, SidebarPaper } from "./Sidebar";
import { useSidebarLocale } from "./sidebarLocale";

type DiscussionComposerProps = {
  paper: SidebarPaper;
  anchorDraft?: SidebarAnchorDraft | null;
  anchorCaptureError?: string;
  similarQuestionPrompt?: React.ReactNode;
  onCreateDiscussion?: (input: SidebarCreateDiscussionInput) => void | Promise<void>;
  onRetryAnchorCapture?: () => void;
  onClearAnchor?: () => void;
};

export function DiscussionComposer({
  paper,
  anchorDraft,
  anchorCaptureError,
  similarQuestionPrompt,
  onCreateDiscussion,
  onRetryAnchorCapture,
  onClearAnchor
}: DiscussionComposerProps) {
  const { t } = useSidebarLocale();
  const [body, setBody] = useState("");
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "error">("idle");

  async function submitQuestion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedBody = body.trim();
    if (!trimmedBody || !onCreateDiscussion) {
      return;
    }

    setSubmitState("submitting");
    try {
      await onCreateDiscussion({
        paperId: paper.id,
        body: trimmedBody,
        anchor: anchorDraft ?? undefined
      });
      setBody("");
      setSubmitState("idle");
    } catch {
      setSubmitState("error");
    }
  }

  return (
    <section aria-label={t("sidebar.questionComposer")} style={styles.panel}>
      <div style={styles.header}>
        <h2 style={styles.title}>{t("sidebar.questionComposer")}</h2>
        {anchorDraft ? (
          <span style={styles.anchorActions}>
            <span style={styles.anchorState}>{t("sidebar.anchored")}</span>
            <button type="button" onClick={onClearAnchor} style={styles.clearAnchorButton}>
              {t("sidebar.clearAnchor")}
            </button>
          </span>
        ) : <span style={styles.anchorState}>{t("sidebar.manual")}</span>}
      </div>

      {anchorCaptureError && (
        <div style={styles.fallback}>
          <span>{anchorCaptureError}</span>
          <button type="button" onClick={onRetryAnchorCapture} style={styles.secondaryButton}>
            {t("sidebar.retryCapture")}
          </button>
        </div>
      )}

      {anchorDraft && <AnchorPreview anchorDraft={anchorDraft} />}

      {similarQuestionPrompt && <div style={styles.prompt}>{similarQuestionPrompt}</div>}

      <form onSubmit={submitQuestion} style={styles.form}>
        <label htmlFor="question-body" style={styles.label}>
          {t("sidebar.questionBody")}
        </label>
        <textarea
          id="question-body"
          aria-label={t("sidebar.questionBody")}
          value={body}
          onChange={(event) => setBody(event.currentTarget.value)}
          rows={4}
          style={styles.textarea}
        />
        {submitState === "error" && (
          <div role="alert" style={styles.submitError}>
            {t("sidebar.questionCouldNotBeSubmitted")}
          </div>
        )}
        <button
          type="submit"
          disabled={submitState === "submitting" || body.trim().length === 0}
          style={styles.primaryButton}
        >
          {submitState === "submitting" ? t("sidebar.submitting") : t("sidebar.submitQuestion")}
        </button>
      </form>
    </section>
  );
}

function AnchorPreview({ anchorDraft }: { anchorDraft: SidebarAnchorDraft }) {
  const quote = "quoteText" in anchorDraft ? anchorDraft.quoteText : undefined;
  const context = "contextText" in anchorDraft ? anchorDraft.contextText : undefined;
  const note = "note" in anchorDraft ? anchorDraft.note : undefined;
  const image = "imageUrl" in anchorDraft ? anchorDraft.imageUrl : undefined;

  return (
    <div style={styles.anchorPreview}>
      <span style={styles.anchorKind}>{anchorDraft.kind}</span>
      {quote && <strong style={styles.anchorQuote}>{quote}</strong>}
      {note && <span>{note}</span>}
      {image && <span>{image}</span>}
      {context && <span style={styles.context}>{context}</span>}
    </div>
  );
}

const styles = {
  panel: {
    border: "1px solid #d0d2cc",
    borderRadius: 6,
    display: "grid",
    gap: 9,
    padding: 10,
    background: "#fbfbf7"
  },
  header: {
    alignItems: "center",
    display: "flex",
    gap: 8,
    justifyContent: "space-between"
  },
  title: {
    color: "#1f2421",
    fontSize: 14,
    lineHeight: 1.2,
    margin: 0
  },
  anchorState: {
    border: "1px solid #c8ccc5",
    borderRadius: 4,
    color: "#505750",
    fontSize: 11,
    fontWeight: 700,
    lineHeight: "18px",
    padding: "0 6px"
  },
  anchorActions: {
    alignItems: "center",
    display: "flex",
    gap: 6
  },
  clearAnchorButton: {
    border: "1px solid #c8ccc5",
    borderRadius: 4,
    background: "#ffffff",
    color: "#505750",
    cursor: "pointer",
    fontSize: 11,
    lineHeight: "20px",
    padding: "0 6px"
  },
  fallback: {
    alignItems: "center",
    border: "1px solid #d2b27b",
    borderRadius: 5,
    color: "#604715",
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 96px",
    gap: 8,
    fontSize: 12,
    padding: 8,
    background: "#fffaf0"
  },
  anchorPreview: {
    border: "1px solid #d8dbd4",
    borderRadius: 5,
    color: "#454c46",
    display: "grid",
    gap: 4,
    fontSize: 12,
    padding: 8,
    background: "#ffffff"
  },
  anchorKind: {
    color: "#505750",
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase" as const
  },
  anchorQuote: {
    color: "#1f2421",
    fontSize: 12,
    lineHeight: 1.3
  },
  context: {
    color: "#666d66",
    lineHeight: 1.35
  },
  prompt: {
    border: "1px solid #d6d8d1",
    borderRadius: 5,
    color: "#454c46",
    fontSize: 12,
    padding: 8,
    background: "#ffffff"
  },
  form: {
    display: "grid",
    gap: 6
  },
  label: {
    color: "#505750",
    fontSize: 12,
    fontWeight: 700
  },
  textarea: {
    border: "1px solid #b9bdb8",
    borderRadius: 4,
    color: "#1f2421",
    fontSize: 13,
    lineHeight: 1.35,
    minHeight: 92,
    padding: 8,
    resize: "vertical" as const
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
    minWidth: 120,
    padding: "0 10px"
  },
  secondaryButton: {
    border: "1px solid #7f6a44",
    borderRadius: 4,
    background: "#ffffff",
    color: "#453718",
    cursor: "pointer",
    fontSize: 12,
    height: 28,
    padding: "0 8px"
  },
  submitError: {
    color: "#7a2727",
    fontSize: 12
  }
};
