import Link from "next/link";
import { useLocale } from "./LocaleProvider";
import { DemoBadge } from "./DemoBadge";

type AnchorPanelRecord = {
  id: string;
  paperId: string;
  title: string | null;
  kind: string;
  quoteText: string | null;
  contextText: string | null;
  pageNumber: number | null;
  sectionLabel: string | null;
  position: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  paper?: { title: string } | null;
  isDemo?: boolean;
  discussions?: Array<{
    id: string;
    title: string;
    status: string;
    votes: Array<{ value: string }>;
  }>;
};

export function AnchorPanel({ anchor, showRelated = true }: { anchor: AnchorPanelRecord; showRelated?: boolean }) {
  const { t } = useLocale();
  const related = anchor.discussions ?? [];
  const anchorType = anchor.kind === "figure" || anchor.kind === "image" ? t("common.figure") : t("common.text");
  const title = anchor.title ?? anchor.quoteText ?? t("common.anchor");

  return (
    <section className="panel stack" aria-label={`${title} ${t("common.anchor")}`}>
      <div>
        <p className="page-kicker">{anchor.paper?.title ?? t("common.anchorDetail")}</p>
        <h1 className="page-title">{title}</h1>
        {anchor.isDemo ? <DemoBadge /> : null}
        <div className="meta-row">
          <span>{t("common.anchorType")}: {anchorType}</span>
          {anchor.pageNumber ? <span>{t("common.page")} {anchor.pageNumber}</span> : null}
          {anchor.sectionLabel ? <span>{anchor.sectionLabel}</span> : null}
          {anchor.position ? <span>{anchor.position}</span> : null}
        </div>
        <div className="toolbar">
          <Link className="button" href={`/papers/${anchor.paperId}`}>{t("common.backToPaper")}</Link>
          <Link className="button" href={`/?q=${encodeURIComponent(anchor.paper?.title ?? title)}`}>{t("common.browseAnchors")}</Link>
        </div>
      </div>

      {anchor.imageUrl && anchor.imageAlt ? (
        <img
          className="anchor-image"
          src={anchor.imageUrl}
          alt={anchor.imageAlt}
        />
      ) : null}

      {anchor.quoteText ? <blockquote className="anchor-quote">{anchor.quoteText}</blockquote> : null}
      {anchor.contextText ? <p className="row-copy">{anchor.contextText}</p> : null}

      {showRelated ? (
        <section>
          <h2 className="section-title">{t("common.relatedDiscussions")}</h2>
          {related.length === 0 ? (
            <p className="row-copy">{t("common.noRelatedDiscussions")}</p>
          ) : (
            <ul className="compact-list">
              {related.map((discussion) => (
                <li key={discussion.id}>
                  <Link href={`/discussions/${discussion.id}`}>{discussion.title}</Link>
                  <div className="meta-row">
                    <span>{discussion.status.replace("_", " ")}</span>
                    <span>{discussion.votes.length} votes</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </section>
  );
}
