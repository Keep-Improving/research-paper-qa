"use client";

import { useState } from "react";

type ActionStatus = "idle" | "saving" | "saved" | "error";

async function postJson(path: string, body: unknown) {
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-User-Id": "user-reader"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

export function CollectionButton({ targetType, targetId, label }: { targetType: string; targetId: string; label: string }) {
  const [status, setStatus] = useState<ActionStatus>("idle");

  async function save() {
    setStatus("saving");
    try {
      await postJson("/api/collections", { targetType, targetId });
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }

  return (
    <button className={status === "saved" ? "button button-primary" : "button"} onClick={save} type="button">
      {status === "saving" ? "Saving..." : status === "saved" ? "Saved" : status === "error" ? "Retry save" : label}
    </button>
  );
}

export function VoteButton({ discussionId }: { discussionId: string }) {
  const [status, setStatus] = useState<ActionStatus>("idle");

  async function vote() {
    setStatus("saving");
    try {
      await postJson("/api/votes", { discussionId, value: "helpful" });
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }

  return (
    <button className="button" onClick={vote} type="button">
      {status === "saving" ? "Voting..." : status === "saved" ? "Marked helpful" : status === "error" ? "Retry vote" : "Helpful"}
    </button>
  );
}

export function ReportButton({ targetType, targetId }: { targetType: string; targetId: string }) {
  const [status, setStatus] = useState<ActionStatus>("idle");

  async function report() {
    setStatus("saving");
    try {
      await postJson("/api/reports", { targetType, targetId, reason: "User requested moderation review" });
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }

  return (
    <button className="button" onClick={report} type="button">
      {status === "saving" ? "Reporting..." : status === "saved" ? "Reported" : status === "error" ? "Retry report" : "Report"}
    </button>
  );
}

export function ReplyForm({
  discussionId,
  parentReplyId,
  title = "Add a response",
  submitLabel = "Submit response",
  compact = false
}: {
  discussionId: string;
  parentReplyId?: string | null;
  title?: string;
  submitLabel?: string;
  compact?: boolean;
}) {
  const [body, setBody] = useState("");
  const [kind, setKind] = useState("answer");
  const [status, setStatus] = useState<ActionStatus>("idle");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!body.trim()) return;

    setStatus("saving");
    try {
      await postJson(`/api/discussions/${encodeURIComponent(discussionId)}/replies`, { kind, body, parentReplyId });
      setBody("");
      setStatus("saved");
      window.location.reload();
    } catch {
      setStatus("error");
    }
  }

  return (
    <form className={compact ? "stack response-reply-form" : "panel stack"} onSubmit={submit}>
      {compact ? <h4>{title}</h4> : <h2 className="section-title">{title}</h2>}
      <label className="field-label">
        Type
        <select onChange={(event) => setKind(event.target.value)} value={kind}>
          <option value="answer">Answer</option>
          <option value="comment">Comment</option>
        </select>
      </label>
      <label className="field-label">
        Response
        <textarea
          className="text-area"
          onChange={(event) => setBody(event.target.value)}
          placeholder="Write a concrete answer or comment."
          value={body}
        />
      </label>
      <div className="toolbar">
        <button className="button button-primary" disabled={status === "saving"} type="submit">
          {status === "saving" ? "Submitting..." : submitLabel}
        </button>
        {status === "saved" ? <span className="row-copy">Saved</span> : null}
        {status === "error" ? <span className="row-copy">Submit failed</span> : null}
      </div>
    </form>
  );
}

type ResponseItem = {
  id: string;
  discussionId: string;
  parentReplyId: string | null;
  kind: string;
  body: string;
  authorName: string;
  isAuthorResponse: boolean;
  createdAt: string;
};

export function ResponseThread({ discussionId, replies }: { discussionId: string; replies: ResponseItem[] }) {
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const roots = replies.filter((reply) => !reply.parentReplyId);

  function childrenOf(replyId: string) {
    return replies.filter((reply) => reply.parentReplyId === replyId);
  }

  return (
    <section className="panel stack">
      <h2 className="section-title">Responses</h2>
      {roots.length === 0 ? (
        <p className="row-copy">No responses yet.</p>
      ) : (
        <ul className="response-list">
          {roots.map((reply) => (
            <ResponseRow
              childrenOf={childrenOf}
              discussionId={discussionId}
              key={reply.id}
              onReply={setReplyingTo}
              reply={reply}
              replyingTo={replyingTo}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function ResponseRow({
  childrenOf,
  discussionId,
  onReply,
  reply,
  replyingTo
}: {
  childrenOf: (replyId: string) => ResponseItem[];
  discussionId: string;
  onReply: (replyId: string | null) => void;
  reply: ResponseItem;
  replyingTo: string | null;
}) {
  const children = childrenOf(reply.id);

  return (
    <li className="response-item">
      <div className="toolbar row-toolbar">
        <div>
          <strong>{reply.authorName}</strong>
          <div className="meta-row">
            <span>{responseKindLabel(reply)}</span>
            <span>{reply.createdAt}</span>
          </div>
        </div>
        <button className="button" onClick={() => onReply(replyingTo === reply.id ? null : reply.id)} type="button">
          Reply to response
        </button>
      </div>
      <p className="row-copy">{reply.body}</p>
      {replyingTo === reply.id ? (
        <ReplyForm
          compact
          discussionId={discussionId}
          parentReplyId={reply.id}
          submitLabel="Submit reply"
          title={`Reply to ${reply.authorName}`}
        />
      ) : null}
      {children.length > 0 ? (
        <ul className="response-children">
          {children.map((child) => (
            <ResponseRow
              childrenOf={childrenOf}
              discussionId={discussionId}
              key={child.id}
              onReply={onReply}
              reply={child}
              replyingTo={replyingTo}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function responseKindLabel(reply: ResponseItem) {
  if (reply.isAuthorResponse || reply.kind === "author_response") {
    return "Author response";
  }

  return reply.kind === "answer" ? "Answer" : "Comment";
}
