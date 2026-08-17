"use client";

import { useEffect, useState } from "react";

import { useLocale } from "./LocaleProvider";

type VerifyStatus = "checking" | "verified" | "error";

export function VerifyEmailPanel({ token }: { token: string }) {
  const { t } = useLocale();
  const [status, setStatus] = useState<VerifyStatus>(token ? "checking" : "error");
  const [message, setMessage] = useState(token ? t("auth.verifyingEmail") : t("auth.missingVerificationToken"));

  useEffect(() => {
    if (!token) {
      return;
    }

    let cancelled = false;
    async function verify() {
      try {
        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token })
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(body.error ?? t("auth.emailVerification"));
        }
        if (!cancelled) {
          setStatus("verified");
          setMessage(t("auth.emailVerifiedDescription"));
        }
      } catch (caught) {
        if (!cancelled) {
          setStatus("error");
          setMessage(caught instanceof Error ? caught.message : t("auth.emailVerification"));
        }
      }
    }

    verify();

    return () => {
      cancelled = true;
    };
  }, [token, t]);

  return (
    <section className="panel stack">
      <p className="page-kicker">{t("auth.accountSecurity")}</p>
      <h1 className="page-title">{t("auth.emailVerification")}</h1>
      <p className="page-summary" role={status === "error" ? "alert" : "status"}>
        {message}
      </p>
      {status === "verified" ? (
        <a className="button button-primary" href="/author/workbench">
          {t("auth.openWorkbench")}
        </a>
      ) : null}
    </section>
  );
}
