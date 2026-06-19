import Link from "next/link";
import Image from "next/image";
import { sampleDiscussions, type AnchorRecord } from "./sampleData";

export function AnchorPanel({ anchor, showRelated = true }: { anchor: AnchorRecord; showRelated?: boolean }) {
  const related = sampleDiscussions.filter((discussion) => discussion.anchorId === anchor.id);
  const anchorType = anchor.kind === "figure" ? "Figure" : "Text";

  return (
    <section className="panel stack" aria-label={`${anchor.title} anchor`}>
      <div>
        <p className="page-kicker">Anchor detail</p>
        <h1 className="page-title">{anchor.title}</h1>
        <div className="meta-row">
          <span>Anchor type: {anchorType}</span>
          <span>Page {anchor.page}</span>
          <span>{anchor.section}</span>
          <span>{anchor.position}</span>
        </div>
      </div>

      {anchor.imageSvg && anchor.imageAlt ? (
        <Image
          className="anchor-image"
          src={anchor.imageSvg}
          alt={anchor.imageAlt}
          width={420}
          height={180}
          unoptimized
        />
      ) : null}

      <blockquote className="anchor-quote">{anchor.quote}</blockquote>
      <p className="row-copy">{anchor.context}</p>

      {showRelated ? (
        <section>
          <h2 className="section-title">Related discussions</h2>
          {related.length === 0 ? (
            <p className="row-copy">No discussions are linked to this anchor yet.</p>
          ) : (
            <ul className="compact-list">
              {related.map((discussion) => (
                <li key={discussion.id}>
                  <Link href={`/discussions/${discussion.id}`}>{discussion.title}</Link>
                  <div className="meta-row">
                    <span>{discussion.status.replace("_", " ")}</span>
                    <span>{discussion.votes} votes</span>
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
