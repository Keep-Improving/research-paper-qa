import type {
  DiscussionCreate,
  DiscussionCreateResponse,
  DiscussionFilter,
  DiscussionItem,
  Paper,
  PaperIdentifyRequest,
} from "./types.js";

type FetchImpl = (input: string, init?: RequestInit) => Promise<Response>;

export type PaperQaClientOptions = {
  baseUrl: string;
  fetchImpl: FetchImpl;
};

export class PaperQaClient {
  private readonly baseUrl: string;
  private readonly fetchImpl: FetchImpl;

  constructor({ baseUrl, fetchImpl }: PaperQaClientOptions) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.fetchImpl = fetchImpl;
  }

  async identifyPaper(input: PaperIdentifyRequest): Promise<Paper> {
    return this.request<Paper>("/papers/identify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  }

  async listDiscussions(
    paperId: string,
    filter: DiscussionFilter = {},
  ): Promise<DiscussionItem[]> {
    const params = new URLSearchParams();
    if (filter.status != null) params.set("status", filter.status);
    if (filter.kind != null) params.set("kind", filter.kind);
    if (filter.has_author_response != null) {
      params.set("has_author_response", String(filter.has_author_response));
    }
    if (filter.anchor_kind != null) params.set("anchor_kind", filter.anchor_kind);
    if (filter.sort != null) params.set("sort", filter.sort);

    const query = params.toString();
    const path = `/papers/${encodeURIComponent(paperId)}/discussions${query ? `?${query}` : ""}`;
    return this.request<DiscussionItem[]>(path, { method: "GET" });
  }

  async createDiscussion(
    paperId: string,
    userId: string,
    input: DiscussionCreate,
  ): Promise<DiscussionCreateResponse> {
    return this.request<DiscussionCreateResponse>(
      `/papers/${encodeURIComponent(paperId)}/discussions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": userId,
        },
        body: JSON.stringify(input),
      },
    );
  }

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    const response = await this.fetchImpl(`${this.baseUrl}${path}`, init);
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}: ${await response.text()}`);
    }
    return response.json() as Promise<T>;
  }
}
