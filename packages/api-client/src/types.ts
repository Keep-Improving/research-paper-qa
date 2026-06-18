export type Paper = {
  id: string;
  title: string;
  doi: string | null;
  arxiv_id: string | null;
  pmid: string | null;
  venue: string | null;
  publication_year: number | null;
  canonical_url: string | null;
  abstract: string | null;
};

export type Anchor = {
  id: string;
  paper_id: string;
  kind: string;
  quote_text: string | null;
  context_text: string | null;
  page_number: number | null;
  section_label: string | null;
  figure_label: string | null;
  table_label: string | null;
  formula_label: string | null;
  reference_label: string | null;
  source_url: string | null;
  dom_path: string | null;
  image_url: string | null;
  ocr_text: string | null;
};

export type ReactionKind =
  | "upvote"
  | "downvote"
  | "helpful"
  | "thanks"
  | "needs_clarification";

export type DiscussionSort =
  | "newest"
  | "active"
  | "votes"
  | "heat"
  | "dispute"
  | "anchor_position";

export type DiscussionItem = {
  id: string;
  paper_id: string;
  anchor_id: string | null;
  parent_id: string | null;
  user_id: string;
  kind: string;
  status: string;
  body: string;
  is_author_response: boolean;
  is_pinned: boolean;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
  anchor: Anchor | null;
};

export type DiscussionFilter = {
  status?: string | null;
  kind?: string | null;
  has_author_response?: boolean | null;
  anchor_kind?: string | null;
  sort?: DiscussionSort | null;
};

export type PaperIdentifyRequest = {
  title?: string | null;
  doi?: string | null;
  arxiv_id?: string | null;
  pmid?: string | null;
  url?: string | null;
};

export type AnchorCreate = {
  kind: string;
  quote_text?: string | null;
  context_text?: string | null;
  page_number?: number | null;
  section_label?: string | null;
  figure_label?: string | null;
  table_label?: string | null;
  formula_label?: string | null;
  reference_label?: string | null;
  source_url?: string | null;
  dom_path?: string | null;
  image_url?: string | null;
  ocr_text?: string | null;
};

export type DiscussionCreate = {
  kind: string;
  body: string;
  status?: string;
  anchor?: AnchorCreate | null;
  parent_id?: string | null;
  is_author_response?: boolean;
};

export type DiscussionCreateResponse = {
  item: DiscussionItem;
  similar_discussions: DiscussionItem[];
};
