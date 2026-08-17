"use client";

import Link from "next/link";

import { useLocale } from "./LocaleProvider";

type WorkspaceItem = { id: string; title: string };

export type MyWorkspaceData = {
  collections: {
    papers: WorkspaceItem[];
    questions: WorkspaceItem[];
    anchors: WorkspaceItem[];
  };
  discussions: Array<{
    id: string;
    title: string;
    status: string;
    myReplyCount: number;
    updatedAt: string;
  }>;
  canUseAuthorTools: boolean;
};

export function MyWorkspace({ data }: { data: MyWorkspaceData | null }) {
  const { t } = useLocale();

  if (!data) {
    return (
      <section className="panel stack">
        <div>
          <p className="page-kicker">{t("my.kicker")}</p>
          <h1 className="page-title">{t("my.title")}</h1>
        </div>
        <p className="page-summary">{t("my.signInPrompt")}</p>
        <Link className="button button-primary" href="/login">{t("my.signInAction")}</Link>
      </section>
    );
  }

  return (
    <div className="stack">
      <section>
        <p className="page-kicker">{t("my.kicker")}</p>
        <h1 className="page-title">{t("my.title")}</h1>
      </section>
      <div className="two-column">
        <div className="stack">
          <WorkspaceSection title={t("my.savedPapers")} items={data.collections.papers} hrefPrefix="/papers/" emptyLabel={t("my.noItems")} />
          <WorkspaceSection title={t("my.savedQuestions")} items={data.collections.questions} hrefPrefix="/discussions/" emptyLabel={t("my.noItems")} />
          <WorkspaceSection title={t("my.savedAnchors")} items={data.collections.anchors} hrefPrefix="/anchors/" emptyLabel={t("my.noItems")} />
          <section className="panel stack">
            <h2 className="section-title">{t("my.myQuestions")}</h2>
            {data.discussions.length === 0 ? <p className="row-copy">{t("my.noItems")}</p> : null}
            {data.discussions.map((discussion) => (
              <div className="result-row" key={discussion.id}>
                <Link href={`/discussions/${discussion.id}`}>{discussion.title}</Link>
                <p className="row-copy">{discussion.status} · {discussion.myReplyCount}</p>
              </div>
            ))}
          </section>
        </div>
        <aside className="stack">
          <section className="panel stack">
            <h2 className="section-title">{t("my.myReplies")}</h2>
            <p className="row-copy">
              {data.discussions.reduce((total, discussion) => total + discussion.myReplyCount, 0)} {t("my.myReplies").toLowerCase()}
            </p>
          </section>
          {data.canUseAuthorTools ? (
            <section className="panel stack">
              <h2 className="section-title">{t("my.authorTools")}</h2>
              <Link href="/author/claims">{t("my.authorClaims")}</Link>
              <Link href="/author/workbench">{t("my.authorWorkbench")}</Link>
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function WorkspaceSection({
  title,
  items,
  hrefPrefix,
  emptyLabel
}: {
  title: string;
  items: WorkspaceItem[];
  hrefPrefix: string;
  emptyLabel: string;
}) {
  return (
    <section className="panel stack">
      <h2 className="section-title">{title}</h2>
      {items.length === 0 ? <p className="row-copy">{emptyLabel}</p> : null}
      {items.map((item) => (
        <div className="result-row" key={item.id}>
          <Link href={hrefPrefix + item.id}>{item.title}</Link>
        </div>
      ))}
    </section>
  );
}
