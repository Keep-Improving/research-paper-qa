import { AcademicShell } from "../../../components/AcademicShell";
import { AnchorPanel } from "../../../components/AnchorPanel";
import { DiscussionPanel } from "../../../components/DiscussionPanel";
import {
  getPaper,
  getPaperAnchors,
  getPaperDiscussions,
  SAMPLE_UI_LABEL
} from "../../../components/sampleData";

export default async function PaperDetailPage({
  params
}: {
  params: Promise<{ paperId: string }>;
}) {
  const { paperId } = await params;
  const paper = getPaper(paperId);

  if (!paper) {
    return (
      <AcademicShell>
        <section className="error-state">
          <h1 className="page-title">Paper not found</h1>
          <p>We could not find sample UI data for this paper.</p>
        </section>
      </AcademicShell>
    );
  }

  const discussions = getPaperDiscussions(paper.id);
  const anchors = getPaperAnchors(paper.id);
  const authorResponses = discussions.filter((discussion) => discussion.hasAuthorResponse);
  const hotDiscussions = [...discussions].sort((a, b) => b.heat - a.heat).slice(0, 2);
  const unanswered = discussions.filter((discussion) => discussion.isUnresolved || discussion.answers.length === 0);
  const textAnchors = anchors.filter((anchor) => anchor.kind === "text");
  const figureAnchors = anchors.filter((anchor) => anchor.kind === "figure");

  return (
    <AcademicShell>
      <div className="stack">
        <section className="panel stack">
          <div>
            <p className="page-kicker">{SAMPLE_UI_LABEL}</p>
            <h1 className="page-title">{paper.title}</h1>
            <p className="page-summary">{paper.abstract}</p>
            <div className="meta-row">
              <span>{paper.authors.join(", ")}</span>
              <span>{paper.venue}</span>
              <span>{paper.year}</span>
              <span>{paper.doi}</span>
            </div>
          </div>
          <div className="toolbar">
            <button className="button button-primary" type="button">
              Add to collection
            </button>
            <button className="button" type="button">
              Follow paper
            </button>
          </div>
        </section>

        <div className="two-column">
          <div className="stack">
            <DiscussionPanel discussions={discussions} />
            <section className="panel">
              <h2 className="section-title">Author responses</h2>
              <ul className="compact-list">
                {authorResponses.map((discussion) => (
                  <li key={discussion.id}>{discussion.authorResponse}</li>
                ))}
              </ul>
            </section>
          </div>

          <aside className="stack" aria-label="Paper summary sections">
            <section className="panel">
              <h2 className="section-title">Anchor groups</h2>
              <h3>Text anchors</h3>
              <ul className="compact-list">
                {textAnchors.map((anchor) => (
                  <li key={anchor.id}>{anchor.title}</li>
                ))}
              </ul>
              <h3>Figure anchors</h3>
              <ul className="compact-list">
                {figureAnchors.map((anchor) => (
                  <li key={anchor.id}>{anchor.title}</li>
                ))}
              </ul>
            </section>

            <section className="panel">
              <h2 className="section-title">Hot discussions</h2>
              <ul className="compact-list">
                {hotDiscussions.map((discussion) => (
                  <li key={discussion.id}>{discussion.title}</li>
                ))}
              </ul>
            </section>

            <section className="panel">
              <h2 className="section-title">Unanswered questions</h2>
              <ul className="compact-list">
                {unanswered.map((discussion) => (
                  <li key={discussion.id}>{discussion.title}</li>
                ))}
              </ul>
            </section>
          </aside>
        </div>

        {anchors[0] ? <AnchorPanel anchor={anchors[0]} showRelated={false} /> : null}
      </div>
    </AcademicShell>
  );
}
