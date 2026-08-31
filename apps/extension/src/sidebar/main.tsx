import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Sidebar, type SidebarCreateDiscussionInput, type SidebarDiscussion, type SidebarPaper } from "./Sidebar";
import { SidebarLocaleProvider, useSidebarLocale } from "./sidebarLocale";
import {
  captureActiveTabSelection,
  createRemoteDiscussion,
  createRemoteReply,
  createRemoteReport,
  createRemoteVote,
  getApiBaseUrl,
  getRemoteDiscussion,
  listRemoteDiscussions,
  matchRemotePaper,
  setApiBaseUrl
} from "./sidebarClient";

const fallbackDetectedPaper: SidebarPaper = {
  id: "detected-paper",
  title: "Detected paper"
};

createRoot(document.getElementById("root")!).render(
  <SidebarLocaleProvider>
    <SidebarApp />
  </SidebarLocaleProvider>
);

function SidebarApp() {
  const { t } = useSidebarLocale();
  const [paper, setPaper] = useState<SidebarPaper>(fallbackDetectedPaper);
  const [discussions, setDiscussions] = useState<SidebarDiscussion[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [apiBaseUrl, setApiBaseUrl] = useState<string | null>(null);
  const didLoad = useRef(false);
  const remotePaperId = useRef<string | null>(null);

  useEffect(() => {
    if (didLoad.current) {
      return;
    }
    didLoad.current = true;
    let mounted = true;

    void loadRemoteState()
      .then((state) => {
        remotePaperId.current = state.paper.id;
        if (!mounted) {
          return;
        }
        setApiBaseUrl(state.apiBaseUrl);
        setPaper(state.paper);
        setDiscussions(state.discussions);
        setLoadState("ready");
      })
      .catch((error) => {
        if (mounted) {
          setErrorMessage(error instanceof Error ? error.message : t("sidebar.couldNotLoadDiscussions"));
          setLoadState("error");
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  async function createDiscussion(input: SidebarCreateDiscussionInput) {
    const baseUrl = apiBaseUrl ?? await getApiBaseUrl();
    const remotePaper = await ensureRemotePaper(baseUrl);
    await createRemoteDiscussion(baseUrl, { ...input, paperId: remotePaper.id });
    setDiscussions(await listRemoteDiscussions(baseUrl, remotePaper.id));
  }

  async function refreshDiscussions(baseUrl: string) {
    const remotePaper = await ensureRemotePaper(baseUrl);
    setDiscussions(await listRemoteDiscussions(baseUrl, remotePaper.id));
  }

  async function ensureRemotePaper(baseUrl: string) {
    if (remotePaperId.current) {
      return paper.id === remotePaperId.current ? paper : { ...paper, id: remotePaperId.current };
    }

    const matchedPaper = await matchRemotePaper(baseUrl, {
      title: fallbackDetectedPaper.title,
      url: location.href
    });
    remotePaperId.current = matchedPaper.id;
    setApiBaseUrl(baseUrl);
    setPaper(matchedPaper);
    setErrorMessage(undefined);
    setLoadState("ready");
    return matchedPaper;
  }

  async function createReply(discussionId: string, body: string, kind: "answer", parentReplyId?: string | null) {
    const baseUrl = apiBaseUrl ?? await getApiBaseUrl();
    await createRemoteReply(baseUrl, discussionId, body, kind, parentReplyId);
    await refreshDiscussions(baseUrl);
  }

  async function voteDiscussion(discussionId: string) {
    const baseUrl = apiBaseUrl ?? await getApiBaseUrl();
    await createRemoteVote(baseUrl, discussionId);
    await refreshDiscussions(baseUrl);
  }

  async function reportDiscussion(discussionId: string) {
    const baseUrl = apiBaseUrl ?? await getApiBaseUrl();
    await createRemoteReport(baseUrl, discussionId);
  }

  async function selectDiscussion(discussionId: string) {
    const baseUrl = apiBaseUrl ?? await getApiBaseUrl();
    return getRemoteDiscussion(baseUrl, discussionId);
  }

  return (
      <Sidebar
      paper={paper}
      initialDiscussions={discussions}
      apiBaseUrl={apiBaseUrl}
      loadState={loadState}
      errorMessage={errorMessage}
      onUseSelection={captureActiveTabSelection}
      onCreateDiscussion={createDiscussion}
      onCreateReply={createReply}
      onVoteDiscussion={voteDiscussion}
      onReportDiscussion={reportDiscussion}
      onSelectDiscussion={selectDiscussion}
      onApiBaseUrlChange={handleApiBaseUrlChange}
    />
  );
}

async function handleApiBaseUrlChange(baseUrl: string) {
  await setApiBaseUrl(baseUrl);
}

async function loadRemoteState() {
  const apiBaseUrl = await getApiBaseUrl();
  const paper = await matchRemotePaper(apiBaseUrl, {
    title: fallbackDetectedPaper.title,
    url: location.href
  });
  const discussions = await listRemoteDiscussions(apiBaseUrl, paper.id);

  return { apiBaseUrl, paper, discussions };
}
