"use client";

import { useMemo, useState } from "react";
import { samplePapers } from "./sampleData";

type ClaimRole = "first_author" | "corresponding_author" | "co_author";
type EvidenceType = "orcid" | "institutional_email" | "manual_review";

type SubmittedClaim = {
  paperId: string;
  role: ClaimRole;
  evidenceType: EvidenceType;
  evidenceDetail: string;
};

const roleLabels: Record<ClaimRole, string> = {
  first_author: "First author",
  corresponding_author: "Corresponding author",
  co_author: "Co-author"
};

const evidenceLabels: Record<EvidenceType, string> = {
  orcid: "ORCID",
  institutional_email: "Institutional email",
  manual_review: "Manual review"
};

export function AuthorClaimForm() {
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
        <p className="page-kicker">Certification</p>
        <h1 className="page-title">Author certification</h1>
        <p className="page-summary">
          Submit a paper-specific role claim. Author response publishing remains limited to approved
          first-author and corresponding-author claims.
        </p>
      </div>

      <form
        className="form-grid"
        onSubmit={(event) => {
          event.preventDefault();
          setSubmittedClaim({ paperId, role, evidenceType, evidenceDetail });
        }}
      >
        <label className="field-label" htmlFor="author-claim-paper">
          Paper
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
          Paper role
          <select
            aria-label="Paper role"
            id="author-claim-role"
            value={role}
            onChange={(event) => setRole(event.target.value as ClaimRole)}
          >
            <option value="first_author">First author</option>
            <option value="corresponding_author">Corresponding author</option>
            <option value="co_author">Co-author</option>
          </select>
        </label>

        <label className="field-label" htmlFor="author-claim-evidence-type">
          Evidence type
          <select
            aria-label="Evidence type"
            id="author-claim-evidence-type"
            value={evidenceType}
            onChange={(event) => setEvidenceType(event.target.value as EvidenceType)}
          >
            <option value="orcid">ORCID</option>
            <option value="institutional_email">Institutional email</option>
            <option value="manual_review">Manual review</option>
          </select>
        </label>

        <label className="field-label field-wide" htmlFor="author-claim-evidence-detail">
          Evidence detail
          <input
            aria-label="Evidence detail"
            className="search-input"
            id="author-claim-evidence-detail"
            onChange={(event) => setEvidenceDetail(event.target.value)}
            placeholder="ORCID, institutional email, or review note"
            value={evidenceDetail}
          />
        </label>

        <div className="toolbar field-wide">
          <button className="button button-primary" type="submit">
            Submit claim
          </button>
        </div>
      </form>

      {submittedClaim ? (
        <div className="result-row" aria-live="polite">
          <div className="badge-row">
            <span className="badge badge-anchor">Pending review</span>
            <span className="badge">{roleLabels[submittedClaim.role]}</span>
            <span className="badge">{evidenceLabels[submittedClaim.evidenceType]}</span>
          </div>
          <strong>Claim submitted for review</strong>
          <p className="row-copy">{selectedPaper?.title}</p>
          <p className="row-copy">{submittedClaim.evidenceDetail || "No evidence detail provided"}</p>
        </div>
      ) : (
        <div className="empty-state">
          <strong>No claim submitted in this session</strong>
          <p className="row-copy">
            Approved claims appear here after the author certification API is connected to user auth.
          </p>
        </div>
      )}
    </section>
  );
}
