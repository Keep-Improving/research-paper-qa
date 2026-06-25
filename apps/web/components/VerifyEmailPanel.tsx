"use client";

import { useEffect, useState } from "react";

type VerifyStatus = "checking" | "verified" | "error";

export function VerifyEmailPanel({ token }: { token: string }) {
  const [status, setStatus] = useState<VerifyStatus>(token ? "checking" : "error");
  const [message, setMessage] = useState(token ? "Verifying email..." : "Verification token is missing.");

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
          throw new Error(body.error ?? "Email verification failed");
        }
        if (!cancelled) {
          setStatus("verified");
          setMessage("Email verified. Author-response permissions can now use this address.");
        }
      } catch (caught) {
        if (!cancelled) {
          setStatus("error");
          setMessage(caught instanceof Error ? caught.message : "Email verification failed");
        }
      }
    }

    verify();

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <section className="panel stack">
      <p className="page-kicker">Account security</p>
      <h1 className="page-title">Email verification</h1>
      <p className="page-summary" role={status === "error" ? "alert" : "status"}>
        {message}
      </p>
      {status === "verified" ? (
        <a className="button button-primary" href="/author/workbench">
          Open workbench
        </a>
      ) : null}
    </section>
  );
}
