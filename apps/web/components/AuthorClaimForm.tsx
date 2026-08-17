"use client";

import { useMemo, useState } from "react";
import { samplePapers } from "./sampleData";
import { useLocale } from "./LocaleProvider";

type ClaimRole = "first_author" | "corresponding_author" | "co_author";
type EvidenceType = "orcid" | "institutional_email" | "manual_review";

type SubmittedClaim = {
  paperId: string;
  role: ClaimRole;
  evidenceType: EvidenceType;
  evidenceDetail: string;
};

export function AuthorClaimForm() {
  const { t } = useLocale();
  const [paperId, setPaperId] = useState(samplePapers[0]?.id ?? "");
  const [role, setRole] = useState<ClaimRole>("first_author");
  const [evidenceType, setEvidenceType] = useState<EvidenceType>("orcid");
  const [evidenceDetail, setEvidenceDetail] = useState("");
  const [submittedClaim, setSubmittedClaim] = useState<SubmittedClaim | null>(null);

  const selectedPaper = useMemo(
    () => samplePapers.find((paper) => paper.id === (submittedClaim?.paperId ?? paperId)),
    [paperId, submittedClaim]
  );

  return (
    <section className="panel stack" aria-label="Author claim form">
      <div>
      <p className="page-kicker">{t("author.certification")}</p>
      <h1 className="page-title">{t("author.certificationTitle")}</h1>
      <p className="page-summary">{t("author.certificationSummary")}</p>
      </div>

      <form
        className="form-grid"
        onSubmit={(event) => {
          event.preventDefault();
          setSubmittedClaim({ paperId, role, evidenceType, evidenceDetail });
        }}
      >
        <label className="field-label" htmlFor="author-claim-paper">
          {t("author.paper")}
          <select
            aria-label="Paper"
            id="author-claim-paper"
            value={paperId}
            onChange={(event) => setPaperId(event.target.value)}
          >
            {samplePapers.map((paper) => (
              <option key={paper.id} value={paper.id}>
                {paper.title}
              </option>
            ))}
          </select>
        </label>

        <label className="field-label" htmlFor="author-claim-role">
          {t("author.paperRole")}
          <select
            aria-label="Paper role"
            id="author-claim-role"
            value={role}
            onChange={(event) => setRole(event.target.value as ClaimRole)}
          >
            <option value="first_author">{t("author.firstAuthor")}</option>
            <option value="corresponding_author">{t("author.correspondingAuthor")}</option>
            <option value="co_author">{t("author.coAuthor")}</option>
          </select>
        </label>

        <label className="field-label" htmlFor="author-claim-evidence-type">
          {t("author.evidenceType")}
          <select
            aria-label="Evidence type"
            id="author-claim-evidence-type"
            value={evidenceType}
            onChange={(event) => setEvidenceType(event.target.value as EvidenceType)}
          >
            <option value="orcid">ORCID</option>
            <option value="institutional_email">{t("author.institutionalEmail")}</option>
            <option value="manual_review">{t("author.manualReview")}</option>
          </select>
        </label>

        <label className="field-label field-wide" htmlFor="author-claim-evidence-detail">
          {t("author.evidenceDetail")}
          <input
            aria-label="Evidence detail"
            className="search-input"
            id="author-claim-evidence-detail"
            onChange={(event) => setEvidenceDetail(event.target.value)}
            placeholder={t("author.evidenceDetail")}
            value={evidenceDetail}
          />
        </label>

        <div className="toolbar field-wide">
          <button className="button button-primary" type="submit">
            {t("author.submitClaim")}
          </button>
        </div>
      </form>

      {submittedClaim ? (
        <div className="result-row" aria-live="polite">
          <div className="badge-row">
            <span className="badge badge-anchor">{t("author.pendingReview")}</span>
            <span className="badge">{submittedClaim.role === "first_author" ? t("author.firstAuthor") : submittedClaim.role === "corresponding_author" ? t("author.correspondingAuthor") : t("author.coAuthor")}</span>
            <span className="badge">{submittedClaim.evidenceType === "institutional_email" ? t("author.institutionalEmail") : submittedClaim.evidenceType === "manual_review" ? t("author.manualReview") : "ORCID"}</span>
          </div>
          <strong>{t("author.claimSubmitted")}</strong>
          <p className="row-copy">{selectedPaper?.title}</p>
          <p className="row-copy">{submittedClaim.evidenceDetail || t("author.noEvidence")}</p>
        </div>
      ) : (
        <div className="empty-state">
          <strong>{t("author.noClaim")}</strong>
          <p className="row-copy">{t("author.noClaimBody")}</p>
        </div>
      )}
    </section>
  );
}
