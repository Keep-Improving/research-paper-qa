import Link from "next/link";
import {
  SAMPLE_UI_LABEL,
  sampleAnchors,
  sampleDiscussions,
  samplePapers,
  type AnchorRecord,
  type DiscussionRecord,
  type PaperRecord
} from "./sampleData";

type SearchParams = {
  q?: string;
};

function matchesQuery(value: string, query: string) {
  return value.toLowerCase().includes(query.toLowerCase());
}

function paperText(paper: PaperRecord) {
  return `${paper.title} ${paper.authors.join(" ")} ${paper.venue} ${paper.doi} ${paper.abstract}`;
}

function discussionText(discussion: DiscussionRecord) {
  return `${discussion.title} ${discussion.body} ${discussion.authorResponse ?? ""}`;
}

function anchorText(anchor: AnchorRecord) {
  return `${anchor.title} ${anchor.quote} ${anchor.context} ${anchor.section}`;
}

export function PaperSearch({ q = "" }: SearchParams) {
  const query = q.trim();
  const hasQuery = query.length > 0;
  const papers = hasQuery ? samplePapers.filter((paper) => matchesQuery(paperText(paper), query)) : samplePapers;
  const discussions = hasQuery
    ? sampleDiscussions.filter((discussion) => matchesQuery(discussionText(discussion), query))
    : sampleDiscussions;
  const anchors = hasQuery
    ? sampleAnchors.filter((anchor) => matchesQuery(anchorText(anchor), query))
    : sampleAnchors;
  const authorResponses = discussions.filter((discussion) => discussion.hasAuthorResponse);
  const isEmpty = papers.length === 0 && discussions.length === 0 && anchors.length === 0;

  return (
    <div className="search-grid">
      <section className="panel stack" aria-label="Paper search">
        <div>
          <p className="page-kicker">{SAMPLE_UI_LABEL}</p>
          <h1 className="page-title">Research Paper Q&A</h1>
          <p className="page-summary">
            Search across papers, anchored questions, author responses, and quote or figure anchors.
          </p>
        </div>
        <form action="/" role="search">
          <label htmlFor="paper-search">Search papers and discussions</label>
          <input
            className="search-input"
            id="paper-search"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Try transformer, author response, Figure 1, or attention"
          />
        </form>
      </section>

      {isEmpty ? (
        <section className="empty-state">
          <h2 className="section-title">No records match this search</h2>
          <p>Records appear after papers are collected or detected by the website or extension.</p>
        </section>
      ) : (
        <>
          <ResultSection title="Papers">
            {papers.map((paper) => (
              <li className="result-row" key={paper.id}>
                <Link href={`/papers/${paper.id}`}>{paper.title}</Link>
                <p className="row-copy">{paper.authors.join(", ")}</p>
                <div className="meta-row">
                  <span>{paper.venue}</span>
                  <span>{paper.year}</span>
                  <span>{paper.doi}</span>
                </div>
              </li>
            ))}
          </ResultSection>

          <ResultSection title="Questions">
            {discussions.map((discussion) => (
              <li className="result-row" key={discussion.id}>
                <Link href={`/discussions/${discussion.id}`}>{discussion.title}</Link>
                <p className="row-copy">{discussion.body}</p>
                <div className="meta-row">
                  <span>{discussion.kind}</span>
                  <span>{discussion.status.replace("_", " ")}</span>
                </div>
              </li>
            ))}
          </ResultSection>

          <ResultSection title="Author responses">
            {authorResponses.map((discussion) => (
              <li className="result-row" key={`${discussion.id}-author-response`}>
                <Link href={`/discussions/${discussion.id}`}>Author response thread</Link>
                <p className="row-copy">{discussion.authorResponse}</p>
                <span className="badge badge-author">Author response</span>
              </li>
            ))}
          </ResultSection>

          <ResultSection title="Anchors">
            {anchors.map((anchor) => (
              <li className="result-row" key={anchor.id}>
                <Link href={`/anchors/${anchor.id}`}>{anchor.title}</Link>
                <p className="row-copy">{anchor.quote}</p>
                <div className="meta-row">
                  <span>{anchor.kind} anchor</span>
                  <span>Page {anchor.page}</span>
                  <span>{anchor.section}</span>
                </div>
              </li>
            ))}
          </ResultSection>
        </>
      )}
    </div>
  );
}

function ResultSection({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <section className="panel">
      <h2 className="section-title">{title}</h2>
      <ul className="result-list">{children}</ul>
    </section>
  );
}
