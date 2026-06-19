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

export function ReplyForm({ discussionId }: { discussionId: string }) {
  const [body, setBody] = useState("");
  const [kind, setKind] = useState("answer");
  const [status, setStatus] = useState<ActionStatus>("idle");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!body.trim()) return;

    setStatus("saving");
    try {
      await postJson(`/api/discussions/${encodeURIComponent(discussionId)}/replies`, { kind, body });
      setBody("");
      setStatus("saved");
      window.location.reload();
    } catch {
      setStatus("error");
    }
  }

  return (
    <form className="panel stack" onSubmit={submit}>
      <h2 className="section-title">Add a response</h2>
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
          {status === "saving" ? "Submitting..." : "Submit response"}
        </button>
        {status === "saved" ? <span className="row-copy">Saved</span> : null}
        {status === "error" ? <span className="row-copy">Submit failed</span> : null}
      </div>
    </form>
  );
}
