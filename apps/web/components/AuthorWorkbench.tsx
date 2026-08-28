"use client";

import Link from "next/link";
import { useLocale } from "./LocaleProvider";
import { DemoBadge } from "./DemoBadge";

export type AuthorWorkbenchDiscussion = {
  id: string;
  title: string;
  body: string;
  heat: number;
  votes: number;
  createdAt: string;
  anchorTitle?: string | null;
  isDemo?: boolean;
};

export type AuthorWorkbenchPaper = {
  id: string;
  title: string;
  venue?: string | null;
  year?: number | null;
  canPublishAuthorResponse: boolean;
  discussions: AuthorWorkbenchDiscussion[];
  isDemo?: boolean;
};

type AuthorWorkbenchProps = {
  papers: AuthorWorkbenchPaper[];
  userEmail?: string | null;
  emailVerified?: boolean;
};

export function AuthorWorkbench({ papers, userEmail, emailVerified = false }: AuthorWorkbenchProps) {
  const { t } = useLocale();
  const hasAnyPermission = papers.some((paper) => paper.canPublishAuthorResponse);
  const discussions = papers
    .flatMap((paper) =>
      paper.discussions.map((discussion) => ({
        ...discussion,
        paper
      }))
    )
    .sort((left, right) => right.heat - left.heat);

  return (
    <div className="stack">
      <section className="panel stack">
        <div>
          <p className="page-kicker">{t("author.workflow")}</p>
          <h1 className="page-title">{t("author.workbenchTitle")}</h1>
          <p className="page-summary">{t("author.workbenchSummary")}</p>
        </div>

        <div className="status-strip">
          <div>
            <strong>{userEmail ?? t("author.notSignedIn")}</strong>
            <p className="row-copy">
              {!userEmail
                ? t("author.checkEligibility")
                : !emailVerified
                  ? t("author.verifyBeforePermissions")
                  : hasAnyPermission
                    ? `${papers.filter((paper) => paper.canPublishAuthorResponse).length} ${t("author.verifiedPapers")}`
                    : t("author.noVerifiedMatch")}
            </p>
          </div>
          <span className={`badge ${hasAnyPermission ? "badge-author" : "badge-unresolved"}`}>
            {t("author.permission")}: {hasAnyPermission ? t("author.approved") : t("author.notEligible")}
          </span>
        </div>
      </section>

      <section className="panel stack" aria-label={t("author.highHeatQuestions")}>
        <div className="toolbar">
          <h2 className="section-title">{t("author.highHeatQuestions")}</h2>
          <span className="badge">{t("author.sortedByHeat")}</span>
        </div>

        {discussions.length === 0 ? (
          <div className="empty-state">
            <p>{t("author.noEligibleQuestions")}</p>
          </div>
        ) : (
          <ul className="discussion-list">
            {discussions.map((discussion) => (
              <li className="discussion-row" key={discussion.id}>
                <div className="toolbar row-toolbar">
                  <Link href={`/discussions/${discussion.id}`}>{discussion.title}</Link>
                  {discussion.isDemo ? <DemoBadge /> : null}
                  <div className="toolbar">
                    {discussion.paper.canPublishAuthorResponse ? (
                      <button className="button button-primary" type="button">
                        {t("common.authorResponse")}
                      </button>
                    ) : null}
                    <button className="button" type="button">
                      {t("author.askAsReader")}
                    </button>
                  </div>
                </div>
                <p className="row-copy">{discussion.body}</p>
                <div className="meta-row">
                  <span>{discussion.paper.title}</span>
                  <span>{t("common.heat")} {discussion.heat}</span>
                  <span>{discussion.votes} {t("common.votes")}</span>
                  <span>{discussion.createdAt}</span>
                  {discussion.anchorTitle ? <span>{discussion.anchorTitle}</span> : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
