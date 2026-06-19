import type { TextAnchorDraft } from "../content/selectionAnchor";
import type { SidebarCreateDiscussionInput, SidebarDiscussion, SidebarPaper } from "./Sidebar";

const API_BASE_URL_KEY = "paperqa:apiBaseUrl";
const DEFAULT_API_BASE_URL = "http://localhost:3000/api";
const DEFAULT_USER_ID = "user-reader";

type CaptureSelectionResponse =
  | {
      ok: true;
      anchor: TextAnchorDraft | null;
    }
  | {
      ok: false;
      error: string;
    };

export async function captureActiveTabSelection(): Promise<TextAnchorDraft | null> {
  const response = (await chrome.runtime.sendMessage({
    type: "paperqa:capture-active-tab-selection"
  })) as CaptureSelectionResponse;

  if (!response.ok) {
    throw new Error(response.error);
  }

  return response.anchor;
}

type FetchImpl = typeof fetch;

export async function getApiBaseUrl() {
  const result = await chrome.storage.local.get([API_BASE_URL_KEY]);
  const configured = typeof result[API_BASE_URL_KEY] === "string" ? result[API_BASE_URL_KEY] : DEFAULT_API_BASE_URL;
  return configured.replace(/\/+$/, "");
}

export async function matchRemotePaper(baseUrl: string, paper: Partial<SidebarPaper> & { url?: string }, fetchImpl: FetchImpl = fetch): Promise<SidebarPaper> {
  const response = await fetchImpl(`${trimBaseUrl(baseUrl)}/papers/match`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: paper.title,
      doi: paper.doi,
      arxivId: paper.arxivId,
      pmid: paper.pmid,
      url: paper.url
    })
  });

  return parseJsonResponse<SidebarPaper>(response);
}

export async function listRemoteDiscussions(baseUrl: string, paperId: string, fetchImpl: FetchImpl = fetch): Promise<SidebarDiscussion[]> {
  const response = await fetchImpl(`${trimBaseUrl(baseUrl)}/papers/${encodeURIComponent(paperId)}/discussions`, {
    method: "GET"
  });

  const discussions = await parseJsonResponse<Array<Record<string, unknown>>>(response);
  return discussions.map(mapRemoteDiscussion);
}

export async function createRemoteDiscussion(baseUrl: string, input: SidebarCreateDiscussionInput, fetchImpl: FetchImpl = fetch): Promise<SidebarDiscussion> {
  const response = await fetchImpl(`${trimBaseUrl(baseUrl)}/papers/${encodeURIComponent(input.paperId)}/discussions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-User-Id": DEFAULT_USER_ID
    },
    body: JSON.stringify({
      body: input.body,
      anchor: input.anchor
    })
  });

  return mapRemoteDiscussion(await parseJsonResponse<Record<string, unknown>>(response));
}

export async function getRemoteDiscussion(baseUrl: string, discussionId: string, fetchImpl: FetchImpl = fetch): Promise<Record<string, unknown>> {
  const response = await fetchImpl(`${trimBaseUrl(baseUrl)}/discussions/${encodeURIComponent(discussionId)}`, {
    method: "GET"
  });

  return parseJsonResponse<Record<string, unknown>>(response);
}

export async function createRemoteReply(baseUrl: string, discussionId: string, body: string, kind: "answer" | "comment", fetchImpl: FetchImpl = fetch) {
  const response = await fetchImpl(`${trimBaseUrl(baseUrl)}/discussions/${encodeURIComponent(discussionId)}/replies`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-User-Id": DEFAULT_USER_ID
    },
    body: JSON.stringify({ kind, body })
  });

  return parseJsonResponse<Record<string, unknown>>(response);
}

export async function createRemoteVote(baseUrl: string, discussionId: string, fetchImpl: FetchImpl = fetch) {
  const response = await fetchImpl(`${trimBaseUrl(baseUrl)}/votes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-User-Id": DEFAULT_USER_ID
    },
    body: JSON.stringify({ discussionId, value: "helpful" })
  });

  return parseJsonResponse<Record<string, unknown>>(response);
}

export async function createRemoteReport(baseUrl: string, discussionId: string, fetchImpl: FetchImpl = fetch) {
  const response = await fetchImpl(`${trimBaseUrl(baseUrl)}/reports`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-User-Id": DEFAULT_USER_ID
    },
    body: JSON.stringify({
      targetType: "discussion",
      targetId: discussionId,
      reason: "Reported from extension sidebar"
    })
  });

  return parseJsonResponse<Record<string, unknown>>(response);
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}: ${await response.text()}`);
  }

  return response.json() as Promise<T>;
}

function trimBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, "");
}

function mapRemoteDiscussion(item: Record<string, unknown>): SidebarDiscussion {
  return {
    id: String(item.id),
    paperId: String(item.paperId ?? item.paper_id),
    kind: "question",
    status: String(item.status ?? "open") as SidebarDiscussion["status"],
    body: String(item.body ?? ""),
    authorName: String(item.authorName ?? item.author_name ?? "Reader"),
    createdAt: String(item.createdAt ?? item.created_at ?? new Date().toISOString()),
    heat: typeof item.heat === "number" ? item.heat : 0,
    answerCount: typeof item.answerCount === "number" ? item.answerCount : 0,
    commentCount: typeof item.commentCount === "number" ? item.commentCount : 0,
    isAuthorResponse: Boolean(item.isAuthorResponse ?? item.is_author_response),
    anchor: item.anchor && typeof item.anchor === "object" ? mapRemoteAnchor(item.anchor as Record<string, unknown>) : undefined
  };
}

function mapRemoteAnchor(anchor: Record<string, unknown>) {
  return {
    kind: String(anchor.kind ?? "manual") as SidebarDiscussion["anchor"]["kind"],
    quoteText: typeof anchor.quoteText === "string" ? anchor.quoteText : typeof anchor.quote_text === "string" ? anchor.quote_text : undefined,
    contextText: typeof anchor.contextText === "string" ? anchor.contextText : typeof anchor.context_text === "string" ? anchor.context_text : undefined,
    sectionLabel: typeof anchor.sectionLabel === "string" ? anchor.sectionLabel : typeof anchor.section_label === "string" ? anchor.section_label : undefined,
    sourceUrl: typeof anchor.sourceUrl === "string" ? anchor.sourceUrl : typeof anchor.source_url === "string" ? anchor.source_url : undefined,
    imageUrl: typeof anchor.imageUrl === "string" ? anchor.imageUrl : typeof anchor.image_url === "string" ? anchor.image_url : undefined
  };
}
