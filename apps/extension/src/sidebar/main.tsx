import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Sidebar, type SidebarCreateDiscussionInput, type SidebarDiscussion, type SidebarPaper } from "./Sidebar";
import { captureActiveTabSelection } from "./sidebarClient";

const paper: SidebarPaper = {
  id: "detected-paper",
  title: "Detected paper"
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SidebarApp />
  </StrictMode>
);

function SidebarApp() {
  const [discussions, setDiscussions] = useState<SidebarDiscussion[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let mounted = true;

    void loadDiscussions(paper.id)
      .then((storedDiscussions) => {
        if (!mounted) {
          return;
        }
        setDiscussions(storedDiscussions);
        setLoadState("ready");
      })
      .catch(() => {
        if (mounted) {
          setLoadState("error");
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  async function createDiscussion(input: SidebarCreateDiscussionInput) {
    const discussion: SidebarDiscussion = {
      id: createDiscussionId(),
      paperId: input.paperId,
      kind: "question",
      status: "open",
      body: input.body,
      authorName: "Reader",
      createdAt: new Date().toISOString(),
      heat: 0,
      answerCount: 0,
      commentCount: 0,
      anchor: input.anchor
    };

    const nextDiscussions = [discussion, ...discussions];
    await saveDiscussions(input.paperId, nextDiscussions);
    setDiscussions(nextDiscussions);
  }

  return (
    <Sidebar
      paper={paper}
      initialDiscussions={discussions}
      loadState={loadState}
      errorMessage="Could not load local discussions."
      onUseSelection={captureActiveTabSelection}
      onCreateDiscussion={createDiscussion}
    />
  );
}

async function loadDiscussions(paperId: string): Promise<SidebarDiscussion[]> {
  const key = storageKey(paperId);
  const result = await chrome.storage.local.get([key]);
  const value = result[key];
  return Array.isArray(value) ? (value as SidebarDiscussion[]) : [];
}

async function saveDiscussions(paperId: string, discussions: SidebarDiscussion[]) {
  await chrome.storage.local.set({
    [storageKey(paperId)]: discussions
  });
}

function storageKey(paperId: string) {
  return `paperqa:discussions:${paperId}`;
}

function createDiscussionId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `discussion-${Date.now()}`;
}
