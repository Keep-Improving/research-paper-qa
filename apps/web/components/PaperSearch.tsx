import Link from "next/link";
import {
  sampleAnchors,
  type AnchorRecord,
} from "./sampleData";
import { InlineHint } from "./InlineHint";
import { useLocale } from "./LocaleProvider";
import type { MessageKey } from "../lib/i18n/messages/en-US";

type SearchParams = {
  q?: string;
  papers?: SearchPaper[];
  discussions?: SearchDiscussion[];
};

export type SearchPaper = {
  id: string;
  title: string;
  authors: string[];
  venue?: string | null;
  year?: number | null;
  doi?: string | null;
  abstract?: string | null;
};

export type SearchDiscussion = {
  id: string;
  title: string;
  body: string;
  kind?: string;
  status: string;
  isAuthorResponse?: boolean;
};

function anchorText(anchor: AnchorRecord) {
  return `${anchor.title} ${anchor.quote} ${anchor.context} ${anchor.section}`;
}

function matchesQuery(value: string, query: string) {
  return value.toLowerCase().includes(query.toLowerCase());
}

export function PaperSearch({ discussions = [], papers = [], q = "" }: SearchParams) {
  const { t } = useLocale();
  const query = q.trim();
  const hasQuery = query.length > 0;
  const anchors = hasQuery
    ? sampleAnchors.filter((anchor) => matchesQuery(anchorText(anchor), query))
    : sampleAnchors;
  const authorResponses = discussions.filter((discussion) => discussion.isAuthorResponse);
  const isEmpty = papers.length === 0 && discussions.length === 0 && anchors.length === 0;

  return (
    <div className="search-grid">
      <section className="panel stack" aria-label={t("search.inputLabel")}>
        <div>
          <p className="page-kicker">{t("search.kicker")}</p>
          <h1 className="page-title">{t("search.title")}</h1>
          <p className="page-summary">{t("search.summary")}</p>
        </div>
        <form action="/" role="search">
          <label htmlFor="paper-search">{t("search.inputLabel")}</label>
          <input
            className="search-input"
            id="paper-search"
            name="q"
            type="search"
            defaultValue={q}
            placeholder={t("search.placeholder")}
          />
        </form>
        <InlineHint messageKey="search.hint" storageKey="paperqa-hint:search" />
      </section>

      {isEmpty ? (
        <section className="empty-state">
          <h2 className="section-title">{t("search.noResults")}</h2>
          <p>{t("search.noResultsBody")}</p>
        </section>
      ) : (
        <>
          <ResultSection titleKey="papers.title">
            {papers.map((paper) => (
              <li className="result-row" key={paper.id}>
                <Link href={`/papers/${paper.id}`}>{paper.title}</Link>
                <p className="row-copy">{paper.authors.join(", ")}</p>
                <div className="meta-row">
                  {paper.venue ? <span>{paper.venue}</span> : null}
                  {paper.year ? <span>{paper.year}</span> : null}
                  {paper.doi ? <span>{paper.doi}</span> : null}
                </div>
              </li>
            ))}
          </ResultSection>

          <ResultSection titleKey="questions.title">
            {discussions.map((discussion) => (
              <li className="result-row" key={discussion.id}>
                <Link href={`/discussions/${discussion.id}`}>{discussion.title}</Link>
                <p className="row-copy">{discussion.body}</p>
                <div className="meta-row">
                  <span>{discussion.kind ?? "question"}</span>
                  <span>{discussion.status.replace("_", " ")}</span>
                </div>
              </li>
            ))}
          </ResultSection>

          <ResultSection titleKey="common.authorResponse">
            {authorResponses.map((discussion) => (
              <li className="result-row" key={`${discussion.id}-author-response`}>
                <Link href={`/discussions/${discussion.id}`}>{t("common.authorResponse")}</Link>
                <p className="row-copy">{discussion.body}</p>
                <span className="badge badge-author">{t("common.authorResponse")}</span>
              </li>
            ))}
          </ResultSection>

          <ResultSection titleKey="anchors.title">
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

function ResultSection({ children, titleKey }: { children: React.ReactNode; titleKey: MessageKey }) {
  const { t } = useLocale();
  return (
    <section className="panel">
      <h2 className="section-title">{t(titleKey)}</h2>
      <ul className="result-list">{children}</ul>
    </section>
  );
}
