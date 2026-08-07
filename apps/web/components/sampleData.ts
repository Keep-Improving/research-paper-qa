export type AnchorKind = "text" | "figure";
export type DiscussionStatus = "open" | "answered" | "author_responded" | "disputed";
export type DiscussionKind = "question" | "answer" | "comment" | "author_response";

export type AnchorRecord = {
  id: string;
  paperId: string;
  title: string;
  kind: AnchorKind;
  quote: string;
  context: string;
  page: number;
  section: string;
  position: string;
  imageAlt?: string;
  imageSvg?: string;
};

export type DiscussionRecord = {
  id: string;
  paperId: string;
  anchorId: string;
  title: string;
  body: string;
  kind: DiscussionKind;
  status: DiscussionStatus;
  author: string;
  createdAt: string;
  votes: number;
  heat: number;
  hasAuthorResponse: boolean;
  isDisputed?: boolean;
  isUnresolved?: boolean;
  answers: string[];
  comments: string[];
  authorResponse?: string;
};

export type PaperRecord = {
  id: string;
  title: string;
  authors: string[];
  venue: string;
  year: number;
  doi: string;
  abstract: string;
};

export const SAMPLE_UI_LABEL = "Sample UI data";

export const samplePapers: PaperRecord[] = [
  {
    id: "paper-transformer",
    title: "Attention Is All You Need",
    authors: ["Ashish Vaswani", "Noam Shazeer", "Niki Parmar"],
    venue: "NeurIPS",
    year: 2017,
    doi: "10.48550/arXiv.1706.03762",
    abstract:
      "A compact sample record for exercising research-paper discussion workflows before API wiring."
  },
  {
    id: "paper-contrastive",
    title: "A Simple Framework for Contrastive Learning of Visual Representations",
    authors: ["Ting Chen", "Simon Kornblith", "Mohammad Norouzi"],
    venue: "ICML",
    year: 2020,
    doi: "10.48550/arXiv.2002.05709",
    abstract: "Included as sample UI data for the empty/search states."
  }
];

export const sampleAnchors: AnchorRecord[] = [
  {
    id: "anchor-equation-scale",
    paperId: "paper-transformer",
    title: "Equation 1 attention scaling",
    kind: "text",
    quote: "Attention(Q, K, V) = softmax(QK^T / sqrt(dk))V",
    context:
      "The scaling term keeps dot products from growing too large as key dimensionality increases.",
    page: 4,
    section: "3.2.1 Scaled Dot-Product Attention",
    position: "Section 3.2.1, equation block"
  },
  {
    id: "anchor-figure-caption",
    paperId: "paper-transformer",
    title: "Figure 1 model architecture",
    kind: "figure",
    quote: "The Transformer follows this overall architecture using stacked self-attention.",
    context:
      "Encoder and decoder stacks are shown with multi-head attention, residual connections, and feed-forward layers.",
    page: 3,
    section: "3 Model Architecture",
    position: "Figure 1 caption",
    imageAlt: "Transformer architecture diagram anchor",
    imageSvg:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 420 180'%3E%3Crect width='420' height='180' fill='%23f6f5f1'/%3E%3Crect x='44' y='32' width='132' height='116' fill='%23ffffff' stroke='%23696358'/%3E%3Crect x='244' y='32' width='132' height='116' fill='%23ffffff' stroke='%23696358'/%3E%3Cpath d='M176 90h68' stroke='%232f5f73' stroke-width='3'/%3E%3Cpath d='M232 78l14 12-14 12' fill='none' stroke='%232f5f73' stroke-width='3'/%3E%3Ctext x='110' y='84' text-anchor='middle' font-family='Georgia' font-size='16' fill='%2326211b'%3EEncoder%3C/text%3E%3Ctext x='310' y='84' text-anchor='middle' font-family='Georgia' font-size='16' fill='%2326211b'%3EDecoder%3C/text%3E%3Ctext x='210' y='160' text-anchor='middle' font-family='Georgia' font-size='13' fill='%23696358'%3EFigure anchor sample%3C/text%3E%3C/svg%3E"
  }
];

export const sampleDiscussions: DiscussionRecord[] = [
  {
    id: "discussion-attention-scale",
    paperId: "paper-transformer",
    anchorId: "anchor-equation-scale",
    title: "Why does scaled dot-product attention divide by sqrt(dk)?",
    body:
      "The paper states that scaling prevents extremely small gradients. What empirical or theoretical evidence supports this specific normalizer?",
    kind: "question",
    status: "author_responded",
    author: "M. Rivera",
    createdAt: "2026-06-18",
    votes: 21,
    heat: 92,
    hasAuthorResponse: true,
    answers: [
      "The variance of unscaled dot products grows with dimension, so the normalizer keeps softmax gradients in a usable range."
    ],
    comments: ["A useful follow-up would compare learned temperature values across heads."],
    authorResponse:
      "Verified author response: the scaling was chosen to stabilize logits across common model widths and matched early ablation behavior."
  },
  {
    id: "discussion-figure-residual",
    paperId: "paper-transformer",
    anchorId: "anchor-figure-caption",
    title: "Are the residual paths in Figure 1 applied before or after normalization?",
    body:
      "The diagram is compact. The implementation order affects how readers reproduce the architecture.",
    kind: "question",
    status: "open",
    author: "L. Chen",
    createdAt: "2026-06-17",
    votes: 9,
    heat: 104,
    hasAuthorResponse: false,
    isUnresolved: true,
    answers: [],
    comments: ["The text appears to describe post-normalization, but later variants differ."]
  },
  {
    id: "discussion-bleu-dispute",
    paperId: "paper-transformer",
    anchorId: "anchor-equation-scale",
    title: "BLEU comparison needs clearer tokenizer settings",
    body: "The reported comparison may be sensitive to preprocessing details.",
    kind: "comment",
    status: "disputed",
    author: "S. Patel",
    createdAt: "2026-06-16",
    votes: 6,
    heat: 48,
    hasAuthorResponse: false,
    isDisputed: true,
    answers: [],
    comments: ["Marked disputed until the evaluation setup is clarified."]
  }
];

export function getPaper(paperId: string) {
  return samplePapers.find((paper) => paper.id === paperId);
}

export function getDiscussion(discussionId: string) {
  return sampleDiscussions.find((discussion) => discussion.id === discussionId);
}

export function getAnchor(anchorId: string) {
  return sampleAnchors.find((anchor) => anchor.id === anchorId);
}

export function getAnchorForDiscussion(discussion: DiscussionRecord) {
  return getAnchor(discussion.anchorId);
}

export function getPaperDiscussions(paperId: string) {
  return sampleDiscussions.filter((discussion) => discussion.paperId === paperId);
}

export function getPaperAnchors(paperId: string) {
  return sampleAnchors.filter((anchor) => anchor.paperId === paperId);
}
