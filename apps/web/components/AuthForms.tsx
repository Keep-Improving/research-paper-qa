"use client";

import { useState } from "react";

import { useLocale } from "./LocaleProvider";

type AuthStatus = "idle" | "submitting" | "error" | "registered";

export function LoginForm() {
  const { t } = useLocale();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<AuthStatus>("idle");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? t("auth.signIn"));
      }

      window.location.assign("/");
    } catch (caught) {
      setStatus("error");
      setError(caught instanceof Error ? caught.message : t("auth.signIn"));
    }
  }

  return (
    <form className="panel stack" onSubmit={submit}>
      <h1 className="page-title">{t("auth.signIn")}</h1>
      <label className="field-label">
        {t("auth.email")}
        <input autoComplete="email" className="text-input" onChange={(event) => setEmail(event.target.value)} type="email" value={email} />
      </label>
      <label className="field-label">
        {t("auth.password")}
        <input autoComplete="current-password" className="text-input" onChange={(event) => setPassword(event.target.value)} type="password" value={password} />
      </label>
      {status === "error" ? <p className="row-copy" role="alert">{error}</p> : null}
      <button className="button button-primary" disabled={status === "submitting"} type="submit">
        {status === "submitting" ? t("auth.signingIn") : t("auth.signIn")}
      </button>
    </form>
  );
}

export function RegisterForm() {
  const { t } = useLocale();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<AuthStatus>("idle");
  const [error, setError] = useState("");
  const [verificationUrl, setVerificationUrl] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setError("");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, email, password })
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error ?? t("auth.register"));
      }

      if (typeof body.verificationUrl === "string") {
        setVerificationUrl(body.verificationUrl);
        setStatus("registered");
      } else {
        window.location.assign("/");
      }
    } catch (caught) {
      setStatus("error");
      setError(caught instanceof Error ? caught.message : t("auth.register"));
    }
  }

  return (
    <form className="panel stack" onSubmit={submit}>
      <h1 className="page-title">{t("auth.createAccount")}</h1>
      <label className="field-label">
        {t("auth.displayName")}
        <input className="text-input" onChange={(event) => setDisplayName(event.target.value)} value={displayName} />
      </label>
      <label className="field-label">
        {t("auth.email")}
        <input autoComplete="email" className="text-input" onChange={(event) => setEmail(event.target.value)} type="email" value={email} />
      </label>
      <label className="field-label">
        {t("auth.password")}
        <input autoComplete="new-password" className="text-input" onChange={(event) => setPassword(event.target.value)} type="password" value={password} />
      </label>
      {status === "error" ? <p className="row-copy" role="alert">{error}</p> : null}
      {status === "registered" ? (
        <div className="callout stack" role="status">
          <p className="row-copy">
            {t("auth.accountCreated")}
          </p>
          <a className="button button-primary" href={verificationUrl}>
            {t("auth.verifyEmail")}
          </a>
        </div>
      ) : null}
      <button className="button button-primary" disabled={status === "submitting"} type="submit">
        {status === "submitting" ? t("auth.creating") : t("auth.createAccount")}
      </button>
    </form>
  );
}
